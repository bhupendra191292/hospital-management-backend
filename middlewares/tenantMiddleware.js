const Tenant = require('../models/Tenant');

// Get tenant from subdomain or custom domain
const getTenantFromRequest = async (req) => {
  const host = req.get('host');
  const subdomain = host.split('.')[0];
  
  // Check for custom domain first
  let tenant = await Tenant.findOne({ 
    'subscription.customDomain': host,
    status: 'active'
  });
  
  if (!tenant) {
    // Check for subdomain
    tenant = await Tenant.findOne({ 
      slug: subdomain,
      status: 'active'
    });
  }
  
  return tenant;
};

// Middleware to resolve tenant
const resolveTenant = async (req, res, next) => {
  try {
    const tenant = await getTenantFromRequest(req);
    
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found or inactive'
      });
    }
    
    // Check if tenant subscription is active
    if (!tenant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tenant subscription expired or inactive'
      });
    }
    
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Tenant resolution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving tenant'
    });
  }
};

// Middleware to check tenant feature access
const checkFeatureAccess = (feature) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(500).json({
        success: false,
        message: 'Tenant not resolved'
      });
    }
    
    if (!req.tenant.features[feature]) {
      return res.status(403).json({
        success: false,
        message: `Feature '${feature}' is not available for this tenant`
      });
    }
    
    next();
  };
};

// Middleware to check tenant limits
const checkTenantLimits = async (req, res, next) => {
  try {
    const tenant = req.tenant;
    
    // Check user limit
    const userCount = await require('../models/doctorModel').countDocuments({ tenant: tenant._id });
    if (userCount >= tenant.subscription.maxUsers) {
      return res.status(403).json({
        success: false,
        message: 'User limit reached for this subscription plan'
      });
    }
    
    // Check patient limit
    const patientCount = await require('../models/Patient').countDocuments({ tenant: tenant._id });
    if (patientCount >= tenant.subscription.maxPatients) {
      return res.status(403).json({
        success: false,
        message: 'Patient limit reached for this subscription plan'
      });
    }
    
    next();
  } catch (error) {
    console.error('Tenant limit check error:', error);
    next();
  }
};

// Middleware to add tenant filter to queries
const addTenantFilter = (req, res, next) => {
  if (req.tenant) {
    req.tenantFilter = { tenant: req.tenant._id };
  }
  next();
};

// Helper to generate tenant-specific IDs
const generateTenantId = (prefix, tenantId) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${prefix}-${tenantId.toString().slice(-6)}-${timestamp}-${random}`.toUpperCase();
};

module.exports = {
  resolveTenant,
  checkFeatureAccess,
  checkTenantLimits,
  addTenantFilter,
  generateTenantId,
  getTenantFromRequest
};
