const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');

// @desc    Create a recurring expense
// @route   POST /api/recurring
// @access  Private
const createRecurring = async (req, res) => {
  try {
    const { description, amount, category, splits, frequency } = req.body;

    // Validate splits match total amount
    const totalSplit = splits.reduce((acc, split) => acc + split.amountOwed, 0);
    if (Math.abs(totalSplit - amount) > 0.01) {
      return res.status(400).json({ message: 'Splits do not add up to total amount' });
    }

    // Calculate the first nextRunDate based on frequency
    const now = new Date();
    let nextRunDate = new Date(now);
    if (frequency === 'daily') {
      nextRunDate.setDate(nextRunDate.getDate() + 1);
    } else if (frequency === 'weekly') {
      nextRunDate.setDate(nextRunDate.getDate() + 7);
    } else if (frequency === 'monthly') {
      nextRunDate.setMonth(nextRunDate.getMonth() + 1);
    }

    const recurring = await RecurringExpense.create({
      description,
      amount,
      category: category || 'Other',
      payer: req.user._id,
      splits,
      frequency,
      nextRunDate,
      createdBy: req.user._id,
    });

    res.status(201).json(recurring);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's recurring expenses
// @route   GET /api/recurring
// @access  Private
const getRecurringExpenses = async (req, res) => {
  try {
    const recurring = await RecurringExpense.find({ createdBy: req.user._id })
      .populate('splits.user', 'name email')
      .sort('-createdAt');

    res.json(recurring);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle recurring expense active/paused
// @route   PUT /api/recurring/:id/toggle
// @access  Private
const toggleRecurring = async (req, res) => {
  try {
    const recurring = await RecurringExpense.findById(req.params.id);

    if (!recurring) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }

    if (recurring.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    recurring.isActive = !recurring.isActive;

    // If reactivating, set nextRunDate to future
    if (recurring.isActive) {
      const now = new Date();
      if (recurring.nextRunDate <= now) {
        if (recurring.frequency === 'daily') {
          recurring.nextRunDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (recurring.frequency === 'weekly') {
          recurring.nextRunDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (recurring.frequency === 'monthly') {
          recurring.nextRunDate = new Date(now);
          recurring.nextRunDate.setMonth(recurring.nextRunDate.getMonth() + 1);
        }
      }
    }

    await recurring.save();
    res.json(recurring);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a recurring expense
// @route   DELETE /api/recurring/:id
// @access  Private
const deleteRecurring = async (req, res) => {
  try {
    const recurring = await RecurringExpense.findById(req.params.id);

    if (!recurring) {
      return res.status(404).json({ message: 'Recurring expense not found' });
    }

    if (recurring.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await RecurringExpense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Recurring expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process all due recurring expenses (called by cron)
const processRecurringExpenses = async () => {
  try {
    const now = new Date();
    const dueRecurring = await RecurringExpense.find({
      isActive: true,
      nextRunDate: { $lte: now },
    });

    console.log(`[CRON] Processing ${dueRecurring.length} recurring expense(s)...`);

    for (const recurring of dueRecurring) {
      // Create the actual expense
      await Expense.create({
        description: `${recurring.description} (recurring)`,
        amount: recurring.amount,
        category: recurring.category,
        payer: recurring.payer,
        splits: recurring.splits,
        createdBy: recurring.createdBy,
      });

      // Advance nextRunDate
      if (recurring.frequency === 'daily') {
        recurring.nextRunDate = new Date(recurring.nextRunDate.getTime() + 24 * 60 * 60 * 1000);
      } else if (recurring.frequency === 'weekly') {
        recurring.nextRunDate = new Date(recurring.nextRunDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (recurring.frequency === 'monthly') {
        recurring.nextRunDate.setMonth(recurring.nextRunDate.getMonth() + 1);
      }

      await recurring.save();
      console.log(`[CRON] Created expense for: ${recurring.description}`);
    }
  } catch (error) {
    console.error('[CRON] Error processing recurring expenses:', error.message);
  }
};

module.exports = {
  createRecurring,
  getRecurringExpenses,
  toggleRecurring,
  deleteRecurring,
  processRecurringExpenses,
};
