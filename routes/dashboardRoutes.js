// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/summary', authMiddleware, getDashboardSummary);

module.exports = router;
