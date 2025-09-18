const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, requireAdmin } = require('../middlewares/authMiddleware');
const { validatePagination, validateDateRange } = require('../middlewares/validationMiddleware');
const { adminLimiter } = require('../middlewares/rateLimitMiddleware');

// Admin dashboard
router.get('/dashboard', authMiddleware, requireAdmin, adminLimiter, adminController.getAdminDashboard);

// Audit logs
router.get('/audit-logs', authMiddleware, requireAdmin, validatePagination, validateDateRange, adminLimiter, adminController.getAuditLogs);

module.exports = router;
