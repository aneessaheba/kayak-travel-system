const UserModel = require('../models/userModel');
const { 
  createUserSchema, 
  updateUserSchema, 
  readUserSchema, 
  deleteUserSchema 
} = require('../validators/userValidator');

/**
 * User Controller - Handles HTTP requests and responses
 * Validates input, calls UserModel, formats responses
 */

const UserController = {

  /**
   * Create new user
   * POST /api/users
   * Body: { user_id, first_name, last_name, email, password, ... }
   */
  async createUser(req, res, next) {
    try {
      // Validate request body
      const { error, value } = createUserSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: error.details[0].message
        });
      }

      // Create user
      const user = await UserModel.createUser(value);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });

    } catch (error) {
      // Handle duplicate user errors
      if (error.message.startsWith('duplicate_user')) {
        return res.status(409).json({
          success: false,
          error: 'duplicate_user',
          message: 'User with this ID already exists'
        });
      }
      
      if (error.message.startsWith('duplicate_email')) {
        return res.status(409).json({
          success: false,
          error: 'duplicate_email',
          message: 'Email already registered'
        });
      }

      next(error);
    }
  },

  /**
   * Get user by ID
   * GET /api/users/:user_id
   */
  async getUserById(req, res, next) {
    try {
      const { user_id } = req.params;

      // Validate user_id format
      const { error } = readUserSchema.validate({ user_id });
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: error.details[0].message
        });
      }

      const user = await UserModel.getUserById(user_id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user by email
   * GET /api/users/email/:email
   */
  async getUserByEmail(req, res, next) {
    try {
      const { email } = req.params;

      // Validate email format
      const { error } = readUserSchema.validate({ email });
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: error.details[0].message
        });
      }

      const user = await UserModel.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user
   * PUT /api/users/:user_id
   * Body: { first_name?, last_name?, email?, ... }
   */
  async updateUser(req, res, next) {
    try {
      const { user_id } = req.params;
      const updateData = { ...req.body, user_id };

      // Validate update data
      const { error, value } = updateUserSchema.validate(updateData);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: error.details[0].message
        });
      }

      // Remove user_id from update data (don't update primary key)
      delete value.user_id;

      const user = await UserModel.updateUser(user_id, value);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user
      });

    } catch (error) {
      if (error.message.startsWith('user_not_found')) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      if (error.message.startsWith('duplicate_email')) {
        return res.status(409).json({
          success: false,
          error: 'duplicate_email',
          message: 'Email already in use'
        });
      }

      next(error);
    }
  },

  /**
   * Delete user
   * DELETE /api/users/:user_id
   */
  async deleteUser(req, res, next) {
    try {
      const { user_id } = req.params;

      // Validate user_id format
      const { error } = deleteUserSchema.validate({ user_id });
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: error.details[0].message
        });
      }

      await UserModel.deleteUser(user_id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      if (error.message.startsWith('user_not_found')) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      next(error);
    }
  },

  /**
   * Login user (verify credentials)
   * POST /api/users/login
   * Body: { email, password }
   */
  async loginUser(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'Email and password are required'
        });
      }

      const user = await UserModel.verifyPassword(email, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'invalid_credentials',
          message: 'Invalid email or password'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: user
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all users (for admin/testing)
   * GET /api/users?limit=100&offset=0
   */
  async getAllUsers(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;

      const users = await UserModel.getAllUsers(limit, offset);
      const totalCount = await UserModel.getUserCount();

      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  async getUserStats(req, res, next) {
    try {
      const totalUsers = await UserModel.getUserCount();

      res.status(200).json({
        success: true,
        data: {
          totalUsers
        }
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload profile image
   * POST /api/users/:user_id/upload-image
   * Body: multipart/form-data with 'image' field
   */
  async uploadProfileImage(req, res, next) {
    try {
      const { user_id } = req.params;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'No image file provided'
        });
      }

      // Validate user exists
      const user = await UserModel.getUserById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'User not found'
        });
      }

      // Generate image URL (relative path)
      const imageUrl = `/uploads/users/${req.file.filename}`;

      // Update user's profile_image in database
      const updatedUser = await UserModel.updateUser(user_id, {
        profile_image: imageUrl
      });

      res.status(200).json({
        success: true,
        message: 'Profile image uploaded successfully',
        data: {
          image_url: imageUrl,
          user: updatedUser
        }
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = UserController;