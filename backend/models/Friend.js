const mongoose = require('mongoose');

const friendSchema = mongoose.Schema(
  {
    user1: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    user2: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED'],
      default: 'ACCEPTED', // simplifying for MVP
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique friendship
friendSchema.index({ user1: 1, user2: 1 }, { unique: true });

module.exports = mongoose.model('Friend', friendSchema);
