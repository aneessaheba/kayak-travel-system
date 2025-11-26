const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// Process payment (create billing record)
router.post('/process-payment', billingController.processPayment);

// Get billing by ID
router.get('/:billingId', billingController.getBillingById);

// Get all billings for a user
router.get('/user/:userId', billingController.getUserBillings);

// Get billing by booking ID
router.get('/booking/:bookingId', billingController.getBillingByBookingId);

// Download invoice PDF
router.get('/:billingId/invoice', billingController.downloadInvoice);

// Update billing status (admin only)
router.put('/:billingId/status', billingController.updateBillingStatus);

// Get billing statistics (admin)
router.get('/stats/revenue', billingController.getRevenueStats);

// Get user's total spending
router.get('/stats/user/:userId', billingController.getUserStats);

module.exports = router;