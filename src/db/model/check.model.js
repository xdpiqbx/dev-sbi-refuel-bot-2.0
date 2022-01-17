const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const CheckSchema = new Schema({
  date: {
    type: Date,
    required: true
  },
  litres: {
    type: Number,
    required: true
  },
  checkImageUrl: {
    type: String
  },
  tlg_file_id: {
    type: String,
    required: true
  },
  tlg_file_unique_id: {
    type: String,
    required: true
  },
  carId: {
    type: mongoose.ObjectId,
    required: true
  },
  driverId: {
    type: mongoose.ObjectId,
    required: true
  }
});

const Check = model('check', CheckSchema);

module.exports = Check;
