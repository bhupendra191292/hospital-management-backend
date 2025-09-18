const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Doctor = require('./models/doctorModel');
const Patient = require('./models/Patient');
const Visit = require('./models/Visit');
const Tenant = require('./models/Tenant');

const seedSimpleDemo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    // Create demo tenant
    const demoTenant = await Tenant.findOneAndUpdate(
      { slug: 'demo-hospital' },
      {
        name: 'Demo General Hospital',
        slug: 'demo-hospital',
        type: 'hospital',
        email: 'admin@demo-hospital.com',
        phone: '+1-555-0123',
        address: {
          street: '123 Healthcare Avenue',
          city: 'Medical City',
          state: 'Health State',
          country: 'USA',
          zipCode: '12345'
        },
        primaryColor: '#2563eb',
        secondaryColor: '#059669',
        features: {
          appointments: true,
          patientManagement: true,
          medicalRecords: true,
          billing: true,
          analytics: true,
          reports: true,
          auditLogs: true
        },
        subscription: {
          plan: 'professional',
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      },
      { upsert: true, new: true }
    );

    console.log('🏥 Demo tenant created:', demoTenant.name);

    // Create one demo doctor
    const demoDoctor = await Doctor.findOneAndUpdate(
      { phone: '9876543210' },
      {
        name: 'Dr. Sarah Johnson',
        phone: '9876543210',
        password: await bcrypt.hash('password123', 10),
        specialization: 'Cardiology',
        role: 'doctor',
        tenant: demoTenant._id
      },
      { upsert: true, new: true }
    );

    console.log('👨‍⚕️ Demo doctor created:', demoDoctor.name);

    // Create one demo patient
    const demoPatient = await Patient.findOneAndUpdate(
      { email: 'john.smith@demo.com' },
      {
        name: 'John Smith',
        email: 'john.smith@demo.com',
        phone: '9876543215',
        age: 45,
        gender: 'Male',
        bloodGroup: 'O+',
        address: '456 Oak Street, Medical City, Health State 12345',
        patientId: 'DEMO-240101-0001',
        tenant: demoTenant._id
      },
      { upsert: true, new: true }
    );

    console.log('👥 Demo patient created:', demoPatient.name);

    // Create one demo visit
    const demoVisit = await Visit.findOneAndUpdate(
      { patientId: demoPatient._id, doctorId: demoDoctor._id },
      {
        patientId: demoPatient._id,
        doctorId: demoDoctor._id,
        date: new Date(),
        symptoms: 'Chest pain, Shortness of breath, Fatigue',
        diagnosis: 'Possible cardiac issue, needs further evaluation',
        notes: 'Patient reports chest pain for the past 2 days. ECG shows some abnormalities.',
        prescription: [{
          medicine: 'Aspirin',
          dose: '75mg',
          frequency: 'Once daily'
        }]
      },
      { upsert: true, new: true }
    );

    console.log('📅 Demo visit created');

    console.log('\n🎉 Simple demo data setup completed successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`🏥 Hospital: ${demoTenant.name}`);
    console.log(`👨‍⚕️ Doctor: ${demoDoctor.name}`);
    console.log(`👥 Patient: ${demoPatient.name}`);
    console.log(`📅 Visit: Created`);
    console.log('\n🔑 Demo Login Credentials:');
    console.log('Admin: super@newflow.com / password123');
    console.log('Doctor: sarah.johnson@demo.com / password123');
    console.log('Patient: john.smith@demo.com (use phone: 9876543215)');

  } catch (error) {
    console.error('❌ Demo data setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding
seedSimpleDemo();
