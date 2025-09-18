const AuditLog = require('../models/AuditLog');

class AuditService {
  static async logAction({
    action,
    performedBy,
    targetId = null,
    targetModel = null,
    details = {},
    ipAddress,
    userAgent,
    status = 'SUCCESS',
    errorMessage = null,
    metadata = {}
  }) {
    try {
      const auditLog = new AuditLog({
        action,
        performedBy,
        targetId,
        targetModel,
        details,
        ipAddress,
        userAgent,
        status,
        errorMessage,
        metadata
      });

      await auditLog.save();
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 AUDIT: ${action} by ${performedBy} - ${status}`);
      }

      return auditLog;
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw error to avoid breaking main functionality
      return null;
    }
  }

  static async getAuditLogs({
    action = null,
    performedBy = null,
    targetId = null,
    targetModel = null,
    startDate = null,
    endDate = null,
    status = null,
    page = 1,
    limit = 50
  }) {
    try {
      const filter = {};

      if (action) filter.action = action;
      if (performedBy) filter.performedBy = performedBy;
      if (targetId) filter.targetId = targetId;
      if (targetModel) filter.targetModel = targetModel;
      if (status) filter.status = status;

      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate('performedBy', 'name role')
          .populate('targetId', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(filter)
      ]);

      return {
        logs: logs.map(log => ({
          ...log,
          actionDescription: this.getActionDescription(log.action)
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }
  }

  static getActionDescription(action) {
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
    return descriptions[action] || action;
  }

  static async getAuditStats() {
    try {
      const stats = await AuditLog.aggregate([
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            lastPerformed: { $max: '$createdAt' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const totalActions = await AuditLog.countDocuments();
      const todayActions = await AuditLog.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      });

      return {
        totalActions,
        todayActions,
        actionBreakdown: stats
      };
    } catch (error) {
      console.error('Failed to get audit stats:', error);
      throw error;
    }
  }

  static async getRecentActivity(limit = 10) {
    try {
      const recentLogs = await AuditLog.find()
        .populate('performedBy', 'name role')
        .populate('targetId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return recentLogs.map(log => ({
        ...log,
        actionDescription: this.getActionDescription(log.action)
      }));
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      throw error;
    }
  }
}

module.exports = AuditService;
