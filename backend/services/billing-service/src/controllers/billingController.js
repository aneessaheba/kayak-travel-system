const Billing = require('../models/Billing');

exports.createBilling = async (req, res) => {
  try {
    const billing = new Billing(req.body);
    await billing.save();
    res.status(201).json({ success: true, message: 'Billing record created successfully', data: billing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating billing record', error: error.message });
  }
};

exports.getBillings = async (req, res) => {
  try {
    const { userId, bookingType, status, startDate, endDate, month, year, page = 1, limit = 20 } = req.query;
    const query = {};

    if (userId) query.userId = userId;
    if (bookingType) query.bookingType = bookingType;
    if (status) query.transactionStatus = status;

    if (startDate || endDate) {
      query.dateOfTransaction = {};
      if (startDate) query.dateOfTransaction.$gte = new Date(startDate);
      if (endDate) query.dateOfTransaction.$lte = new Date(endDate);
    }

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.dateOfTransaction = { $gte: start, $lte: end };
    }

    const sort = { dateOfTransaction: -1 };
    const skip = (page - 1) * limit;

    const billings = await Billing.find(query).sort(sort).skip(skip).limit(Number(limit));
    const total = await Billing.countDocuments(query);

    res.json({ success: true, data: billings, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching billing records', error: error.message });
  }
};

exports.getBillingById = async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id);
    if (!billing) return res.status(404).json({ success: false, message: 'Billing record not found' });
    res.json({ success: true, data: billing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching billing record', error: error.message });
  }
};

exports.updateBilling = async (req, res) => {
  try {
    const billing = await Billing.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!billing) return res.status(404).json({ success: false, message: 'Billing record not found' });
    res.json({ success: true, message: 'Billing record updated successfully', data: billing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating billing record', error: error.message });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { refundAmount, reason } = req.body;
    const billing = await Billing.findById(req.params.id);
    if (!billing) return res.status(404).json({ success: false, message: 'Billing record not found' });

    billing.refundDetails = {
      refundAmount: refundAmount || billing.totalAmountPaid,
      refundDate: new Date(),
      reason: reason || 'Customer request',
      status: 'pending'
    };
    billing.transactionStatus = 'refunded';
    await billing.save();

    res.json({ success: true, message: 'Refund processed successfully', data: billing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing refund', error: error.message });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate, bookingType } = req.query;
    const match = { transactionStatus: 'completed' };

    if (startDate || endDate) {
      match.dateOfTransaction = {};
      if (startDate) match.dateOfTransaction.$gte = new Date(startDate);
      if (endDate) match.dateOfTransaction.$lte = new Date(endDate);
    }
    if (bookingType) match.bookingType = bookingType;

    const stats = await Billing.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmountPaid' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$totalAmountPaid' }
        }
      }
    ]);

    res.json({ success: true, data: stats[0] || { totalRevenue: 0, totalTransactions: 0, averageTransaction: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching revenue stats', error: error.message });
  }
};

