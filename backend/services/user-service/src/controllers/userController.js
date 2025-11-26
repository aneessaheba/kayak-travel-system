const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      email,
      password
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or ID already exists'
      });
    }

    // Create new user
    const user = new User({
      userId,
      firstName,
      lastName,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = user.toJSON();
    
    // Ensure nested objects are always present, even if empty
    if (!userData.emergencyContact) {
      userData.emergencyContact = {
        name: '',
        phone: '',
        relationship: ''
      };
    }
    
    if (!userData.travelPreferences) {
      userData.travelPreferences = {
        passportNumber: '',
        frequentFlyerNumber: '',
        seatPreference: 'No Preference',
        mealPreference: 'No Preference'
      };
    }

    console.log('Returning user data:', JSON.stringify(userData, null, 2));
    console.log('Emergency Contact:', userData.emergencyContact);
    console.log('Travel Preferences:', userData.travelPreferences);

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Get user by email
exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Get all users (for admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 1000, search } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { email: new RegExp(search, 'i') },
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { userId: new RegExp(search, 'i') }
      ];
    }
    
    const skip = (page - 1) * limit;
    const users = await User.find(query).select('-password').skip(skip).limit(Number(limit));
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users.map(user => user.toJSON()),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Don't allow password update through this endpoint
    delete updateData.password;
    delete updateData.userId; // Don't allow changing user ID

    // Validate that the user ID is a valid MongoDB ObjectId
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Optional: Verify that the user making the request owns this account
    // (req.userId is set by auth middleware from JWT token)
    if (req.userId && req.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    // Handle nested objects - MongoDB can handle nested objects directly with $set
    // But we need to ensure the structure matches the schema
    const updateQuery = {};
    
    // Handle top-level fields - skip empty strings for enum fields
    Object.keys(updateData).forEach(key => {
      if (key !== 'emergencyContact' && key !== 'travelPreferences' && key !== '_id' && key !== '__v') {
        // For gender, if it's empty string, don't include it (or set to undefined to keep default)
        if (key === 'gender' && updateData[key] === '') {
          // Skip empty gender - let it use default
        } else {
          updateQuery[key] = updateData[key];
        }
      }
    });
    
    // Handle nested emergencyContact object - set the entire object
    if (updateData.emergencyContact) {
      updateQuery['emergencyContact'] = {
        name: updateData.emergencyContact.name || '',
        phone: updateData.emergencyContact.phone || '',
        relationship: updateData.emergencyContact.relationship || '',
      };
    }
    
    // Handle nested travelPreferences object - set the entire object
    if (updateData.travelPreferences) {
      updateQuery['travelPreferences'] = {
        passportNumber: updateData.travelPreferences.passportNumber || '',
        frequentFlyerNumber: updateData.travelPreferences.frequentFlyerNumber || '',
        seatPreference: updateData.travelPreferences.seatPreference || 'No Preference',
        mealPreference: updateData.travelPreferences.mealPreference || 'No Preference',
      };
    }

    console.log('Update query:', JSON.stringify(updateQuery, null, 2));
    console.log('Original updateData:', JSON.stringify(updateData, null, 2));

    // Use runValidators: false for now to avoid enum validation issues with empty strings
    // We'll validate manually if needed
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateQuery },
      { new: true, runValidators: false }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = user.toJSON();
    
    // Ensure nested objects are always present, even if empty
    if (!updatedUser.emergencyContact) {
      updatedUser.emergencyContact = {
        name: '',
        phone: '',
        relationship: ''
      };
    }
    
    if (!updatedUser.travelPreferences) {
      updatedUser.travelPreferences = {
        passportNumber: '',
        frequentFlyerNumber: '',
        seatPreference: 'No Preference',
        mealPreference: 'No Preference'
      };
    }
    
    console.log('Updated user from DB:', JSON.stringify(updatedUser, null, 2));
    console.log('Updated user emergencyContact:', updatedUser.emergencyContact);
    console.log('Updated user travelPreferences:', updatedUser.travelPreferences);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// Add booking to history
exports.addBooking = async (req, res) => {
  try {
    const userId = req.params.id;
    const booking = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { bookingHistory: booking } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking added to history',
      data: user.bookingHistory[user.bookingHistory.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding booking',
      error: error.message
    });
  }
};

// Get booking history
exports.getBookingHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const { status } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let bookings = user.bookingHistory;
    if (status) {
      bookings = bookings.filter(booking => booking.status === status);
    }

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching booking history',
      error: error.message
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const userId = req.params.id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find booking by bookingId (string) or _id
    const booking = user.bookingHistory.find(
      b => b.bookingId === bookingId || b._id.toString() === bookingId
    );
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only allow cancellation of upcoming/confirmed bookings
    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === 'past' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    booking.status = 'cancelled';
    await user.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
      error: error.message
    });
  }
};

// Add review
exports.addReview = async (req, res) => {
  try {
    const userId = req.params.id;
    const review = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { reviews: review } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Review added successfully',
      data: user.reviews[user.reviews.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

// Get user reviews
exports.getReviews = async (req, res) => {
  try {
    const userId = req.params.id;
    const { type } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let reviews = user.reviews;
    if (type) {
      reviews = reviews.filter(review => review.type === type);
    }

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Add favourite
exports.addFavourite = async (req, res) => {
  try {
    const userId = req.params.id;
    const { itemId, type, itemData } = req.body;

    if (!itemId || !type || !itemData) {
      return res.status(400).json({
        success: false,
        message: 'itemId, type, and itemData are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already favourited
    const existingFavourite = user.favourites.find(
      fav => fav.itemId === itemId && fav.type === type
    );

    if (existingFavourite) {
      return res.status(400).json({
        success: false,
        message: 'Item is already in favourites'
      });
    }

    // Add to favourites
    user.favourites.push({
      itemId,
      type,
      itemData,
      addedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Added to favourites successfully',
      data: user.favourites[user.favourites.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding favourite',
      error: error.message
    });
  }
};

// Remove favourite
exports.removeFavourite = async (req, res) => {
  try {
    const userId = req.params.id;
    // Support both query params and body for flexibility
    const { itemId, type } = req.query.itemId ? req.query : req.body;

    if (!itemId || !type) {
      return res.status(400).json({
        success: false,
        message: 'itemId and type are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from favourites
    user.favourites = user.favourites.filter(
      fav => !(fav.itemId === itemId && fav.type === type)
    );

    await user.save();

    res.json({
      success: true,
      message: 'Removed from favourites successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing favourite',
      error: error.message
    });
  }
};

// Get user favourites
exports.getFavourites = async (req, res) => {
  try {
    const userId = req.params.id;
    const { type } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let favourites = user.favourites;
    if (type) {
      favourites = favourites.filter(fav => fav.type === type);
    }

    res.json({
      success: true,
      data: favourites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favourites',
      error: error.message
    });
  }
};

// Get notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.params.id;
    const { read, type } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let notifications = user.notifications || [];

    // Filter by read status if provided
    if (read !== undefined) {
      const isRead = read === 'true';
      notifications = notifications.filter(n => n.read === isRead);
    }

    // Filter by type if provided
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }

    // Sort by createdAt (newest first)
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.params.id;
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'notificationId is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notification = user.notifications.find(
      n => n.notificationId === notificationId || n._id.toString() === notificationId
    );
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await user.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.notifications.forEach(notification => {
      notification.read = true;
    });

    await user.save();

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.params.id;
    const { notificationId } = req.query.notificationId ? req.query : req.body;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'notificationId is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.notifications = user.notifications.filter(
      n => n.notificationId !== notificationId && n._id.toString() !== notificationId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message
    });
  }
};

// Create notification (for system use - can be called when booking is created, etc.)
exports.createNotification = async (req, res) => {
  try {
    const userId = req.params.id;
    const { type, title, message, relatedId, relatedType } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'type, title, and message are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const notification = {
      notificationId,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      relatedId: relatedId || '',
      relatedType: relatedType || ''
    };

    user.notifications.push(notification);
    await user.save();

    res.json({
      success: true,
      message: 'Notification created successfully',
      data: user.notifications[user.notifications.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating notification',
      error: error.message
    });
  }
};

