const Tenant = require('../models/Tenant');
const Doctor = require('../models/doctorModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateTenantId } = require('../middlewares/tenantMiddleware');

// Register new tenant (hospital/clinic)
const registerTenant = async (req, res) => {
  try {
    const {
      name,
      type,
      email,
      phone,
      address,
      businessLicense,
      taxId,
      establishedDate,
      adminName,
      adminPhone,
      adminPassword,
      subscriptionPlan = 'free'
    } = req.body;

    // Check if tenant already exists
    const existingTenant = await Tenant.findOne({
      $or: [{ email }, { slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-') }]
    });

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: 'Hospital/Clinic with this email or name already exists'
      });
    }

    // Create tenant
    const tenant = new Tenant({
      name,
      type,
      email,
      phone,
      address,
      businessLicense,
      taxId,
      establishedDate,
      subscription: {
        plan: subscriptionPlan,
        status: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
      },
      status: 'active'
    });

    await tenant.save();

    // Create admin user for the tenant
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = new Doctor({
      name: adminName,
      phone: adminPhone,
      password: hashedPassword,
      specialization: 'Administration',
      role: 'admin',
      tenant: tenant._id,
      isSuperAdmin: false
    });

    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        tenant: tenant._id,
        role: admin.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' }
    );

    res.status(201).json({
      success: true,
      message: 'Hospital/Clinic registered successfully',
      data: {
        tenant: {
          id: tenant._id,
          name: tenant.name,
          slug: tenant.slug,
          type: tenant.type,
          subscription: tenant.subscription
        },
        admin: {
          id: admin._id,
          name: admin.name,
          role: admin.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Tenant registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register hospital/clinic'
    });
  }
};

// Get tenant configuration
const getTenantConfig = async (req, res) => {
  try {
    const tenant = req.tenant;
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      data: tenant.getConfig()
    });
  } catch (error) {
    console.error('Get tenant config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant configuration'
    });
  }
};

// Update tenant configuration
const updateTenantConfig = async (req, res) => {
  try {
    const tenant = req.tenant;
    const updates = req.body;

    // Only allow certain fields to be updated
    const allowedUpdates = [
      'name', 'logo', 'favicon', 'primaryColor', 'secondaryColor', 
      'customCSS', 'settings', 'address', 'phone'
    ];

    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    const updatedTenant = await Tenant.findByIdAndUpdate(
      tenant._id,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Tenant configuration updated successfully',
      data: updatedTenant.getConfig()
    });
  } catch (error) {
    console.error('Update tenant config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant configuration'
    });
  }
};

// Get tenant statistics
const getTenantStats = async (req, res) => {
  try {
    const tenant = req.tenant;
    
    const [doctors, patients, appointments] = await Promise.all([
      Doctor.countDocuments({ tenant: tenant._id }),
      require('../models/Patient').countDocuments({ tenant: tenant._id }),
      require('../models/Appointment').countDocuments({ tenant: tenant._id })
    ]);

    const stats = {
      doctors,
      patients,
      appointments,
      subscription: {
        plan: tenant.subscription.plan,
        status: tenant.subscription.status,
        maxUsers: tenant.subscription.maxUsers,
        maxPatients: tenant.subscription.maxPatients,
        usedUsers: doctors,
        usedPatients: patients
      },
      features: tenant.features
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get tenant stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get tenant statistics'
    });
  }
};

// List all tenants (super admin only)
const listTenants = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      Tenant.find(filter)
        .select('-customCSS')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Tenant.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        tenants,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('List tenants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list tenants'
    });
  }
};

// Update tenant status (super admin only)
const updateTenantStatus = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { status } = req.body;

    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { status },
      { new: true }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found'
      });
    }

    res.json({
      success: true,
      message: 'Tenant status updated successfully',
      data: tenant
    });
  } catch (error) {
    console.error('Update tenant status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tenant status'
    });
  }
};

module.exports = {
  registerTenant,
  getTenantConfig,
  updateTenantConfig,
  getTenantStats,
  listTenants,
  updateTenantStatus
};
