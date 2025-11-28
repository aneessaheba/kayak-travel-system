const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        // SSN format: 9 digits
        return /^\d{9}$/.test(v);
      },
      message: 'User ID must be a 9-digit number (SSN format)'
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
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
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profileImage: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: {
      values: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      message: 'Gender must be one of: Male, Female, Other, Prefer not to say'
    },
    default: ''
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  country: {
    type: String,
    default: 'USA',
    trim: true
  },
  preferredLanguage: {
    type: String,
    default: 'English',
    trim: true
  },
  currency: {
    type: String,
    default: 'USD',
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      default: '',
      trim: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    relationship: {
      type: String,
      default: '',
      trim: true
    }
  },
  travelPreferences: {
    passportNumber: {
      type: String,
      default: '',
      trim: true
    },
    frequentFlyerNumber: {
      type: String,
      default: '',
      trim: true
    },
    seatPreference: {
      type: String,
      enum: ['Window', 'Aisle', 'Middle', 'No Preference'],
      default: 'No Preference'
    },
    mealPreference: {
      type: String,
      enum: ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'No Preference'],
      default: 'No Preference'
    }
  },
  creditCard: {
    cardNumber: {
      type: String,
      default: ''
    },
    cardHolderName: {
      type: String,
      default: ''
    },
    expiryDate: {
      type: String,
      default: ''
    },
    cvv: {
      type: String,
      default: ''
    }
  },
  bookingHistory: [{
    bookingId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['flight', 'hotel', 'car'],
      required: true
    },
    bookingDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['upcoming', 'current', 'past', 'cancelled'],
      default: 'upcoming'
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  }],
  reviews: [{
    reviewId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['flight', 'hotel', 'car'],
      required: true
    },
    itemId: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
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
  favourites: [{
    itemId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['flight', 'hotel', 'car'],
      required: true
    },
    itemData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notifications: [{
    notificationId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['success', 'info', 'warning', 'error'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    relatedId: {
      type: String,
      default: ''
    },
    relatedType: {
      type: String,
      enum: ['booking', 'payment', 'deal', 'reminder', ''],
      default: ''
    }
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  if (user.creditCard && user.creditCard.cvv) {
    delete user.creditCard.cvv;
  }
  // Ensure _id is included in the response (MongoDB _id)
  if (!user._id && this._id) {
    user._id = this._id.toString();
  }
  return user;
};

module.exports = mongoose.model('User', userSchema);

