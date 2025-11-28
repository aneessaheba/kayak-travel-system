const ReviewModel = require('../models/reviewModel');
const { 
  createReviewSchema, 
  updateReviewSchema,
  getReviewsQuerySchema
} = require('../validators/reviewValidator');

/**
 * Review Controller - Handles HTTP requests and responses
 * Validates input, calls ReviewModel, formats responses
 */

const ReviewController = {

  /**
   * Create new review
   * POST /api/reviews/:entity_type/:entity_id
   */
  async createReview(req, res, next) {
    try {
      const { entity_type, entity_id } = req.params;
      
      const reviewData = {
        entity_type,
        entity_id,
        entity_name: req.body.entity_name,
        user_id: req.body.user_id,
        user_name: req.body.user_name,
        rating: req.body.rating,
        review_text: req.body.review_text,
        images: req.body.images || []
      };

      // Validate request body
      const { error, value } = createReviewSchema.validate(reviewData);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: error.details[0].message
        });
      }

      // Check if user already reviewed this entity
      const existingReview = await ReviewModel.checkUserReview(
        value.user_id,
        value.entity_type,
        value.entity_id
      );

      if (existingReview) {
        return res.status(409).json({
          success: false,
          error: 'duplicate_review',
          message: 'You have already reviewed this. You can edit your existing review.'
        });
      }

      // Create review
      const review = await ReviewModel.createReview(value);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all reviews for an entity
   * GET /api/reviews/:entity_type/:entity_id
   */
  async getReviewsByEntity(req, res, next) {
    try {
      const { entity_type, entity_id } = req.params;
      
      // Validate query parameters
      const { error, value } = getReviewsQuerySchema.validate(req.query);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: error.details[0].message
        });
      }

      const reviews = await ReviewModel.getReviewsByEntity(
        entity_type,
        entity_id,
        value
      );

      res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get review statistics for an entity
   * GET /api/reviews/:entity_type/:entity_id/stats
   */
  async getReviewStats(req, res, next) {
    try {
      const { entity_type, entity_id } = req.params;

      const stats = await ReviewModel.getReviewStats(entity_type, entity_id);

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all reviews by a user
   * GET /api/reviews/user/:user_id/my-reviews
   */
  async getUserReviews(req, res, next) {
    try {
      const { user_id } = req.params;

      const reviews = await ReviewModel.getReviewsByUser(user_id);

      res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Check if user has reviewed an entity
   * GET /api/reviews/check?user_id=X&entity_type=Y&entity_id=Z
   */
  async checkUserReview(req, res, next) {
    try {
      const { user_id, entity_type, entity_id } = req.query;

      if (!user_id || !entity_type || !entity_id) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'user_id, entity_type, and entity_id are required'
        });
      }

      const review = await ReviewModel.checkUserReview(user_id, entity_type, entity_id);

      if (review) {
        return res.status(200).json({
          success: true,
          has_reviewed: true,
          review: {
            review_id: review._id,
            rating: review.rating,
            review_text: review.review_text,
            created_at: review.created_at,
            updated_at: review.updated_at
          }
        });
      }

      res.status(200).json({
        success: true,
        has_reviewed: false
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single review by ID
   * GET /api/reviews/:review_id
   */
  async getReviewById(req, res, next) {
    try {
      const { review_id } = req.params;

      const review = await ReviewModel.getReviewById(review_id);

      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'review_not_found',
          message: 'Review not found'
        });
      }

      res.status(200).json({
        success: true,
        data: review
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Update review
   * PUT /api/reviews/:review_id
   */
  async updateReview(req, res, next) {
    try {
      const { review_id } = req.params;
      const { user_id } = req.body; // User ID for ownership verification

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'user_id is required'
        });
      }

      // Check if review exists and belongs to user
      const existingReview = await ReviewModel.getReviewById(review_id);

      if (!existingReview) {
        return res.status(404).json({
          success: false,
          error: 'review_not_found',
          message: 'Review not found'
        });
      }

      if (existingReview.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          error: 'unauthorized',
          message: 'You can only edit your own reviews'
        });
      }

      // Validate update data
      const { error, value } = updateReviewSchema.validate({
        rating: req.body.rating,
        review_text: req.body.review_text,
        images: req.body.images
      });

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: error.details[0].message
        });
      }

      // Update review
      const updatedReview = await ReviewModel.updateReview(review_id, value);

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: updatedReview
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete review
   * DELETE /api/reviews/:review_id
   */
  async deleteReview(req, res, next) {
    try {
      const { review_id } = req.params;
      const { user_id } = req.body; // User ID for ownership verification

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'validation_error',
          message: 'user_id is required'
        });
      }

      // Check if review exists and belongs to user
      const existingReview = await ReviewModel.getReviewById(review_id);

      if (!existingReview) {
        return res.status(404).json({
          success: false,
          error: 'review_not_found',
          message: 'Review not found'
        });
      }

      if (existingReview.user_id !== user_id) {
        return res.status(403).json({
          success: false,
          error: 'unauthorized',
          message: 'You can only delete your own reviews'
        });
      }

      // Delete review
      await ReviewModel.deleteReview(review_id);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully'
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark review as helpful
   * POST /api/reviews/:review_id/helpful
   */
  async markHelpful(req, res, next) {
    try {
      const { review_id } = req.params;

      const review = await ReviewModel.getReviewById(review_id);

      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'review_not_found',
          message: 'Review not found'
        });
      }

      const newCount = await ReviewModel.markHelpful(review_id);

      res.status(200).json({
        success: true,
        message: 'Marked as helpful',
        helpful_count: newCount
      });

    } catch (error) {
      next(error);
    }
  },

  /**
   * Get total review count (for stats)
   * GET /api/reviews/stats/total
   */
  async getTotalReviews(req, res, next) {
    try {
      const total = await ReviewModel.getReviewCount();

      res.status(200).json({
        success: true,
        data: {
          total_reviews: total
        }
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = ReviewController;