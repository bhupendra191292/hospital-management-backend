const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Basic notification info
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  type: {
    type: String,
    required: true,
    enum: ['success', 'error', 'warning', 'info', 'appointment', 'medical', 'system'],
    default: 'info'
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Recipient information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['User', 'Doctor', 'Patient']
  },
  recipientType: {
    type: String,
    enum: ['user', 'role', 'all'],
    default: 'user'
  },
  
  // Status and timing
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  
  // Scheduling
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  
  // Additional data
  persistent: {
    type: Boolean,
    default: false
  },
  actions: [{
    label: String,
    action: String,
    url: String,
    data: mongoose.Schema.Types.Mixed
  }],
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Delivery channels
  channels: [{
    type: String,
    enum: ['in-app', 'email', 'sms', 'push'],
    default: ['in-app']
  }],
  
  // Metadata
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ tenantId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, priority: 1 });
notificationSchema.index({ scheduledAt: 1, status: 1 });
notificationSchema.index({ expiresAt: 1 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
});

// Methods
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.status = 'read';
  return this.save();
};

notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = undefined;
  this.status = 'sent';
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(recipientId, tenantId) {
  return this.countDocuments({
    recipientId,
    tenantId,
    isRead: false,
    status: { $in: ['sent', 'delivered'] }
  });
};

notificationSchema.statics.markAllAsRead = function(recipientId, tenantId) {
  return this.updateMany(
    {
      recipientId,
      tenantId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
        status: 'read'
      }
    }
  );
};

notificationSchema.statics.clearExpired = function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
