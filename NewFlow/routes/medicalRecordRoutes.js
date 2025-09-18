const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getMedicalRecordsByPatient,
  getMedicalRecordsByDoctor,
  createMedicalRecord,
  getAllMedicalRecords
} = require('../controllers/medicalRecordController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get medical records by patient
router.get('/patients/:patientId/medical-records', [
  param('patientId').isMongoId().withMessage('Invalid patient ID')
], getMedicalRecordsByPatient);

// Get medical records by doctor
router.get('/doctors/:doctorId/medical-records', [
  param('doctorId').isMongoId().withMessage('Invalid doctor ID')
], getMedicalRecordsByDoctor);

// Get all medical records with pagination and filters
router.get('/medical-records', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('recordType').optional().isIn(['Consultation', 'Follow-up', 'Emergency', 'Lab Test', 'Imaging', 'Procedure']).withMessage('Invalid record type'),
  query('status').optional().isIn(['Active', 'Completed', 'Cancelled']).withMessage('Invalid status')
], getAllMedicalRecords);

// Create new medical record
router.post('/medical-records', [
  body('patientId').isMongoId().withMessage('Invalid patient ID'),
  body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('visitId').optional().isMongoId().withMessage('Invalid visit ID'),
  body('recordType').isIn(['Consultation', 'Follow-up', 'Emergency', 'Lab Test', 'Imaging', 'Procedure']).withMessage('Invalid record type'),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('department').notEmpty().trim().withMessage('Department is required'),
  body('diagnosis').notEmpty().trim().withMessage('Diagnosis is required'),
  body('treatment').notEmpty().trim().withMessage('Treatment is required'),
  body('notes').optional().trim(),
  body('followUpRequired').optional().isBoolean().withMessage('Follow-up required must be boolean'),
  body('followUpDate').optional().isISO8601().withMessage('Invalid follow-up date format'),
  body('status').optional().isIn(['Active', 'Completed', 'Cancelled']).withMessage('Invalid status')
], createMedicalRecord);

module.exports = router;
