// controllers/dashboardController.js
const { Patient, Visit } = require('../models');

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalVisits = await Visit.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisits = await Visit.countDocuments({
      date: { $gte: today }
    });

    res.json({ totalPatients, totalVisits, todayVisits });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.status(500).json({ message: 'Dashboard error', error: err.message });
  }
};
