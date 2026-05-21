const express = require('express');
const router = express.Router();
const { getUserProfile, searchUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.get('/search', protect, searchUsers);

module.exports = router;
