const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  age: Number,
  dob: { type: Date, default: null },
  gender: { type: String, default: null },
  email: { type: String, default: null },
  bloodGroup: { type: String, default: null },
  address: { type: String, default: null },
  allergies: [{ type: String, default: [] }],
  chronicConditions: [{ type: String, default: [] }],
  emergencyContact: {
    name: { type: String, default: null },
    phone: { type: String, default: null }
  },
  language: { type: String, default: null },
  visits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Visit' }],
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  patientId: { type: String, required: true }, // Tenant-specific patient ID
}, { timestamps: true });

// Compound index for tenant-specific phone uniqueness
patientSchema.index({ tenant: 1, phone: 1 });
patientSchema.index({ tenant: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model('Patient', patientSchema);
