const config = require('./config'); // for issues/319 node-telegram-bot-api

const Bot = require('./bot/Bot');
const bot = new Bot();

require('./db/mongo-instance');

const start = require('./botEvents/startBot');
const uploadPhoto = require('./botEvents/uploadPhotoBot');
const getNumber = require('./botEvents/getNumberBot');
const admin = require('./botEvents/adminBot');
const message = require('./botEvents/messageBot');
const callbackQuery = require('./botEvents/callbackQuery/callbackQuery');

start(bot);
uploadPhoto(bot);
getNumber(bot);
admin(bot);
message(bot);
callbackQuery(bot);
