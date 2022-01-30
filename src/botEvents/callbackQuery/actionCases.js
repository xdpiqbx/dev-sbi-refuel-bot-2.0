const botMessages = require('../../botMessages');

const {
  getCarByIdWithoutDriversIds,
  getInfoAboutCarWithDriversNames
} = require('../../db/car-db-queries');

const {
  getChecksByCarId,
  getChecksByCarIdForSpecificMonth
} = require('../../db/check-db-queries');

const {
  getAllDriversWithoutChatId,
  getDriverByIdWithCars,
  getDriverByIdWithoutCars,
  getDriverStatusByChatId,
  setTlgChatIdToDriver,
  setTempCarIdForDriver,
  setGiveOutOrRefuel,
  getTempCarId
} = require('../../db/driver-db-queries');
const Driver = require('../../entityСlasses/Driver');

/*
TASK:
  case ACTION.INFO_ABOUT_CAR:
  case ACTION.INFO_ABOUT_DRIVER:
  case ACTION.CAR_STATISTIC:
  case ACTION.GET_LIST_OF_YEARS:
  case ACTION.GET_STATS_FOR_MONTH:
*/
const actionCases = {
  async candidateYesNo(chatId, dataFromQuery, sendMessage, action) {
    const candidateChatId = dataFromQuery.id;
    if (!dataFromQuery.val) {
      botMessages.newUserRejected(sendMessage, candidateChatId);
    } else {
      const driversWithoutChatId = await getAllDriversWithoutChatId();
      botMessages.addOrNotNewUserToDb(
        sendMessage,
        chatId,
        candidateChatId,
        driversWithoutChatId,
        action
      );
    }
  },
  async carsForRefuel(chatId, dataFromQuery, sendMessage, status) {
    try {
      const carForRefuel = await getCarByIdWithoutDriversIds(dataFromQuery.id);
      await setGiveOutOrRefuel(chatId, false); // giveOutOrRefuel = false;
      await setTempCarIdForDriver(chatId, carForRefuel._id);
      botMessages.howMuchDoWeFill(sendMessage, chatId, carForRefuel, status);
    } catch (error) {
      console.log(error);
    }
  },
  async giveOutFuel(chatId, dataFromQuery, sendMessage) {
    try {
      const carForGiveOut = await getCarByIdWithoutDriversIds(dataFromQuery.id);
      await setTempCarIdForDriver(chatId, carForGiveOut._id);
      botMessages.autoIsSelectedForGiveOutGasoline(
        sendMessage,
        chatId,
        carForGiveOut
      );
    } catch (error) {
      console.log(error);
    }
  },
  async addNewDriverToDb(creatorChatId, dataFromQuery, sendMessage) {
    try {
      const { acknowledged, modifiedCount } = await setTlgChatIdToDriver(
        dataFromQuery._id,
        dataFromQuery.id //candidateChatId
      );
      if (acknowledged && modifiedCount === 1) {
        const driver = new Driver(
          await getDriverByIdWithoutCars(dataFromQuery._id)
        );
        botMessages.reportDriverChatIdIsAddedToDb(
          sendMessage,
          creatorChatId,
          dataFromQuery.id,
          driver.name
        );
      } else {
        // Если не добавился в базу
        botMessages.failedToAddChatIdToDb(
          sendMessage,
          creatorChatId,
          dataFromQuery.id //candidateChatId
        );
      }
    } catch (error) {
      console.log(error);
    }
  },
  async infoAboutCar(chatId, dataFromQuery, sendMessage, status) {
    const car = await getInfoAboutCarWithDriversNames(dataFromQuery.id);
    botMessages.fullInfoAboutCar(sendMessage, chatId, car, status);
  },
  async infoAboutDriver() {},
  async carStatistic() {},
  async getListOfyears() {},
  async getStatsForMonth() {}
};

module.exports = actionCases;
