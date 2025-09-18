const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,
  specialization: String,
  role: { type: String, enum: ['admin', 'doctor'], default: 'doctor' },
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  isSuperAdmin: { type: Boolean, default: false }, // For system-wide admin
}, { timestamps: true });

// Compound index for tenant-specific phone uniqueness
doctorSchema.index({ tenant: 1, phone: 1 }, { unique: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
