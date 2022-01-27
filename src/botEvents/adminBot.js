const botMessages = require('../botMessages');
const { getDriverStatusByChatId } = require('../db/driver-db-queries');
const dbQuerieErrors = require('../errorCodes');
const { newVisitor } = require('../library/userLib');

const admin = bot => {
  bot.admin(async msg => {
    try {
      const status = await getDriverStatusByChatId(msg.chat.id);
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
