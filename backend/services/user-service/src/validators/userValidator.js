const Joi = require('joi');

// US State abbreviations (all 50 states)
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Custom validators
const validators = {
  // SSN format: XXX-XX-XXXX
  validateSSN: (ssn) => {
    const ssnPattern = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;
    if (!ssnPattern.test(ssn)) {
      throw new Error('invalid_user_id: User ID must match SSN format (XXX-XX-XXXX)');
    }
    return ssn;
  },

  // Zip code format: XXXXX or XXXXX-XXXX (must be at least 2 digits)
  validateZipCode: (zipCode) => {
    // Valid: 12, 95123, 90086-1929
    // Invalid: 1, 1247 (less than 5 digits unless 2 digits exactly), 1829A, 37849-392
    const zipPattern5 = /^[0-9]{5}$/;
    const zipPattern5Plus4 = /^[0-9]{5}-[0-9]{4}$/;
    const zipPattern2 = /^[0-9]{2}$/;
    
    if (!zipPattern5.test(zipCode) && !zipPattern5Plus4.test(zipCode) && !zipPattern2.test(zipCode)) {
      throw new Error('malformed_zip: Zip code must be 2 digits, 5 digits, or 5+4 format (XXXXX-XXXX)');
    }
    return zipCode;
  },

  // State abbreviation validation
  validateState: (state) => {
    const upperState = state.toUpperCase();
    if (!US_STATES.includes(upperState)) {
      throw new Error('malformed_state: State must be a valid US state abbreviation');
    }
    return upperState;
  },

  // Email validation
  validateEmail: (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new Error('Invalid email format');
    }
    return email.toLowerCase();
  },

  // Phone number validation (basic)
  validatePhone: (phone) => {
    const phonePattern = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phonePattern.test(phone)) {
      throw new Error('Invalid phone number format');
    }
    return phone;
  }
};

// Joi schema for user creation
const createUserSchema = Joi.object({
  user_id: Joi.string().required().custom((value, helpers) => {
    try {
      return validators.validateSSN(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().max(255).required().custom((value, helpers) => {
    try {
      return validators.validateEmail(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  password: Joi.string().min(6).max(255).required(),
  address: Joi.string().max(255).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  state: Joi.string().length(2).allow(null, '').custom((value, helpers) => {
    if (!value) return value;
    try {
      return validators.validateState(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  zip_code: Joi.string().max(10).allow(null, '').custom((value, helpers) => {
    if (!value) return value;
    try {
      return validators.validateZipCode(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  phone_number: Joi.string().max(20).allow(null, '').custom((value, helpers) => {
    if (!value) return value;
    try {
      return validators.validatePhone(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  profile_image: Joi.string().max(500).allow(null, '')
});

// Joi schema for user update
const updateUserSchema = Joi.object({
  user_id: Joi.string().required().custom((value, helpers) => {
    try {
      return validators.validateSSN(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  first_name: Joi.string().min(1).max(100),
  last_name: Joi.string().min(1).max(100),
  email: Joi.string().email().max(255).custom((value, helpers) => {
    try {
      return validators.validateEmail(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  password: Joi.string().min(6).max(255),
  address: Joi.string().max(255).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  state: Joi.string().length(2).allow(null, '').custom((value, helpers) => {
    if (!value) return value;
    try {
      return validators.validateState(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  zip_code: Joi.string().max(10).allow(null, '').custom((value, helpers) => {
    if (!value) return value;
    try {
      return validators.validateZipCode(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  phone_number: Joi.string().max(20).allow(null, '').custom((value, helpers) => {
    if (!value) return value;
    try {
      return validators.validatePhone(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  profile_image: Joi.string().max(500).allow(null, '')
}).min(2); // At least user_id + one field to update

// Joi schema for user read
const readUserSchema = Joi.object({
  user_id: Joi.string().custom((value, helpers) => {
    try {
      return validators.validateSSN(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  }),
  email: Joi.string().email().max(255)
}).xor('user_id', 'email'); // Either user_id or email, not both

// Joi schema for user delete
const deleteUserSchema = Joi.object({
  user_id: Joi.string().required().custom((value, helpers) => {
    try {
      return validators.validateSSN(value);
    } catch (error) {
      return helpers.error('any.custom', { message: error.message });
    }
  })
});

module.exports = {
  validators,
  createUserSchema,
  updateUserSchema,
  readUserSchema,
  deleteUserSchema,
  US_STATES
};