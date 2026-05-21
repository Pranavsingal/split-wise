const Expense = require('../models/Expense');
const Settlement = require('../models/Settlement');

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res) => {
  try {
    const { description, amount, payer, group, splits } = req.body;

    // Validate splits match total amount (accounting for floating point errors)
    const totalSplit = splits.reduce((acc, split) => acc + split.amountOwed, 0);
    if (Math.abs(totalSplit - amount) > 0.01) {
      return res.status(400).json({ message: 'Splits do not add up to total amount' });
    }

    const expense = await Expense.create({
      description,
      amount,
      payer,
      group: group || null,
      splits,
      createdBy: req.user._id,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user expenses
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [{ payer: req.user._id }, { 'splits.user': req.user._id }],
    })
      .populate('payer', 'name email')
      .populate('splits.user', 'name email')
      .populate('group', 'name')
      .sort('-createdAt');

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a settlement (payment)
// @route   POST /api/expenses/settle
// @access  Private
const addSettlement = async (req, res) => {
  try {
    const { payee, amount, group } = req.body; // req.user is the payer

    const settlement = await Settlement.create({
      payer: req.user._id,
      payee,
      amount,
      group: group || null,
    });

    res.status(201).json(settlement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all balances for current user
// @route   GET /api/expenses/balances
// @access  Private
const getBalances = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const balances = {}; // { otherUserId: { amount: 0, user: {} } } (positive means they owe current user)

    // 1. Calculate from Expenses
    const expenses = await Expense.find({
      $or: [{ payer: req.user._id }, { 'splits.user': req.user._id }],
    }).populate('payer splits.user', 'name email');

    expenses.forEach((expense) => {
      const payerId = expense.payer._id.toString();
      
      expense.splits.forEach((split) => {
        const splitUserId = split.user._id.toString();
        
        if (payerId === userId && splitUserId !== userId) {
          // Current user paid, other user owes them
          if (!balances[splitUserId]) balances[splitUserId] = { amount: 0, user: split.user };
          balances[splitUserId].amount += split.amountOwed;
        } else if (splitUserId === userId && payerId !== userId) {
          // Other user paid, current user owes them
          if (!balances[payerId]) balances[payerId] = { amount: 0, user: expense.payer };
          balances[payerId].amount -= split.amountOwed;
        }
      });
    });

    // 2. Calculate from Settlements
    const settlements = await Settlement.find({
      $or: [{ payer: req.user._id }, { payee: req.user._id }],
    }).populate('payer payee', 'name email');

    settlements.forEach((settlement) => {
      const payerId = settlement.payer._id.toString();
      const payeeId = settlement.payee._id.toString();

      if (payerId === userId) {
        // Current user paid someone (reduces what user owes them, meaning adds to balance)
        if (!balances[payeeId]) balances[payeeId] = { amount: 0, user: settlement.payee };
        balances[payeeId].amount += settlement.amount;
      } else if (payeeId === userId) {
        // Someone paid current user (reduces what they owe user, meaning subtracts from balance)
        if (!balances[payerId]) balances[payerId] = { amount: 0, user: settlement.payer };
        balances[payerId].amount -= settlement.amount;
      }
    });

    // Clean up 0 balances and format array
    const balancesArray = Object.values(balances)
      .filter((b) => Math.abs(b.amount) > 0.01)
      .map(b => ({
        ...b,
        amount: Number(b.amount.toFixed(2))
      }));

    res.json(balancesArray);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's settlement (payment) history
// @route   GET /api/expenses/settlements
// @access  Private
const getSettlements = async (req, res) => {
  try {
    const settlements = await Settlement.find({
      $or: [{ payer: req.user._id }, { payee: req.user._id }],
    })
      .populate('payer', 'name email')
      .populate('payee', 'name email')
      .sort('-date'); // Sort by most recent first

    res.json(settlements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addExpense,
  getExpenses,
  addSettlement,
  getBalances,
  getSettlements,
};
