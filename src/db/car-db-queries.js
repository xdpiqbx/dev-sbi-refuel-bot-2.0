const Car = require('./model/car.model');

module.exports = {
  getAllCarsModelNumberGas: async () => {
    return await Car.find({}).select('model number gasoline_residue -_id');
  },
  getAllCarsModelNumber: async () => {
    return await Car.find({}).select('model number').sort('model');
  },
  getCarByIdWithoutDriversIds: async carId => {
    return await Car.findById(carId).select('-driversIds');
  },
  getInfoAboutCarWithDriversNames: async carId => {
    return await Car.findById(carId).populate('driversIds', 'name -_id');
  },
  setCarGasolineResidue: async (carId, gasoline_residue) => {
    await Car.updateOne({ _id: carId }, { $set: { gasoline_residue } });
  },
  getGiveOutOrRefuel: async carId => {
    return await Car.findById(carId).select('giveOutOrRefuel');
  },
  setGiveOutOrRefuel: async (carId, giveOutOrRefuel) => {
    return await Car.findOneAndUpdate(
      { _id: carId },
      { $set: { giveOutOrRefuel } }
    );
  }
};
