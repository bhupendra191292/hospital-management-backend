const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  date: { type: Date, default: Date.now },
  symptoms: String,
  diagnosis: String,
  prescription: [{
    medicine: String,
    dose: String,
    frequency: String
  }],
  notes: String,
  report: String
});

module.exports = mongoose.model('Visit', visitSchema);
