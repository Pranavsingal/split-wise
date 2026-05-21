const Group = require('../models/Group');

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body; // members is array of user IDs

    // Automatically add the creator to the group members if not present
    const groupMembers = members || [];
    if (!groupMembers.includes(req.user._id.toString())) {
      groupMembers.push(req.user._id);
    }

    const group = await Group.create({
      name,
      description,
      members: groupMembers,
      createdBy: req.user._id,
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's groups
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
    }).populate('members', 'name email');

    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group details by ID
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'name email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is part of the group
    if (!group.members.some((m) => m._id.toString() === req.user._id.toString())) {
      return res.status(401).json({ message: 'Not authorized to view this group' });
    }

    res.json(group);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
};
