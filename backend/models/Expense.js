const mongoose = require('mongoose');

const splitSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amountOwed: {
      type: Number,
      required: true,
    },
    splitType: {
      type: String,
      enum: ['EQUAL', 'EXACT', 'PERCENTAGE'],
      default: 'EQUAL',
    },
    percentage: {
      type: Number, // Only required if splitType is PERCENTAGE
    },
  },
  { _id: false }
);

const expenseSchema = mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    amount: {
      type: Number,
      required: [true, 'Please add the total amount'],
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Who paid for this expense
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
    splits: [splitSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Expense', expenseSchema);
