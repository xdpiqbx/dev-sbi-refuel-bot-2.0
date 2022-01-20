const botMessages = require('../botMessages');
const DriverCandidate = require('../entityСlasses/DriverCandidate');
const inlineKeyboardActions = require('../inline-keyboard-actions');

const newVisitor = (botSendMessage, chatId, firstName, userName) => {
  const candidate = new DriverCandidate({ chatId, firstName, userName });
  botMessages.messageForNewVisitor(botSendMessage, candidate);
  botMessages.reportForCreatorAboutNewUser(
    botSendMessage,
    candidate,
    inlineKeyboardActions.CANDIDATE_YES_NO
  );
};

module.exports = { newVisitor };
