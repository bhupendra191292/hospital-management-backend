const mongoose = require('mongoose');
const Tenant = require('./models/Tenant');
const Doctor = require('./models/doctorModel');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/digital-hospital', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createTestTenant = async () => {
  try {
    console.log('🌱 Creating test tenant...');

    // Create test tenant
    const testTenant = new Tenant({
      name: 'Test Hospital',
      slug: 'test-hospital',
      type: 'hospital',
      email: 'test@hospital.com',
      phone: '+1234567890',
      address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        zipCode: '12345'
      },
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        maxUsers: 5,
        maxPatients: 100
      },
      status: 'active',
      features: {
        appointments: true,
        patientManagement: true,
        medicalRecords: true,
        analytics: true,
        reports: true,
        auditLogs: true
      }
    });

    await testTenant.save();
    console.log('✅ Test tenant created:', testTenant.name);

    // Create test admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const testAdmin = new Doctor({
      name: 'Test Admin',
      phone: '+1234567890',
      password: hashedPassword,
      specialization: 'Administration',
      role: 'admin',
      tenant: testTenant._id,
      isSuperAdmin: false
    });

    await testAdmin.save();
    console.log('✅ Test admin created:', testAdmin.name);

    // Create test doctor
    const testDoctor = new Doctor({
      name: 'Dr. Test Doctor',
      phone: '+1234567891',
      password: hashedPassword,
      specialization: 'General Medicine',
      role: 'doctor',
      tenant: testTenant._id,
      isSuperAdmin: false
    });

    await testDoctor.save();
    console.log('✅ Test doctor created:', testDoctor.name);

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin Login:');
    console.log('  Phone: +1234567890');
    console.log('  Password: admin123');
    console.log('\nDoctor Login:');
    console.log('  Phone: +1234567891');
    console.log('  Password: admin123');
    console.log('\n🏥 Tenant Info:');
    console.log('  Name: Test Hospital');
    console.log('  Slug: test-hospital');
    console.log('  Type: hospital');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
};

createTestTenant();
