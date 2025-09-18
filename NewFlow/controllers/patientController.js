const Patient = require('../models/Patient');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// In-memory store for mock patients when MongoDB is not available
let mockPatientsStore = [
  { _id: '1', name: 'John Doe', email: 'john@example.com', uhid: 'DELH01-250901-0001', age: 45, gender: 'Male', mobile: '+91 98765 43210', lastVisit: '2024-01-15', status: 'active', registrationDate: '2024-01-15T10:30:00.000Z', bloodGroup: 'O+', emergencyContact: '+91 98765 43220' },
  { _id: '2', name: 'Sarah Smith', email: 'sarah@example.com', uhid: 'DELH01-250901-0002', age: 32, gender: 'Female', mobile: '+91 98765 43211', lastVisit: '2024-01-10', status: 'active', registrationDate: '2024-01-10T14:15:00.000Z', bloodGroup: 'A+', emergencyContact: '+91 98765 43221' },
  { _id: '3', name: 'Mike Johnson', email: 'mike@example.com', uhid: 'DELH01-250901-0003', age: 58, gender: 'Male', mobile: '+91 98765 43212', lastVisit: '2024-01-20', status: 'active', registrationDate: '2024-01-20T09:45:00.000Z', bloodGroup: 'B+', emergencyContact: '+91 98765 43222' }
];

// Get all patients for a tenant
const getAllPatients = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = 'Active',
      sortBy = 'registrationDate',
      sortOrder = 'desc'
    } = req.query;

    // Check if MongoDB is available
    if (mongoose.connection.readyState !== 1) {
      // Fallback to in-memory store when MongoDB is not available
      let filteredPatients = [...mockPatientsStore];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredPatients = filteredPatients.filter(patient => 
          patient.name.toLowerCase().includes(searchLower) ||
          patient.email.toLowerCase().includes(searchLower) ||
          patient.uhid.toLowerCase().includes(searchLower) ||
          patient.mobile.includes(search)
        );
      }

      // Apply status filter
      if (status && status !== 'All') {
        filteredPatients = filteredPatients.filter(patient => 
          patient.status.toLowerCase() === status.toLowerCase()
        );
      }

      // Apply sorting
      filteredPatients.sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedPatients = filteredPatients.slice(startIndex, endIndex);

      return res.json({
        success: true,
        data: {
          patients: paginatedPatients,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(filteredPatients.length / limit),
            totalPatients: filteredPatients.length,
            hasNext: endIndex < filteredPatients.length,
            hasPrev: page > 1
          }
        }
      });
    }

    // Build search query
    const searchQuery = {
      tenantId: tenantId,
      status: status
    };

    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { uhid: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const patients = await Patient.find(searchQuery)
      .sort(sortObj)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v')
      .lean();

    // Get total count for pagination
    const total = await Patient.countDocuments(searchQuery);

    res.json({
      success: true,
      data: {
        patients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalPatients: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message
    });
  }
};

// Get patient by ID
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const patient = await Patient.findOne({ 
      _id: id, 
      tenantId: tenantId 
    }).select('-__v');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message
    });
  }
};

// Create new patient
const createPatient = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { tenantId, userId } = req.user;
    const patientData = req.body;

    // Check if MongoDB is available
    if (mongoose.connection.readyState !== 1) {
      // Fallback mode - create mock patient and add to in-memory store
      const now = new Date();
      const mockPatient = {
        _id: Date.now().toString(),
        ...patientData,
        tenantId: tenantId,
        createdBy: userId,
        registrationDate: now.toISOString(), // Full ISO string with time
        lastVisit: now.toISOString(),
        createdAt: now.toISOString(), // Additional timestamp field
        status: patientData.status || 'Active'
      };

      // Add to in-memory store
      mockPatientsStore.push(mockPatient);

      return res.status(201).json({
        success: true,
        message: 'Patient created successfully (mock mode)',
        data: mockPatient
      });
    }

    // Generate UHID if not provided
    if (!patientData.uhid) {
      patientData.uhid = Patient.generateUHID();
    }

    // Check for duplicates (only if not a family member)
    if (!patientData.isFamilyMember) {
      const duplicates = await Patient.findDuplicates(patientData, tenantId);
      
      if (duplicates.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate patient detected',
          duplicates: duplicates.map(dup => ({
            id: dup._id,
            name: dup.name,
            uhid: dup.uhid,
            mobile: dup.mobile,
            email: dup.email,
            type: 'duplicate'
          }))
        });
      }
    }

    // Create patient
    const patient = new Patient({
      ...patientData,
      tenantId: tenantId,
      createdBy: userId,
      registrationDate: new Date()
    });

    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: patient
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    
    // Handle duplicate UHID error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'UHID already exists. Please try again.',
        error: 'Duplicate UHID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create patient',
      error: error.message
    });
  }
};

// Update patient
const updatePatient = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { tenantId } = req.user;
    const updateData = req.body;

    // Find existing patient
    const existingPatient = await Patient.findOne({ 
      _id: id, 
      tenantId: tenantId 
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check for duplicates (only if not a family member and data has changed)
    if (!updateData.isFamilyMember && 
        (updateData.name !== existingPatient.name || 
         updateData.mobile !== existingPatient.mobile || 
         updateData.email !== existingPatient.email)) {
      
      const duplicates = await Patient.findDuplicates(updateData, tenantId, id);
      
      if (duplicates.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Duplicate patient detected',
          duplicates: duplicates.map(dup => ({
            id: dup._id,
            name: dup.name,
            uhid: dup.uhid,
            mobile: dup.mobile,
            email: dup.email,
            type: 'duplicate'
          }))
        });
      }
    }

    // Update patient
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { ...updateData, lastUpdated: new Date() },
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedPatient
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    
    // Handle duplicate UHID error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'UHID already exists. Please try again.',
        error: 'Duplicate UHID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
};

// Delete patient
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const patient = await Patient.findOneAndDelete({ 
      _id: id, 
      tenantId: tenantId 
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: error.message
    });
  }
};

// Check for duplicates
const checkDuplicates = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const patientData = req.body;

    const duplicates = await Patient.findDuplicates(patientData, tenantId);

    if (duplicates.length > 0) {
      return res.json({
        success: true,
        hasDuplicates: true,
        duplicates: duplicates.map(dup => ({
          id: dup._id,
          name: dup.name,
          uhid: dup.uhid,
          mobile: dup.mobile,
          email: dup.email,
          type: 'duplicate'
        }))
      });
    }

    res.json({
      success: true,
      hasDuplicates: false,
      duplicates: []
    });
  } catch (error) {
    console.error('Error checking duplicates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check duplicates',
      error: error.message
    });
  }
};

// Get family members
const getFamilyMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    const patient = await Patient.findOne({ 
      _id: id, 
      tenantId: tenantId 
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const familyMembers = await patient.getFamilyMembers();

    res.json({
      success: true,
      data: familyMembers
    });
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family members',
      error: error.message
    });
  }
};

// Get patient statistics
const getPatientStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const stats = await Patient.aggregate([
      { $match: { tenantId: tenantId } },
      {
        $group: {
          _id: null,
          totalPatients: { $sum: 1 },
          activePatients: {
            $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
          },
          inactivePatients: {
            $sum: { $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0] }
          },
          familyMembers: {
            $sum: { $cond: [{ $eq: ['$isFamilyMember', true] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalPatients: 0,
      activePatients: 0,
      inactivePatients: 0,
      familyMembers: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching patient stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  checkDuplicates,
  getFamilyMembers,
  getPatientStats
};
