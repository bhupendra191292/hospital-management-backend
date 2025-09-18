const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE_DOCTOR',
      'UPDATE_DOCTOR',
      'DELETE_DOCTOR',
      'PROMOTE_DOCTOR',
      'CREATE_PATIENT',
      'UPDATE_PATIENT',
      'DELETE_PATIENT',
      'CREATE_APPOINTMENT',
      'UPDATE_APPOINTMENT',
      'DELETE_APPOINTMENT',
      'LOGIN',
      'LOGOUT',
      'PASSWORD_CHANGE',
      'ROLE_CHANGE',
      'BULK_OPERATION',
      'SYSTEM_CONFIG',
      'DATA_EXPORT',
      'DATA_IMPORT'
    ]
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    enum: ['Doctor', 'Patient', 'Appointment', 'System']
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING'],
    default: 'SUCCESS'
  },
  errorMessage: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1, targetModel: 1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ status: 1, createdAt: -1 });

// Virtual for readable action description
auditLogSchema.virtual('actionDescription').get(function() {
  const descriptions = {
    'CREATE_DOCTOR': 'Created new doctor account',
    'UPDATE_DOCTOR': 'Updated doctor information',
    'DELETE_DOCTOR': 'Deleted doctor account',
    'PROMOTE_DOCTOR': 'Promoted doctor to admin',
    'CREATE_PATIENT': 'Created new patient record',
    'UPDATE_PATIENT': 'Updated patient information',
    'DELETE_PATIENT': 'Deleted patient record',
    'CREATE_APPOINTMENT': 'Created new appointment',
    'UPDATE_APPOINTMENT': 'Updated appointment details',
    'DELETE_APPOINTMENT': 'Deleted appointment',
    'LOGIN': 'User logged in',
    'LOGOUT': 'User logged out',
    'PASSWORD_CHANGE': 'Password changed',
    'ROLE_CHANGE': 'User role changed',
    'BULK_OPERATION': 'Bulk operation performed',
    'SYSTEM_CONFIG': 'System configuration changed',
    'DATA_EXPORT': 'Data exported',
    'DATA_IMPORT': 'Data imported'
  };
  return descriptions[this.action] || this.action;
});

// Method to get formatted log entry
auditLogSchema.methods.getFormattedLog = function() {
  return {
    id: this._id,
    action: this.action,
    actionDescription: this.actionDescription,
    performedBy: this.performedBy,
    targetId: this.targetId,
    targetModel: this.targetModel,
    details: this.details,
    ipAddress: this.ipAddress,
    userAgent: this.userAgent,
    status: this.status,
    errorMessage: this.errorMessage,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
