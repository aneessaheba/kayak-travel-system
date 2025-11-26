const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  billingId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  bookingType: {
    type: String,
    enum: ['flight', 'hotel', 'car'],
    required: true
  },
  bookingId: {
    type: String,
    required: true
  },
  dateOfTransaction: {
    type: Date,
    default: Date.now,
    required: true
  },
  totalAmountPaid: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash'],
    required: true
  },
  transactionStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    required: true
  },
  invoiceDetails: {
    invoiceNumber: {
      type: String,
      unique: true
    },
    items: [{
      description: String,
      quantity: Number,
      price: Number,
      total: Number
    }],
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number
  },
  receiptDetails: {
    receiptNumber: String,
    issuedDate: Date,
    pdfUrl: String
  },
  refundDetails: {
    refundAmount: Number,
    refundDate: Date,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'processed', 'completed']
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

billingSchema.index({ userId: 1, dateOfTransaction: -1 });
billingSchema.index({ dateOfTransaction: -1 });
billingSchema.index({ transactionStatus: 1 });
billingSchema.index({ bookingType: 1 });

billingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (!this.invoiceDetails.invoiceNumber) {
    this.invoiceDetails.invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

module.exports = mongoose.model('Billing', billingSchema);

