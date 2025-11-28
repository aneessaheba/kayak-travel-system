const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { getCollection } = require('../config/mongodb');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Get admin from database to ensure they still exist and are active
    const adminsCollection = getCollection('admin', 'admins');
    const admin = await adminsCollection.findOne({ 
      adminId: decoded.adminId,
      isActive: true 
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found or inactive.'
      });
    }

    // Attach admin info to request object
    req.admin = {
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      providerType: admin.providerType,
      providerName: admin.providerName,
      firstName: admin.firstName,
      lastName: admin.lastName
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.'
    });
  }
};

// Check if user is Kayak Admin (super admin)
const isKayakAdmin = (req, res, next) => {
  if (req.admin.role !== 'kayak_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Kayak admin privileges required.'
    });
  }
  next();
};

// Check if user is Provider Admin
const isProviderAdmin = (req, res, next) => {
  if (req.admin.role !== 'provider_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Provider admin privileges required.'
    });
  }
  next();
};

// Check if user is either Kayak Admin or Provider Admin (any admin)
const isAdmin = (req, res, next) => {
  if (!['kayak_admin', 'provider_admin'].includes(req.admin.role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if provider admin is accessing their own data
const checkProviderAccess = (providerType) => {
  return (req, res, next) => {
    // Kayak admin can access everything
    if (req.admin.role === 'kayak_admin') {
      return next();
    }

    // Provider admin must match the provider type
    if (req.admin.role === 'provider_admin') {
      if (req.admin.providerType !== providerType) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This endpoint is for ${providerType} providers only.`
        });
      }
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });
  };
};

// Apply filter based on admin role
// This function helps filter queries based on admin role
const applyProviderFilter = (req, providerType, providerFieldName) => {
  // If Kayak admin, no filter needed (can see all)
  if (req.admin.role === 'kayak_admin') {
    return {};
  }

  // If provider admin, filter by their provider
  if (req.admin.role === 'provider_admin' && req.admin.providerType === providerType) {
    return { [providerFieldName]: req.admin.providerName };
  }

  // No match - return impossible filter
  return { _id: null };
};

module.exports = {
  verifyToken,
  isKayakAdmin,
  isProviderAdmin,
  isAdmin,
  checkProviderAccess,
  applyProviderFilter
};