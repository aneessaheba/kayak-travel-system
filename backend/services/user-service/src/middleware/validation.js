// Validation middleware
exports.validateRegister = (req, res, next) => {
  const {
    userId,
    firstName,
    lastName,
    email,
    password,
    address,
    city,
    state,
    zipCode,
    phoneNumber
  } = req.body;

  const errors = [];

  if (!userId || !/^\d{9}$/.test(userId)) {
    errors.push('User ID must be a 9-digit number (SSN format)');
  }

  if (!firstName || firstName.trim().length < 2) {
    errors.push('First name is required and must be at least 2 characters');
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push('Last name is required and must be at least 2 characters');
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (!password || password.length < 6) {
    errors.push('Password is required and must be at least 6 characters');
  }

  if (!address || address.trim().length < 5) {
    errors.push('Address is required');
  }

  if (!city || city.trim().length < 2) {
    errors.push('City is required');
  }

  if (!state || state.trim().length < 2) {
    errors.push('State is required');
  }

  if (!zipCode || zipCode.trim().length < 5) {
    errors.push('Valid zip code is required');
  }

  if (!phoneNumber || phoneNumber.trim().length < 10) {
    errors.push('Valid phone number is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  const errors = [];

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Valid email is required');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

