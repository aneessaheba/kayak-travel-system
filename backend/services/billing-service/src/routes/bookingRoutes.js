const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Create booking
router.post('/create', bookingController.createBooking);

// Get booking by ID
router.get('/:bookingId', bookingController.getBookingById);

// Get user's all bookings
router.get('/user/:userId', bookingController.getUserBookings);

// Get user's upcoming bookings
router.get('/user/:userId/upcoming', bookingController.getUpcomingBookings);

// Check if user has completed booking (for reviews)
router.get('/has-booking', bookingController.hasCompletedBooking);

// Cancel booking
router.put('/:bookingId/cancel', bookingController.cancelBooking);

// Update booking status
router.put('/:bookingId/status', bookingController.updateBookingStatus);

module.exports = router;