const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorId: { 
    type: String, 
    unique: true, 
    required: true,
    default: function() {
      // Generate unique doctor ID: DOC + timestamp + random 3 digits
      return 'DOC' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    }
  },
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    match: /^[0-9]{10}$/
  },
  email: { 
    type: String, 
    required: false, // Made optional
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6
  },
  specialization: { 
    type: String, 
    required: true,
    enum: [
      'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology',
      'Gynecology', 'General Medicine', 'Surgery', 'Psychiatry', 'Radiology',
      'Anesthesiology', 'Emergency Medicine', 'Internal Medicine', 'Oncology',
      'Ophthalmology', 'ENT', 'Urology', 'Gastroenterology', 'Endocrinology',
      'Pulmonology', 'Nephrology', 'Rheumatology', 'Hematology', 'Infectious Disease'
    ]
  },
  qualification: { 
    type: String, 
    required: false,
    trim: true,
    maxlength: 200
  },
  experience: { 
    type: Number, 
    required: true,
    min: 0,
    max: 50
  },
  consultationFee: { 
    type: Number, 
    required: true,
    min: 0
  },
  availableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  status: { 
    type: String, 
    enum: ['active', 'pending', 'inactive'], 
    default: 'pending' 
  },
  rating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  patients: { 
    type: Number, 
    default: 0,
    min: 0
  },
  tenantId: { 
    type: String, 
    required: false, // Made optional for development
    default: 'default-tenant'
  },
  createdBy: { 
    type: String, 
    required: false, // Made optional for development
    default: 'system'
  }
}, { 
  timestamps: true,
  collection: 'newflow_doctors' // Separate collection for NewFlow doctors
});

// Indexes for better performance
doctorSchema.index({ doctorId: 1 });
doctorSchema.index({ phone: 1 });
doctorSchema.index({ email: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ status: 1 });
doctorSchema.index({ tenantId: 1 });

const Doctor = mongoose.model('NewFlowDoctor', doctorSchema);

module.exports = Doctor;
