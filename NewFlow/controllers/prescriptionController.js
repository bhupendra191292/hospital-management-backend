const NewFlowPrescription = require('../models/Prescription');
const NewFlowPatient = require('../models/Patient');
const NewFlowDoctor = require('../models/Doctor');
const NewFlowVisit = require('../models/Visit');
const mongoose = require('mongoose');

// Mock data store for when MongoDB is not connected
let mockPrescriptionsStore = [
  {
    id: 'prescription-1',
    patientId: '68bd6cd8a400feb3fe9a92ea',
    doctorId: '68bccb847eaab0d33069e179',
    visitId: null,
    medication: 'Paracetamol',
    dosage: '500mg',
    frequency: 'Three times daily',
    duration: '5 days',
    instructions: 'Take after meals',
    status: 'Active',
    prescribedDate: new Date(),
    startDate: new Date(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    refills: 0,
    refillsRemaining: 0,
    notes: 'For fever and pain relief',
    tenantId: 'test-tenant',
    createdBy: '68bccb847eaab0d33069e179',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prescription-2',
    patientId: '68bd6cd8a400feb3fe9a92ea',
    doctorId: '68bccb847eaab0d33069e179',
    visitId: null,
    medication: 'Amoxicillin',
    dosage: '250mg',
    frequency: 'Twice daily',
    duration: '7 days',
    instructions: 'Take with food',
    status: 'Active',
    prescribedDate: new Date(),
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    refills: 1,
    refillsRemaining: 1,
    notes: 'Antibiotic for infection',
    tenantId: 'test-tenant',
    createdBy: '68bccb847eaab0d33069e179',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Create new prescription
const createPrescription = async (req, res) => {
  try {
    const { tenantId, id: doctorId } = req.user;
    const prescriptionData = {
      ...req.body,
      doctorId,
      tenantId,
      createdBy: doctorId
    };

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const newPrescription = {
        id: `prescription-${Date.now()}`,
        ...prescriptionData,
        prescribedDate: new Date(),
        startDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrescriptionsStore.push(newPrescription);
      
      return res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        data: { prescription: newPrescription },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const prescription = new NewFlowPrescription(prescriptionData);
    await prescription.save();

    // Populate the response
    await prescription.populate([
      { path: 'patientId', select: 'name uhid mobile' },
      { path: 'doctorId', select: 'name specialty' },
      { path: 'visitId', select: 'appointmentDate appointmentTime' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: { prescription },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get all prescriptions
const getAllPrescriptions = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10, status, patientId, doctorId } = req.query;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      let prescriptions = mockPrescriptionsStore.filter(p => p.tenantId === tenantId);
      
      // Apply filters
      if (status) prescriptions = prescriptions.filter(p => p.status === status);
      if (patientId) prescriptions = prescriptions.filter(p => p.patientId === patientId);
      if (doctorId) prescriptions = prescriptions.filter(p => p.doctorId === doctorId);
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedPrescriptions = prescriptions.slice(startIndex, endIndex);
      
      return res.status(200).json({
        success: true,
        data: {
          prescriptions: paginatedPrescriptions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(prescriptions.length / limit),
            totalPrescriptions: prescriptions.length,
            hasNext: endIndex < prescriptions.length,
            hasPrev: page > 1
          }
        },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const query = { tenantId };
    if (status) query.status = status;
    if (patientId) query.patientId = patientId;
    if (doctorId) query.doctorId = doctorId;

    const prescriptions = await NewFlowPrescription.find(query)
      .populate('patientId', 'name uhid mobile')
      .populate('doctorId', 'name specialty')
      .populate('visitId', 'appointmentDate appointmentTime')
      .sort({ prescribedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await NewFlowPrescription.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        prescriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPrescriptions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescriptions',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get prescriptions by patient
const getPrescriptionsByPatient = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { patientId } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const prescriptions = mockPrescriptionsStore.filter(p => 
        p.patientId === patientId && p.tenantId === tenantId
      );
      
      return res.status(200).json({
        success: true,
        data: { prescriptions },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const prescriptions = await NewFlowPrescription.findByPatient(patientId, tenantId);

    res.status(200).json({
      success: true,
      data: { prescriptions },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient prescriptions',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get prescriptions by doctor
const getPrescriptionsByDoctor = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { doctorId } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const prescriptions = mockPrescriptionsStore.filter(p => 
        p.doctorId === doctorId && p.tenantId === tenantId
      );
      
      return res.status(200).json({
        success: true,
        data: { prescriptions },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const prescriptions = await NewFlowPrescription.findByDoctor(doctorId, tenantId);

    res.status(200).json({
      success: true,
      data: { prescriptions },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching doctor prescriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor prescriptions',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get prescription by ID
const getPrescriptionById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const prescription = mockPrescriptionsStore.find(p => 
        p.id === id && p.tenantId === tenantId
      );
      
      if (!prescription) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found',
          flow: 'newflow',
          version: '2.0.0-beta',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        success: true,
        data: { prescription },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const prescription = await NewFlowPrescription.findOne({ _id: id, tenantId })
      .populate('patientId', 'name uhid mobile email')
      .populate('doctorId', 'name specialty')
      .populate('visitId', 'appointmentDate appointmentTime');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: { prescription },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prescription',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Update prescription
const updatePrescription = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const updateData = { ...req.body, updatedAt: new Date() };

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const prescriptionIndex = mockPrescriptionsStore.findIndex(p => 
        p.id === id && p.tenantId === tenantId
      );
      
      if (prescriptionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found',
          flow: 'newflow',
          version: '2.0.0-beta',
          timestamp: new Date().toISOString()
        });
      }
      
      mockPrescriptionsStore[prescriptionIndex] = {
        ...mockPrescriptionsStore[prescriptionIndex],
        ...updateData,
        updatedAt: new Date()
      };
      
      return res.status(200).json({
        success: true,
        message: 'Prescription updated successfully',
        data: { prescription: mockPrescriptionsStore[prescriptionIndex] },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const prescription = await NewFlowPrescription.findOneAndUpdate(
      { _id: id, tenantId },
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patientId', select: 'name uhid mobile' },
      { path: 'doctorId', select: 'name specialty' },
      { path: 'visitId', select: 'appointmentDate appointmentTime' }
    ]);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription updated successfully',
      data: { prescription },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating prescription',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Delete prescription
const deletePrescription = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const prescriptionIndex = mockPrescriptionsStore.findIndex(p => 
        p.id === id && p.tenantId === tenantId
      );
      
      if (prescriptionIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Prescription not found',
          flow: 'newflow',
          version: '2.0.0-beta',
          timestamp: new Date().toISOString()
        });
      }
      
      mockPrescriptionsStore.splice(prescriptionIndex, 1);
      
      return res.status(200).json({
        success: true,
        message: 'Prescription deleted successfully',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const prescription = await NewFlowPrescription.findOneAndDelete({ _id: id, tenantId });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Prescription deleted successfully',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting prescription',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionsByPatient,
  getPrescriptionsByDoctor,
  getPrescriptionById,
  updatePrescription,
  deletePrescription
};
