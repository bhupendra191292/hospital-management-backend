const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/summary', authMiddleware, analyticsController.getDashboardSummary);
router.get('/trends', authMiddleware, analyticsController.getTrends);

module.exports = router;
