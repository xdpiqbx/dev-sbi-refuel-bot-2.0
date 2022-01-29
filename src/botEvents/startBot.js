const botMessages = require('../botMessages');
const { getAllCarsModelNumber } = require('../db/car-db-queries');
const { getDriverIdByChatId } = require('../db/driver-db-queries');
const { newVisitor } = require('../library/userLib');
const ACTION = require('../inline-keyboard-actions');

const start = bot => {
  bot.start(async msg => {
    try {
      const driver = await getDriverIdByChatId(msg.chat.id);
      if (!driver) {
        newVisitor(
          bot.sendMessage.bind(bot),
          msg.chat.id,
          msg.from.first_name,
          msg.from.username
        );
      } else {
        const cars = await getAllCarsModelNumber();
        botMessages.startDialog(
          bot.sendMessage.bind(bot),
          msg.chat.id,
          cars,
          ACTION.CARS_FOR_REFUEL
        );
      }
    } catch (e) {
      console.log(e);
    }
  });
};

module.exports = start;
