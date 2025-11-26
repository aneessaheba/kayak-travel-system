const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  hotelId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  hotelName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true
  },
  starRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  numberOfRooms: {
    type: Number,
    required: true,
    min: 1
  },
  availableRooms: {
    type: Number,
    required: true,
    min: 0
  },
  maxGuests: {
    type: Number,
    required: false,
    min: 1,
    default: 1
  },
  roomTypes: [{
    type: {
      type: String,
      enum: ['Single', 'Double', 'Suite', 'Deluxe', 'Presidential'],
      required: true
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },
    available: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: [{
    type: String
  }],
  hotelRating: {
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
  guestReviews: [{
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

// Indexes
hotelSchema.index({ city: 1, state: 1 });
hotelSchema.index({ starRating: 1 });
hotelSchema.index({ pricePerNight: 1 });
hotelSchema.index({ 'hotelRating.average': -1 });

hotelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Hotel', hotelSchema);

