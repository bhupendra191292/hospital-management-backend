const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Doctor = require('./NewFlow/models/Doctor');
const Patient = require('./NewFlow/models/Patient');
const Visit = require('./NewFlow/models/Visit');

async function clearDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hospital-management');
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    console.log('🧹 Clearing database...');
    
    // Clear NewFlow collections
    const doctorResult = await Doctor.deleteMany({});
    console.log(`🗑️  Deleted ${doctorResult.deletedCount} doctors`);
    
    const patientResult = await Patient.deleteMany({});
    console.log(`🗑️  Deleted ${patientResult.deletedCount} patients`);
    
    const visitResult = await Visit.deleteMany({});
    console.log(`🗑️  Deleted ${visitResult.deletedCount} visits`);

    // Clear any other collections if they exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      if (collectionName.startsWith('newflow_') || collectionName.includes('doctor') || collectionName.includes('patient')) {
        try {
          const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
          console.log(`🗑️  Deleted ${result.deletedCount} documents from ${collectionName}`);
        } catch (error) {
          console.log(`⚠️  Could not clear ${collectionName}:`, error.message);
        }
      }
    }

    console.log('✅ Database cleared successfully!');
    console.log('📊 Database is now ready for fresh data');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
clearDatabase();
