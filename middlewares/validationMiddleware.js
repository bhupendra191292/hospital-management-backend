const { body, param, query, validationResult } = require('express-validator');

// Validation helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Doctor validation rules
const validateDoctor = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),
  
  body('phone')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone must be between 10 and 15 characters')
    .matches(/^[\d\-\+\(\)\s]+$/)
    .withMessage('Phone can only contain numbers, spaces, and basic symbols'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('specialization')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Specialization must be between 2 and 50 characters'),
  
  body('role')
    .isIn(['admin', 'doctor'])
    .withMessage('Role must be either admin or doctor'),
  
  handleValidationErrors
];

// Patient validation rules
const validatePatient = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone must be between 10 and 15 characters'),
  
  body('age')
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  
  handleValidationErrors
];

// Appointment validation rules
const validateAppointment = [
  body('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  
  body('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('date')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date < now) {
        throw new Error('Appointment date cannot be in the past');
      }
      return true;
    }),
  
  body('time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Time must be in HH:MM format'),
  
  body('type')
    .isIn(['Checkup', 'Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Test', 'Other'])
    .withMessage('Invalid appointment type'),
  
  body('status')
    .optional()
    .isIn(['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-show'])
    .withMessage('Invalid appointment status'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  handleValidationErrors
];

// ID validation for routes with parameters
const validateId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Search term must be between 2 and 50 characters'),
  
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && new Date(endDate) <= new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Tenant validation rules
const validateTenant = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Hospital/Clinic name must be between 2 and 100 characters'),
  
  body('type')
    .isIn(['hospital', 'clinic', 'medical_center', 'pharmacy', 'laboratory'])
    .withMessage('Invalid healthcare facility type'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  
  body('phone')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone must be between 10 and 15 characters'),
  
  body('adminName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Admin name must be between 2 and 50 characters'),
  
  body('adminPhone')
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage('Admin phone must be between 10 and 15 characters'),
  
  body('adminPassword')
    .isLength({ min: 8 })
    .withMessage('Admin password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Admin password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('subscriptionPlan')
    .optional()
    .isIn(['free', 'basic', 'professional', 'enterprise'])
    .withMessage('Invalid subscription plan'),
  
  handleValidationErrors
];

// Bill validation rules
const validateBill = [
  body('patientId')
    .isMongoId()
    .withMessage('Invalid patient ID'),
  
  body('doctorId')
    .isMongoId()
    .withMessage('Invalid doctor ID'),
  
  body('visitId')
    .isMongoId()
    .withMessage('Invalid visit ID'),
  
  body('billDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid bill date format'),
  
  body('dueDate')
    .isISO8601()
    .withMessage('Invalid due date format'),
  
  body('items')
    .isArray({ min: 1 })
    .withMessage('Bill must have at least one item'),
  
  body('items.*.description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Item description must be between 1 and 200 characters'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Item quantity must be at least 1'),
  
  body('items.*.rate')
    .isFloat({ min: 0 })
    .withMessage('Item rate must be a positive number'),
  
  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Tax must be a positive number'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Discount must be a positive number'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  
  handleValidationErrors
];

// Payment validation rules
const validatePayment = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be greater than 0'),
  
  body('paymentMethod')
    .isIn(['cash', 'card', 'upi', 'netbanking', 'cheque'])
    .withMessage('Invalid payment method'),
  
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must be less than 100 characters'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Payment notes must be less than 500 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateDoctor,
  validatePatient,
  validateAppointment,
  validateId,
  validatePagination,
  validateSearch,
  validateDateRange,
  validateTenant,
  validateBill,
  validatePayment,
  handleValidationErrors
};
