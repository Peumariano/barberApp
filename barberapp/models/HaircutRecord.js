const mongoose = require('mongoose');

const haircutRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  service: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  isFree: {
    type: Boolean,
    default: false
  },
  pointsEarned: {
    type: Number,
    default: 1
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }
});

const HaircutRecord = mongoose.model('HaircutRecord', haircutRecordSchema);
module.exports = HaircutRecord;