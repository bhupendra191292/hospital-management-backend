const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { validateBill, validatePayment, validateId } = require('../../middlewares/validationMiddleware');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Bill Management Routes
router.get('/', billingController.getAllBills);
router.get('/stats', billingController.getBillingStats);
router.get('/:id', validateId, billingController.getBillById);
router.post('/', validateBill, billingController.createBill);
router.put('/:id', validateId, validateBill, billingController.updateBill);
router.delete('/:id', validateId, billingController.deleteBill);

// Payment Routes
router.post('/:id/payments', validateId, validatePayment, billingController.addPayment);
router.get('/:id/payments', validateId, billingController.getBillPayments);

// Report Routes
router.get('/reports/summary', billingController.getBillingSummary);
router.get('/reports/outstanding', billingController.getOutstandingBills);
router.get('/reports/collections', billingController.getCollectionReport);

// Export Routes
router.get('/export/pdf/:id', validateId, billingController.exportBillPDF);
router.get('/export/excel', billingController.exportBillsExcel);

module.exports = router;
