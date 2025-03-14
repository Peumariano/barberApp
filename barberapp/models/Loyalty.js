const mongoose = require('mongoose');

const loyaltySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentPoints: {
    type: Number,
    default: 0
  },
  totalHaircuts: {
    type: Number,
    default: 0
  },
  freeHaircutsEarned: {
    type: Number,
    default: 0
  },
  freeHaircutsUsed: {
    type: Number,
    default: 0
  },
  pointsToNextFree: {
    type: Number,
    default: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Loyalty = mongoose.model('Loyalty', loyaltySchema);
module.exports = Loyalty;