const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController'); // 👈 default import
const { getPatientVisits } = require('../controllers/visitController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { getPatientsByPhone } = require('../controllers/patientController');


router.post('/register', patientController.registerPatient);
router.post('/check', patientController.checkPatient);
router.get('/:id/visits', authMiddleware, getPatientVisits);
router.get('/', authMiddleware, patientController.getPatients);
router.get('/:id', authMiddleware, patientController.getPatientById);
router.get('/by-phone/:phone', authMiddleware, getPatientsByPhone);

module.exports = router;
