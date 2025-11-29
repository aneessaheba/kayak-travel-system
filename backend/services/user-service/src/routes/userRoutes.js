const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const upload = require('../config/upload');

/**
 * User Routes
 * Base path: /api/users
 */

// Create new user
// POST /api/users
// Body: { user_id, first_name, last_name, email, password, address, city, state, zip_code, phone_number, profile_image }
router.post('/', UserController.createUser);

// Login user
// POST /api/users/login
// Body: { email, password }
router.post('/login', UserController.loginUser);

// Upload profile image
// POST /api/users/:user_id/upload-image
// Body: multipart/form-data with 'image' field
router.post('/:user_id/upload-image', upload.single('image'), UserController.uploadProfileImage);

// Get all users (with pagination)
// GET /api/users?limit=100&offset=0
router.get('/', UserController.getAllUsers);

// Get user statistics
// GET /api/users/stats
router.get('/stats', UserController.getUserStats);

// Get user by email
// GET /api/users/email/:email
router.get('/email/:email', UserController.getUserByEmail);

// Update user (MUST be before GET /:user_id)
// PUT /api/users/:user_id
// Body: { first_name?, last_name?, email?, password?, address?, city?, state?, zip_code?, phone_number?, profile_image? }
router.put('/:user_id', UserController.updateUser);

// Delete user (MUST be before GET /:user_id)
// DELETE /api/users/:user_id
router.delete('/:user_id', UserController.deleteUser);

// Get user by ID (MUST be last among /:user_id routes)
// GET /api/users/:user_id
router.get('/:user_id', UserController.getUserById);

module.exports = router;