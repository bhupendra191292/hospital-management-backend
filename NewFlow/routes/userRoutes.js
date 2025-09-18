const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all users with pagination and filters
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'pharmacist', 'patient', 'super_admin']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
  query('sortBy').optional().isIn(['createdAt', 'name', 'email', 'role', 'status']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], userController.getAllUsers);

// Get user statistics
router.get('/stats', userController.getUserStats);

// Get user by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], userController.getUserById);

// Create new user
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'pharmacist', 'patient', 'super_admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
  body('profile.gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('profile.dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth format')
], userController.createUser);

// Update user
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('phone').optional().matches(/^[0-9]{10}$/).withMessage('Phone must be a valid 10-digit number'),
  body('role').optional().isIn(['admin', 'doctor', 'nurse', 'receptionist', 'lab_tech', 'pharmacist', 'patient', 'super_admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']).withMessage('Invalid status'),
  body('profile.gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('profile.dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth format')
], userController.updateUser);

// Delete user
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], userController.deleteUser);

// Update user password
router.patch('/:id/password', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], userController.updateUserPassword);

// Toggle user status
router.patch('/:id/status', [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], userController.toggleUserStatus);

module.exports = router;
