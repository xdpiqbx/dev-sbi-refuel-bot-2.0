const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const CarSchema = new Schema({
  model: {
    type: String,
    required: true
  },
  number: {
    type: String,
    required: true
  },
  gasoline_residue: {
    type: Number,
    required: true
  },
  driversIds: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'driver'
    }
  ]
  // giveOutOrRefuel: {
  //   type: Boolean,
  //   default: false
  // }
});

const Car = model('car', CarSchema);

module.exports = Car;
