const express = require('express');
const router = express.Router();
const {
  createRecurring,
  getRecurringExpenses,
  toggleRecurring,
  deleteRecurring,
  processRecurringExpenses,
} = require('../controllers/recurringController');
const { protect } = require('../middleware/authMiddleware');

// Vercel Cron triggered processing endpoint
router.get('/process', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  
  try {
    await processRecurringExpenses();
    res.status(200).json({ message: 'Processed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', protect, createRecurring);
router.get('/', protect, getRecurringExpenses);
router.put('/:id/toggle', protect, toggleRecurring);
router.delete('/:id', protect, deleteRecurring);

module.exports = router;
