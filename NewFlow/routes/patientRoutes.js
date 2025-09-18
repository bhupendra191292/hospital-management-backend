const express = require('express');
const router = express.Router();
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  checkDuplicates,
  getFamilyMembers,
  getPatientStats
} = require('../controllers/patientController');
const authMiddleware = require('../middleware/authMiddleware');

// Validation middleware
const { body, param, query } = require('express-validator');

// Patient validation rules
const patientValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Patient name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('mobile')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^(\+91|91)?[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian mobile number'),
  
  body('emergencyContact')
    .optional({ checkFalsy: true })
    .matches(/^(\+91|91)?[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian mobile number for emergency contact'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City name cannot exceed 50 characters'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State name cannot exceed 50 characters'),
  
  body('pincode')
    .optional({ checkFalsy: true })
    .matches(/^[1-9][0-9]{5}$/)
    .withMessage('Please provide a valid 6-digit pincode'),
  
  body('dateOfBirth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      if (value && new Date(value) > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    }),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other', ''])
    .withMessage('Invalid gender value'),
  
  body('bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''])
    .withMessage('Invalid blood group value'),
  
  body('occupation')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Occupation cannot exceed 100 characters'),
  
  body('maritalStatus')
    .optional()
    .isIn(['Single', 'Married', 'Divorced', 'Widowed', 'Other', ''])
    .withMessage('Invalid marital status value'),
  
  body('isFamilyMember')
    .optional()
    .isBoolean()
    .withMessage('isFamilyMember must be a boolean value'),
  
  body('familyHeadName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Family head name cannot exceed 100 characters'),
  
  body('familyHeadUHID')
    .optional({ checkFalsy: true })
    .matches(/^[A-Z]{2,4}\d{0,2}-\d{6}-\d{4}$/)
    .withMessage('Please provide a valid family head UHID'),
  
  body('relationshipToHead')
    .optional()
    .isIn(['Child', 'Spouse', 'Parent', 'Sibling', 'Grandchild', 'Grandparent', 'Other', ''])
    .withMessage('Invalid relationship value'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Deceased', 'active', 'inactive', 'deceased'])
    .withMessage('Invalid status value'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
];

// ID validation
const idValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid patient ID')
];

// Query validation
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search term cannot exceed 100 characters'),
  
  query('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Deceased', 'All'])
    .withMessage('Invalid status value'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'uhid', 'mobile', 'email', 'registrationDate', 'lastUpdated'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Apply auth middleware to all routes
router.use(authMiddleware);

// Routes

// GET /api/newflow/patients - Get all patients with pagination and search
router.get('/', queryValidation, getAllPatients);

// GET /api/newflow/patients/stats - Get patient statistics
router.get('/stats', getPatientStats);

// GET /api/newflow/patients/:id - Get patient by ID
router.get('/:id', idValidation, getPatientById);

// GET /api/newflow/patients/:id/family - Get family members
router.get('/:id/family', idValidation, getFamilyMembers);

// POST /api/newflow/patients - Create new patient
router.post('/', patientValidation, createPatient);

// POST /api/newflow/patients/check-duplicates - Check for duplicates
router.post('/check-duplicates', patientValidation, checkDuplicates);

// PUT /api/newflow/patients/:id - Update patient
router.put('/:id', [...idValidation, ...patientValidation], updatePatient);

// DELETE /api/newflow/patients/:id - Delete patient
router.delete('/:id', idValidation, deletePatient);

module.exports = router;
