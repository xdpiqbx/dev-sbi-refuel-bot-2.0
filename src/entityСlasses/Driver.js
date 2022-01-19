class Driver {
  _id = null;
  name = '';
  status = 5;
  carsIds = [];
  tlg_chatId = null;
  candidateChatId = null;
  giveOutOrRefue = false;
  creatorChatId = 938358368;

  constructor(driver) {
    this._id = driver._id;
    this.name = driver.name;
    this.status = driver.status;
    this.carsIds = driver.carsIds;
    this.tlg_chatId = driver.tlg_chatId;
    this.candidateChatId = null;
    this.giveOutOrRefue = false;
    this.creatorChatId = 938358368;
  }
}

module.exports = Driver;
