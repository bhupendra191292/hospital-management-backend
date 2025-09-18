const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/
  },
  type: {
    type: String,
    enum: ['hospital', 'clinic', 'medical_center', 'pharmacy', 'laboratory'],
    default: 'hospital'
  },
  
  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Branding & Customization
  logo: {
    url: String,
    alt: String
  },
  favicon: {
    url: String
  },
  primaryColor: {
    type: String,
    default: '#2563eb',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  secondaryColor: {
    type: String,
    default: '#059669',
    match: /^#[0-9A-Fa-f]{6}$/
  },
  customCSS: String,
  
  // Business Information
  businessLicense: String,
  taxId: String,
  registrationNumber: String,
  establishedDate: Date,
  
  // Features & Settings
  features: {
    appointments: { type: Boolean, default: true },
    patientManagement: { type: Boolean, default: true },
    medicalRecords: { type: Boolean, default: true },
    billing: { type: Boolean, default: false },
    inventory: { type: Boolean, default: false },
    labReports: { type: Boolean, default: false },
    pharmacy: { type: Boolean, default: false },
    telemedicine: { type: Boolean, default: false },
    analytics: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    auditLogs: { type: Boolean, default: true }
  },
  
  // Subscription & Billing
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled'],
      default: 'trial'
    },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    maxUsers: { type: Number, default: 5 },
    maxPatients: { type: Number, default: 1000 },
    maxStorage: { type: Number, default: 1024 }, // MB
    customDomain: String
  },
  
  // System Settings
  settings: {
    timezone: { type: String, default: 'UTC' },
    dateFormat: { type: String, default: 'MM/DD/YYYY' },
    timeFormat: { type: String, default: '12h' },
    language: { type: String, default: 'en' },
    currency: { type: String, default: 'USD' },
    workingHours: {
      monday: { start: String, end: String, closed: { type: Boolean, default: false } },
      tuesday: { start: String, end: String, closed: { type: Boolean, default: false } },
      wednesday: { start: String, end: String, closed: { type: Boolean, default: false } },
      thursday: { start: String, end: String, closed: { type: Boolean, default: false } },
      friday: { start: String, end: String, closed: { type: Boolean, default: false } },
      saturday: { start: String, end: String, closed: { type: Boolean, default: true } },
      sunday: { start: String, end: String, closed: { type: Boolean, default: true } }
    },
    appointmentDuration: { type: Number, default: 30 }, // minutes
    autoConfirmAppointments: { type: Boolean, default: false },
    sendSMSNotifications: { type: Boolean, default: false },
    sendEmailNotifications: { type: Boolean, default: true },
    requirePatientConsent: { type: Boolean, default: true }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient querying
tenantSchema.index({ slug: 1 });
tenantSchema.index({ email: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'subscription.status': 1 });
tenantSchema.index({ createdAt: -1 });

// Virtual for full address
tenantSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country];
  return parts.filter(Boolean).join(', ');
});

// Virtual for subscription status
tenantSchema.virtual('isActive').get(function() {
  return this.status === 'active' && 
         ['active', 'trial'].includes(this.subscription.status) &&
         (!this.subscription.endDate || this.subscription.endDate > new Date());
});

// Method to get tenant configuration
tenantSchema.methods.getConfig = function() {
  return {
    id: this._id,
    name: this.name,
    slug: this.slug,
    type: this.type,
    logo: this.logo,
    favicon: this.favicon,
    primaryColor: this.primaryColor,
    secondaryColor: this.secondaryColor,
    customCSS: this.customCSS,
    features: this.features,
    settings: this.settings,
    subscription: {
      plan: this.subscription.plan,
      status: this.subscription.status,
      maxUsers: this.subscription.maxUsers,
      maxPatients: this.subscription.maxPatients,
      customDomain: this.subscription.customDomain
    }
  };
};

// Pre-save middleware to generate slug if not provided
tenantSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Tenant', tenantSchema);
