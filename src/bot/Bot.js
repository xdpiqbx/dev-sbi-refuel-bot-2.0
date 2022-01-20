const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

class Bot {
  constructor() {
    this.bot = new TelegramBot(config.TOKEN, {
      polling: true
    });
  }

  start(callback) {
    this.bot.onText(/\/start/, callback);
  }

  admin(callback) {
    this.bot.onText(/\/admin/, callback);
  }

  message(callback) {
    this.bot.on('message', callback);
  }

  callbackQuery(callback) {
    this.bot.on('callback_query', callback);
  }

  getNumberOfLiters(callback) {
    this.bot.onText(/^\d{1,3}$/, callback);
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
}

module.exports = Bot;
