const analyticsService = require('../services/analyticsService');

/**
 * Get top 10 properties with revenue per year
 * GET /api/analytics/top-properties?year=2025&type=all
 */
const getTopProperties = async (req, res) => {
  try {
    const { year, type = 'all' } = req.query;

    // Validate year
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required'
      });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year'
      });
    }

    // Validate type
    const validTypes = ['all', 'flight', 'hotel', 'car'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be: all, flight, hotel, or car'
      });
    }

    // Build provider filter for provider admins
    let providerFilter = null;
    if (req.admin.role === 'provider_admin') {
      providerFilter = {
        providerType: req.admin.providerType,
        providerName: req.admin.providerName
      };

      // If type is specified and doesn't match provider type, return empty
      if (type !== 'all' && type !== req.admin.providerType) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No data available for this type'
        });
      }
    }

    const results = await analyticsService.getTop10PropertiesByRevenue(
      yearNum,
      type,
      providerFilter
    );

    res.status(200).json({
      success: true,
      data: results,
      filters: {
        year: yearNum,
        type,
        ...(providerFilter && { provider: providerFilter.providerName })
      }
    });

  } catch (error) {
    console.error('Get top properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top properties'
    });
  }
};

/**
 * Get city-wise revenue per year
 * GET /api/analytics/city-revenue?year=2025&type=all
 */
const getCityRevenue = async (req, res) => {
  try {
    const { year, type = 'all' } = req.query;

    // Validate year
    if (!year) {
      return res.status(400).json({
        success: false,
        message: 'Year parameter is required'
      });
    }

    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year'
      });
    }

    // Validate type
    const validTypes = ['all', 'flight', 'hotel', 'car'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type. Must be: all, flight, hotel, or car'
      });
    }

    // Build provider filter for provider admins
    let providerFilter = null;
    if (req.admin.role === 'provider_admin') {
      providerFilter = {
        providerType: req.admin.providerType,
        providerName: req.admin.providerName
      };

      // If type is specified and doesn't match provider type, return empty
      if (type !== 'all' && type !== req.admin.providerType) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No data available for this type'
        });
      }
    }

    const results = await analyticsService.getCityWiseRevenue(
      yearNum,
      type,
      providerFilter
    );

    res.status(200).json({
      success: true,
      data: results,
      filters: {
        year: yearNum,
        type,
        ...(providerFilter && { provider: providerFilter.providerName })
      }
    });

  } catch (error) {
    console.error('Get city revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get city revenue'
    });
  }
};

/**
 * Get top 10 providers by bookings last month
 * GET /api/analytics/top-providers?type=flight
 */
const getTopProviders = async (req, res) => {
  try {
    const { type } = req.query;

    // Validate type
    const validTypes = ['flight', 'hotel', 'car'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type parameter is required. Must be: flight, hotel, or car'
      });
    }

    // Build provider filter for provider admins
    let providerFilter = null;
    if (req.admin.role === 'provider_admin') {
      // Provider admin can only see their own data
      if (type !== req.admin.providerType) {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No data available for this type'
        });
      }

      providerFilter = {
        providerType: req.admin.providerType,
        providerName: req.admin.providerName
      };
    }

    const results = await analyticsService.getTop10ProvidersByBookings(
      type,
      providerFilter
    );

    res.status(200).json({
      success: true,
      data: results,
      filters: {
        type,
        period: 'last_month',
        ...(providerFilter && { provider: providerFilter.providerName })
      }
    });

  } catch (error) {
    console.error('Get top providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get top providers'
    });
  }
};

/**
 * Get dashboard overview
 * GET /api/analytics/overview
 */
const getDashboardOverview = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Build provider filter
    let providerFilter = null;
    let providerType = 'all';
    
    if (req.admin.role === 'provider_admin') {
      providerFilter = {
        providerType: req.admin.providerType,
        providerName: req.admin.providerName
      };
      providerType = req.admin.providerType;
    }

    // Get data in parallel
    const [topProperties, cityRevenue, topProviders] = await Promise.all([
      analyticsService.getTop10PropertiesByRevenue(currentYear, providerType, providerFilter),
      analyticsService.getCityWiseRevenue(currentYear, providerType, providerFilter),
      providerType !== 'all' 
        ? analyticsService.getTop10ProvidersByBookings(providerType, providerFilter)
        : Promise.resolve([])
    ]);

    // Calculate totals
    const totalRevenue = topProperties.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
    const totalBookings = topProperties.reduce((sum, item) => sum + parseInt(item.total_bookings || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRevenue: totalRevenue.toFixed(2),
          totalBookings,
          year: currentYear,
          providerType,
          ...(providerFilter && { providerName: providerFilter.providerName })
        },
        topProperties: topProperties.slice(0, 5), // Top 5 for overview
        cityRevenue: cityRevenue.slice(0, 5), // Top 5 cities
        topProviders: topProviders.slice(0, 5) // Top 5 providers
      }
    });

  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard overview'
    });
  }
};

module.exports = {
  getTopProperties,
  getCityRevenue,
  getTopProviders,
  getDashboardOverview
};