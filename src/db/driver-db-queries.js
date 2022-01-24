const dbQuerieErrors = require('../errorCodes');
const Driver = require('./model/driver.model');

module.exports = {
  getAllDriversByAlphabet: async () => {
    return await Driver.find({})
      .select('name')
      .collation({ locale: 'uk' })
      .sort({ name: 1 });
  },
  getDriverByChatId: async chatId => {
    return await Driver.findOne({ tlg_chatId: chatId });
  },
  getAllDriversWithoutChatId: async () => {
    return await Driver.find({ tlg_chatId: null });
  },
  getDriverByIdWithoutCars: async driverId => {
    return await Driver.findById(driverId, 'name tlg_chatId');
  },
  getDriverByIdWithCars: async driverId => {
    return await Driver.findById(driverId).populate(
      'carsIds',
      'model number -_id'
    );
  },
  setTlgChatIdToDriver: async (driverId, tlg_chatId) => {
    return await Driver.updateOne({ _id: driverId }, { $set: { tlg_chatId } });
  },
  getDriverStatusByChatId: async chatId => {
    const res = await Driver.findOne({ tlg_chatId: chatId }).select(
      'status -_id'
    );
    if (!res) {
      return dbQuerieErrors.NOT_EXIST;
    } else {
      return res.status;
    }
  },
  setTempCarIdForDriver: async (chatId, carId) => {
    return await Driver.updateOne(
      { tlg_chatId: chatId },
      { $set: { temp_carId: carId } }
    );
  },
  getTempCarId: async chatId => {
    return await Driver.findOne({ tlg_chatId: chatId }).select('temp_carId');
  },
  setTempLitres: async (chatId, litres) => {
    return await Driver.updateOne(
      { tlg_chatId: chatId },
      { $set: { temp_litres: litres } }
    );
  },
  getTmpCarIdTmpLitresDrvStatus: async chatId => {
    return await Driver.findOne({ tlg_chatId: chatId }).select(
      'temp_carId temp_litres status'
    );
  },
  resetTempDataInDriver: async driverId => {
    await Driver.findByIdAndUpdate(driverId, {
      $set: { temp_litres: 0, temp_carId: null, giveOutOrRefuel: false }
    });
  },
  getGiveOutOrRefuel: async chatId => {
    const res = await Driver.findOne({ tlg_chatId: chatId }).select(
      'giveOutOrRefuel'
    );
    return res.giveOutOrRefuel;
  },
  setGiveOutOrRefuel: async (chatId, giveOutOrRefuel) => {
    return await Driver.updateOne(
      { tlg_chatId: chatId },
      { $set: { giveOutOrRefuel: giveOutOrRefuel } }
    );
  }
};
