const { getAllCarsModelNumber } = require('../db/car-db-queries');
const { getDriverByChatId } = require('../db/driver-db-queries');

const start = bot => {
  bot.start(async msg => {
    try {
      const dbResponse = await getDriverByChatId(msg.chat.id);
      if (!dbResponse) {
        newVisitor(msg.chat.id, msg.from.first_name, msg.from.username);
      } else {
        const driver = new Driver(dbResponse);
        state.check.driverId = driver._id;
        if (driver.tlg_chatId === msg.chat.id) {
          const cars = await getAllCarsModelNumber();
          sortStringsFromObj(cars, 'model');
          botMessages.startDialog(
            bot.sendMessage.bind(bot),
            msg.chat.id,
            cars,
            ACTION.CARS_FOR_REFUEL
          );
        }
      }
    } catch (e) {
      console.log(e);
    }
  });
};

module.exports = start;
