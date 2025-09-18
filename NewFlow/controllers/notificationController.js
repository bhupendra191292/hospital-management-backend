const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');

// Get notifications with pagination and filters
const getNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Build filter object
    const filter = {
      recipientId: userId,
      tenantId
    };

    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get notifications
    const notifications = await Notification.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('recipientId', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    // Get total count
    const total = await Notification.countDocuments(filter);

    // Get unread count
    const unreadCount = await Notification.getUnreadCount(userId, tenantId);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        unreadCount
      },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const notification = await Notification.findOne({
      _id: id,
      recipientId: userId,
      tenantId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        flow: 'newflow'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const result = await Notification.markAllAsRead(userId, tenantId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipientId: userId,
      tenantId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        flow: 'newflow'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Clear all notifications
const clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const result = await Notification.deleteMany({
      recipientId: userId,
      tenantId
    });

    res.json({
      success: true,
      message: 'All notifications cleared',
      data: {
        deletedCount: result.deletedCount
      },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear all notifications',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Send notification
const sendNotification = async (req, res) => {
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
      title,
      message,
      type = 'info',
      priority = 'normal',
      recipientId,
      recipientType = 'user',
      persistent = false,
      actions = [],
      data = {},
      channels = ['in-app'],
      scheduledAt,
      expiresAt
    } = req.body;

    const tenantId = req.user.tenantId;
    const createdBy = req.user.userId;

    const notification = new Notification({
      title,
      message,
      type,
      priority,
      recipientId,
      recipientType,
      persistent,
      actions,
      data,
      channels,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      tenantId,
      createdBy,
      status: 'sent'
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Get notification settings
const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // For now, return default settings
    // In a real app, you'd store user preferences in a separate collection
    const settings = {
      email: true,
      sms: false,
      push: true,
      inApp: true,
      types: {
        appointment: true,
        medical: true,
        system: true,
        marketing: false
      },
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    res.json({
      success: true,
      data: settings,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Update notification settings
const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    const settings = req.body;

    // For now, just return success
    // In a real app, you'd save these settings to a user preferences collection
    console.log('Updating notification settings for user:', userId, settings);

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message,
      flow: 'newflow'
    });
  }
};

// Get notification statistics
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    const stats = await Notification.aggregate([
      {
        $match: {
          recipientId: mongoose.Types.ObjectId(userId),
          tenantId
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0]
            }
          },
          byType: {
            $push: {
              type: '$type',
              isRead: '$isRead'
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total: 0, unread: 0, byType: [] };

    // Count by type
    const typeStats = {};
    result.byType.forEach(item => {
      if (!typeStats[item.type]) {
        typeStats[item.type] = { total: 0, unread: 0 };
      }
      typeStats[item.type].total++;
      if (!item.isRead) {
        typeStats[item.type].unread++;
      }
    });

    res.json({
      success: true,
      data: {
        total: result.total,
        unread: result.unread,
        byType: typeStats
      },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message,
      flow: 'newflow'
    });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  sendNotification,
  getNotificationSettings,
  updateNotificationSettings,
  getNotificationStats
};
