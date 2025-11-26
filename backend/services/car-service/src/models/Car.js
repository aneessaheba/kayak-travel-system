const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  carId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  carType: {
    type: String,
    enum: ['SUV', 'Sedan', 'Compact', 'Luxury', 'Convertible', 'Van', 'Truck'],
    required: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: new Date().getFullYear() + 1
  },
  transmissionType: {
    type: String,
    enum: ['Automatic', 'Manual'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['Gasoline', 'Electric', 'Hybrid', 'Diesel'],
    default: 'Gasoline'
  },
  numberOfSeats: {
    type: Number,
    required: true,
    min: 2,
    max: 15
  },
  dailyRentalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  carRating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  customerReviews: [{
    userId: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  availabilityStatus: {
    type: String,
    enum: ['available', 'rented', 'maintenance'],
    default: 'available'
  },
  bookings: [{
    pickupDate: {
      type: Date,
      required: true
    },
    returnDate: {
      type: Date,
      required: true
    },
    bookingId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  location: {
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  },
  features: [{
    type: String
  }],
  images: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

carSchema.index({ carType: 1 });
carSchema.index({ 'location.city': 1 });
carSchema.index({ dailyRentalPrice: 1 });
carSchema.index({ availabilityStatus: 1 });

carSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Car', carSchema);

