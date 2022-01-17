const format = require('date-fns/format');
const { uk } = require('date-fns/locale');
const config = require('./config');

const Bot = require('./bot/Bot');
const bot = new Bot();

// const TelegramBot = require('node-telegram-bot-api');
// const bot = new TelegramBot(config.TOKEN, {
//   polling: true
// });

const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const cloudinary = require('cloudinary').v2;

require('./db/mongo-instance');

const KB_BTNS = require('./keyboard-buttons');
const ACTION = require('./inline-keyboard-actions');

const state = require('./state');
const initialState = JSON.stringify(state);

const {
  getAllDriversByAlphabet,
  getDriverByChatId,
  getAllDriversWithoutChatId,
  getDriverByIdWithCars,
  getDriverByIdWithoutCars,
  setTlgChatIdToDriver
} = require('./db/driver-db-queries');

const {
  getCarByIdWithoutDriversIds,
  getAllCarsModelNumberGas,
  getAllCarsModelNumber,
  getInfoAboutCarWithDriversNames,
  setCarGasolineResidue
} = require('./db/car-db-queries');

const botMessages = require('./botMessages');
const botPhotos = require('./botPhotos');

const {
  saveCheckToDb,
  getChecksByCarId,
  getChecksByCarIdForSpecificMonth
} = require('./db/check-db-queries');

const { logStart, sortStringsFromObj } = require('./helper');

logStart();

// стартую и рисую клавиатуру
bot.start(async msg => {
  try {
    const driver = await getDriverByChatId(msg.chat.id);

    if (!driver) {
      newVisitor(msg.chat.id, msg.from.first_name, msg.from.username);
    } else {
      state.check.driverId = driver._id;
      state.driver._id = driver._id;
      state.driver.name = driver.name;
      state.driver.status = driver.status;
      state.driver.carsIds = driver.carsIds;
      state.driver.tlg_chatId = driver.tlg_chatId;
      if (state.driver.tlg_chatId === msg.chat.id) {
        start(msg.chat.id);
      }
    }
  } catch (e) {
    console.log(e);
  }
});

bot.admin(async msg => {
  try {
    const driver = await getDriverByChatId(msg.chat.id);
    if (!driver) {
      newVisitor(msg.chat.id, msg.from.first_name, msg.from.username);
    } else {
      if (driver.status > 2) {
        botMessages.accessDenied(bot.sendMessage.bind(bot), msg.chat.id);
      } else {
        state.check.driverId = driver._id;
        state.driver._id = driver._id;
        state.driver.name = driver.name;
        state.driver.status = driver.status;
        state.driver.carsIds = driver.carsIds;
        state.driver.tlg_chatId = driver.tlg_chatId;
        botMessages.mainAdminKeyboard(
          bot.sendMessage.bind(bot),
          msg.chat.id,
          state.driver.status
        );
      }
    }
  } catch (e) {
    console.log(e);
  }
});

bot.message(async msg => {
  const chatId = msg.chat.id;
  switch (msg.text) {
    case KB_BTNS.YES:
      addDriverToDb(chatId); // Done
      break;
    case KB_BTNS.NO:
      candidatRejected(); // Done
      break;
    case KB_BTNS.GIVE_OUT_FUEL:
      state.driver.status === 0
        ? giveOutFuel(chatId)
        : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId); // Done
      break;
    case KB_BTNS.TOTAL_FUEL_BALANCE:
      state.driver.status < 2
        ? totalFuelBalance(chatId)
        : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId); // Done
      break;
    case KB_BTNS.ABOUT_CAR: // Done
      state.driver.status < 3
        ? aboutCar(chatId)
        : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId); // Done
      break;
    case KB_BTNS.CAR_REFUEL_STAT: // !!!!!!!!!!!!===============================
      state.driver.status < 2
        ? carStatistic(chatId)
        : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId);
      break;
    case KB_BTNS.ABOUT_DRIVER: // Done
      state.driver.status < 3
        ? aboutDriver(chatId)
        : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId);
      break;
    case KB_BTNS.MY_CARS: // Done
      myCars(chatId);
      break;
    case KB_BTNS.ATTACH:
      state.driver.status === 0
        ? attach(chatId)
        : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId);
      break;
  }
});

bot.callbackQuery(async query => {
  const dataFromQuery = JSON.parse(query.data);
  const chatId = query.message.chat.id;
  let car = {};
  let driver = {};
  switch (dataFromQuery.action) {
    case ACTION.CARS_FOR_REFUEL:
      state.giveOutOrRefuel = false;

      state.check.date = new Date(query.message.date * 1000);
      car = await getCarByIdWithoutDriversIds(dataFromQuery.id);

      state.check.carId = car._id;
      state.car._id = car._id;
      state.car.model = car.model;
      state.car.number = car.number;
      state.car.gasoline_residue = car.gasoline_residue;

      howManyLitres(chatId, state.car);
      break;
    case ACTION.GIVE_OUT_FUEL:
      state.giveOutOrRefuel = true;
      car = await getCarByIdWithoutDriversIds(dataFromQuery.id);
      state.car._id = car._id;
      state.car.model = car.model;
      state.car.number = car.number;
      state.car.gasoline_residue = car.gasoline_residue;

      botMessages.autoIsSelectedForGiveOutGasoline(
        bot.sendMessage.bind(bot),
        chatId,
        state.car
      );
      break;
    case ACTION.ADD_NEW_DRIVER_TO_DB:
      const { acknowledged, modifiedCount } = await setTlgChatIdToDriver(
        dataFromQuery.id,
        state.candidateChatId
      );

      if (acknowledged && modifiedCount === 1) {
        const driver = await getDriverByIdWithoutCars(dataFromQuery.id);
        botMessages.reportDriverChatIdIsAddedToDb(
          bot.sendMessage.bind(bot),
          state.creatorChatId,
          state.candidateChatId,
          driver.name
        );
      } else {
        // Ошибка Mongo_DB
        botMessages.failedToAddChatIdToDb(
          bot.sendMessage.bind(bot),
          state.creatorChatId,
          state.candidateChatId
        );
      }
      break;
    case ACTION.INFO_ABOUT_CAR:
      car = await getInfoAboutCarWithDriversNames(dataFromQuery.id);
      sortStringsFromObj(car.driversIds, 'name');
      botMessages.fullInfoAboutCar(
        bot.sendMessage.bind(bot),
        chatId,
        car,
        state.driver.status
      );
      break;
    case ACTION.INFO_ABOUT_DRIVER:
      driver = await getDriverByIdWithCars(dataFromQuery.id);
      sortStringsFromObj(driver.carsIds, 'model');
      botMessages.fullInfoAboutDriver(
        bot.sendMessage.bind(bot),
        chatId,
        driver
      );
      break;
    case ACTION.CAR_STATISTIC:
      state.refuelStat.carId = dataFromQuery.id;
      const checksByCarId = await getChecksByCarId(state.refuelStat.carId);
      const carForStat = await getCarByIdWithoutDriversIds(
        state.refuelStat.carId
      );

      const getAllMonthses = checks => {
        const arrAllDates = checks.map(check => check.date);
        return arrAllDates.map(date => ({
          month: date.getMonth(),
          label: format(date, 'LLLL', { locale: uk })
        }));
      };

      const allMonthses = getAllMonthses(checksByCarId);

      const unicMonthsesNums = [
        ...new Set(allMonthses.map(item => item.month))
      ].sort((a, b) => a - b);

      const allUnicMonthses = unicMonthsesNums.map(monNum => {
        return allMonthses.find(m => m.month === monNum);
      });

      // вывести inline месяца в которых заправлялась машина
      botMessages.getListOfMonthesInline(
        bot.sendMessage.bind(bot),
        chatId,
        allUnicMonthses,
        carForStat,
        ACTION.GET_STATS_FOR_MONTH
      );
      break;

    case ACTION.GET_STATS_FOR_MONTH:
      const checksByCarIdForSpecificMonth =
        await getChecksByCarIdForSpecificMonth(
          state.refuelStat.carId,
          dataFromQuery.month
        );
      const unicDates = [
        ...new Set(
          checksByCarIdForSpecificMonth.map(item => item.date.getDate())
        )
      ].sort((a, b) => a - b);
      const checksByDate = unicDates.map(date => {
        return checksByCarIdForSpecificMonth.filter(
          check => check.date.getDate() === date
        );
      });
      const resultArr = checksByDate.map(checksArr => {
        return {
          date: checksArr[0].date,
          litres: checksArr.reduce((acc, check) => (acc += check.litres), 0),
          imgsAndDrivers: checksArr.reduce((acc, check) => {
            acc.push({
              litres: check.litres,
              img: check.checkImageUrl,
              driver: check.driverId
            });
            return acc;
          }, [])
        };
      });
      const carForFinalStat = await getCarByIdWithoutDriversIds(
        state.refuelStat.carId
      );
      const monthTotalStat = {
        car: {
          model: carForFinalStat.model,
          number: carForFinalStat.number
        },
        monthLabel: format(resultArr[0].date, 'LLLL', { locale: uk }),
        data: resultArr
      };
      botMessages.refuelStatForCarInSpecMonth(
        bot.sendMessage.bind(bot),
        chatId,
        monthTotalStat
      );
      break;
  }
});
// любое число от 0-999 (сюда я ловлю литры)
bot.getNumberOfLiters(async msg => {
  if (!state.car.model) {
    botMessages.offerToPressStart(bot.sendMessage.bind(bot), msg.chat.id);
  } else {
    const litres = parseInt(msg.text.trim());
    /*
      тут или сложение или вычитание ...
      state.car.gasoline_residue = state.car.gasoline_residue - litres
    */
    if (state.giveOutOrRefuel) {
      state.car.gasoline_residue = state.car.gasoline_residue + litres;
    } else {
      state.car.gasoline_residue = state.car.gasoline_residue - litres;
    }
    state.check.litres = litres;

    await setCarGasolineResidue(state.car._id, state.car.gasoline_residue);

    litresReport(msg.chat.id);
  }
});

bot.photo(async msg => {
  const photoElement = msg.photo[3];
  state.check.tlg_file_id = photoElement.file_id;
  state.check.tlg_file_unique_id = photoElement.file_unique_id;
  state.check.checkImageUrl = await getLinkToUploadedPhoto(photoElement);
  // тут проверить: литры и машина
  resultReport(msg.chat.id);
});

const start = async chatId => {
  const cars = await getAllCarsModelNumber();
  sortStringsFromObj(cars, 'model');
  botMessages.startDialog(
    bot.sendMessage.bind(bot),
    chatId,
    cars,
    ACTION.CARS_FOR_REFUEL
  );
};

const howManyLitres = (chatId, stateCar) => {
  botMessages.howMuchDoWeFill(
    bot.sendMessage.bind(bot),
    chatId,
    stateCar,
    state.driver.status
  );
};

const litresReport = async chatId => {
  if (state.giveOutOrRefuel) {
    botMessages.giveOutReport(
      bot.sendMessage.bind(bot),
      chatId,
      state.car,
      state.check.litres,
      state.driver.status
    );
    await setCarGasolineResidue(state.car._id, state.car.gasoline_residue);
  } else {
    botMessages.refuelReportAndAskForCheck(
      bot.sendMessage.bind(bot),
      chatId,
      state.car,
      state.check.litres,
      state.driver.status
    );
  }
};

const getLinkToUploadedPhoto = async photoElement => {
  cloudinary.config(config.CLOUDINARY_CONFIG);
  // queryLinkToFile - ссылка для запроса на получения инфо о файле
  const queryLinkToFile = `https://api.telegram.org/bot${config.TOKEN}/getFile?file_id=${photoElement.file_id}`;
  // resp - тут ответ (инфа о файле)
  const resp = await fetch(queryLinkToFile)
    .then(response => response.json())
    .catch(e => {
      console.log('=======>>> await fetch(queryLinkToFile)');
      console.log(e);
    });
  // fileUrl - ссылка на скачивание файла
  const fileUrl = `https://api.telegram.org/file/bot${config.TOKEN}/${resp.result.file_path}`;

  // carNum - номер машины без буков
  const carNum = state.car.number.split(' ')[1];
  // carModel - модель машины тире вместо пробелов
  const carModel = state.car.model.split(' ').join('-');

  // Загрузка файла изображения по fileUrl на cloudinary
  // Примерно так -> `sbi-cars/Toyota-Corola-3306/16583983-vnidvbivry.jpg`
  const result = await cloudinary.uploader.upload(fileUrl, {
    resource_type: 'image',
    public_id: `${config.CLOUDINARY_ROOT_FOLDER}/${carModel}-${carNum}/${state.check.date}-${state.check.tlg_file_unique_id}`,
    function(error, result) {
      console.log(result, error);
    }
  });

  return result.secure_url;
};

const resultReport = async chatId => {
  botPhotos.sendReportWithCheckPhoto(
    bot.sendPhoto.bind(bot),
    chatId,
    state.car,
    state.check.litres,
    state.driver.status,
    state.check.checkImageUrl
  );
  saveCheckToDb(state.check);
  state = JSON.parse(initialState);
};

const newVisitor = (chatId, firstName, userName) => {
  state.candidateChatId = chatId;
  botMessages.messageForNewVisitor(
    bot.sendMessage.bind(bot),
    chatId,
    firstName
  );
  botMessages.reportForCreatorAboutNewUser(
    bot.sendMessage.bind(bot),
    state.creatorChatId,
    firstName,
    userName
  );
};

const addDriverToDb = async chatId => {
  const driversWithoutChatId = await getAllDriversWithoutChatId();
  botMessages.addOrNotNewUserToDb(
    bot.sendMessage.bind(bot),
    chatId,
    driversWithoutChatId,
    ACTION.ADD_NEW_DRIVER_TO_DB
  );
};

const candidatRejected = () => {
  botMessages.newUserRejected(bot.sendMessage.bind(bot), state.candidateChatId);
};

const myCars = async chatId => {
  if (!state.driver._id) {
    const driver = await getDriverByChatId(chatId);
    state.driver._id = driver._id;
  }
  const driver = await getDriverByIdWithCars(state.driver._id);
  sortStringsFromObj(driver.carsIds, 'model');
  botMessages.carsAssignedToDriver(bot.sendMessage.bind(bot), chatId, driver);
};

const giveOutFuel = async chatId => {
  const cars = await getAllCarsModelNumber();
  sortStringsFromObj(cars, 'model');
  botMessages.giveOutGasoline(
    bot.sendMessage.bind(bot),
    chatId,
    cars,
    ACTION.GIVE_OUT_FUEL
  );
};

const totalFuelBalance = async chatId => {
  const cars = await getAllCarsModelNumberGas();
  sortStringsFromObj(cars, 'model');
  botMessages.totalFuelBalance(bot.sendMessage.bind(bot), chatId, cars);
};

const aboutCar = async chatId => {
  const cars = await getAllCarsModelNumber();
  sortStringsFromObj(cars, 'model');
  botMessages.inlineKbdListOfCars(
    bot.sendMessage.bind(bot),
    chatId,
    cars,
    ACTION.INFO_ABOUT_CAR
  );
};

const carStatistic = async chatId => {
  const cars = await getAllCarsModelNumber();
  sortStringsFromObj(cars, 'model');
  botMessages.inlineKbdListOfCars(
    bot.sendMessage.bind(bot),
    chatId,
    cars,
    ACTION.CAR_STATISTIC
  );
};

const aboutDriver = async chatId => {
  const drivers = await getAllDriversByAlphabet();
  botMessages.inlineKbdListOfDrivers(
    bot.sendMessage.bind(bot),
    chatId,
    drivers,
    ACTION.INFO_ABOUT_DRIVER
  );
};

const attach = chatId => {
  console.log(KB_BTNS.ATTACH); // in process
};
