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
  }
};
