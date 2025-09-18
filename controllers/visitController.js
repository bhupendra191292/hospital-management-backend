const { Visit, Patient } = require('../models');
const fs = require('fs');
const PDFDocument = require('pdfkit');

exports.addVisit = async (req, res) => {
  try {
    const { patientId, symptoms, diagnosis, notes } = req.body;
    const prescription = JSON.parse(req.body.prescription);
    const report = req.file ? `/uploads/${req.file.filename}` : null;

    const visit = await Visit.create({
      patientId,
      doctorId: req.doctorId,
      symptoms,
      diagnosis,
      notes,
      prescription,
      report,
    });

    await Patient.findByIdAndUpdate(patientId, { $push: { visits: visit._id } });
    res.status(201).json(visit);
  } catch (err) {
    res.status(500).json({ message: 'Visit creation failed', error: err.message });
  }
};

exports.updateVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    if (!visit) return res.status(404).json({ message: 'Visit not found' });

    const isOwner = visit.doctorId.toString() === req.doctorId;
    if (req.user.role !== 'admin' && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const updated = await Visit.findByIdAndUpdate(req.params.id, {
      symptoms: req.body.symptoms,
      diagnosis: req.body.diagnosis,
      notes: req.body.notes,
      prescription: req.body.prescription,
    }, { new: true });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update visit' });
  }
};

exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No report file uploaded' });

    const updated = await Visit.findByIdAndUpdate(
      req.params.id,
      { report: `/uploads/${req.file.filename}` },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Visit not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to attach report' });
  }
};

exports.exportPatientHistoryPDF = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).populate({
      path: 'visits',
      populate: { path: 'doctorId' }
    });

    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${patient.name}-history.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).text(`Patient History - ${patient.name}`, { underline: true });
    doc.moveDown();

    patient.visits.forEach((v, i) => {
      doc.fontSize(12).text(`Visit #${i + 1}`);
      doc.text(`Date: ${new Date(v.date).toLocaleString()}`);
      doc.text(`Doctor: ${v.doctorId?.name || 'Unknown'}`);
      doc.text(`Diagnosis: ${v.diagnosis}`);
      doc.text(`Symptoms: ${v.symptoms}`);
      doc.text(`Notes: ${v.notes}`);
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ message: 'Failed to generate PDF', error: err.message });
  }
};

exports.getPatientVisits = async (req, res) => {
    try {
      const query = { patientId: req.params.id };
      if (req.user.role !== 'admin') {
        query.doctorId = req.doctorId;
      }
  
      const visits = await Visit.find(query).populate('doctorId');
      res.json(visits);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching visits' });
    }
  };
