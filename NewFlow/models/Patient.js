const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  uhid: {
    type: String,
    required: [true, 'UHID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Contact Information
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^(\+91|91)?[6-9]\d{9}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please provide a valid Indian mobile number'
    }
  },
  
  emergencyContact: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^(\+91|91)?[6-9]\d{9}$/.test(v.replace(/\s/g, ''));
      },
      message: 'Please provide a valid Indian mobile number for emergency contact'
    }
  },
  
  // Address Information
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  
  city: {
    type: String,
    trim: true,
    maxlength: [50, 'City name cannot exceed 50 characters']
  },
  
  state: {
    type: String,
    trim: true,
    maxlength: [50, 'State name cannot exceed 50 characters']
  },
  
  pincode: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[1-9][0-9]{5}$/.test(v);
      },
      message: 'Please provide a valid 6-digit pincode'
    }
  },
  
  // Personal Information
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
    default: ''
  },
  
  occupation: {
    type: String,
    trim: true,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other', ''],
    default: ''
  },
  
  // Family Relationship Information
  isFamilyMember: {
    type: Boolean,
    default: false
  },
  
  familyHeadName: {
    type: String,
    trim: true,
    maxlength: [100, 'Family head name cannot exceed 100 characters']
  },
  
  familyHeadUHID: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]{2,4}\d{0,2}-\d{6}-\d{4}$/.test(v);
      },
      message: 'Please provide a valid family head UHID'
    }
  },
  
  relationshipToHead: {
    type: String,
    enum: ['Child', 'Spouse', 'Parent', 'Sibling', 'Grandchild', 'Grandparent', 'Other', ''],
    default: ''
  },
  
  // System Information
  tenantId: {
    type: String,
    required: false,
    default: 'default-tenant'
  },
  
  createdBy: {
    type: String,
    required: false,
    default: 'system'
  },
  
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Deceased'],
    default: 'Active'
  },
  
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Additional Notes
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
patientSchema.index({ uhid: 1 });
patientSchema.index({ mobile: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ tenantId: 1 });
patientSchema.index({ familyHeadUHID: 1 });
patientSchema.index({ name: 1, mobile: 1 });
patientSchema.index({ registrationDate: -1 });
patientSchema.index({ bloodGroup: 1 });

// Virtual for age calculation
patientSchema.virtual('calculatedAge').get(function() {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  return this.age;
});

// Pre-save middleware to calculate age if dateOfBirth is provided
patientSchema.pre('save', function(next) {
  if (this.dateOfBirth && !this.age) {
    this.age = this.calculatedAge;
  }
  this.lastUpdated = new Date();
  next();
});

// Static method to find duplicates
patientSchema.statics.findDuplicates = function(patientData, tenantId, excludeId = null) {
  const query = {
    tenantId: tenantId,
    $or: []
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  // Check for exact name + mobile combination
  if (patientData.name && patientData.mobile) {
    query.$or.push({
      name: { $regex: new RegExp(`^${patientData.name.trim()}$`, 'i') },
      mobile: patientData.mobile.replace(/\s/g, '')
    });
  }
  
  // Check for email duplicates (only if email is provided and not a family member)
  if (patientData.email && !patientData.isFamilyMember) {
    query.$or.push({
      email: patientData.email.trim().toLowerCase()
    });
  }
  
  // Check for mobile duplicates (only if not a family member)
  if (patientData.mobile && !patientData.isFamilyMember) {
    query.$or.push({
      mobile: patientData.mobile.replace(/\s/g, '')
    });
  }
  
  return this.find(query);
};

// Static method to generate UHID
patientSchema.statics.generateUHID = function(tenantCode = 'DELH01') {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `${tenantCode}-${year}${month}${day}-${randomNum}`;
};

// Instance method to get family members
patientSchema.methods.getFamilyMembers = function() {
  return this.constructor.find({
    tenantId: this.tenantId,
    $or: [
      { familyHeadUHID: this.uhid },
      { uhid: this.familyHeadUHID }
    ]
  });
};

module.exports = mongoose.model('NewFlowPatient', patientSchema);
