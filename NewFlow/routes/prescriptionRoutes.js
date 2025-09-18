const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
} = require('../controllers/prescriptionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation middleware
const validatePrescription = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('medication').notEmpty().trim().withMessage('Medication is required'),
  body('dosage').notEmpty().trim().withMessage('Dosage is required'),
  body('frequency').isIn([
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
    'As needed', 'Before meals', 'After meals', 'At bedtime'
  ]).withMessage('Invalid frequency'),
  body('duration').notEmpty().trim().withMessage('Duration is required'),
  body('instructions').optional().trim(),
  body('status').optional().isIn(['Active', 'Completed', 'Cancelled', 'Draft']),
  body('refills').optional().isInt({ min: 0 }),
  body('notes').optional().trim()
];

const validatePrescriptionUpdate = [
  body('medication').optional().notEmpty().trim(),
  body('dosage').optional().notEmpty().trim(),
  body('frequency').optional().isIn([
    'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
    'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours',
    'As needed', 'Before meals', 'After meals', 'At bedtime'
  ]),
  body('duration').optional().notEmpty().trim(),
  body('instructions').optional().trim(),
  body('status').optional().isIn(['Active', 'Completed', 'Cancelled', 'Draft']),
  body('refills').optional().isInt({ min: 0 }),
  body('notes').optional().trim()
];

// Routes
router.post('/', validatePrescription, createPrescription);
router.get('/', getAllPrescriptions);
router.get('/patient/:patientId', [
  param('patientId').isMongoId().withMessage('Invalid patient ID')
], getPrescriptionsByPatient);
router.get('/doctor/:doctorId', [
  param('doctorId').isMongoId().withMessage('Invalid doctor ID')
], getPrescriptionsByDoctor);
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid prescription ID')
], getPrescriptionById);
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid prescription ID'),
  ...validatePrescriptionUpdate
], updatePrescription);
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid prescription ID')
], deletePrescription);

module.exports = router;
