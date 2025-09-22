const mongoose = require('mongoose');
require('dotenv').config();

// Import NewFlow models
const NewFlowPatient = require('./NewFlow/models/Patient');
const NewFlowDoctor = require('./NewFlow/models/Doctor');

const seedNewFlowPatients = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/digital-hospital');
    console.log('🔗 Connected to MongoDB');

    // Create some demo patients for NewFlow
    const patients = [
      {
        name: 'John Smith',
        uhid: 'DELH01-240922-0001',
        email: 'john.smith@example.com',
        mobile: '9876543210',
        emergencyContact: '9876543211',
        address: '123 Main Street, New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        dateOfBirth: new Date('1980-05-15'),
        gender: 'Male',
        bloodGroup: 'O+',
        occupation: 'Software Engineer',
        maritalStatus: 'Married',
        tenantId: 'test-tenant',
        createdBy: 'system',
        status: 'Active',
        notes: 'Regular patient with good health history'
      },
      {
        name: 'Sarah Johnson',
        uhid: 'DELH01-240922-0002',
        email: 'sarah.johnson@example.com',
        mobile: '9876543212',
        emergencyContact: '9876543213',
        address: '456 Park Avenue, New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110002',
        dateOfBirth: new Date('1985-08-22'),
        gender: 'Female',
        bloodGroup: 'A+',
        occupation: 'Teacher',
        maritalStatus: 'Single',
        tenantId: 'test-tenant',
        createdBy: 'system',
        status: 'Active',
        notes: 'New patient, first visit'
      },
      {
        name: 'Michael Brown',
        uhid: 'DELH01-240922-0003',
        email: 'michael.brown@example.com',
        mobile: '9876543214',
        emergencyContact: '9876543215',
        address: '789 Garden Road, New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110003',
        dateOfBirth: new Date('1975-12-10'),
        gender: 'Male',
        bloodGroup: 'B+',
        occupation: 'Business Owner',
        maritalStatus: 'Married',
        tenantId: 'test-tenant',
        createdBy: 'system',
        status: 'Active',
        notes: 'VIP patient, prefers morning appointments'
      },
      {
        name: 'Emily Davis',
        uhid: 'DELH01-240922-0004',
        email: 'emily.davis@example.com',
        mobile: '9876543216',
        emergencyContact: '9876543217',
        address: '321 Lake View, New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110004',
        dateOfBirth: new Date('1990-03-18'),
        gender: 'Female',
        bloodGroup: 'AB+',
        occupation: 'Doctor',
        maritalStatus: 'Married',
        tenantId: 'test-tenant',
        createdBy: 'system',
        status: 'Active',
        notes: 'Medical professional, understands procedures well'
      },
      {
        name: 'Robert Wilson',
        uhid: 'DELH01-240922-0005',
        email: 'robert.wilson@example.com',
        mobile: '9876543218',
        emergencyContact: '9876543219',
        address: '654 Hill Station, New Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110005',
        dateOfBirth: new Date('1965-07-05'),
        gender: 'Male',
        bloodGroup: 'O-',
        occupation: 'Retired',
        maritalStatus: 'Widowed',
        tenantId: 'test-tenant',
        createdBy: 'system',
        status: 'Active',
        notes: 'Senior citizen, requires assistance with mobility'
      }
    ];

    // Clear existing NewFlow patients
    await NewFlowPatient.deleteMany({});
    console.log('🧹 Cleared existing NewFlow patients');

    // Insert new patients
    const createdPatients = await NewFlowPatient.insertMany(patients);
    console.log(`✅ Created ${createdPatients.length} NewFlow patients`);

    // Create a demo doctor for NewFlow
    const demoDoctor = await NewFlowDoctor.findOneAndUpdate(
      { email: 'dr.sarah@demo.com' },
      {
        name: 'Dr. Sarah Johnson',
        email: 'dr.sarah@demo.com',
        mobile: '9876543200',
        password: 'password123', // This should be hashed in real app
        specialization: 'General Medicine',
        department: 'Internal Medicine',
        qualification: 'MBBS, MD',
        experience: 10,
        consultationFee: 500,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableTimeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
        status: 'Active',
        tenantId: 'test-tenant',
        createdBy: 'system'
      },
      { upsert: true, new: true }
    );

    console.log('👨‍⚕️ Demo NewFlow doctor created:', demoDoctor.name);

    console.log('\n🎉 NewFlow demo data setup completed successfully!');
    console.log('\n📊 NewFlow Demo Data Summary:');
    console.log(`👥 Patients: ${createdPatients.length}`);
    console.log(`👨‍⚕️ Doctor: ${demoDoctor.name}`);
    console.log('\n🔑 Demo Login Credentials:');
    console.log('Doctor: dr.sarah@demo.com / password123');

  } catch (error) {
    console.error('❌ NewFlow demo data setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding
seedNewFlowPatients();
