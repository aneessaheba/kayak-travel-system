const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');

// Process payment (create billing record)
router.post('/process-payment', billingController.processPayment);

// Statistics routes (most specific first)
router.get('/stats/revenue', billingController.getRevenueStats);
router.get('/stats/user/:userId', billingController.getUserStats);

// User billings
router.get('/user/:userId', billingController.getUserBillings);

// Booking billings
router.get('/booking/:bookingId', billingController.getBillingByBookingId);

// Invoice download
router.get('/:billingId/invoice', billingController.downloadInvoice);

// Update status
router.put('/:billingId/status', billingController.updateBillingStatus);

// Get single billing (LAST - most generic)
router.get('/:billingId', billingController.getBillingById);

module.exports = router;