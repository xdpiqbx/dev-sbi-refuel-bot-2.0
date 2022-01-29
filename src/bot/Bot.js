const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

class Bot {
  allowableEmmitersNames = {
    start: /\/start/,
    admin: /\/admin/,
    number: /^\d{1,3}$/
  };

  constructor() {
    this.bot = new TelegramBot(config.TOKEN, {
      polling: true
    });
  }

  start(callback) {
    this.bot.onText(this.allowableEmmitersNames.start, callback);
  }

  admin(callback) {
    this.bot.onText(this.allowableEmmitersNames.admin, callback);
  }

  getNumberOfLiters(callback) {
    this.bot.onText(this.allowableEmmitersNames.number, callback);
  }

  message(callback) {
    this.bot.on('message', callback);
  }

  callbackQuery(callback) {
    this.bot.on('callback_query', callback);
  }

  photo(callback) {
    this.bot.on('photo', callback);
  }

  async sendMessage(...args) {
    await this.bot.sendMessage(...args);
  }
  async sendPhoto(...args) {
    await this.bot.sendPhoto(...args);
  }
  async deleteMessage(...args) {
    await this.bot.deleteMessage(...args);
  }
}

module.exports = Bot;
