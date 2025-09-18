const { Patient, Visit } = require('../models');

exports.getDashboardSummary = async (req, res) => {
  try {
    const totalPatients = await Patient.countDocuments();
    const totalVisits = await Visit.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisits = await Visit.countDocuments({ date: { $gte: today } });

    res.json({ totalPatients, totalVisits, todayVisits });
  } catch (err) {
    res.status(500).json({ message: 'Dashboard error', error: err.message });
  }
};

exports.getTrends = async (req, res) => {
  const visits = await Visit.find({}).populate('patientId');

  const trends = {
    byDate: {},
    gender: { Male: 0, Female: 0, Other: 0 },
    ageGroups: { '0-18': 0, '19-40': 0, '41-60': 0, '60+': 0 },
  };

  visits.forEach((v) => {
    const date = new Date(v.date).toLocaleDateString();
    trends.byDate[date] = (trends.byDate[date] || 0) + 1;

    const { gender, age } = v.patientId || {};
    if (gender) trends.gender[gender] = (trends.gender[gender] || 0) + 1;

    if (age !== undefined) {
      if (age <= 18) trends.ageGroups['0-18']++;
      else if (age <= 40) trends.ageGroups['19-40']++;
      else if (age <= 60) trends.ageGroups['41-60']++;
      else trends.ageGroups['60+']++;
    }
  });

  res.json(trends);
};
