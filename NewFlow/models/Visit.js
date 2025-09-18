const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  // Patient Reference
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewFlowPatient',
    required: true,
    index: true
  },
  
  // Visit Information
  visitId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  visitType: {
    type: String,
    enum: ['OPD', 'Emergency', 'Follow-up', 'Consultation', 'Procedure'],
    default: 'OPD',
    required: true
  },
  
  // Medical Information
  chiefComplaint: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  
  symptoms: [{
    type: String,
    trim: true
  }],
  
  // Doctor Information
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false // Can be assigned later
  },
  
  doctorName: {
    type: String,
    trim: true
  },
  
  department: {
    type: String,
    enum: ['General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Gynecology', 'Dermatology', 'ENT', 'Ophthalmology', 'Emergency', 'Other'],
    required: true
  },
  
  // Appointment Information
  appointmentDate: {
    type: Date,
    required: true
  },
  
  appointmentTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  
  // Visit Status
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    default: 'Scheduled',
    required: true
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Emergency'],
    default: 'Normal'
  },
  
  // Visit Notes
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // Insurance Information
  insuranceProvider: {
    type: String,
    trim: true
  },
  
  insuranceNumber: {
    type: String,
    trim: true
  },
  
  // Financial Information
  estimatedCost: {
    type: Number,
    min: 0
  },
  
  // System Information
  tenantId: {
    type: String,
    required: true,
    index: true,
    default: 'test-tenant'
  },
  
  createdBy: {
    type: String,
    required: true,
    default: 'system'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Visit Completion
  completedAt: {
    type: Date
  },
  
  // Prescription and Diagnosis (for completed visits)
  diagnosis: [{
    type: String,
    trim: true
  }],
  
  prescription: [{
    medicineName: String,
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
  }
}, {
  timestamps: true
});

// Indexes for better performance
visitSchema.index({ patientId: 1, appointmentDate: 1 });
visitSchema.index({ doctorId: 1, appointmentDate: 1 });
visitSchema.index({ status: 1, appointmentDate: 1 });
visitSchema.index({ tenantId: 1, appointmentDate: 1 });

// Static method to generate Visit ID
visitSchema.statics.generateVisitId = function() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `VIS${year}${month}${day}-${random}`;
};

// Static method to find visits by patient
visitSchema.statics.findByPatient = function(patientId, tenantId) {
  return this.find({ patientId, tenantId })
    .populate('patientId', 'name uhid mobile email')
    .populate('doctorId', 'name specialization')
    .sort({ appointmentDate: -1 });
};

// Static method to find visits by doctor
visitSchema.statics.findByDoctor = function(doctorId, tenantId, date) {
  const query = { doctorId, tenantId };
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
  }
  
  return this.find(query)
    .populate('patientId', 'name uhid mobile email age gender')
    .sort({ appointmentTime: 1 });
};

// Instance method to check if visit can be cancelled
visitSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':');
  appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Can cancel if appointment is more than 2 hours away
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  return appointmentDateTime > twoHoursFromNow && this.status === 'Scheduled';
};

// Pre-save middleware to update timestamps
visitSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('NewFlowVisit', visitSchema);
