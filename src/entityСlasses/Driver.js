const config = require('../config');

class Driver {
  _id = null;
  name = '';
  status = 5;
  carsIds = [];
  tlg_chatId = null;
  candidateChatId = null;
  creatorChatId = config.CREATOR_CHAT_ID;

  constructor(driver) {
    this._id = driver._id;
    this.name = driver.name;
    this.status = driver.status;
    this.carsIds = driver.carsIds;
    this.tlg_chatId = driver.tlg_chatId;
    this.candidateChatId = null;
    this.creatorChatId = config.CREATOR_CHAT_ID;
  }
}

module.exports = Driver;
