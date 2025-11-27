const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

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

// Get all users (with pagination)
// GET /api/users?limit=100&offset=0
router.get('/', UserController.getAllUsers);

// Get user statistics
// GET /api/users/stats
router.get('/stats', UserController.getUserStats);

// Get user by email
// GET /api/users/email/:email
router.get('/email/:email', UserController.getUserByEmail);

// Get user by ID
// GET /api/users/:user_id
router.get('/:user_id', UserController.getUserById);

// Update user
// PUT /api/users/:user_id
// Body: { first_name?, last_name?, email?, password?, address?, city?, state?, zip_code?, phone_number?, profile_image? }
router.put('/:user_id', UserController.updateUser);

// Delete user
// DELETE /api/users/:user_id
router.delete('/:user_id', UserController.deleteUser);

module.exports = router;