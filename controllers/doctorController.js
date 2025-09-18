const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Doctor } = require('../models');
const AuditService = require('../services/auditService');

const loginDoctor = async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Input validation
    if (!phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone and password are required' 
      });
    }

    const doctor = await Doctor.findOne({ phone });
    if (!doctor) {
      // Log failed login attempt
      await AuditService.logAction({
        action: 'LOGIN',
        performedBy: null,
        details: { phone, reason: 'Doctor not found' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'FAILED',
        errorMessage: 'Doctor not found'
      });
      
      return res.status(404).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      // Log failed login attempt
      await AuditService.logAction({
        action: 'LOGIN',
        performedBy: doctor._id,
        details: { phone, reason: 'Invalid password' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        status: 'FAILED',
        errorMessage: 'Invalid password'
      });
      
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    // Log successful login
    await AuditService.logAction({
      action: 'LOGIN',
      performedBy: doctor._id,
      details: { phone, role: doctor.role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      token,
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        phone: doctor.phone,
        specialization: doctor.specialization,
        role: doctor.role,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doctors', error: err.message });
  }
};

const createDoctor = async (req, res) => {
  try {
    const { name, phone, password, specialization, role = 'doctor' } = req.body;

    // Check if doctor already exists
    const existing = await Doctor.findOne({ phone });
    if (existing) {
      return res.status(409).json({ 
        success: false,
        message: 'Doctor with this phone number already exists' 
      });
    }

    // Validate role
    if (!['admin', 'doctor'].includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid role. Must be admin or doctor' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const doctor = await Doctor.create({ 
      name, 
      phone, 
      password: hashedPassword, 
      specialization, 
      role 
    });

    // Log the action
    await AuditService.logAction({
      action: 'CREATE_DOCTOR',
      performedBy: req.user._id,
      targetId: doctor._id,
      targetModel: 'Doctor',
      details: { 
        name: doctor.name, 
        phone: doctor.phone, 
        specialization: doctor.specialization, 
        role: doctor.role 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'SUCCESS'
    });

    res.status(201).json({ 
      success: true,
      message: 'Doctor created successfully', 
      doctor: {
        _id: doctor._id,
        name: doctor.name,
        phone: doctor.phone,
        specialization: doctor.specialization,
        role: doctor.role
      }
    });
  } catch (err) {
    console.error('Create doctor error:', err);
    
    // Log the failed action
    await AuditService.logAction({
      action: 'CREATE_DOCTOR',
      performedBy: req.user._id,
      details: { 
        name: req.body.name, 
        phone: req.body.phone, 
        specialization: req.body.specialization, 
        role: req.body.role 
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'FAILED',
      errorMessage: err.message
    });

    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false,
        message: 'Doctor with this phone number already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to create doctor' 
    });
  }
};

const updateDoctor = async (req, res) => {
  try {
    const updateFields = {
      name: req.body.name,
      specialization: req.body.specialization,
    };
    if (req.body.role !== undefined) {
      updateFields.role = req.body.role;
    }

    const updated = await Doctor.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!updated) return res.status(404).json({ message: 'Doctor not found' });

    res.json({ message: 'Doctor updated successfully', doctor: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update doctor', error: err.message });
  }
};

const deleteDoctor = async (req, res) => {
  try {
    const deleted = await Doctor.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Doctor not found' });

    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete doctor', error: err.message });
  }
};

const promoteDoctor = async (req, res) => {
  try {
    const updated = await Doctor.findByIdAndUpdate(
      req.params.id,
      { role: 'admin' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Doctor not found' });

    res.json({ message: 'Doctor promoted to admin', doctor: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to promote doctor', error: err.message });
  }
};

module.exports = {
  loginDoctor,
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  promoteDoctor
};
