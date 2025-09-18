const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewFlowPatient',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewFlowDoctor',
    required: true,
    index: true
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewFlowVisit',
    required: false, // Can be created outside a visit
    index: true
  },
  recordType: {
    type: String,
    enum: ['Consultation', 'Follow-up', 'Emergency', 'Lab Test', 'Imaging', 'Procedure'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  treatment: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    oxygenSaturation: Number
  },
  labResults: [{
    testName: String,
    result: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['Normal', 'Abnormal', 'Critical'],
      default: 'Normal'
    }
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: String, // Storing user ID as string
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
medicalRecordSchema.index({ patientId: 1, date: -1 });
medicalRecordSchema.index({ doctorId: 1, date: -1 });
medicalRecordSchema.index({ tenantId: 1, recordType: 1 });
medicalRecordSchema.index({ tenantId: 1, status: 1 });

// Static method to find records by patient
medicalRecordSchema.statics.findByPatient = function(patientId, tenantId) {
  return this.find({ patientId, tenantId })
    .populate('doctorId', 'name email phone')
    .populate('visitId', 'appointmentDate appointmentTime')
    .sort({ date: -1 });
};

// Static method to find records by doctor
medicalRecordSchema.statics.findByDoctor = function(doctorId, tenantId) {
  return this.find({ doctorId, tenantId })
    .populate('patientId', 'name uhid mobile email')
    .populate('visitId', 'appointmentDate appointmentTime')
    .sort({ date: -1 });
};

const NewFlowMedicalRecord = mongoose.model('NewFlowMedicalRecord', medicalRecordSchema);

module.exports = NewFlowMedicalRecord;
