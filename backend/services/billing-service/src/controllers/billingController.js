const BillingModel = require('../models/billingModel');
const { generateBillingId } = require('../utils/idGenerator');
const { publishEvent } = require('../config/kafka');

// Mock payment gateway
async function mockPaymentGateway(amount, method) {
  await new Promise(resolve => setTimeout(resolve, 100));
  return Math.random() > 0.05; // 95% success rate
}

class BillingController {
  
  // Process payment and create billing record
  static async processPayment(req, res) {
    try {
      const { user_id, booking_type, booking_id, total_amount, payment_method } = req.body;

      // Validate required fields
      if (!user_id || !booking_type || !booking_id || !total_amount || !payment_method) {
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

      // Validate payment_method
      const validPaymentMethods = ['credit_card', 'debit_card', 'paypal', 'stripe'];
      if (!validPaymentMethods.includes(payment_method)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method'
        });
      }

      // Check for duplicate billing
      const existingBilling = await BillingModel.getBillingByBookingId(booking_id);
      if (existingBilling) {
        return res.status(409).json({
          success: false,
          message: 'Billing already exists for this booking',
          data: { billing_id: existingBilling.billing_id }
        });
      }

      // Generate billing ID
      const billing_id = generateBillingId();

      // Process payment
      const paymentSuccess = await mockPaymentGateway(total_amount, payment_method);

      const billingData = {
        billing_id,
        user_id,
        booking_type,
        booking_id,
        total_amount,
        payment_method,
        transaction_status: paymentSuccess ? 'completed' : 'failed'
      };

      // Create billing record
      await BillingModel.createBilling(billingData);

      // Publish event to Kafka
      await publishEvent('payment.processed', {
        billing_id,
        booking_id,
        user_id,
        amount: total_amount,
        status: billingData.transaction_status,
        booking_type,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          billing_id,
          transaction_status: billingData.transaction_status,
          amount: total_amount
        }
      });

    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payment',
        error: error.message
      });
    }
  }

  // Get billing by ID
  static async getBillingById(req, res) {
    try {
      const { billingId } = req.params;
      const billing = await BillingModel.getBillingById(billingId);

      if (!billing) {
        return res.status(404).json({
          success: false,
          message: 'Billing record not found'
        });
      }

      res.status(200).json({
        success: true,
        data: billing
      });

    } catch (error) {
      console.error('Error getting billing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve billing',
        error: error.message
      });
    }
  }

  // Get all billings for a user
  static async getUserBillings(req, res) {
    try {
      const { userId } = req.params;
      const billings = await BillingModel.getBillingsByUserId(userId);

      res.status(200).json({
        success: true,
        count: billings.length,
        data: billings
      });

    } catch (error) {
      console.error('Error getting user billings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user billings',
        error: error.message
      });
    }
  }

  // Get billing by booking ID
  static async getBillingByBookingId(req, res) {
    try {
      const { bookingId } = req.params;
      const billing = await BillingModel.getBillingByBookingId(bookingId);

      if (!billing) {
        return res.status(404).json({
          success: false,
          message: 'Billing record not found for this booking'
        });
      }

      res.status(200).json({
        success: true,
        data: billing
      });

    } catch (error) {
      console.error('Error getting billing by booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve billing',
        error: error.message
      });
    }
  }

  // Download invoice PDF
  static async downloadInvoice(req, res) {
    try {
      const { billingId } = req.params;
      const billing = await BillingModel.getBillingWithUserDetails(billingId);

      if (!billing) {
        return res.status(404).json({
          success: false,
          message: 'Billing record not found'
        });
      }

      // TODO: Generate PDF invoice (next step)
      res.status(200).json({
        success: true,
        message: 'Invoice generation coming soon',
        data: billing
      });

    } catch (error) {
      console.error('Error downloading invoice:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate invoice',
        error: error.message
      });
    }
  }

  // Update billing status
  static async updateBillingStatus(req, res) {
    try {
      const { billingId } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'completed', 'failed', 'refunded'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const exists = await BillingModel.billingExists(billingId);
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Billing record not found'
        });
      }

      await BillingModel.updateBillingStatus(billingId, status);

      res.status(200).json({
        success: true,
        message: 'Billing status updated successfully'
      });

    } catch (error) {
      console.error('Error updating billing status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update billing status',
        error: error.message
      });
    }
  }

  // Get revenue statistics
  static async getRevenueStats(req, res) {
    try {
      const { booking_type } = req.query;

      if (!booking_type) {
        return res.status(400).json({
          success: false,
          message: 'booking_type query parameter required'
        });
      }

      const stats = await BillingModel.getTotalRevenueByType(booking_type);

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting revenue stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve revenue stats',
        error: error.message
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      const stats = await BillingModel.getUserTotalSpending(userId);

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user stats',
        error: error.message
      });
    }
  }
}

module.exports = BillingController;