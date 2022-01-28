const botMessages = require('../../botMessages');
const config = require('../../config');
const {
  getCarByIdWithoutDriversIds,
  getInfoAboutCarWithDriversNames
} = require('../../db/car-db-queries');
const {
  getChecksByCarId,
  getChecksByCarIdForSpecificMonth
} = require('../../db/check-db-queries');
const {
  getDriverStatusByChatId,
  setGiveOutOrRefuel,
  setTempCarIdForDriver,
  setTlgChatIdToDriver,
  getDriverByIdWithoutCars,
  getDriverByIdWithCars,
  getTempCarId
} = require('../../db/driver-db-queries');
const { sortStringsFromObj } = require('../../helper');

const callbackQuery = bot => {
  // bot.callbackQuery(async query => {  });
};

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

module.exports = callbackQuery;
