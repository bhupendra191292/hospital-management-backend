const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get notifications with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['success', 'error', 'warning', 'info', 'appointment', 'medical', 'system']).withMessage('Invalid notification type'),
  query('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'read', 'failed']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['createdAt', 'title', 'type', 'priority']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], notificationController.getNotifications);

// Get notification statistics
router.get('/stats', notificationController.getNotificationStats);

// Mark notification as read
router.patch('/:id/read', [
  param('id').isMongoId().withMessage('Invalid notification ID')
], notificationController.markNotificationAsRead);

// Mark all notifications as read
router.patch('/read-all', notificationController.markAllNotificationsAsRead);

// Delete notification
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid notification ID')
], notificationController.deleteNotification);

// Clear all notifications
router.delete('/clear-all', notificationController.clearAllNotifications);

// Send notification
router.post('/send', [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message is required and must be less than 1000 characters'),
  body('type').optional().isIn(['success', 'error', 'warning', 'info', 'appointment', 'medical', 'system']).withMessage('Invalid notification type'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority'),
  body('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  body('recipientType').optional().isIn(['user', 'role', 'all']).withMessage('Invalid recipient type'),
  body('persistent').optional().isBoolean().withMessage('Persistent must be boolean'),
  body('channels').optional().isArray().withMessage('Channels must be an array'),
  body('channels.*').optional().isIn(['in-app', 'email', 'sms', 'push']).withMessage('Invalid channel type'),
  body('scheduledAt').optional().isISO8601().withMessage('Invalid scheduled date format'),
  body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date format')
], notificationController.sendNotification);

// Get notification settings
router.get('/settings', notificationController.getNotificationSettings);

// Update notification settings
router.patch('/settings', [
  body('email').optional().isBoolean().withMessage('Email setting must be boolean'),
  body('sms').optional().isBoolean().withMessage('SMS setting must be boolean'),
  body('push').optional().isBoolean().withMessage('Push setting must be boolean'),
  body('inApp').optional().isBoolean().withMessage('In-app setting must be boolean'),
  body('frequency').optional().isIn(['immediate', 'daily', 'weekly']).withMessage('Invalid frequency setting')
], notificationController.updateNotificationSettings);

module.exports = router;
