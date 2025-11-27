const db = require('../config/db');

class BookingModel {
  
  // Create new booking
  static async createBooking(bookingData) {
    const {
      booking_id,
      user_id,
      booking_type,
      listing_id,
      travel_date,
      quantity,
      total_amount,
      status = 'pending',
      special_requests = null
    } = bookingData;

    const query = `
      INSERT INTO bookings (
        booking_id, user_id, booking_type, listing_id,
        travel_date, quantity, total_amount, status, special_requests
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      booking_id,
      user_id,
      booking_type,
      listing_id,
      travel_date,
      quantity,
      total_amount,
      status,
      special_requests
    ]);

    return result;
  }

  // Get booking by ID
  static async getBookingById(booking_id) {
    const query = `SELECT * FROM bookings WHERE booking_id = ?`;
    const [rows] = await db.execute(query, [booking_id]);
    return rows[0] || null;
  }

  // Get all bookings for a user
  static async getBookingsByUserId(user_id) {
    const query = `
      SELECT * FROM bookings
      WHERE user_id = ?
      ORDER BY booking_date DESC
    `;
    const [rows] = await db.execute(query, [user_id]);
    return rows;
  }

  // Get bookings by status
  static async getBookingsByStatus(status) {
    const query = `
      SELECT * FROM bookings
      WHERE status = ?
      ORDER BY booking_date DESC
    `;
    const [rows] = await db.execute(query, [status]);
    return rows;
  }

  // Update booking status
  static async updateBookingStatus(booking_id, status) {
    const query = `
      UPDATE bookings
      SET status = ?
      WHERE booking_id = ?
    `;
    const [result] = await db.execute(query, [status, booking_id]);
    return result;
  }

  // Cancel booking
  static async cancelBooking(booking_id) {
    const query = `
      UPDATE bookings
      SET status = 'cancelled'
      WHERE booking_id = ?
    `;
    const [result] = await db.execute(query, [booking_id]);
    return result;
  }

  // Delete booking
  static async deleteBooking(booking_id) {
    const query = `DELETE FROM bookings WHERE booking_id = ?`;
    const [result] = await db.execute(query, [booking_id]);
    return result;
  }

  // Check if booking exists
  static async bookingExists(booking_id) {
    const query = `SELECT COUNT(*) as count FROM bookings WHERE booking_id = ?`;
    const [rows] = await db.execute(query, [booking_id]);
    return rows[0].count > 0;
  }

  // Get booking with user details
  static async getBookingWithUserDetails(booking_id) {
    const query = `
      SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ?
    `;
    const [rows] = await db.execute(query, [booking_id]);
    return rows[0] || null;
  }

  // Get user's upcoming bookings
  static async getUpcomingBookings(user_id) {
    const query = `
      SELECT * FROM bookings
      WHERE user_id = ?
        AND status = 'confirmed'
        AND travel_date >= CURDATE()
      ORDER BY travel_date ASC
    `;
    const [rows] = await db.execute(query, [user_id]);
    return rows;
  }

  // Get user's past bookings
  static async getPastBookings(user_id) {
    const query = `
      SELECT * FROM bookings
      WHERE user_id = ?
        AND status = 'confirmed'
        AND travel_date < CURDATE()
      ORDER BY travel_date DESC
    `;
    const [rows] = await db.execute(query, [user_id]);
    return rows;
  }
}

module.exports = BookingModel;