const Friend = require('../models/Friend');
const User = require('../models/User');

// @desc    Add a friend
// @route   POST /api/friends
// @access  Private
const addFriend = async (req, res) => {
  try {
    const { friendEmail } = req.body;

    const friendUser = await User.findOne({ email: friendEmail });

    if (!friendUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (friendUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot add yourself as a friend' });
    }

    // Check if friendship already exists
    const existingFriendship = await Friend.findOne({
      $or: [
        { user1: req.user._id, user2: friendUser._id },
        { user1: friendUser._id, user2: req.user._id },
      ],
    });

    if (existingFriendship) {
      return res.status(400).json({ message: 'You are already friends with this user' });
    }

    const friendship = await Friend.create({
      user1: req.user._id,
      user2: friendUser._id,
      status: 'ACCEPTED', // simplifying for MVP
    });

    res.status(201).json(friendship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's friends
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    const friendships = await Friend.find({
      $or: [{ user1: req.user._id }, { user2: req.user._id }],
      status: 'ACCEPTED',
    }).populate('user1 user2', 'name email');

    // Map to just return the friend's user data
    const friendsList = friendships.map((f) => {
      if (f.user1._id.toString() === req.user._id.toString()) {
        return f.user2;
      }
      return f.user1;
    });

    res.json(friendsList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addFriend,
  getFriends,
};
