const Patient = require('../models/Patient');
const { generateTenantId } = require('../middlewares/tenantMiddleware');

const registerPatient = async (req, res) => {
    const {
      phone,
      name,
      age,
      dob = null,
      gender = null,
      address = null,
      email = null,
      bloodGroup = null,
      allergies = [],
      chronicConditions = [],
      emergencyContact = {},
      language = null
    } = req.body;
  
    try {
      const existing = await Patient.findOne({ 
        phone, 
        name, 
        dob,
        tenant: req.user?.tenant || '507f1f77bcf86cd799439011'
      });
      if (existing) {
        return res.status(409).json({ message: 'Same patient already registered.' });
      }
      const patient = await Patient.create({
        phone,
        name,
        age,
        dob,
        gender,
        address,
        email,
        bloodGroup,
        allergies,
        chronicConditions,
        emergencyContact: {
          name: emergencyContact.name || null,
          phone: emergencyContact.phone || null
        },
        language,
        tenant: req.user?.tenant || '507f1f77bcf86cd799439011', // Default tenant for now
        patientId: generateTenantId('PAT', req.user?.tenant || '507f1f77bcf86cd799439011')
      });
  
      res.status(201).json(patient);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

const checkPatient = async (req, res) => {
  const { phone } = req.body;
  try {
    const patient = await Patient.findOne({ phone }).populate('visits');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: 'Failed to check patient', error: err.message });
  }
};

const getPatientById = async (req, res) => {
    try {
      const patient = await Patient.findById(req.params.id).populate('visits');
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
  
      res.json(patient);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching patient', error: err.message });
    }
  };

  const getPatientsByPhone = async (req, res) => {
    try {
      const phone = req.params.phone;
      const patients = await Patient.find({ "contact.phone": phone });
      res.status(200).json(patients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching patients by phone", error });
    }
  };
  

const getPatients = async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', gender } = req.query;
      const query = {};
  
      if (search) {
        query.$or = [
          { name: new RegExp(search, 'i') },
          { phone: new RegExp(search, 'i') }
        ];
      }
  
      if (gender) {
        query.gender = gender;
      }
  
      const total = await Patient.countDocuments(query);
      const patients = await Patient.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate({
          path: 'visits',
          options: { sort: { date: -1 }, limit: 1 }, // last visit
        });
  
      const data = patients.map((p) => ({
        _id: p._id,
        name: p.name,
        phone: p.phone,
        age: p.age,
        gender: p.gender,
        lastVisit: p.visits?.[0]?.date || null,
      }));
  
      res.json({
        data,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching patients', error: err.message });
    }
  };

  
module.exports = {
  registerPatient,
  checkPatient,
  getPatientById,
  getPatients,
  getPatientsByPhone
};
