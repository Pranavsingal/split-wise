const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, addSettlement, getBalances, getSettlements } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addExpense);
router.get('/', protect, getExpenses);
router.post('/settle', protect, addSettlement);
router.get('/balances', protect, getBalances);
router.get('/settlements', protect, getSettlements);

module.exports = router;
