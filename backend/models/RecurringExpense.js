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
      type: Number,
    },
  },
  { _id: false }
);

const recurringExpenseSchema = mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    amount: {
      type: Number,
      required: [true, 'Please add the total amount'],
    },
    category: {
      type: String,
      enum: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Rent', 'Health', 'Travel', 'Other'],
      default: 'Other',
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    splits: [splitSchema],
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: [true, 'Please select a frequency'],
    },
    nextRunDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
