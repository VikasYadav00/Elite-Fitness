// Elite Fitness - Expense Routes
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary
} = require('../controllers/expenseController');

router.get('/', authenticate, authorize('OWNER'), getExpenses);
router.get('/summary', authenticate, authorize('OWNER'), getExpenseSummary);
router.post('/', authenticate, authorize('OWNER'), createExpense);
router.put('/:id', authenticate, authorize('OWNER'), updateExpense);
router.delete('/:id', authenticate, authorize('OWNER'), deleteExpense);

module.exports = router;
