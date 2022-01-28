const config = require('../config');

class DriverCandidate {
  name = '';
  first_name = '';
  tlg_chatId = null;

  constructor(candidate) {
    this.name = candidate.userName;
    this.first_name = candidate.first_name;
    this.tlg_chatId = candidate.chatId;
  }
}

module.exports = DriverCandidate;
