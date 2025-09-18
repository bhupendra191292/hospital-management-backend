const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Checkup', 'Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Test', 'Other'],
    default: 'Checkup'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No-show'],
    default: 'Scheduled'
  },
  notes: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in minutes
    default: 30
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Emergency'],
    default: 'Medium'
  },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  appointmentId: { type: String, required: true }, // Tenant-specific appointment ID
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create indexes for better query performance
appointmentSchema.index({ tenant: 1, patient: 1, date: 1 });
appointmentSchema.index({ tenant: 1, doctor: 1, date: 1 });
appointmentSchema.index({ tenant: 1, status: 1 });
appointmentSchema.index({ tenant: 1, date: 1, status: 1 });
appointmentSchema.index({ tenant: 1, appointmentId: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
