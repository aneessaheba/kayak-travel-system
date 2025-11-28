const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current admin profile
 * @access  Private (requires valid JWT token)
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * @route   POST /api/auth/logout
 * @desc    Admin logout (mainly for logging purposes, client handles token removal)
 * @access  Private
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change admin password
 * @access  Private
 */
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;