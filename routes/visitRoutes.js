const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multerConfig'); // ✅ fixed import
const { exportPatientHistoryPDF } = visitController;

router.post('/', authMiddleware, upload.single('report'), visitController.addVisit);
router.patch('/:id', authMiddleware, visitController.updateVisit);
router.patch('/:id/report', authMiddleware, upload.single('report'), visitController.uploadReport);
router.get('/:id/history.pdf', authMiddleware, exportPatientHistoryPDF);


module.exports = router;
