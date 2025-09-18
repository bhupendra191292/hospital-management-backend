const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/doctorModel');
const { authMiddleware, requireAdmin } = require('../middlewares/authMiddleware');
const { generateTenantId } = require('../middlewares/tenantMiddleware');

// Get all appointments (with optional filters)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      patient, 
      doctor, 
      status, 
      date, 
      startDate, 
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // Add filters
    if (patient) filter.patient = patient;
    if (doctor) filter.doctor = doctor;
    if (status) filter.status = status;
    
    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name phone age gender')
      .populate('doctor', 'name specialization')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointments' 
    });
  }
});

// Get appointment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name phone age gender address')
      .populate('doctor', 'name specialization');

    if (!appointment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Appointment not found' 
      });
    }

    res.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointment' 
    });
  }
});

// Create new appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      patientId, 
      date, 
      time, 
      type, 
      notes, 
      duration, 
      priority 
    } = req.body;

    // Validate required fields
    if (!patientId || !date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Patient, date, and time are required'
      });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check for scheduling conflicts
    const appointmentDate = new Date(date);
    const existingAppointment = await Appointment.findOne({
      patient: patientId,
      date: {
        $gte: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate()),
        $lt: new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate() + 1)
      },
      status: { $in: ['Scheduled', 'Confirmed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Patient already has an appointment on this date'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: req.user.id, // Current logged-in doctor
      date: appointmentDate,
      time,
      type: type || 'Checkup',
      notes: notes || '',
      duration: duration || 30,
      priority: priority || 'Medium',
      status: 'Scheduled',
      tenant: req.user.tenant || '507f1f77bcf86cd799439011', // Default tenant for now
      appointmentId: generateTenantId('APT', req.user.tenant || '507f1f77bcf86cd799439011')
    });

    await appointment.save();

    // Populate patient and doctor info for response
    await appointment.populate('patient', 'name phone age gender');
    await appointment.populate('doctor', 'name specialization');

    res.status(201).json({
      success: true,
      message: 'Appointment scheduled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    // Provide more specific error messages
    if (error.name === 'CastError' && error.path === '_id') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to schedule appointment',
      error: error.message
    });
  }
});

// Update appointment
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { 
      date, 
      time, 
      type, 
      status, 
      notes, 
      duration, 
      priority 
    } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update fields
    if (date) appointment.date = new Date(date);
    if (time) appointment.time = time;
    if (type) appointment.type = type;
    if (status) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;
    if (duration) appointment.duration = duration;
    if (priority) appointment.priority = priority;

    await appointment.save();

    // Populate patient and doctor info for response
    await appointment.populate('patient', 'name phone age gender');
    await appointment.populate('doctor', 'name specialization');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment'
    });
  }
});

// Delete appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
});

// Get appointments by patient
router.get('/patient/:patientId', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.params.patientId })
      .populate('doctor', 'name specialization')
      .sort({ date: -1, time: -1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient appointments'
    });
  }
});

// Get today's appointments
router.get('/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const appointments = await Appointment.find({
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['Scheduled', 'Confirmed'] }
    })
      .populate('patient', 'name phone age gender')
      .populate('doctor', 'name specialization')
      .sort({ time: 1 });

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s appointments'
    });
  }
});

module.exports = router;
