const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware, requireAdmin } = require('../middlewares/authMiddleware');
const { validateDoctor, validateId, validatePagination } = require('../middlewares/validationMiddleware');
const { loginLimiter, adminLimiter } = require('../middlewares/rateLimitMiddleware');

router.post('/login', loginLimiter, doctorController.loginDoctor);
router.get('/', authMiddleware, requireAdmin, validatePagination, adminLimiter, doctorController.getAllDoctors);
router.post('/', authMiddleware, requireAdmin, validateDoctor, adminLimiter, doctorController.createDoctor);
router.patch('/:id', authMiddleware, requireAdmin, validateId, adminLimiter, doctorController.updateDoctor);
router.patch('/:id/promote', authMiddleware, requireAdmin, validateId, adminLimiter, doctorController.promoteDoctor);
router.delete('/:id', authMiddleware, requireAdmin, validateId, adminLimiter, doctorController.deleteDoctor);

module.exports = router;
