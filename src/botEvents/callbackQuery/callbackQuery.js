const { getDriverStatusByChatId } = require('../../db/driver-db-queries');

const ACTION = require('../../keyboards/inline-actions');
const actionCases = require('./actionCases');

const callbackQuery = bot => {
  bot.callbackQuery(async query => {
    const dataFromQuery = JSON.parse(query.data);
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const driverStatus = await getDriverStatusByChatId(chatId);
    const sendMessage = bot.sendMessage.bind(bot);
    bot.deleteMessage(chatId, messageId);
    switch (dataFromQuery.action) {
      case ACTION.CANDIDATE_YES_NO:
        actionCases.candidateYesNo(
          chatId,
          dataFromQuery,
          sendMessage,
          ACTION.ADD_NEW_DRIVER_TO_DB
        );
        break;
      case ACTION.CARS_FOR_REFUEL:
        actionCases.carsForRefuel(
          chatId,
          dataFromQuery,
          sendMessage,
          driverStatus.status
        );
        break;
      case ACTION.GIVE_OUT_FUEL:
        actionCases.giveOutFuel(chatId, dataFromQuery, sendMessage);
        break;
      case ACTION.ADD_NEW_DRIVER_TO_DB:
        actionCases.addNewDriverToDb(chatId, dataFromQuery, sendMessage);
        break;
      case ACTION.INFO_ABOUT_CAR:
        actionCases.infoAboutCar(
          chatId,
          dataFromQuery,
          sendMessage,
          driverStatus.status
        );
        break;
      case ACTION.INFO_ABOUT_DRIVER:
        actionCases.infoAboutDriver(chatId, dataFromQuery, sendMessage);
        break;
      case ACTION.CAR_STATISTIC:
        actionCases.carStatistic(
          chatId,
          dataFromQuery,
          sendMessage,
          ACTION.GET_LIST_OF_YEARS
        );
        break;
      case ACTION.GET_LIST_OF_YEARS:
        actionCases.getListOfyears(
          chatId,
          dataFromQuery,
          sendMessage,
          ACTION.GET_STATS_FOR_MONTH
        );
        break;
      case ACTION.GET_STATS_FOR_MONTH:
        actionCases.getStatsForMonth(chatId, dataFromQuery, sendMessage);
        break;
    }
  });
};

module.exports = callbackQuery;
