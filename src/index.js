const format = require('date-fns/format');
const { uk } = require('date-fns/locale');
const config = require('./config');

const Bot = require('./bot/Bot');
const bot = new Bot();

const Driver = require('./entityСlasses/Driver');

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
  setTlgChatIdToDriver,
  getDriverStatusByChatId,
  setTempCarIdForDriver,
  getTempCarId,
  setTempLitres
} = require('./db/driver-db-queries');

const {
  getCarByIdWithoutDriversIds,
  getAllCarsModelNumberGas,
  getAllCarsModelNumber,
  getInfoAboutCarWithDriversNames,
  setCarGasolineResidue,
  setGiveOutOrRefuel,
  getGiveOutOrRefuel
} = require('./db/car-db-queries');

const botMessages = require('./botMessages');
const botPhotos = require('./botPhotos');

const {
  saveCheckToDb,
  getChecksByCarId,
  getChecksByCarIdForSpecificMonth
} = require('./db/check-db-queries');

const { logStart, sortStringsFromObj } = require('./helper');
const { newVisitor } = require('./library/userLib');
const start = require('./botEvents/startBot');

logStart();

// стартую и рисую клавиатуру
start(bot);
// bot.start(async msg => {
//   try {
//     const dbResponse = await getDriverByChatId(msg.chat.id);
//     if (!dbResponse) {
//       newVisitor(
//         bot.sendMessage.bind(bot),
//         msg.chat.id,
//         msg.from.first_name,
//         msg.from.username
//       );
//     } else {
//       const driver = new Driver(dbResponse);
//       state.check.driverId = driver._id;
//       if (driver.tlg_chatId === msg.chat.id) {
//         const cars = await getAllCarsModelNumber();
//         sortStringsFromObj(cars, 'model');
//         botMessages.startDialog(
//           bot.sendMessage.bind(bot),
//           msg.chat.id,
//           cars,
//           ACTION.CARS_FOR_REFUEL
//         );
//       }
//     }
//   } catch (e) {
//     console.log(e);
//   }
// });

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
  }
});

bot.callbackQuery(async query => {
  const dataFromQuery = JSON.parse(query.data);
  const chatId = query.message.chat.id;
  const driverStatus = await getDriverStatusByChatId(chatId);
  let car = {};
  let driver = {};
  switch (dataFromQuery.action) {
    case ACTION.CANDIDATE_YES_NO:
      // Refactored
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
      if (!dataFromQuery.val) {
        candidatRejected(dataFromQuery.id);
      } else {
        addDriverToDb(chatId, dataFromQuery.id);
      }
      break;
    case ACTION.CARS_FOR_REFUEL:
      // Refactored
      try {
        const carForRefuel = await getCarByIdWithoutDriversIds(
          dataFromQuery.id
        );
        await setGiveOutOrRefuel(carForRefuel._id, false); // giveOutOrRefuel = false;
        await setTempCarIdForDriver(chatId, carForRefuel._id);
        botMessages.howMuchDoWeFill(
          bot.sendMessage.bind(bot),
          chatId,
          carForRefuel,
          driverStatus
        );
      } catch (error) {
        console.log(error);
      }
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
        dataFromQuery._id,
        dataFromQuery.id //candidateChatId
      );
      bot.deleteMessage(query.message.chat.id, query.message.message_id);
      if (acknowledged && modifiedCount === 1) {
        const driver = new Driver(
          await getDriverByIdWithoutCars(dataFromQuery._id)
        );
        botMessages.reportDriverChatIdIsAddedToDb(
          bot.sendMessage.bind(bot),
          driver.creatorChatId,
          dataFromQuery.id,
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
      const carForStat = await getCarByIdWithoutDriversIds(
        state.refuelStat.carId
      );

      const years = [2021, 2022];

      botMessages.getListOfYearsInline(
        bot.sendMessage.bind(bot),
        chatId,
        years,
        carForStat,
        ACTION.GET_LIST_OF_YEARS
      );
      break;

    case ACTION.GET_LIST_OF_YEARS:
      const checksByCarId = await getChecksByCarId(
        state.refuelStat.carId,
        dataFromQuery.year
      );

      const carForStatRes = await getCarByIdWithoutDriversIds(
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
        dataFromQuery.year,
        carForStatRes,
        ACTION.GET_STATS_FOR_MONTH
      );
      break;

    case ACTION.GET_STATS_FOR_MONTH:
      const checksByCarIdForSpecificMonth =
        await getChecksByCarIdForSpecificMonth(
          state.refuelStat.carId,
          dataFromQuery.month,
          dataFromQuery.year
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
  // Refactored
  const chatId = msg.chat.id;
  try {
    const carId = await getTempCarId(chatId);
    if (!carId.temp_carId) {
      botMessages.offerToPressStart(bot.sendMessage.bind(bot), chatId);
    } else {
      const car = await getCarByIdWithoutDriversIds(carId.temp_carId);
      const litres = parseInt(msg.text.trim());
      let resLitres = 0;
      if (car.giveOutOrRefuel) {
        // give out talon
        resLitres = car.gasoline_residue + litres;
      } else {
        // refuel
        resLitres = car.gasoline_residue - litres;
      }
      await setCarGasolineResidue(car._id, resLitres);
      await setTempLitres(chatId, litres);
      litresReport(
        chatId,
        car,
        resLitres,
        litres,
        await getDriverStatusByChatId(chatId),
        car.giveOutOrRefuel
      );
    }
  } catch (error) {
    console.log(error);
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

// const howManyLitres = (chatId, stateCar) => {
//   botMessages.howMuchDoWeFill(
//     bot.sendMessage.bind(bot),
//     chatId,
//     stateCar,
//     state.driver.status
//   );
// };

const litresReport = async (
  chatId,
  car,
  resLitres,
  litres,
  status,
  giveOutOrRefuel
) => {
  if (giveOutOrRefuel) {
    botMessages.giveOutReport(
      bot.sendMessage.bind(bot),
      chatId,
      car,
      resLitres,
      litres,
      status
    );
    await setCarGasolineResidue(car._id, car.gasoline_residue);
  } else {
    botMessages.refuelReportAndAskForCheck(
      bot.sendMessage.bind(bot),
      chatId,
      car,
      resLitres,
      litres,
      status
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

// const newVisitor = (chatId, firstName, userName) => {
//   state.candidateChatId = chatId;
//   botMessages.messageForNewVisitor(
//     bot.sendMessage.bind(bot),
//     chatId,
//     firstName
//   );
//   botMessages.reportForCreatorAboutNewUser(
//     bot.sendMessage.bind(bot),
//     state.creatorChatId,
//     firstName,
//     userName
//   );
// };

const addDriverToDb = async (chatId, candidateChatId) => {
  const driversWithoutChatId = await getAllDriversWithoutChatId();
  botMessages.addOrNotNewUserToDb(
    bot.sendMessage.bind(bot),
    chatId,
    candidateChatId,
    driversWithoutChatId,
    ACTION.ADD_NEW_DRIVER_TO_DB
  );
};

const candidatRejected = chatId => {
  botMessages.newUserRejected(bot.sendMessage.bind(bot), chatId);
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
