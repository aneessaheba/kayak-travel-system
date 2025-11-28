const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');

/**
 * Review Routes
 * Base path: /api/reviews
 */

// ============================================
// Public Routes (Anyone can access)
// ============================================

// Get all reviews for an entity (hotel/flight/car)
// GET /api/reviews/:entity_type/:entity_id
// Query params: ?limit=50&offset=0&sort=recent
router.get('/:entity_type/:entity_id', ReviewController.getReviewsByEntity);

// Get review statistics (average rating, count, distribution)
// GET /api/reviews/:entity_type/:entity_id/stats
router.get('/:entity_type/:entity_id/stats', ReviewController.getReviewStats);

// Get total review count
// GET /api/reviews/stats/total
router.get('/stats/total', ReviewController.getTotalReviews);

// ============================================
// User Routes (Require user authentication)
// ============================================

// Create new review
// POST /api/reviews/:entity_type/:entity_id
// Body: { entity_name, user_id, user_name, rating, review_text, images }
router.post('/:entity_type/:entity_id', ReviewController.createReview);

// Check if user has reviewed an entity
// GET /api/reviews/check?user_id=X&entity_type=Y&entity_id=Z
router.get('/check', ReviewController.checkUserReview);

// Get all reviews by a specific user
// GET /api/reviews/user/:user_id/my-reviews
router.get('/user/:user_id/my-reviews', ReviewController.getUserReviews);

// Get single review by ID
// GET /api/reviews/review/:review_id
router.get('/review/:review_id', ReviewController.getReviewById);

// Update review (user can only update their own)
// PUT /api/reviews/review/:review_id
// Body: { user_id, rating?, review_text?, images? }
router.put('/review/:review_id', ReviewController.updateReview);

// Delete review (user can only delete their own)
// DELETE /api/reviews/review/:review_id
// Body: { user_id }
router.delete('/review/:review_id', ReviewController.deleteReview);

// Mark review as helpful (increment counter)
// POST /api/reviews/review/:review_id/helpful
router.post('/review/:review_id/helpful', ReviewController.markHelpful);

module.exports = router;