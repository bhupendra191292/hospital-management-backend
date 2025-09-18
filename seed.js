const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const doctorSchema = new mongoose.Schema({
  name: String,
  phone: { type: String, unique: true },
  password: String,
  specialization: String,
  role: { type: String, enum: ['admin', 'doctor'], default: 'doctor' }
});
const Doctor = mongoose.model('Doctor', doctorSchema);

const seedDoctor = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const phone = "9166677753";
  const hashed = await bcrypt.hash('Test@123', 10);
  
  const doctor = await Doctor.findOneAndUpdate(
    { phone }, // search criteria
    {          // update data
      name: "Dr. Bhupi",
      phone,
      password: hashed,
      specialization: "All",
      role: "doctor"
    },
    {          // options
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  console.log("✅ Doctor profile updated/created successfully!");
  mongoose.disconnect();
};

seedDoctor().catch(err => console.error("❌ Seeding failed:", err));
