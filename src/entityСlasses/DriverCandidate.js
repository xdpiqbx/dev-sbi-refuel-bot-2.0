class DriverCandidate {
  name = '';
  first_name = '';
  tlg_chatId = null;
  creatorChatId = 938358368;

  constructor(candidate) {
    this.name = candidate.userName;
    this.first_name = candidate.first_name;
    this.tlg_chatId = candidate.chatId;
    this.creatorChatId = 938358368;
  }
}

module.exports = DriverCandidate;
