const Car = require('./model/car.model');

module.exports = {
  getAllCarsModelNumberGas: async () => {
    return await Car.find({})
      .select('model number gasoline_residue -_id')
      .sort('model');
  },
  getAllCarsModelNumber: async () => {
    return await Car.find({}).select('model number').sort('model');
  },
  getCarByIdWithoutDriversIds: async carId => {
    return await Car.findById(carId).select('-driversIds');
  },
  getInfoAboutCarWithDriversNames: async carId => {
    return await Car.findById(carId).populate({
      path: 'driversIds',
      select: 'name -_id',
      options: { sort: { name: 1 } }
    });
  },
  setCarGasolineResidue: async (carId, gasoline_residue) => {
    await Car.updateOne({ _id: carId }, { $set: { gasoline_residue } });
  },
  getModelNumberGas: async carId => {
    return await Car.findById(carId).select(
      'model number gasoline_residue -_id'
    );
  }
};
