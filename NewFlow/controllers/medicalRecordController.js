const NewFlowMedicalRecord = require('../models/MedicalRecord');
const mongoose = require('mongoose');

// Mock data store for development
let mockMedicalRecordsStore = [
  {
    _id: 'mock-record-1',
    patientId: '68bd6cd8a400feb3fe9a92ea',
    doctorId: '68bccb847eaab0d33069e179',
    visitId: null,
    recordType: 'Consultation',
    date: new Date('2025-01-15'),
    department: 'Cardiology',
    diagnosis: 'Hypertension',
    treatment: 'Prescribed Amlodipine 5mg daily',
    notes: 'Patient reports good compliance with medication. Blood pressure well controlled.',
    attachments: [
      { name: 'blood_pressure_chart.pdf', type: 'pdf', url: '/uploads/bp_chart.pdf' },
      { name: 'ecg_report.pdf', type: 'pdf', url: '/uploads/ecg_report.pdf' }
    ],
    vitalSigns: {
      bloodPressure: '140/90',
      heartRate: 72,
      temperature: 98.6,
      weight: 75,
      height: 170,
      oxygenSaturation: 98
    },
    labResults: [
      {
        testName: 'Blood Pressure',
        result: '140/90',
        normalRange: '<120/80',
        status: 'Abnormal'
      }
    ],
    medications: [
      {
        name: 'Amlodipine',
        dosage: '5mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take with food'
      }
    ],
    followUpRequired: true,
    followUpDate: new Date('2025-02-15'),
    status: 'Active',
    tenantId: 'test-tenant',
    createdBy: '68bccb847eaab0d33069e179',
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    _id: 'mock-record-2',
    patientId: '68bd6cd8a400feb3fe9a92ea',
    doctorId: '68bccb847eaab0d33069e179',
    visitId: null,
    recordType: 'Follow-up',
    date: new Date('2024-12-20'),
    department: 'General Medicine',
    diagnosis: 'Diabetes Type 2',
    treatment: 'Metformin 500mg twice daily, lifestyle modifications',
    notes: 'Patient needs to improve diet and exercise routine. HbA1c levels improving.',
    attachments: [
      { name: 'lab_results.pdf', type: 'pdf', url: '/uploads/lab_results.pdf' }
    ],
    vitalSigns: {
      bloodPressure: '130/85',
      heartRate: 78,
      temperature: 98.4,
      weight: 78,
      height: 170,
      oxygenSaturation: 97
    },
    labResults: [
      {
        testName: 'HbA1c',
        result: '7.2%',
        normalRange: '<6.5%',
        status: 'Abnormal'
      },
      {
        testName: 'Fasting Glucose',
        result: '145 mg/dL',
        normalRange: '70-100 mg/dL',
        status: 'Abnormal'
      }
    ],
    medications: [
      {
        name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '90 days',
        instructions: 'Take with meals'
      }
    ],
    followUpRequired: true,
    followUpDate: new Date('2025-01-20'),
    status: 'Active',
    tenantId: 'test-tenant',
    createdBy: '68bccb847eaab0d33069e179',
    createdAt: new Date('2024-12-20'),
    updatedAt: new Date('2024-12-20')
  },
  {
    _id: 'mock-record-3',
    patientId: '68bd6cd8a400feb3fe9a92ea',
    doctorId: '68bccb847eaab0d33069e179',
    visitId: null,
    recordType: 'Emergency',
    date: new Date('2024-11-10'),
    department: 'Emergency Medicine',
    diagnosis: 'Acute Gastritis',
    treatment: 'Pantoprazole 40mg daily, dietary restrictions',
    notes: 'Patient presented with severe abdominal pain. Responded well to treatment.',
    attachments: [
      { name: 'ct_scan.pdf', type: 'pdf', url: '/uploads/ct_scan.pdf' },
      { name: 'blood_work.pdf', type: 'pdf', url: '/uploads/blood_work.pdf' }
    ],
    vitalSigns: {
      bloodPressure: '120/80',
      heartRate: 85,
      temperature: 99.1,
      weight: 76,
      height: 170,
      oxygenSaturation: 98
    },
    labResults: [
      {
        testName: 'WBC Count',
        result: '12,500',
        normalRange: '4,500-11,000',
        status: 'Abnormal'
      }
    ],
    medications: [
      {
        name: 'Pantoprazole',
        dosage: '40mg',
        frequency: 'Once daily',
        duration: '14 days',
        instructions: 'Take before breakfast'
      }
    ],
    followUpRequired: false,
    followUpDate: null,
    status: 'Completed',
    tenantId: 'test-tenant',
    createdBy: '68bccb847eaab0d33069e179',
    createdAt: new Date('2024-11-10'),
    updatedAt: new Date('2024-11-10')
  }
];

// Get medical records by patient
const getMedicalRecordsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { tenantId } = req.user;

    console.log('🔍 Fetching medical records for patient:', patientId, 'tenant:', tenantId);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Using mock medical records data');
      const records = mockMedicalRecordsStore.filter(record => 
        record.patientId === patientId && record.tenantId === tenantId
      );

      return res.status(200).json({
        success: true,
        data: { records },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Use real MongoDB data
    const records = await NewFlowMedicalRecord.findByPatient(patientId, tenantId);

    res.status(200).json({
      success: true,
      data: { records },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medical records',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get medical records by doctor
const getMedicalRecordsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { tenantId } = req.user;

    console.log('🔍 Fetching medical records for doctor:', doctorId, 'tenant:', tenantId);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Using mock medical records data');
      const records = mockMedicalRecordsStore.filter(record => 
        record.doctorId === doctorId && record.tenantId === tenantId
      );

      return res.status(200).json({
        success: true,
        data: { records },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Use real MongoDB data
    const records = await NewFlowMedicalRecord.findByDoctor(doctorId, tenantId);

    res.status(200).json({
      success: true,
      data: { records },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medical records',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Create new medical record
const createMedicalRecord = async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;
    const recordData = {
      ...req.body,
      tenantId,
      createdBy: userId
    };

    console.log('📝 Creating medical record:', recordData);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Using mock medical record creation');
      const newRecord = {
        _id: 'mock-record-' + Date.now(),
        ...recordData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockMedicalRecordsStore.push(newRecord);

      return res.status(201).json({
        success: true,
        data: { record: newRecord },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Use real MongoDB data
    const record = new NewFlowMedicalRecord(recordData);
    await record.save();

    res.status(201).json({
      success: true,
      data: { record },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating medical record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating medical record',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

// Get all medical records
const getAllMedicalRecords = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { page = 1, limit = 10, recordType, status } = req.query;

    console.log('📋 Fetching all medical records for tenant:', tenantId);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📋 Using mock medical records data');
      let records = mockMedicalRecordsStore.filter(record => record.tenantId === tenantId);

      // Apply filters
      if (recordType) {
        records = records.filter(record => record.recordType === recordType);
      }
      if (status) {
        records = records.filter(record => record.status === status);
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedRecords = records.slice(startIndex, endIndex);

      return res.status(200).json({
        success: true,
        data: { 
          records: paginatedRecords,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(records.length / limit),
            totalRecords: records.length,
            hasNext: endIndex < records.length,
            hasPrev: startIndex > 0
          }
        },
        flow: 'newflow',
        version: '2.0.0-beta',
        timestamp: new Date().toISOString()
      });
    }

    // Use real MongoDB data
    const query = { tenantId };
    if (recordType) query.recordType = recordType;
    if (status) query.status = status;

    const records = await NewFlowMedicalRecord.find(query)
      .populate('patientId', 'name uhid mobile email')
      .populate('doctorId', 'name email phone')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await NewFlowMedicalRecord.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { 
        records,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      },
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medical records',
      error: error.message,
      flow: 'newflow',
      version: '2.0.0-beta',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  getMedicalRecordsByPatient,
  getMedicalRecordsByDoctor,
  createMedicalRecord,
  getAllMedicalRecords
};
