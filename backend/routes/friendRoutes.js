const express = require('express');
const router = express.Router();
const { addFriend, getFriends } = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, addFriend);
router.get('/', protect, getFriends);

module.exports = router;
