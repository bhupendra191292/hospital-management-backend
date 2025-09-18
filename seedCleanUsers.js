const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Doctor = require('./NewFlow/models/Doctor');
const Patient = require('./NewFlow/models/Patient');

async function seedCleanUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospital-management');
    console.log('✅ Connected to MongoDB');

    console.log('🌱 Seeding clean users with proper role support...');

    // Create sample doctors with proper roles
    const doctors = [
      {
        doctorId: 'DOC001',
        name: 'Dr. Sarah Johnson',
        phone: '9876543210',
        email: 'sarah.johnson@hospital.com',
        password: 'password123',
        specialization: 'Cardiology',
        qualification: 'MD, DM Cardiology',
        experience: 8,
        consultationFee: 800,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        status: 'active',
        tenantId: 'test-tenant',
        createdBy: 'system'
      },
      {
        doctorId: 'DOC002',
        name: 'Dr. Michael Chen',
        phone: '9876543211',
        email: 'michael.chen@hospital.com',
        password: 'password123',
        specialization: 'Neurology',
        qualification: 'MD, DM Neurology',
        experience: 12,
        consultationFee: 1000,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        status: 'active',
        tenantId: 'test-tenant',
        createdBy: 'system'
      },
      {
        doctorId: 'DOC003',
        name: 'Dr. Lisa Wilson',
        phone: '9876543212',
        email: 'lisa.wilson@hospital.com',
        password: 'password123',
        specialization: 'Pediatrics',
        qualification: 'MD, DCH',
        experience: 6,
        consultationFee: 600,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        status: 'active',
        tenantId: 'test-tenant',
        createdBy: 'system'
      },
      {
        doctorId: 'DOC004',
        name: 'Dr. Robert Brown',
        phone: '9876543213',
        email: 'robert.brown@hospital.com',
        password: 'password123',
        specialization: 'Orthopedics',
        qualification: 'MS Orthopedics',
        experience: 10,
        consultationFee: 900,
        availableDays: ['Tuesday', 'Thursday', 'Saturday'],
        status: 'active',
        tenantId: 'test-tenant',
        createdBy: 'system'
      },
      {
        doctorId: 'DOC005',
        name: 'Dr. Emma Davis',
        phone: '9876543214',
        email: 'emma.davis@hospital.com',
        password: 'password123',
        specialization: 'Dermatology',
        qualification: 'MD Dermatology',
        experience: 7,
        consultationFee: 700,
        availableDays: ['Monday', 'Wednesday', 'Friday'],
        status: 'pending', // This one is pending for testing
        tenantId: 'test-tenant',
        createdBy: 'system'
      }
    ];

    // Create sample patients
    const patients = [
      {
        uhid: 'UHID001',
        name: 'John Smith',
        mobile: '9123456780',
        email: 'john.smith@email.com',
        dateOfBirth: '1985-05-15',
        gender: 'Male',
        address: '123 Main Street, City',
        emergencyContact: '9123456781',
        medicalHistory: 'No known allergies',
        status: 'Active',
        tenantId: 'test-tenant',
        createdBy: 'system'
      },
      {
        uhid: 'UHID002',
        name: 'Jane Doe',
        mobile: '9123456782',
        email: 'jane.doe@email.com',
        dateOfBirth: '1990-08-22',
        gender: 'Female',
        address: '456 Oak Avenue, City',
        emergencyContact: '9123456783',
        medicalHistory: 'Allergic to penicillin',
        status: 'Active',
        tenantId: 'test-tenant',
        createdBy: 'system'
      },
      {
        uhid: 'UHID003',
        name: 'Mike Johnson',
        mobile: '9123456784',
        email: 'mike.johnson@email.com',
        dateOfBirth: '1978-12-10',
        gender: 'Male',
        address: '789 Pine Road, City',
        emergencyContact: '9123456785',
        medicalHistory: 'Diabetes Type 2',
        status: 'Active',
        tenantId: 'test-tenant',
        createdBy: 'system'
      }
    ];

    // Insert doctors
    console.log('👨‍⚕️ Creating doctors...');
    const createdDoctors = await Doctor.insertMany(doctors);
    console.log(`✅ Created ${createdDoctors.length} doctors`);

    // Insert patients
    console.log('👤 Creating patients...');
    const createdPatients = await Patient.insertMany(patients);
    console.log(`✅ Created ${createdPatients.length} patients`);

    console.log('\n🎉 Clean user seeding completed!');
    console.log('\n📋 Login Credentials for Testing:');
    console.log('=====================================');
    
    console.log('\n👨‍⚕️ DOCTORS:');
    createdDoctors.forEach(doctor => {
      console.log(`• ${doctor.name} (${doctor.specialization})`);
      console.log(`  Phone: ${doctor.phone} | Email: ${doctor.email}`);
      console.log(`  Status: ${doctor.status} | Doctor ID: ${doctor.doctorId}`);
      console.log('');
    });

    console.log('\n👤 PATIENTS:');
    createdPatients.forEach(patient => {
      console.log(`• ${patient.name}`);
      console.log(`  Mobile: ${patient.mobile} | Email: ${patient.email}`);
      console.log(`  UHID: ${patient.uhid} | Status: ${patient.status}`);
      console.log('');
    });

    console.log('🔐 All users have password: password123');
    console.log('🏥 Tenant ID: test-tenant');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding
seedCleanUsers();
