const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get all users with pagination and filters
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const tenantId = req.user.tenantId;

    // Build filter object
    const filter = { tenantId };

    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get users
    const users = await User.find(filter)
      .select('-password -loginAttempts -lockUntil')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const user = await User.findOne({ _id: id, tenantId })
      .select('-password -loginAttempts -lockUntil')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        flow: 'newflow'
      });
    }

    res.json({
      success: true,
      data: user,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        flow: 'newflow'
      });
    }

    const {
      name,
      email,
      phone,
      password,
      role = 'patient',
      permissions = [],
      profile = {},
      status = 'active'
    } = req.body;

    const tenantId = req.user.tenantId;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase(), tenantId },
        { phone, tenantId }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or phone already exists',
        flow: 'newflow'
      });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role,
      permissions,
      profile,
      status,
      tenantId
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user.toJSON(),
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        flow: 'newflow'
      });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password;
    delete updateData.loginAttempts;
    delete updateData.lockUntil;

    const user = await User.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -loginAttempts -lockUntil');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        flow: 'newflow'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const user = await User.findOneAndDelete({ _id: id, tenantId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        flow: 'newflow'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const stats = await User.getUserStats(tenantId);

    // Format stats
    const formattedStats = {
      total: 0,
      byRole: {},
      active: 0,
      pending: 0,
      inactive: 0
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      formattedStats.byRole[stat._id] = {
        total: stat.count,
        active: stat.active,
        pending: stat.pending
      };
      formattedStats.active += stat.active;
      formattedStats.pending += stat.pending;
    });

    // Get inactive count
    const inactiveCount = await User.countDocuments({
      tenantId,
      status: { $in: ['inactive', 'suspended'] }
    });
    formattedStats.inactive = inactiveCount;

    res.json({
      success: true,
      data: formattedStats,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Update user password
const updateUserPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        flow: 'newflow'
      });
    }

    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const tenantId = req.user.tenantId;

    const user = await User.findOne({ _id: id, tenantId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        flow: 'newflow'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        flow: 'newflow'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Toggle user status
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.user.tenantId;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended',
        flow: 'newflow'
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { status } },
      { new: true }
    ).select('-password -loginAttempts -lockUntil');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        flow: 'newflow'
      });
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: user,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message,
      flow: 'newflow'
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  updateUserPassword,
  toggleUserStatus
};
