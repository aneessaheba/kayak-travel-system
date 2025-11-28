const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// All analytics routes require authentication
router.use(verifyToken);
router.use(isAdmin); // Must be either kayak_admin or provider_admin

/**
 * @route   GET /api/analytics/overview
 * @desc    Get dashboard overview with key metrics
 * @access  Private (Kayak Admin: all data, Provider Admin: their data only)
 */
router.get('/overview', analyticsController.getDashboardOverview);

/**
 * @route   GET /api/analytics/top-properties
 * @desc    Get top 10 properties with revenue per year
 * @query   year (required) - Year to analyze (e.g., 2025)
 * @query   type (optional) - 'all', 'flight', 'hotel', 'car' (default: 'all')
 * @access  Private (Kayak Admin: all data, Provider Admin: their data only)
 * 
 * Example: GET /api/analytics/top-properties?year=2025&type=flight
 */
router.get('/top-properties', analyticsController.getTopProperties);

/**
 * @route   GET /api/analytics/city-revenue
 * @desc    Get city-wise revenue per year
 * @query   year (required) - Year to analyze (e.g., 2025)
 * @query   type (optional) - 'all', 'flight', 'hotel', 'car' (default: 'all')
 * @access  Private (Kayak Admin: all data, Provider Admin: their data only)
 * 
 * Example: GET /api/analytics/city-revenue?year=2025&type=hotel
 */
router.get('/city-revenue', analyticsController.getCityRevenue);

/**
 * @route   GET /api/analytics/top-providers
 * @desc    Get top 10 providers with maximum properties sold last month
 * @query   type (required) - 'flight', 'hotel', or 'car'
 * @access  Private (Kayak Admin: all providers, Provider Admin: only their data)
 * 
 * Example: GET /api/analytics/top-providers?type=flight
 */
router.get('/top-providers', analyticsController.getTopProviders);

module.exports = router;