const botMessages = require('../botMessages');
const DriverCandidate = require('../entityСlasses/DriverCandidate');
const ACTION = require('../keyboards/inline-actions');

const newVisitor = (botSendMessage, chatId, firstName, userName) => {
  const candidate = new DriverCandidate({ chatId, firstName, userName });
  botMessages.messageForNewVisitor(botSendMessage, candidate);
  botMessages.reportForCreatorAboutNewUser(
    botSendMessage,
    candidate,
    ACTION.CANDIDATE_YES_NO
  );
};

module.exports = { newVisitor };
