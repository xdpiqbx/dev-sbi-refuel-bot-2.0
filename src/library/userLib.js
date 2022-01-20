const botMessages = require('../botMessages');
const DriverCandidate = require('../entityСlasses/DriverCandidate');
const inlineKeyboardActions = require('../inline-keyboard-actions');

const newVisitor = (bot, chatId, firstName, userName) => {
  const candidate = new DriverCandidate({ chatId, firstName, userName });
  botMessages.messageForNewVisitor(bot.sendMessage.bind(bot), candidate);
  botMessages.reportForCreatorAboutNewUser(
    bot.sendMessage.bind(bot),
    candidate,
    inlineKeyboardActions.CANDIDATE_YES_NO
  );
};

module.exports = { newVisitor };
