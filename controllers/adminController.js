const Doctor = require('../models/doctorModel');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const AuditService = require('../services/auditService');

const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      auditStats,
      recentActivity,
      systemHealth
    ] = await Promise.all([
      Doctor.countDocuments(),
      Patient.countDocuments(),
      Appointment.countDocuments(),
      AuditService.getAuditStats(),
      AuditService.getRecentActivity(10),
      getSystemHealth()
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todayAppointments,
      todayPatients,
      todayLogins
    ] = await Promise.all([
      Appointment.countDocuments({
        date: { $gte: today, $lt: tomorrow }
      }),
      Patient.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      AuditService.getAuditLogs({
        action: 'LOGIN',
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        status: 'SUCCESS'
      })
    ]);

    // Get monthly trends
    const monthlyStats = await getMonthlyStats();

    // Get doctor performance
    const doctorPerformance = await getDoctorPerformance();

    // Get appointment analytics
    const appointmentAnalytics = await getAppointmentAnalytics();

    res.json({
      success: true,
      data: {
        overview: {
          totalDoctors,
          totalPatients,
          totalAppointments,
          todayAppointments,
          todayPatients,
          todayLogins: todayLogins.logs.length
        },
        auditStats,
        recentActivity,
        systemHealth,
        monthlyStats,
        doctorPerformance,
        appointmentAnalytics
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard'
    });
  }
};

const getSystemHealth = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Check recent activity
    const recentLogins = await AuditService.getAuditLogs({
      action: 'LOGIN',
      startDate: oneHourAgo.toISOString(),
      status: 'SUCCESS'
    });

    const recentErrors = await AuditService.getAuditLogs({
      startDate: oneHourAgo.toISOString(),
      status: 'FAILED'
    });

    // Calculate system health score
    const totalActions = recentLogins.logs.length + recentErrors.logs.length;
    const errorRate = totalActions > 0 ? (recentErrors.logs.length / totalActions) * 100 : 0;
    
    let healthStatus = 'healthy';
    if (errorRate > 10) healthStatus = 'warning';
    if (errorRate > 25) healthStatus = 'critical';

    return {
      status: healthStatus,
      errorRate: Math.round(errorRate * 100) / 100,
      recentActivity: totalActions,
      lastChecked: now.toISOString()
    };
  } catch (error) {
    console.error('System health check error:', error);
    return {
      status: 'unknown',
      errorRate: 0,
      recentActivity: 0,
      lastChecked: new Date().toISOString()
    };
  }
};

const getMonthlyStats = async () => {
  try {
    const now = new Date();
    const months = [];
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }

    const stats = await Promise.all(
      months.map(async (month) => {
        const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
        const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const [patients, appointments, logins] = await Promise.all([
          Patient.countDocuments({
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          }),
          Appointment.countDocuments({
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }),
          AuditService.getAuditLogs({
            action: 'LOGIN',
            startDate: startOfMonth.toISOString(),
            endDate: endOfMonth.toISOString(),
            status: 'SUCCESS'
          })
        ]);

        return {
          month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          patients,
          appointments,
          logins: logins.logs.length
        };
      })
    );

    return stats;
  } catch (error) {
    console.error('Monthly stats error:', error);
    return [];
  }
};

const getDoctorPerformance = async () => {
  try {
    const doctors = await Doctor.find().select('name specialization');
    const appointments = await Appointment.find()
      .populate('doctor', 'name')
      .populate('patient', 'name');

    const performance = doctors.map(doctor => {
      const doctorAppointments = appointments.filter(apt => 
        apt.doctor && apt.doctor._id.toString() === doctor._id.toString()
      );

      const completed = doctorAppointments.filter(apt => apt.status === 'Completed').length;
      const total = doctorAppointments.length;
      const completionRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        doctorId: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        totalAppointments: total,
        completedAppointments: completed,
        completionRate: Math.round(completionRate * 100) / 100
      };
    });

    return performance.sort((a, b) => b.completionRate - a.completionRate);
  } catch (error) {
    console.error('Doctor performance error:', error);
    return [];
  }
};

const getAppointmentAnalytics = async () => {
  try {
    const appointments = await Appointment.find();
    
    const typeStats = {};
    const statusStats = {};
    const hourlyStats = {};

    appointments.forEach(apt => {
      // Type statistics
      typeStats[apt.type] = (typeStats[apt.type] || 0) + 1;
      
      // Status statistics
      statusStats[apt.status] = (statusStats[apt.status] || 0) + 1;
      
      // Hourly statistics
      const hour = apt.time.split(':')[0];
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });

    return {
      typeStats,
      statusStats,
      hourlyStats,
      totalAppointments: appointments.length
    };
  } catch (error) {
    console.error('Appointment analytics error:', error);
    return {
      typeStats: {},
      statusStats: {},
      hourlyStats: {},
      totalAppointments: 0
    };
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const {
      action,
      performedBy,
      targetId,
      targetModel,
      startDate,
      endDate,
      status,
      page = 1,
      limit = 50
    } = req.query;

    const logs = await AuditService.getAuditLogs({
      action,
      performedBy,
      targetId,
      targetModel,
      startDate,
      endDate,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs'
    });
  }
};

module.exports = {
  getAdminDashboard,
  getAuditLogs
};
