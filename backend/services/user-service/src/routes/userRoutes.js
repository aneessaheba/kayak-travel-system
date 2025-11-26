const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Public routes - specific routes must come before parameterized routes
router.post('/register', validateRegister, userController.register);
router.post('/login', validateLogin, userController.login);
router.get('/email/:email', userController.getUserByEmail);
// Admin route to get all users (should be protected in production)
router.get('/', userController.getAllUsers);

// Protected routes - specific routes with /:id must come before generic /:id route
// Booking history routes
router.post('/:id/bookings', authenticate, userController.addBooking);
router.get('/:id/bookings', authenticate, userController.getBookingHistory);
router.put('/:id/bookings/cancel', authenticate, userController.cancelBooking);

// Review routes
router.post('/:id/reviews', authenticate, userController.addReview);
router.get('/:id/reviews', authenticate, userController.getReviews);

// Favourites routes
router.post('/:id/favourites', authenticate, userController.addFavourite);
router.delete('/:id/favourites', authenticate, userController.removeFavourite);
router.get('/:id/favourites', authenticate, userController.getFavourites);

// Notifications routes - must come before /:id route
router.get('/:id/notifications', authenticate, userController.getNotifications);
router.post('/:id/notifications', authenticate, userController.createNotification);
router.put('/:id/notifications/read', authenticate, userController.markNotificationAsRead);
router.put('/:id/notifications/read-all', authenticate, userController.markAllNotificationsAsRead);
router.delete('/:id/notifications', authenticate, userController.deleteNotification);

// Generic user routes - must come last
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);

module.exports = router;

