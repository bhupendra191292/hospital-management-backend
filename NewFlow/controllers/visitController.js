const NewFlowVisit = require('../models/Visit');
const NewFlowPatient = require('../models/Patient');
const mongoose = require('mongoose');

// In-memory store for mock visits (fallback when MongoDB is not connected)
let mockVisitsStore = [
  {
    _id: '1',
    visitId: 'VIS250906-0001',
    patientId: '1',
    visitType: 'OPD',
    chiefComplaint: 'Fever and headache',
    department: 'General Medicine',
    appointmentDate: '2024-01-15T10:00:00.000Z',
    appointmentTime: '10:00',
    status: 'Scheduled',
    priority: 'Normal',
    tenantId: '507f1f77bcf86cd799439011',
    createdBy: '507f1f77bcf86cd799439012',
    createdAt: '2024-01-15T09:30:00.000Z'
  },
  {
    _id: '2',
    visitId: 'VIS250906-0002',
    patientId: '2',
    visitType: 'Follow-up',
    chiefComplaint: 'Follow-up for diabetes',
    department: 'General Medicine',
    appointmentDate: '2024-01-16T14:00:00.000Z',
    appointmentTime: '14:00',
    status: 'Completed',
    priority: 'Normal',
    tenantId: '507f1f77bcf86cd799439011',
    createdBy: '507f1f77bcf86cd799439012',
    createdAt: '2024-01-16T13:30:00.000Z',
    completedAt: '2024-01-16T15:30:00.000Z'
  }
];

// Get all visits with pagination, search, and filtering
const getAllVisits = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      department = '',
      visitType = '',
      date = '',
      sortField = 'appointmentDate',
      sortDirection = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Using mock visits data (MongoDB not connected)');
      
      // Filter mock data
      let filteredVisits = mockVisitsStore.filter(visit => visit.tenantId === tenantId);
      
      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filteredVisits = filteredVisits.filter(visit => 
          visit.visitId.toLowerCase().includes(searchLower) ||
          visit.chiefComplaint.toLowerCase().includes(searchLower) ||
          visit.department.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply status filter
      if (status) {
        filteredVisits = filteredVisits.filter(visit => visit.status === status);
      }
      
      // Apply department filter
      if (department) {
        filteredVisits = filteredVisits.filter(visit => visit.department === department);
      }
      
      // Apply visit type filter
      if (visitType) {
        filteredVisits = filteredVisits.filter(visit => visit.visitType === visitType);
      }
      
      // Apply date filter
      if (date) {
        const filterDate = new Date(date);
        filteredVisits = filteredVisits.filter(visit => {
          const visitDate = new Date(visit.appointmentDate);
          return visitDate.toDateString() === filterDate.toDateString();
        });
      }
      
      // Sort
      filteredVisits.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      // Paginate
      const totalVisits = filteredVisits.length;
      const totalPages = Math.ceil(totalVisits / limitNum);
      const paginatedVisits = filteredVisits.slice(skip, skip + limitNum);
      
      return res.status(200).json({
        success: true,
        data: {
          visits: paginatedVisits,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalVisits,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1
          }
        },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Build query for MongoDB
    const query = { tenantId };
    
    if (search) {
      query.$or = [
        { visitId: { $regex: search, $options: 'i' } },
        { chiefComplaint: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (department) {
      query.department = department;
    }
    
    if (visitType) {
      query.visitType = visitType;
    }
    
    if (date) {
      const filterDate = new Date(date);
      const startOfDay = new Date(filterDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filterDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    // Execute query with pagination
    const visits = await NewFlowVisit.find(query)
      .populate('patientId', 'name uhid mobile email age gender')
      .populate('doctorId', 'name specialization')
      .sort({ [sortField]: sortDirection === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limitNum);

    const totalVisits = await NewFlowVisit.countDocuments(query);
    const totalPages = Math.ceil(totalVisits / limitNum);

    res.status(200).json({
      success: true,
      data: {
        visits,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalVisits,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visits',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get visit by ID
const getVisitById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const visit = mockVisitsStore.find(v => v._id === id && v.tenantId === tenantId);
      if (!visit) {
        return res.status(404).json({
          success: false,
          message: 'Visit not found',
          flow: 'newflow',
          version: '2.0.0-beta',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(200).json({
        success: true,
        data: { visit },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const visit = await NewFlowVisit.findOne({ _id: id, tenantId })
      .populate('patientId', 'name uhid mobile email age gender bloodGroup')
      .populate('doctorId', 'name specialization department');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: { visit },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visit',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Create new visit
const createVisit = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const visitData = req.body;

    // Debug logging
    console.log('🔍 Visit data received:', visitData);
    console.log('🔍 Doctor ID received:', visitData.doctorId);
    console.log('🔍 Doctor ID type:', typeof visitData.doctorId);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Creating mock visit (MongoDB not connected)');
      
      const now = new Date();
      const visitId = `VIS${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      
      const mockVisit = {
        _id: Date.now().toString(),
        ...visitData,
        visitId,
        tenantId,
        createdBy: userId,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: visitData.status || 'Scheduled'
      };
      
      mockVisitsStore.push(mockVisit);
      
      return res.status(201).json({
        success: true,
        message: 'Visit created successfully',
        data: { visit: mockVisit },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Generate visit ID
    const visitId = NewFlowVisit.generateVisitId();

    // Create visit
    const visit = new NewFlowVisit({
      ...visitData,
      visitId,
      tenantId,
      createdBy: userId
    });

    await visit.save();

    // Populate the created visit
    await visit.populate('patientId', 'name uhid mobile email age gender');
    if (visit.doctorId) {
      await visit.populate('doctorId', 'name specialization');
    }

    res.status(201).json({
      success: true,
      message: 'Visit created successfully',
      data: { visit },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating visit',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Update visit
const updateVisit = async (req, res) => {
  try {
    const { tenantId, userId } = req.user;
    const { id } = req.params;
    const updateData = req.body;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const visitIndex = mockVisitsStore.findIndex(v => v._id === id && v.tenantId === tenantId);
      if (visitIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Visit not found',
          flow: 'newflow',
          version: '2.0.0-beta',
          timestamp: new Date().toISOString()
        });
      }
      
      mockVisitsStore[visitIndex] = {
        ...mockVisitsStore[visitIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        message: 'Visit updated successfully',
        data: { visit: mockVisitsStore[visitIndex] },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const visit = await NewFlowVisit.findOneAndUpdate(
      { _id: id, tenantId },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('patientId', 'name uhid mobile email age gender')
     .populate('doctorId', 'name specialization');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Visit updated successfully',
      data: { visit },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating visit',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Delete visit
const deleteVisit = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const visitIndex = mockVisitsStore.findIndex(v => v._id === id && v.tenantId === tenantId);
      if (visitIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Visit not found',
          flow: 'newflow',
          version: '2.0.0-beta',
          timestamp: new Date().toISOString()
        });
      }
      
      mockVisitsStore.splice(visitIndex, 1);
      
      return res.status(200).json({
        success: true,
        message: 'Visit deleted successfully',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const visit = await NewFlowVisit.findOneAndDelete({ _id: id, tenantId });

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'Visit not found',
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Visit deleted successfully',
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting visit',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get visits by patient
const getVisitsByPatient = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { patientId } = req.params;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const visits = mockVisitsStore.filter(v => v.patientId === patientId && v.tenantId === tenantId);
      
      return res.status(200).json({
        success: true,
        data: { visits },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const visits = await NewFlowVisit.findByPatient(patientId, tenantId);

    res.status(200).json({
      success: true,
      data: { visits },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching patient visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patient visits',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get visits by doctor
const getVisitsByDoctor = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { doctorId } = req.params;
    const { date } = req.query;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      let visits = mockVisitsStore.filter(v => v.tenantId === tenantId);
      
      // Filter by doctor if doctorId is provided
      if (doctorId) {
        visits = visits.filter(v => v.doctorId === doctorId);
      }
      
      return res.status(200).json({
        success: true,
        data: { visits },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const visits = await NewFlowVisit.findByDoctor(doctorId, tenantId, date);

    res.status(200).json({
      success: true,
      data: { visits },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching doctor visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor visits',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get visit statistics
const getVisitStats = async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      const visits = mockVisitsStore.filter(v => v.tenantId === tenantId);
      
      const stats = {
        totalVisits: visits.length,
        scheduledVisits: visits.filter(v => v.status === 'Scheduled').length,
        completedVisits: visits.filter(v => v.status === 'Completed').length,
        cancelledVisits: visits.filter(v => v.status === 'Cancelled').length,
        todayVisits: visits.filter(v => {
          const today = new Date().toDateString();
          const visitDate = new Date(v.appointmentDate).toDateString();
          return today === visitDate;
        }).length
      };
      
      return res.status(200).json({
        success: true,
        data: { stats },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    const totalVisits = await NewFlowVisit.countDocuments({ tenantId });
    const scheduledVisits = await NewFlowVisit.countDocuments({ tenantId, status: 'Scheduled' });
    const completedVisits = await NewFlowVisit.countDocuments({ tenantId, status: 'Completed' });
    const cancelledVisits = await NewFlowVisit.countDocuments({ tenantId, status: 'Cancelled' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayVisits = await NewFlowVisit.countDocuments({
      tenantId,
      appointmentDate: { $gte: today, $lt: tomorrow }
    });

    const stats = {
      totalVisits,
      scheduledVisits,
      completedVisits,
      cancelledVisits,
      todayVisits
    };

    res.status(200).json({
      success: true,
      data: { stats },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching visit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visit stats',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getAllVisits,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
  getVisitsByPatient,
  getVisitsByDoctor,
  getVisitStats
};
