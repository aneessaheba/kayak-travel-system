const BookingModel = require('../models/bookingModel');
const { generateBookingId } = require('../utils/idGenerator');
const { publishEvent } = require('../config/kafka');

class BookingController {
  
  // Create new booking
  static async createBooking(req, res) {
    try {
      const {
        user_id,
        booking_type,
        listing_id,
        travel_date,
        return_date,       
        quantity = 1,
        total_amount,
        special_requests
      } = req.body;

      // Validate required fields
      if (!user_id || !booking_type || !listing_id || !travel_date || !total_amount) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Validate booking_type
      const validBookingTypes = ['flight', 'hotel', 'car'];
      if (!validBookingTypes.includes(booking_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid booking type'
        });
      }

      // Generate booking ID
      const booking_id = generateBookingId();

      const bookingData = {
        booking_id,
        user_id,
        booking_type,
        listing_id,
        travel_date,
        return_date,      
        quantity,
        total_amount,
        status: 'pending',
        special_requests
      };

      // Create booking
      await BookingModel.createBooking(bookingData);

      // Publish event to Kafka
      await publishEvent('booking.created', {
        booking_id,
        user_id,
        booking_type,
        listing_id,
        travel_date,
        return_date,      
        quantity,         
        total_amount,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          booking_id,
          status: 'pending',
          total_amount
        }
      });

    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error.message
      });
    }
  }

  // Get booking by ID
  static async getBookingById(req, res) {
    try {
      const { bookingId } = req.params;
      const booking = await BookingModel.getBookingById(bookingId);

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.status(200).json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Error getting booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve booking',
        error: error.message
      });
    }
  }

  // Get user's bookings
  static async getUserBookings(req, res) {
    try {
      const { userId } = req.params;
      const bookings = await BookingModel.getBookingsByUserId(userId);

      res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
      });

    } catch (error) {
      console.error('Error getting user bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bookings',
        error: error.message
      });
    }
  }

  // Get upcoming bookings
  static async getUpcomingBookings(req, res) {
    try {
      const { userId } = req.params;
      const bookings = await BookingModel.getUpcomingBookings(userId);

      res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings
      });

    } catch (error) {
      console.error('Error getting upcoming bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve upcoming bookings',
        error: error.message
      });
    }
  }

  // Cancel booking
  static async cancelBooking(req, res) {
    try {
      const { bookingId } = req.params;

      const exists = await BookingModel.bookingExists(bookingId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      await BookingModel.cancelBooking(bookingId);

      // Publish event
      await publishEvent('booking.cancelled', {
        booking_id: bookingId,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        message: 'Booking cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking',
        error: error.message
      });
    }
  }

  // Update booking status
  static async updateBookingStatus(req, res) {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'confirmed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const exists = await BookingModel.bookingExists(bookingId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      await BookingModel.updateBookingStatus(bookingId, status);

      res.status(200).json({
        success: true,
        message: 'Booking status updated successfully'
      });

    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking status',
        error: error.message
      });
    }
  }
}

module.exports = BookingController;