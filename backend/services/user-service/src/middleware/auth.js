const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token (accepts both user and admin tokens)
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      // Accept both user tokens (with userId) and admin tokens (with adminId)
      if (decoded.userId) {
        req.userId = decoded.userId;
      } else if (decoded.adminId) {
        // Admin token - allow admin operations
        req.userId = decoded.adminId; // Set userId for compatibility, but mark as admin
        req.isAdmin = true;
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error authenticating user',
      error: error.message
    });
  }
};

// Optional: Get user from token (doesn't require auth)
exports.getUserFromToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
      } catch (error) {
        // Token invalid, but continue without user
      }
    }
    next();
  } catch (error) {
    next();
  }
};

