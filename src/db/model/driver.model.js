const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const DriverSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true
  },
  carsIds: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'car'
    }
  ],
  tlg_chatId: {
    type: Number
  },
  temp_carId: {
    type: mongoose.ObjectId,
    default: null
  },
  temp_litres: {
    type: Number,
    default: 0
  }
});

const Driver = model('driver', DriverSchema);

module.exports = Driver;
