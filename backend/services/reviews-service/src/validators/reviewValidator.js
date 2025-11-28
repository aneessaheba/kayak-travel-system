const Joi = require('joi');

// Valid entity types
const ENTITY_TYPES = ['hotel', 'flight', 'car'];

// Joi schema for creating a review
const createReviewSchema = Joi.object({
  entity_type: Joi.string().valid(...ENTITY_TYPES).required(),
  entity_id: Joi.string().max(50).required(),
  entity_name: Joi.string().max(200).required(),
  user_id: Joi.string()
    .pattern(/^[0-9]{3}-[0-9]{2}-[0-9]{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'User ID must be in SSN format (XXX-XX-XXXX)'
    }),
  user_name: Joi.string().max(200).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  review_text: Joi.string().min(10).max(2000).required(),
  images: Joi.array().items(Joi.string().max(500)).max(5).default([])
});

// Joi schema for updating a review
const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5),
  review_text: Joi.string().min(10).max(2000),
  images: Joi.array().items(Joi.string().max(500)).max(5)
}).min(1); // At least one field to update

// Joi schema for query parameters
const getReviewsQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
  sort: Joi.string().valid('recent', 'helpful', 'rating_high', 'rating_low').default('recent')
});

// Validate SSN format
function validateUserId(userId) {
  const ssnPattern = /^[0-9]{3}-[0-9]{2}-[0-9]{4}$/;
  if (!ssnPattern.test(userId)) {
    throw new Error('User ID must be in SSN format (XXX-XX-XXXX)');
  }
  return userId;
}

// Validate entity type
function validateEntityType(entityType) {
  if (!ENTITY_TYPES.includes(entityType)) {
    throw new Error(`Entity type must be one of: ${ENTITY_TYPES.join(', ')}`);
  }
  return entityType;
}

// Validate rating
function validateRating(rating) {
  const ratingNum = parseInt(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  return ratingNum;
}

module.exports = {
  createReviewSchema,
  updateReviewSchema,
  getReviewsQuerySchema,
  validateUserId,
  validateEntityType,
  validateRating,
  ENTITY_TYPES
};