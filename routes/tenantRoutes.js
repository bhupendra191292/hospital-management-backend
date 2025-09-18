const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authMiddleware, requireAdmin } = require('../middlewares/authMiddleware');
const { resolveTenant, checkFeatureAccess, addTenantFilter } = require('../middlewares/tenantMiddleware');
const { validateTenant } = require('../middlewares/validationMiddleware');

// Public routes (no authentication required)
router.post('/register', tenantController.registerTenant);

// Tenant-specific routes (require tenant resolution)
router.get('/config', resolveTenant, tenantController.getTenantConfig);
router.patch('/config', resolveTenant, authMiddleware, requireAdmin, tenantController.updateTenantConfig);
router.get('/stats', resolveTenant, authMiddleware, tenantController.getTenantStats);

// Super admin routes (for managing all tenants)
router.get('/all', authMiddleware, requireAdmin, tenantController.listTenants);
router.patch('/:tenantId/status', authMiddleware, requireAdmin, tenantController.updateTenantStatus);

module.exports = router;
