const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const config = require('../config');

const {
  getTmpCarIdTmpLitresDrvStatus,
  resetTempDataInDriver
} = require('../db/driver-db-queries');

const {
  getCarByIdWithoutDriversIds,
  setCarGasolineResidue
} = require('../db/car-db-queries');

const { saveCheckToDb } = require('../db/check-db-queries');

const botPhotos = require('../botPhotos');

const uploadPhoto = bot => {
  bot.photo(async msg => {
    const { file_id, file_unique_id } = msg.photo[3];

    cloudinary.config(config.CLOUDINARY_CONFIG);

    // queryLinkToFile - ссылка для запроса на получения инфо о файле
    const queryLinkToFile = `https://api.telegram.org/bot${config.TOKEN}/getFile?file_id=${file_id}`;

    // resp - тут ответ (инфа о фото которое отправил в телеграм)
    const resp = await axios
      .get(queryLinkToFile)
      .then(response => response.data)
      .catch(error => console.log(error));

    // fileUrl - ссылка на скачивание файла
    const fileUrl = `https://api.telegram.org/file/bot${config.TOKEN}/${resp.result.file_path}`;

    const {
      temp_carId,
      temp_litres,
      status,
      _id: driverId
    } = await getTmpCarIdTmpLitresDrvStatus(msg.chat.id);
    // temp_carId temp_litres status
    const car = await getCarByIdWithoutDriversIds(temp_carId);

    const gasoline_residue = car.gasoline_residue - temp_litres;

    await setCarGasolineResidue(temp_carId, gasoline_residue);

    // carNum - номер машины без буков
    const carNum = car.number.split(' ')[1];
    // carModel - модель машины тире вместо пробелов
    const carModel = car.model.split(' ').join('-');

    // Загрузка файла изображения по fileUrl на cloudinary
    // Примерно так -> `sbi-cars/Toyota-Corola-3306/16583983-vnidvbivry.jpg`
    const date = new Date(Date.now());
    const stringDate =
      date.toLocaleDateString() + '-at-' + date.toLocaleTimeString();
    date.setMinutes(date.getMinutes() + Math.abs(date.getTimezoneOffset()));

    const result = await cloudinary.uploader.upload(fileUrl, {
      resource_type: 'image',
      public_id: `${config.CLOUDINARY_ROOT_FOLDER}/${carModel}-${carNum}/${stringDate}-${file_unique_id}`,
      function(error, result) {
        console.log(result, error);
      }
    });

    botPhotos.sendReportWithCheckPhoto(
      bot.sendPhoto.bind(bot),
      msg.chat.id,
      {
        model: car.model,
        number: car.number,
        gasoline_residue
      },
      temp_litres,
      status,
      result.secure_url
    );

    const check = {
      date,
      litres: temp_litres,
      checkImageUrl: result.secure_url,
      tlg_file_id: file_id,
      tlg_file_unique_id: file_unique_id,
      carId: temp_carId,
      driverId
    };

    saveCheckToDb(check);
    resetTempDataInDriver(driverId);
  });
};

module.exports = uploadPhoto;
