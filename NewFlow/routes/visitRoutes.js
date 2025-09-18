const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getAllVisits,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitsByPatient,
  getVisitsByDoctor,
  getVisitStats
} = require('../controllers/visitController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Validation middleware
const visitValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('visitType').isIn(['OPD', 'Emergency', 'Follow-up', 'Consultation', 'Procedure']).withMessage('Invalid visit type'),
  body('chiefComplaint').optional({ checkFalsy: true }).trim().isLength({ min: 5, max: 500 }).withMessage('Chief complaint must be between 5 and 500 characters if provided'),
  body('department').isIn(['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology', 'ENT', 'Ophthalmology', 'Emergency', 'Other']).withMessage('Invalid department'),
  body('appointmentDate').isISO8601().withMessage('Invalid appointment date'),
  body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid appointment time format (HH:MM)'),
  body('priority').optional().isIn(['Low', 'Normal', 'High', 'Emergency']).withMessage('Invalid priority'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  body('insuranceProvider').optional().trim().isLength({ max: 100 }).withMessage('Insurance provider name too long'),
  body('insuranceNumber').optional().trim().isLength({ max: 50 }).withMessage('Insurance number too long'),
  body('estimatedCost').optional().isNumeric().withMessage('Estimated cost must be a number'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('doctorId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid doctor ID'),
  body('doctorName').optional().trim().isLength({ max: 100 }).withMessage('Doctor name too long')
];

const updateVisitValidation = [
  body('visitType').optional().isIn(['OPD', 'Emergency', 'Follow-up', 'Consultation', 'Procedure']).withMessage('Invalid visit type'),
  body('chiefComplaint').optional().trim().isLength({ min: 5, max: 500 }).withMessage('Chief complaint must be between 5 and 500 characters'),
  body('department').optional().isIn(['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology', 'ENT', 'Ophthalmology', 'Emergency', 'Other']).withMessage('Invalid department'),
  body('appointmentDate').optional().isISO8601().withMessage('Invalid appointment date'),
  body('appointmentTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid appointment time format (HH:MM)'),
  body('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show']).withMessage('Invalid status'),
  body('priority').optional().isIn(['Low', 'Normal', 'High', 'Emergency']).withMessage('Invalid priority'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  body('insuranceProvider').optional().trim().isLength({ max: 100 }).withMessage('Insurance provider name too long'),
  body('insuranceNumber').optional().trim().isLength({ max: 50 }).withMessage('Insurance number too long'),
  body('estimatedCost').optional().isNumeric().withMessage('Estimated cost must be a number'),
  body('symptoms').optional().isArray().withMessage('Symptoms must be an array'),
  body('doctorId').optional({ checkFalsy: true }).isMongoId().withMessage('Invalid doctor ID'),
  body('doctorName').optional().trim().isLength({ max: 100 }).withMessage('Doctor name too long'),
  body('diagnosis').optional().isArray().withMessage('Diagnosis must be an array'),
  body('prescription').optional().isArray().withMessage('Prescription must be an array'),
  body('followUpRequired').optional().isBoolean().withMessage('Follow-up required must be boolean'),
  body('followUpDate').optional().isISO8601().withMessage('Invalid follow-up date')
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long'),
  query('status').optional().isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show']).withMessage('Invalid status filter'),
  query('department').optional().isIn(['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology', 'ENT', 'Ophthalmology', 'Emergency', 'Other']).withMessage('Invalid department filter'),
  query('visitType').optional().isIn(['OPD', 'Emergency', 'Follow-up', 'Consultation', 'Procedure']).withMessage('Invalid visit type filter'),
  query('date').optional().isISO8601().withMessage('Invalid date filter'),
  query('sortField').optional().isIn(['appointmentDate', 'createdAt', 'status', 'priority', 'visitType']).withMessage('Invalid sort field'),
  query('sortDirection').optional().isIn(['asc', 'desc']).withMessage('Sort direction must be asc or desc')
];

// Routes

// GET /api/newflow/visits - Get all visits with pagination and filtering
router.get('/', queryValidation, getAllVisits);

// GET /api/newflow/visits/stats - Get visit statistics
router.get('/stats', getVisitStats);

// GET /api/newflow/visits/patient/:patientId - Get visits by patient
router.get('/patient/:patientId', [
  param('patientId').isMongoId().withMessage('Invalid patient ID')
], getVisitsByPatient);

// GET /api/newflow/visits/doctor/:doctorId - Get visits by doctor
router.get('/doctor/:doctorId', [
  param('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  query('date').optional().isISO8601().withMessage('Invalid date format')
], getVisitsByDoctor);

// GET /api/newflow/visits/:id - Get visit by ID
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid visit ID')
], getVisitById);

// POST /api/newflow/visits - Create new visit
router.post('/', visitValidation, createVisit);

// PUT /api/newflow/visits/:id - Update visit
router.put('/:id', [
  param('id').isMongoId().withMessage('Invalid visit ID'),
  ...updateVisitValidation
], updateVisit);

// DELETE /api/newflow/visits/:id - Delete visit
router.delete('/:id', [
  param('id').isMongoId().withMessage('Invalid visit ID')
], deleteVisit);

module.exports = router;
