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

const seedAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const phone = "9999999999";
  const hashed = await bcrypt.hash('Admin@123', 10);
  
  const admin = await Doctor.findOneAndUpdate(
    { phone }, // search criteria
    {          // update data
      name: "Admin User",
      phone,
      password: hashed,
      specialization: "Administration",
      role: "admin"
    },
    {          // options
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  console.log("✅ Admin user created/updated successfully!");
  console.log("📧 Phone: 9999999999");
  console.log("🔑 Password: Admin@123");
  mongoose.disconnect();
};

seedAdmin().catch(err => console.error("❌ Admin seeding failed:", err));
