const botMessages = require('../botMessages');
const {
  getAllCarsModelNumber,
  getAllCarsModelNumberGas
} = require('../db/car-db-queries');
const {
  getDriverStatusByChatId,
  getAllDriversByAlphabet,
  getDriverByChatId,
  getDriverByIdWithCars,
  setGiveOutOrRefuel
} = require('../db/driver-db-queries');
const { sortStringsFromObj } = require('../helper');
const KB_BTNS = require('../keyboard-buttons');
const ACTION = require('../inline-keyboard-actions');

const message = bot => {
  bot.message(async msg => {
    const chatId = msg.chat.id;
    const status = await getDriverStatusByChatId(msg.chat.id);
    switch (msg.text) {
      case KB_BTNS.GIVE_OUT_FUEL:
        status === 0
          ? giveOutFuel(bot.sendMessage.bind(bot), chatId)
          : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId); // Done
        break;
      case KB_BTNS.TOTAL_FUEL_BALANCE:
        status < 2
          ? totalFuelBalance(bot.sendMessage.bind(bot), chatId)
          : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId); // Done
        break;
      case KB_BTNS.ABOUT_CAR: // Done
        status < 3
          ? aboutCar(bot.sendMessage.bind(bot), chatId)
          : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId); // Done
        break;
      case KB_BTNS.CAR_REFUEL_STAT: // Done
        status < 2
          ? carStatistic(bot.sendMessage.bind(bot), chatId)
          : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId);
        break;
      case KB_BTNS.ABOUT_DRIVER: // Done
        status < 3
          ? aboutDriver(bot.sendMessage.bind(bot), chatId)
          : botMessages.accessDenied(bot.sendMessage.bind(bot), chatId);
        break;
      case KB_BTNS.MY_CARS: // Done
        myCars(chatId);
        break;
    }
  });
};

const giveOutFuel = async (sendMessage, chatId) => {
  const cars = await getAllCarsModelNumber();
  await setGiveOutOrRefuel(chatId, true);
  sortStringsFromObj(cars, 'model');
  botMessages.giveOutGasoline(sendMessage, chatId, cars, ACTION.GIVE_OUT_FUEL);
};

const totalFuelBalance = async (sendMessage, chatId) => {
  const cars = await getAllCarsModelNumberGas();
  sortStringsFromObj(cars, 'model');
  botMessages.totalFuelBalance(sendMessage, chatId, cars);
};

const aboutCar = async (sendMessage, chatId) => {
  const cars = await getAllCarsModelNumber();
  sortStringsFromObj(cars, 'model');
  botMessages.inlineKbdListOfCars(
    sendMessage,
    chatId,
    cars,
    ACTION.INFO_ABOUT_CAR
  );
};

const carStatistic = async (sendMessage, chatId) => {
  const cars = await getAllCarsModelNumber();
  sortStringsFromObj(cars, 'model');
  botMessages.inlineKbdListOfCars(
    sendMessage,
    chatId,
    cars,
    ACTION.CAR_STATISTIC
  );
};

const aboutDriver = async (sendMessage, chatId) => {
  const drivers = await getAllDriversByAlphabet();
  botMessages.inlineKbdListOfDrivers(
    sendMessage,
    chatId,
    drivers,
    ACTION.INFO_ABOUT_DRIVER
  );
};

const myCars = async (sendMessage, chatId) => {
  const driver = await getDriverByChatId(chatId);
  if (!driver) {
    botMessages.accessDenied(sendMessage, chatId);
  } else {
    const driver = await getDriverByIdWithCars(driver._id);
    sortStringsFromObj(driver.carsIds, 'model');
    botMessages.carsAssignedToDriver(sendMessage, chatId, driver);
  }
};

module.exports = message;
