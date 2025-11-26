const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  flightId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  airline: {
    type: String,
    required: true,
    trim: true
  },
  departureAirport: {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    }
  },
  arrivalAirport: {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    }
  },
  departureDateTime: {
    type: Date,
    required: true
  },
  arrivalDateTime: {
    type: Date,
    required: true
  },
  duration: {
    hours: {
      type: Number,
      required: true
    },
    minutes: {
      type: Number,
      required: true
    }
  },
  flightClass: {
    type: String,
    enum: ['Economy', 'Business', 'First'],
    default: 'Economy',
    required: true
  },
  ticketPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalAvailableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  flightRating: {
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
  passengerReviews: [{
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
  amenities: [{
    type: String
  }],
  // Return flight fields (always required - all flights are round-trip)
  returnFlightId: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  returnDepartureDateTime: {
    type: Date,
    required: true
  },
  returnArrivalDateTime: {
    type: Date,
    required: true
  },
  returnDuration: {
    hours: {
      type: Number,
      required: true,
      min: 0
    },
    minutes: {
      type: Number,
      required: true,
      min: 0,
      max: 59
    }
  },
  returnTicketPrice: {
    type: Number,
    required: true,
    min: 0
  },
  returnFlightClass: {
    type: String,
    enum: ['Economy', 'Business', 'First'],
    required: true
  },
  returnTotalAvailableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  returnAvailableSeats: {
    type: Number,
    required: true,
    min: 0
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

// Indexes for better search performance
flightSchema.index({ 'departureAirport.code': 1, 'arrivalAirport.code': 1 });
flightSchema.index({ departureDateTime: 1 });
flightSchema.index({ ticketPrice: 1 });
flightSchema.index({ flightClass: 1 });

// Update updatedAt on save
flightSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Flight', flightSchema);

