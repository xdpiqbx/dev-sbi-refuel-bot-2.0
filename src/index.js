const config = require('./config'); // for issues/319 node-telegram-bot-api
const format = require('date-fns/format');
const { uk } = require('date-fns/locale');

const Bot = require('./bot/Bot');
const bot = new Bot();

const Driver = require('./entityСlasses/Driver');

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
  setGiveOutOrRefuel
} = require('./db/car-db-queries');

const botMessages = require('./botMessages');

const {
  getChecksByCarId,
  getChecksByCarIdForSpecificMonth
} = require('./db/check-db-queries');

const { logStart, sortStringsFromObj } = require('./helper');
const { newVisitor } = require('./library/userLib');

const start = require('./botEvents/startBot');
const uploadPhoto = require('./botEvents/uploadPhotoBot');

logStart();

start(bot); // bot.start event
uploadPhoto(bot); // bot.photo event

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
        bot.deleteMessage(query.message.chat.id, query.message.message_id);
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
        await setCarGasolineResidue(car._id, resLitres);
      } else {
        // refuel
        resLitres = car.gasoline_residue - litres;
        // setCarGasolineResidue - in bot.photo !!!
      }
      await setTempLitres(chatId, litres);
      const driverStatus = await getDriverStatusByChatId(chatId);
      litresReport(
        chatId,
        car,
        resLitres,
        litres,
        driverStatus,
        car.giveOutOrRefuel
      );
    }
  } catch (error) {
    console.log(error);
  }
});

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
