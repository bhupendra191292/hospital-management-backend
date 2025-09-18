/**
 * NewFlow Routes
 * This file contains all the routes for the new development flow
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Import NewFlow specific routes
const patientRoutes = require('./routes/patientRoutes');
const visitRoutes = require('./routes/visitRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const billingRoutes = require('./routes/billingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');

// Import NewFlow models
const Doctor = require('./models/Doctor');

// Mount NewFlow specific routes
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/medical-records', medicalRecordRoutes);
router.use('/bills', billingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/users', userRoutes);

// NewFlow Authentication Routes

// Forgot Password endpoint
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { loginField, tenantId } = req.body;
    
    if (!loginField || !tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email, phone, or user ID',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }
    
    // In a real application, you would:
    // 1. Find the user by loginField (email/phone/userId)
    // 2. Generate a secure reset token
    // 3. Send email/SMS with reset link
    // 4. Store token in database with expiration
    
    // For development, we'll simulate the process
    console.log('🔐 Forgot password request for:', loginField);
    
    // Simulate finding user
    let userFound = false;
    let userType = 'unknown';
    
    if (loginField.includes('@')) {
      userFound = true;
      userType = 'email';
    } else if (/^[0-9]{10}$/.test(loginField)) {
      userFound = true;
      userType = 'phone';
    } else if (loginField.startsWith('DOC') || loginField.startsWith('EMP')) {
      userFound = true;
      userType = 'user_id';
    } else {
      userFound = true;
      userType = 'username';
    }
    
    if (userFound) {
      // In production, send actual email/SMS here
      res.status(200).json({
        success: true,
        message: `Password reset instructions have been sent to your ${userType}`,
        instructions: [
          'Check your email/SMS for reset instructions',
          'Click the reset link to create a new password',
          'If you don\'t receive the message, check your spam folder',
          'Contact support if you continue to have issues'
        ],
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'No account found with this information',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process password reset request',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// Reset Password endpoint
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and new password',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }
    
    // In production, you would:
    // 1. Verify the reset token
    // 2. Check if token is expired
    // 3. Update user's password
    // 4. Invalidate the token
    
    console.log('🔐 Password reset request with token:', token);
    
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
      instructions: [
        'Your password has been updated',
        'You can now login with your new password',
        'For security, please logout from all other devices'
      ],
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to reset password',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/auth/login', async (req, res) => {
  console.log('🚀 NewFlow login route hit!', req.body);
  try {
    const { loginField, password, tenantId } = req.body;
    
    // Mock authentication for NewFlow development
    // In production, this would connect to your actual auth system
    if (loginField && password && tenantId) {
      // Determine role based on login field for testing
      let role = 'admin';
      let name = 'NewFlow User';
      let email = loginField; // Default to loginField as email
      let userId = 'newflow-user-1'; // Default mock ID
      
      // Check if loginField is an email
      if (loginField.includes('@')) {
        email = loginField;
      } else if (/^[0-9]{10}$/.test(loginField)) {
        // Phone number format
        email = `user${loginField}@hospital.com`; // Mock email for phone
      } else if (loginField.startsWith('DOC') || loginField.startsWith('EMP')) {
        // User ID format
        email = `user${loginField}@hospital.com`; // Mock email for user ID
      } else {
        // Username format
        email = `${loginField}@hospital.com`; // Mock email for username
      }
      
      // Try to find real doctor data if it's a doctor login
      if (mongoose.connection.readyState === 1) {
        try {
          const Doctor = require('./models/Doctor');
          
          // Check if loginField is a phone number and try to find doctor
          if (/^[0-9]{10}$/.test(loginField)) {
            const doctor = await Doctor.findOne({ phone: loginField, tenantId: tenantId });
            if (doctor) {
              role = 'doctor';
              name = doctor.name;
              email = doctor.email || email;
              userId = doctor._id.toString(); // Use real doctor ObjectId
              console.log('🔍 Found real doctor:', { name: doctor.name, id: doctor._id });
            }
          }
          // Check if loginField is an email and try to find doctor
          else if (loginField.includes('@')) {
            const doctor = await Doctor.findOne({ email: loginField, tenantId: tenantId });
            if (doctor) {
              role = 'doctor';
              name = doctor.name;
              email = doctor.email;
              userId = doctor._id.toString(); // Use real doctor ObjectId
              console.log('🔍 Found real doctor by email:', { name: doctor.name, id: doctor._id });
            }
          }
        } catch (dbError) {
          console.error('Error fetching doctor from database:', dbError);
          // Fallback to mock data if database query fails
        }
      }
      
      // Fallback role determination if no real doctor found
      if (role === 'admin') {
        if (loginField.includes('doctor') || loginField === '9876543210') {
          role = 'doctor';
          name = 'Dr. Sarah Johnson';
        } else if (loginField.includes('nurse') || loginField === 'DOC123456') {
          role = 'nurse';
          name = 'Nurse Lisa Wilson';
        } else if (loginField.includes('patient') || loginField === 'patient_user') {
          role = 'patient';
          name = 'John Smith';
        } else if (loginField.includes('receptionist') || loginField === 'EMP001') {
          role = 'receptionist';
          name = 'Receptionist Mike Brown';
        } else if (loginField.includes('lab') || loginField === 'lab_tech_01') {
          role = 'lab_tech';
          name = 'Lab Tech David Lee';
        } else if (loginField.includes('pharmacist') || loginField === 'pharma123') {
          role = 'pharmacist';
          name = 'Pharmacist Emma Davis';
        } else if (loginField.includes('super') || loginField.includes('admin') || loginField === 'admin@newflow.com') {
          role = 'super_admin';
          name = 'Super Admin';
        }
      }
      
      const mockUser = {
        id: userId, // Use real doctor ID if found, otherwise mock ID
        _id: userId, // Also provide _id for compatibility
        email: email,
        name: name,
        tenantId: tenantId,
        role: role,
        flow: 'newflow',
        permissions: [] // Will be populated by role context
      };
      
      const mockToken = 'newflow-token-' + Date.now();
      
      console.log('🔍 Login response user:', mockUser);
      
      res.json({
        success: true,
        message: 'NewFlow login successful',
        token: mockToken,
        user: mockUser
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'NewFlow authentication error',
      error: error.message
    });
  }
});

// NewFlow Dashboard Routes
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Mock dashboard stats for NewFlow
    const mockStats = {
      totalPatients: 1250,
      totalDoctors: 45,
      totalAppointments: 3200,
      todayAppointments: 18
    };
    
    res.json({
      success: true,
      message: 'NewFlow dashboard stats loaded',
      data: mockStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load NewFlow dashboard stats',
      error: error.message
    });
  }
});

// Patient routes are now handled by the dedicated patientRoutes module

// NewFlow Doctor Routes
// Get all doctors or filter by department
router.get('/doctors', async (req, res) => {
  try {
    const { department } = req.query;
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Returning mock doctors (MongoDB not connected)');
      
      // Mock doctor data for NewFlow with valid ObjectIds and comprehensive info
      const mockDoctors = [
        // General Medicine Doctors
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Dr. Sarah Johnson',
          specialization: 'General Medicine',
          phone: '+1234567890',
          email: 'sarah.johnson@hospital.com',
          consultationFee: 500,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          experience: '15 years',
          flow: 'newflow'
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Dr. Michael Brown',
          specialization: 'General Medicine',
          phone: '+1234567891',
          email: 'michael.brown@hospital.com',
          consultationFee: 400,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          experience: '12 years',
          flow: 'newflow'
        },
        // Cardiology Doctors
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Dr. Lisa Wilson',
          specialization: 'Cardiology',
          phone: '+1234567892',
          email: 'lisa.wilson@hospital.com',
          consultationFee: 800,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          experience: '18 years',
          flow: 'newflow'
        },
        {
          _id: '507f1f77bcf86cd799439014',
          name: 'Dr. Robert Chen',
          specialization: 'Cardiology',
          phone: '+1234567893',
          email: 'robert.chen@hospital.com',
          consultationFee: 750,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          experience: '20 years',
          flow: 'newflow'
        },
        // Pediatrics Doctors
        {
          _id: '507f1f77bcf86cd799439015',
          name: 'Dr. Emma Davis',
          specialization: 'Pediatrics',
          phone: '+1234567894',
          email: 'emma.davis@hospital.com',
          consultationFee: 600,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          experience: '14 years',
          flow: 'newflow'
        },
        {
          _id: '507f1f77bcf86cd799439016',
          name: 'Dr. David Kumar',
          specialization: 'Pediatrics',
          phone: '+1234567895',
          email: 'david.kumar@hospital.com',
          consultationFee: 550,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          experience: '16 years',
          flow: 'newflow'
        },
        // Gynecology Doctors
        {
          _id: '507f1f77bcf86cd799439017',
          name: 'Dr. Priya Sharma',
          specialization: 'Gynecology',
          phone: '+1234567896',
          email: 'priya.sharma@hospital.com',
          consultationFee: 700,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          experience: '17 years',
          flow: 'newflow'
        },
        {
          _id: '507f1f77bcf86cd799439018',
          name: 'Dr. James Miller',
          specialization: 'Gynecology',
          phone: '+1234567897',
          email: 'james.miller@hospital.com',
          consultationFee: 650,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          experience: '13 years',
          flow: 'newflow'
        },
        // Orthopedics Doctors
        {
          _id: '507f1f77bcf86cd799439019',
          name: 'Dr. Alex Thompson',
          specialization: 'Orthopedics',
          phone: '+1234567898',
          email: 'alex.thompson@hospital.com',
          consultationFee: 900,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          experience: '22 years',
          flow: 'newflow'
        },
        {
          _id: '507f1f77bcf86cd799439020',
          name: 'Dr. Maria Rodriguez',
          specialization: 'Orthopedics',
          phone: '+1234567899',
          email: 'maria.rodriguez@hospital.com',
          consultationFee: 850,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          experience: '19 years',
          flow: 'newflow'
        },
        // Emergency Doctors
        {
          _id: '507f1f77bcf86cd799439021',
          name: 'Dr. John Smith',
          specialization: 'Emergency Medicine',
          phone: '+1234567800',
          email: 'john.smith@hospital.com',
          consultationFee: 1000,
          availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          experience: '25 years',
          flow: 'newflow'
        }
      ];
      
      // Filter by department if specified
      let filteredDoctors = mockDoctors;
      if (department) {
        const departmentMapping = {
          'General Medicine': ['General Medicine'],
          'Cardiology': ['Cardiology', 'General Medicine'],
          'Orthopedics': ['Orthopedics', 'General Medicine'],
          'Pediatrics': ['Pediatrics', 'General Medicine'],
          'Gynecology': ['Gynecology', 'General Medicine'],
          'Dermatology': ['General Medicine'], // Fallback to General Medicine
          'ENT': ['General Medicine'], // Fallback to General Medicine
          'Ophthalmology': ['General Medicine'], // Fallback to General Medicine
          'Emergency': ['Emergency Medicine', 'General Medicine'],
          'Other': ['General Medicine']
        };
        
        const mappedSpecializations = departmentMapping[department] || ['General Medicine'];
        filteredDoctors = mockDoctors.filter(doctor => 
          mappedSpecializations.includes(doctor.specialization)
        );
      }
      
      return res.json({
        success: true,
        message: 'NewFlow doctors loaded',
        data: filteredDoctors,
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Real MongoDB query
    console.log('📋 Fetching doctors from MongoDB');
    
    let query = {};
    
    // Filter by department/specialization if provided
    if (department) {
      const mappedSpecializations = department.split(',').map(d => d.trim());
      query.specialization = { $in: mappedSpecializations };
    }
    
    const doctors = await Doctor.find(query).select('-password');
    
    res.json({
      success: true,
      message: 'NewFlow doctors loaded',
      data: doctors,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load NewFlow doctors',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// Create new doctor
router.post('/doctors', async (req, res) => {
  try {
    // For development, use default values if no authentication
    const tenantId = req.user?.tenantId || 'default-tenant';
    const userId = req.user?.userId || 'system';
    const doctorData = req.body;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Creating mock doctor (MongoDB not connected)');
      
      const mockDoctor = {
        _id: Date.now().toString(),
        doctorId: 'DOC' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0'),
        ...doctorData,
        tenantId,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        rating: 0,
        patients: 0
      };
      
      return res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: { doctor: mockDoctor },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Real MongoDB creation using NewFlow Doctor model
    const doctor = new Doctor({
      ...doctorData,
      tenantId,
      createdBy: userId,
      status: doctorData.status || 'pending' // Default to pending for approval
    });

    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: { doctor },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating doctor:', error);
    
    // Handle duplicate key errors with user-friendly messages
    if (error.code === 11000) {
      let field = 'field';
      let message = 'This information is already registered';
      
      if (error.keyPattern?.phone) {
        field = 'phone number';
        message = 'This phone number is already registered. Please use a different phone number.';
      } else if (error.keyPattern?.email) {
        field = 'email address';
        message = 'This email address is already registered. Please use a different email address.';
      } else if (error.keyPattern?.doctorId) {
        field = 'doctor ID';
        message = 'This doctor ID is already in use. Please try again.';
      }
      
      return res.status(409).json({
        success: false,
        message: message,
        field: field,
        error: 'Duplicate entry',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Please check the information you entered',
        errors: validationErrors,
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Unable to create doctor account. Please try again.',
      error: 'Internal server error',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// Update doctor
router.put('/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Updating mock doctor (MongoDB not connected)');
      
      return res.json({
        success: true,
        message: 'Doctor updated successfully',
        data: { doctor: { _id: id, ...updateData } },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Real MongoDB update
    const Doctor = require('../models/doctorModel');
    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: { doctor },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating doctor',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// Delete doctor
router.delete('/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Deleting mock doctor (MongoDB not connected)');
      
      return res.json({
        success: true,
        message: 'Doctor deleted successfully',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Real MongoDB deletion
    const Doctor = require('../models/doctorModel');
    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Doctor deleted successfully',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting doctor',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// Get pending doctors for admin approval
router.get('/doctors/pending', async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Returning mock pending doctors (MongoDB not connected)');
      
      const mockPendingDoctors = [
        {
          _id: 'pending1',
          doctorId: 'DOC123456789',
          name: 'Dr. Pending User',
          email: 'pending@example.com',
          phone: '9876543210',
          specialization: 'Cardiology',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ];
      
      return res.json({
        success: true,
        message: 'Pending doctors loaded',
        data: mockPendingDoctors,
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const pendingDoctors = await Doctor.find({ status: 'pending' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Pending doctors loaded',
      data: pendingDoctors,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pending doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load pending doctors',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// Get doctor by ID
router.get('/doctors/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Getting mock doctor by ID (MongoDB not connected)');
      
      // Return a mock doctor
      const mockDoctor = {
        _id: id,
        name: 'Dr. Mock Doctor',
        specialization: 'General Medicine',
        phone: '+1234567890',
        email: 'mock@hospital.com',
        status: 'active'
      };
      
      return res.json({
        success: true,
        message: 'Doctor retrieved successfully',
        data: { doctor: mockDoctor },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Real MongoDB query
    const Doctor = require('../models/doctorModel');
    const doctor = await Doctor.findById(id).select('-password');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Doctor retrieved successfully',
      data: { doctor },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting doctor',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// Patient registration, UHID generation, and search routes are now handled by the dedicated patientRoutes module

// NewFlow Appointment Routes
router.post('/appointments/book', async (req, res) => {
  try {
    console.log('🚀 NewFlow appointment booking:', req.body);
    
    const appointmentData = req.body;
    
    // Mock appointment booking
    const newAppointment = {
      id: Date.now(),
      ...appointmentData,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Appointment booking failed',
      error: error.message
    });
  }
});

// Approve pending doctor
router.put('/doctors/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Approving mock doctor (MongoDB not connected)');
      
      return res.json({
        success: true,
        message: 'Doctor approved successfully',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { status: 'active' },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Doctor approved:', doctor.doctorId);

    res.json({
      success: true,
      message: 'Doctor approved successfully',
      data: doctor,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error approving doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving doctor',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// Reject pending doctor
router.put('/doctors/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Rejecting mock doctor (MongoDB not connected)');
      
      return res.json({
        success: true,
        message: 'Doctor rejected successfully',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        rejectionReason: reason || 'No reason provided'
      },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    console.log('❌ Doctor rejected:', doctor.doctorId);

    res.json({
      success: true,
      message: 'Doctor rejected successfully',
      data: doctor,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error rejecting doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting doctor',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
});

// NewFlow Health Check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'NewFlow is running',
    flow: 'newflow',
    version: '2.0.0-beta',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
