const db = require('../config/db');

class BillingModel {
  
  // Create new billing record
  static async createBilling(billingData) {
    const {
      billing_id,
      user_id,
      booking_type,
      booking_id,
      total_amount,
      payment_method,
      transaction_status = 'pending',
      invoice_url = null
    } = billingData;

    const query = `
      INSERT INTO billing (
        billing_id, user_id, booking_type, booking_id,
        total_amount, payment_method, transaction_status, invoice_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      billing_id,
      user_id,
      booking_type,
      booking_id,
      total_amount,
      payment_method,
      transaction_status,
      invoice_url
    ]);

    return result;
  }

  // Get billing by ID
  static async getBillingById(billing_id) {
    const query = `
      SELECT * FROM billing
      WHERE billing_id = ?
    `;

    const [rows] = await db.execute(query, [billing_id]);
    return rows[0] || null;
  }

  // Get all billing records for a user
  static async getBillingsByUserId(user_id) {
    const query = `
      SELECT * FROM billing
      WHERE user_id = ?
      ORDER BY transaction_date DESC
    `;

    const [rows] = await db.execute(query, [user_id]);
    return rows;
  }

  // Get billing by booking ID
  static async getBillingByBookingId(booking_id) {
    const query = `
      SELECT * FROM billing
      WHERE booking_id = ?
    `;

    const [rows] = await db.execute(query, [booking_id]);
    return rows[0] || null;
  }

  // Update billing status
  static async updateBillingStatus(billing_id, status) {
    const query = `
      UPDATE billing
      SET transaction_status = ?
      WHERE billing_id = ?
    `;

    const [result] = await db.execute(query, [status, billing_id]);
    return result;
  }

  // Update invoice URL
  static async updateInvoiceUrl(billing_id, invoice_url) {
    const query = `
      UPDATE billing
      SET invoice_url = ?
      WHERE billing_id = ?
    `;

    const [result] = await db.execute(query, [invoice_url, billing_id]);
    return result;
  }

  // Get billing records by status
  static async getBillingsByStatus(status) {
    const query = `
      SELECT * FROM billing
      WHERE transaction_status = ?
      ORDER BY transaction_date DESC
    `;

    const [rows] = await db.execute(query, [status]);
    return rows;
  }

  // Get billing records by date range
  static async getBillingsByDateRange(start_date, end_date) {
    const query = `
      SELECT * FROM billing
      WHERE transaction_date BETWEEN ? AND ?
      ORDER BY transaction_date DESC
    `;

    const [rows] = await db.execute(query, [start_date, end_date]);
    return rows;
  }

  // Get billing with user details (for invoice generation)
  static async getBillingWithUserDetails(billing_id) {
    const query = `
      SELECT 
        b.*,
        u.first_name,
        u.last_name,
        u.email,
        u.address,
        u.city,
        u.state,
        u.zip_code,
        u.phone_number
      FROM billing b
      JOIN users u ON b.user_id = u.user_id
      WHERE b.billing_id = ?
    `;

    const [rows] = await db.execute(query, [billing_id]);
    return rows[0] || null;
  }

  // Get total revenue by booking type
  static async getTotalRevenueByType(booking_type) {
    const query = `
      SELECT 
        booking_type,
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_revenue
      FROM billing
      WHERE transaction_status = 'completed'
        AND booking_type = ?
    `;

    const [rows] = await db.execute(query, [booking_type]);
    return rows[0] || null;
  }

  // Get user's total spending
  static async getUserTotalSpending(user_id) {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_spent
      FROM billing
      WHERE user_id = ?
        AND transaction_status = 'completed'
    `;

    const [rows] = await db.execute(query, [user_id]);
    return rows[0] || { total_transactions: 0, total_spent: 0 };
  }

  // Delete billing record (for testing/admin)
  static async deleteBilling(billing_id) {
    const query = `
      DELETE FROM billing
      WHERE billing_id = ?
    `;

    const [result] = await db.execute(query, [billing_id]);
    return result;
  }

  // Check if billing exists
  static async billingExists(billing_id) {
    const query = `
      SELECT COUNT(*) as count
      FROM billing
      WHERE billing_id = ?
    `;

    const [rows] = await db.execute(query, [billing_id]);
    return rows[0].count > 0;
  }
}

module.exports = BillingModel;