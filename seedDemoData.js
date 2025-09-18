const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Doctor = require('./models/doctorModel');
const Patient = require('./models/Patient');
const Visit = require('./models/Visit');
const Tenant = require('./models/Tenant');

const seedDemoData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');

    // Clear existing demo data
    await Doctor.deleteMany({ email: { $regex: /@demo\./ } });
    await Patient.deleteMany({ email: { $regex: /@demo\./ } });
    await Visit.deleteMany({});
    await Tenant.deleteMany({ slug: 'demo-hospital' });
    console.log('🧹 Cleared existing demo data');

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

    // Create demo doctors
    const demoDoctors = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@demo.com',
        phone: '9876543210',
        password: await bcrypt.hash('password123', 10),
        specialization: 'Cardiology',
        qualification: 'MBBS, MD (Cardiology)',
        experience: 8,
        consultationFee: 500,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        status: 'active',
        tenant: demoTenant._id
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@demo.com',
        phone: '9876543211',
        password: await bcrypt.hash('password123', 10),
        specialization: 'Neurology',
        qualification: 'MBBS, MD (Neurology)',
        experience: 12,
        consultationFee: 600,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        status: 'active',
        tenant: demoTenant._id
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@demo.com',
        phone: '9876543212',
        password: await bcrypt.hash('password123', 10),
        specialization: 'Pediatrics',
        qualification: 'MBBS, MD (Pediatrics)',
        experience: 6,
        consultationFee: 400,
        availableDays: ['Monday', 'Tuesday', 'Thursday', 'Saturday'],
        status: 'active',
        tenant: demoTenant._id
      },
      {
        name: 'Dr. James Wilson',
        email: 'james.wilson@demo.com',
        phone: '9876543213',
        password: await bcrypt.hash('password123', 10),
        specialization: 'Orthopedics',
        qualification: 'MBBS, MS (Orthopedics)',
        experience: 15,
        consultationFee: 700,
        availableDays: ['Tuesday', 'Thursday', 'Friday'],
        status: 'active',
        tenant: demoTenant._id
      },
      {
        name: 'Dr. Lisa Thompson',
        email: 'lisa.thompson@demo.com',
        phone: '9876543214',
        password: await bcrypt.hash('password123', 10),
        specialization: 'Dermatology',
        qualification: 'MBBS, MD (Dermatology)',
        experience: 10,
        consultationFee: 450,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        status: 'active',
        tenant: demoTenant._id
      }
    ];

    const createdDoctors = await Doctor.insertMany(demoDoctors);
    console.log(`👨‍⚕️ Created ${createdDoctors.length} demo doctors`);

    // Create demo patients
    const demoPatients = [
      {
        name: 'John Smith',
        email: 'john.smith@demo.com',
        phone: '9876543215',
        age: 45,
        gender: 'Male',
        bloodGroup: 'O+',
        dateOfBirth: '1978-05-15',
        address: '456 Oak Street, Medical City, Health State 12345',
        emergencyContact: '9876543216',
        occupation: 'Software Engineer',
        maritalStatus: 'Married',
        guardianName: 'Jane Smith',
        guardianRelation: 'Spouse',
        patientId: 'DEMO-240101-0001',
        status: 'Active',
        registrationDate: new Date().toISOString().split('T')[0],
        tenant: demoTenant._id
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@demo.com',
        phone: '9876543217',
        age: 32,
        gender: 'Female',
        bloodGroup: 'A+',
        dateOfBirth: '1991-08-22',
        address: '789 Pine Avenue, Medical City, Health State 12345',
        emergencyContact: '9876543218',
        occupation: 'Teacher',
        maritalStatus: 'Single',
        patientId: 'DEMO-240101-0002',
        status: 'Active',
        registrationDate: new Date().toISOString().split('T')[0],
        tenant: demoTenant._id
      },
      {
        name: 'Robert Johnson',
        email: 'robert.johnson@demo.com',
        phone: '9876543219',
        age: 67,
        gender: 'Male',
        bloodGroup: 'B+',
        dateOfBirth: '1956-12-03',
        address: '321 Elm Drive, Medical City, Health State 12345',
        emergencyContact: '9876543220',
        occupation: 'Retired',
        maritalStatus: 'Widowed',
        guardianName: 'Susan Johnson',
        guardianRelation: 'Daughter',
        patientId: 'DEMO-240101-0003',
        status: 'Active',
        registrationDate: new Date().toISOString().split('T')[0],
        tenant: demoTenant._id
      },
      {
        name: 'Jennifer Lee',
        email: 'jennifer.lee@demo.com',
        phone: '9876543221',
        age: 28,
        gender: 'Female',
        bloodGroup: 'AB+',
        dateOfBirth: '1995-03-18',
        address: '654 Maple Lane, Medical City, Health State 12345',
        emergencyContact: '9876543222',
        occupation: 'Nurse',
        maritalStatus: 'Married',
        guardianName: 'David Lee',
        guardianRelation: 'Husband',
        patientId: 'DEMO-240101-0004',
        status: 'Active',
        registrationDate: new Date().toISOString().split('T')[0],
        tenant: demoTenant._id
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@demo.com',
        phone: '9876543223',
        age: 55,
        gender: 'Male',
        bloodGroup: 'O-',
        dateOfBirth: '1968-09-12',
        address: '987 Cedar Street, Medical City, Health State 12345',
        emergencyContact: '9876543224',
        occupation: 'Business Owner',
        maritalStatus: 'Married',
        guardianName: 'Patricia Brown',
        guardianRelation: 'Wife',
        patientId: 'DEMO-240101-0005',
        status: 'Active',
        registrationDate: new Date().toISOString().split('T')[0],
        tenant: demoTenant._id
      }
    ];

    const createdPatients = await Patient.insertMany(demoPatients);
    console.log(`👥 Created ${createdPatients.length} demo patients`);

    // Create demo visits
    const demoVisits = [
      {
        patientId: createdPatients[0]._id,
        patientName: createdPatients[0].name,
        doctorId: createdDoctors[0]._id,
        doctorName: createdDoctors[0].name,
        visitType: 'OPD',
        chiefComplaint: 'Chest pain and shortness of breath',
        symptoms: 'Chest pain, Shortness of breath, Fatigue',
        department: 'Cardiology',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00',
        priority: 'High',
        notes: 'Patient reports chest pain for the past 2 days. ECG shows some abnormalities.',
        status: 'Completed',
        createdAt: new Date(),
        tenant: demoTenant._id
      },
      {
        patientId: createdPatients[1]._id,
        patientName: createdPatients[1].name,
        doctorId: createdDoctors[2]._id,
        doctorName: createdDoctors[2].name,
        visitType: 'OPD',
        chiefComplaint: 'Regular checkup for child',
        symptoms: 'Routine checkup',
        department: 'Pediatrics',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '14:00',
        priority: 'Normal',
        notes: 'Annual checkup. Child is healthy and developing normally.',
        status: 'Completed',
        createdAt: new Date(),
        tenant: demoTenant._id
      },
      {
        patientId: createdPatients[2]._id,
        patientName: createdPatients[2].name,
        doctorId: createdDoctors[1]._id,
        doctorName: createdDoctors[1].name,
        visitType: 'OPD',
        chiefComplaint: 'Headaches and memory issues',
        symptoms: 'Headaches, Memory loss, Confusion',
        department: 'Neurology',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        appointmentTime: '09:00',
        priority: 'High',
        notes: 'Patient experiencing frequent headaches and memory issues. Needs neurological evaluation.',
        status: 'Scheduled',
        createdAt: new Date(),
        tenant: demoTenant._id
      },
      {
        patientId: createdPatients[3]._id,
        patientName: createdPatients[3].name,
        doctorId: createdDoctors[4]._id,
        doctorName: createdDoctors[4].name,
        visitType: 'OPD',
        chiefComplaint: 'Skin rash and itching',
        symptoms: 'Skin rash, Itching, Redness',
        department: 'Dermatology',
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
        appointmentTime: '11:00',
        priority: 'Normal',
        notes: 'Patient has developed a skin rash on arms and legs. No known allergies.',
        status: 'Scheduled',
        createdAt: new Date(),
        tenant: demoTenant._id
      },
      {
        patientId: createdPatients[4]._id,
        patientName: createdPatients[4].name,
        doctorId: createdDoctors[3]._id,
        doctorName: createdDoctors[3].name,
        visitType: 'OPD',
        chiefComplaint: 'Knee pain and stiffness',
        symptoms: 'Knee pain, Stiffness, Swelling',
        department: 'Orthopedics',
        appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        appointmentTime: '15:00',
        priority: 'Normal',
        notes: 'Patient reports knee pain after physical activity. X-ray may be needed.',
        status: 'Scheduled',
        createdAt: new Date(),
        tenant: demoTenant._id
      }
    ];

    const createdVisits = await Visit.insertMany(demoVisits);
    console.log(`📅 Created ${createdVisits.length} demo visits`);

    console.log('\n🎉 Demo data setup completed successfully!');
    console.log('\n📊 Demo Data Summary:');
    console.log(`🏥 Hospital: ${demoTenant.name}`);
    console.log(`👨‍⚕️ Doctors: ${createdDoctors.length}`);
    console.log(`👥 Patients: ${createdPatients.length}`);
    console.log(`📅 Visits: ${createdVisits.length}`);
    console.log('\n🔑 Demo Login Credentials:');
    console.log('Admin: super@newflow.com / password123');
    console.log('Doctor: sarah.johnson@demo.com / password123');
    console.log('Patient: john.smith@demo.com (use mobile: 9876543215)');

  } catch (error) {
    console.error('❌ Demo data setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding
seedDemoData();
