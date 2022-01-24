const botMessages = require('../botMessages');
const { getDriverStatusByChatId } = require('../db/driver-db-queries');
const dbQuerieErrors = require('../errorCodes');
const { newVisitor } = require('../library/userLib');

const admin = bot => {
  bot.admin(async msg => {
    try {
      const status = await getDriverStatusByChatId(msg.chat.id);
      console.log(status);
      if (status === dbQuerieErrors.NOT_EXIST) {
        newVisitor(
          bot.sendMessage.bind(bot),
          msg.chat.id,
          msg.from.first_name,
          msg.from.username
        );
      } else {
        if (status > 2) {
          botMessages.accessDenied(bot.sendMessage.bind(bot), msg.chat.id);
        } else {
          // state.check.driverId = driver._id;
          // state.driver._id = driver._id;
          // state.driver.name = driver.name;
          // state.driver.status = driver.status;
          // state.driver.carsIds = driver.carsIds;
          // state.driver.tlg_chatId = driver.tlg_chatId;
          botMessages.mainAdminKeyboard(
            bot.sendMessage.bind(bot),
            msg.chat.id,
            status
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  });
};

module.exports = admin;
