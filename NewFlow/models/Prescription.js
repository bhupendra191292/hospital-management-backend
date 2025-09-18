const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
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
    required: false,
    index: true
  },
  medication: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Every 12 hours', 'As needed', 'Before meals', 'After meals', 'At bedtime'],
    default: 'Once daily'
  },
  duration: {
    type: String,
    required: true,
    trim: true
  },
  instructions: {
    type: String,
    required: false,
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled', 'Draft'],
    default: 'Active'
  },
  prescribedDate: {
    type: Date,
    default: Date.now
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: false
  },
  refills: {
    type: Number,
    default: 0,
    min: 0
  },
  refillsRemaining: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    required: false,
    trim: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
prescriptionSchema.index({ patientId: 1, tenantId: 1 });
prescriptionSchema.index({ doctorId: 1, tenantId: 1 });
prescriptionSchema.index({ visitId: 1, tenantId: 1 });
prescriptionSchema.index({ status: 1, tenantId: 1 });
prescriptionSchema.index({ prescribedDate: -1, tenantId: 1 });

// Static method to find prescriptions by patient
prescriptionSchema.statics.findByPatient = function(patientId, tenantId) {
  return this.find({ patientId, tenantId })
    .populate('doctorId', 'name specialty')
    .populate('visitId', 'appointmentDate appointmentTime')
    .sort({ prescribedDate: -1 });
};

// Static method to find prescriptions by doctor
prescriptionSchema.statics.findByDoctor = function(doctorId, tenantId) {
  return this.find({ doctorId, tenantId })
    .populate('patientId', 'name uhid mobile')
    .populate('visitId', 'appointmentDate appointmentTime')
    .sort({ prescribedDate: -1 });
};

// Static method to find active prescriptions
prescriptionSchema.statics.findActive = function(tenantId) {
  return this.find({ status: 'Active', tenantId })
    .populate('patientId', 'name uhid mobile')
    .populate('doctorId', 'name specialty')
    .sort({ prescribedDate: -1 });
};

module.exports = mongoose.model('NewFlowPrescription', prescriptionSchema);
