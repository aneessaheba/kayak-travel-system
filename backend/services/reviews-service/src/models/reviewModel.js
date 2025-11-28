const { ObjectId } = require('mongodb');
const { getCollection } = require('../config/mongodb');
const { RedisUtil } = require('../config/redis');

/**
 * Review Model - Handles all MongoDB operations with Redis caching
 * Cache Strategy:
 * - Reviews by entity: rating:{entity_type}:{entity_id}
 * - User reviews: user:reviews:{user_id}
 * - TTL: 1 hour (3600 seconds)
 */

const ReviewModel = {

  /**
   * Create a new review
   * @param {Object} reviewData - Review data
   * @returns {Object} Created review
   */
  async createReview(reviewData) {
    const collection = getCollection('reviews');
    
    try {
      const review = {
        entity_type: reviewData.entity_type,
        entity_id: reviewData.entity_id,
        entity_name: reviewData.entity_name,
        user_id: reviewData.user_id,
        user_name: reviewData.user_name,
        rating: reviewData.rating,
        review_text: reviewData.review_text,
        images: reviewData.images || [],
        verified_booking: false, // Set to false for now (no verification)
        helpful_count: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await collection.insertOne(review);
      review._id = result.insertedId;

      // Invalidate caches
      await this.invalidateEntityCache(review.entity_type, review.entity_id);
      await this.invalidateUserCache(review.user_id);

      return review;

    } catch (error) {
      // Handle duplicate review error
      if (error.code === 11000) {
        throw new Error('duplicate_review: You have already reviewed this');
      }
      throw error;
    }
  },

  /**
   * Get all reviews for an entity (with caching)
   * @param {String} entityType - hotel, flight, car
   * @param {String} entityId - Entity ID
   * @param {Object} options - Query options (limit, offset, sort)
   * @returns {Array} Reviews
   */
  async getReviewsByEntity(entityType, entityId, options = {}) {
    const { limit = 50, offset = 0, sort = 'recent' } = options;
    
    // Try cache first (for default query only)
    if (offset === 0 && limit === 50 && sort === 'recent') {
      const cacheKey = `reviews:${entityType}:${entityId}`;
      const cached = await RedisUtil.get(cacheKey);
      
      if (cached) {
        console.log(`[CACHE HIT] Reviews for ${entityType}:${entityId}`);
        return cached;
      }
      console.log(`[CACHE MISS] Reviews for ${entityType}:${entityId}`);
    }

    // Query database
    const collection = getCollection('reviews');
    
    // Determine sort order
    let sortOption = { created_at: -1 }; // Default: most recent
    if (sort === 'helpful') sortOption = { helpful_count: -1 };
    if (sort === 'rating_high') sortOption = { rating: -1 };
    if (sort === 'rating_low') sortOption = { rating: 1 };

    const reviews = await collection
      .find({ entity_type: entityType, entity_id: entityId })
      .sort(sortOption)
      .skip(offset)
      .limit(limit)
      .toArray();

    // Cache default query results
    if (offset === 0 && limit === 50 && sort === 'recent') {
      const cacheKey = `reviews:${entityType}:${entityId}`;
      await RedisUtil.set(cacheKey, reviews, 3600);
    }

    return reviews;
  },

  /**
   * Get review statistics for an entity (with caching)
   * @param {String} entityType
   * @param {String} entityId
   * @returns {Object} Stats (average, total, distribution)
   */
  async getReviewStats(entityType, entityId) {
    // Check cache first
    const cacheKey = `rating:${entityType}:${entityId}`;
    const cached = await RedisUtil.get(cacheKey);
    
    if (cached) {
      console.log(`[CACHE HIT] Rating stats for ${entityType}:${entityId}`);
      return cached;
    }
    
    console.log(`[CACHE MISS] Calculating stats for ${entityType}:${entityId}`);

    // Calculate from database
    const collection = getCollection('reviews');
    
    const stats = await collection.aggregate([
      { $match: { entity_type: entityType, entity_id: entityId } },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating' },
          total: { $sum: 1 },
          ratings: { $push: '$rating' }
        }
      }
    ]).toArray();

    if (stats.length === 0) {
      return {
        average: 0,
        total: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    // Calculate rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    stats[0].ratings.forEach(rating => {
      distribution[rating]++;
    });

    const result = {
      average: Math.round(stats[0].average * 10) / 10, // Round to 1 decimal
      total: stats[0].total,
      distribution
    };

    // Cache the result
    await RedisUtil.set(cacheKey, result, 3600);

    return result;
  },

  /**
   * Get all reviews by a user
   * @param {String} userId
   * @returns {Array} User's reviews
   */
  async getReviewsByUser(userId) {
    // Check cache
    const cacheKey = `user:reviews:${userId}`;
    const cached = await RedisUtil.get(cacheKey);
    
    if (cached) {
      console.log(`[CACHE HIT] Reviews for user ${userId}`);
      return cached;
    }

    // Query database
    const collection = getCollection('reviews');
    const reviews = await collection
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    // Cache the result
    await RedisUtil.set(cacheKey, reviews, 1800); // 30 min cache

    return reviews;
  },

  /**
   * Check if user has already reviewed an entity
   * @param {String} userId
   * @param {String} entityType
   * @param {String} entityId
   * @returns {Object|null} Existing review or null
   */
  async checkUserReview(userId, entityType, entityId) {
    const collection = getCollection('reviews');
    const review = await collection.findOne({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId
    });
    
    return review;
  },

  /**
   * Get single review by ID
   * @param {String} reviewId
   * @returns {Object|null} Review
   */
  async getReviewById(reviewId) {
    const collection = getCollection('reviews');
    
    try {
      const review = await collection.findOne({ _id: new ObjectId(reviewId) });
      return review;
    } catch (error) {
      // Invalid ObjectId format
      return null;
    }
  },

  /**
   * Update a review
   * @param {String} reviewId
   * @param {Object} updateData
   * @returns {Object} Updated review
   */
  async updateReview(reviewId, updateData) {
    const collection = getCollection('reviews');
    
    try {
      // Build update object
      const update = {
        updated_at: new Date()
      };
      
      if (updateData.rating !== undefined) update.rating = updateData.rating;
      if (updateData.review_text !== undefined) update.review_text = updateData.review_text;
      if (updateData.images !== undefined) update.images = updateData.images;

      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(reviewId) },
        { $set: update },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('review_not_found: Review does not exist');
      }

      // Invalidate caches
      await this.invalidateEntityCache(result.entity_type, result.entity_id);
      await this.invalidateUserCache(result.user_id);

      return result;

    } catch (error) {
      if (error.message === 'review_not_found: Review does not exist') {
        throw error;
      }
      throw new Error('Failed to update review');
    }
  },

  /**
   * Delete a review
   * @param {String} reviewId
   * @returns {Boolean} Success
   */
  async deleteReview(reviewId) {
    const collection = getCollection('reviews');
    
    try {
      // Get review first (for cache invalidation)
      const review = await this.getReviewById(reviewId);
      
      if (!review) {
        throw new Error('review_not_found: Review does not exist');
      }

      // Delete review
      const result = await collection.deleteOne({ _id: new ObjectId(reviewId) });

      if (result.deletedCount === 0) {
        throw new Error('review_not_found: Review does not exist');
      }

      // Invalidate caches
      await this.invalidateEntityCache(review.entity_type, review.entity_id);
      await this.invalidateUserCache(review.user_id);

      return true;

    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark review as helpful (increment counter)
   * @param {String} reviewId
   * @returns {Number} New helpful count
   */
  async markHelpful(reviewId) {
    const collection = getCollection('reviews');
    
    try {
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(reviewId) },
        { $inc: { helpful_count: 1 } },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('review_not_found: Review does not exist');
      }

      // Invalidate entity cache (helpful count affects sorting)
      await this.invalidateEntityCache(result.entity_type, result.entity_id);

      return result.helpful_count;

    } catch (error) {
      throw error;
    }
  },

  /**
   * Get total review count
   * @returns {Number} Total reviews
   */
  async getReviewCount() {
    const collection = getCollection('reviews');
    return await collection.countDocuments();
  },

  /**
   * Invalidate entity-related caches
   */
  async invalidateEntityCache(entityType, entityId) {
    await RedisUtil.del(`reviews:${entityType}:${entityId}`);
    await RedisUtil.del(`rating:${entityType}:${entityId}`);
  },

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCache(userId) {
    await RedisUtil.del(`user:reviews:${userId}`);
  }
};

module.exports = ReviewModel;