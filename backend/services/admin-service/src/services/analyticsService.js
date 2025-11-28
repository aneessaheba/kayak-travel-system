const { query } = require('../config/mysql');
const { getFlightsDB, getHotelsDB, getCarsDB } = require('../config/mongodb');
const { get: getCache, set: setCache } = require('../config/redis');
const config = require('../config/config');

/**
 * Analytics Service
 * Provides helper functions for dashboard analytics
 */

// ==================== REVENUE ANALYTICS ====================

/**
 * Get top 10 properties with revenue per year
 * @param {number} year - Year to analyze
 * @param {string} listingType - 'flight', 'hotel', 'car', or 'all'
 * @returns {Array} Top 10 properties with revenue
 */
const getTop10PropertiesByRevenue = async (year, listingType = 'all', providerFilter = null) => {
  const cacheKey = `analytics:top10:${year}:${listingType}:${providerFilter || 'all'}`;
  
  // Try cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`📦 Cache HIT: ${cacheKey}`);
    return cached;
  }

  console.log(`🔍 Cache MISS: ${cacheKey} - Querying database...`);

  let sql = `
    SELECT 
      b.listing_id,
      b.booking_type,
      COUNT(b.booking_id) as total_bookings,
      SUM(bil.total_amount) as total_revenue
    FROM bookings b
    INNER JOIN billing bil ON b.booking_id = bil.booking_id
    WHERE YEAR(bil.transaction_date) = ?
      AND bil.transaction_status = 'completed'
  `;

  const params = [year];

  // Filter by booking type if specified
  if (listingType !== 'all') {
    sql += ` AND b.booking_type = ?`;
    params.push(listingType);
  }

  sql += `
    GROUP BY b.listing_id, b.booking_type
    ORDER BY total_revenue DESC
    LIMIT 10
  `;

  const results = await query(sql, params);

  // Enrich with listing details from MongoDB
  const enrichedResults = await enrichListingData(results);

  // Apply provider filter if needed (for provider admins)
  let finalResults = enrichedResults;
  if (providerFilter) {
    finalResults = enrichedResults.filter(item => {
      if (!item.listingDetails) return false;
      
      switch (item.booking_type) {
        case 'flight':
          return item.listingDetails.airline === providerFilter.providerName;
        case 'hotel':
          return item.listingDetails.hotelName === providerFilter.providerName;
        case 'car':
          return item.listingDetails.company === providerFilter.providerName;
        default:
          return false;
      }
    });
  }

  // Cache results
  await setCache(cacheKey, finalResults, config.redis.cacheTTL);

  return finalResults;
};

/**
 * Get city-wise revenue per year
 * @param {number} year - Year to analyze
 * @param {string} listingType - 'flight', 'hotel', 'car', or 'all'
 * @returns {Array} City-wise revenue breakdown
 */
const getCityWiseRevenue = async (year, listingType = 'all', providerFilter = null) => {
  const cacheKey = `analytics:citywise:${year}:${listingType}:${providerFilter || 'all'}`;
  
  // Try cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`📦 Cache HIT: ${cacheKey}`);
    return cached;
  }

  console.log(`🔍 Cache MISS: ${cacheKey} - Querying database...`);

  let sql = `
    SELECT 
      b.listing_id,
      b.booking_type,
      SUM(bil.total_amount) as total_revenue,
      COUNT(b.booking_id) as total_bookings
    FROM bookings b
    INNER JOIN billing bil ON b.booking_id = bil.booking_id
    WHERE YEAR(bil.transaction_date) = ?
      AND bil.transaction_status = 'completed'
  `;

  const params = [year];

  if (listingType !== 'all') {
    sql += ` AND b.booking_type = ?`;
    params.push(listingType);
  }

  sql += ` GROUP BY b.listing_id, b.booking_type`;

  const results = await query(sql, params);

  // Enrich with location data from MongoDB
  const cityData = await enrichWithCityData(results, providerFilter);

  // Aggregate by city
  const cityAggregated = cityData.reduce((acc, item) => {
    if (!item.city) return acc;

    if (!acc[item.city]) {
      acc[item.city] = {
        city: item.city,
        state: item.state,
        total_revenue: 0,
        total_bookings: 0,
        breakdown: {
          flight: 0,
          hotel: 0,
          car: 0
        }
      };
    }

    acc[item.city].total_revenue += parseFloat(item.total_revenue);
    acc[item.city].total_bookings += parseInt(item.total_bookings);
    acc[item.city].breakdown[item.booking_type] += parseFloat(item.total_revenue);

    return acc;
  }, {});

  const finalResults = Object.values(cityAggregated)
    .sort((a, b) => b.total_revenue - a.total_revenue);

  // Cache results
  await setCache(cacheKey, finalResults, config.redis.cacheTTL);

  return finalResults;
};

/**
 * Get top 10 providers with maximum properties sold last month
 * @param {string} listingType - 'flight', 'hotel', 'car'
 * @returns {Array} Top 10 providers by bookings
 */
const getTop10ProvidersByBookings = async (listingType, providerFilter = null) => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const year = lastMonth.getFullYear();
  const month = lastMonth.getMonth() + 1;

  const cacheKey = `analytics:providers:${year}-${month}:${listingType}:${providerFilter || 'all'}`;
  
  // Try cache first
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log(`📦 Cache HIT: ${cacheKey}`);
    return cached;
  }

  console.log(`🔍 Cache MISS: ${cacheKey} - Querying database...`);

  const sql = `
    SELECT 
      b.listing_id,
      b.booking_type,
      COUNT(b.booking_id) as total_bookings,
      SUM(bil.total_amount) as total_revenue
    FROM bookings b
    INNER JOIN billing bil ON b.booking_id = bil.booking_id
    WHERE YEAR(bil.transaction_date) = ?
      AND MONTH(bil.transaction_date) = ?
      AND b.booking_type = ?
      AND bil.transaction_status = 'completed'
    GROUP BY b.listing_id, b.booking_type
  `;

  const results = await query(sql, [year, month, listingType]);

  // Enrich with provider data
  const enrichedResults = await enrichWithProviderData(results, listingType, providerFilter);

  // Aggregate by provider
  const providerAggregated = enrichedResults.reduce((acc, item) => {
    if (!item.providerName) return acc;

    if (!acc[item.providerName]) {
      acc[item.providerName] = {
        providerName: item.providerName,
        providerType: listingType,
        total_properties: 0,
        total_bookings: 0,
        total_revenue: 0
      };
    }

    acc[item.providerName].total_properties += 1;
    acc[item.providerName].total_bookings += parseInt(item.total_bookings);
    acc[item.providerName].total_revenue += parseFloat(item.total_revenue);

    return acc;
  }, {});

  const finalResults = Object.values(providerAggregated)
    .sort((a, b) => b.total_bookings - a.total_bookings)
    .slice(0, 10);

  // Cache results
  await setCache(cacheKey, finalResults, config.redis.cacheTTL);

  return finalResults;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Enrich booking data with listing details from MongoDB
 */
const enrichListingData = async (bookings) => {
  const flightsDB = getFlightsDB();
  const hotelsDB = getHotelsDB();
  const carsDB = getCarsDB();

  const enriched = await Promise.all(
    bookings.map(async (booking) => {
      let listingDetails = null;

      try {
        switch (booking.booking_type) {
          case 'flight':
            listingDetails = await flightsDB.collection('flights').findOne({ flightId: booking.listing_id });
            break;
          case 'hotel':
            listingDetails = await hotelsDB.collection('hotels').findOne({ hotelId: booking.listing_id });
            break;
          case 'car':
            listingDetails = await carsDB.collection('cars').findOne({ carId: booking.listing_id });
            break;
        }
      } catch (error) {
        console.error(`Error fetching listing ${booking.listing_id}:`, error.message);
      }

      return {
        ...booking,
        listingDetails
      };
    })
  );

  return enriched;
};

/**
 * Enrich booking data with city information
 */
const enrichWithCityData = async (bookings, providerFilter) => {
  const flightsDB = getFlightsDB();
  const hotelsDB = getHotelsDB();
  const carsDB = getCarsDB();

  const enriched = await Promise.all(
    bookings.map(async (booking) => {
      let city = null;
      let state = null;

      try {
        let listing;
        switch (booking.booking_type) {
          case 'flight':
            listing = await flightsDB.collection('flights').findOne({ flightId: booking.listing_id });
            if (listing) {
              // Apply provider filter
              if (providerFilter && listing.airline !== providerFilter.providerName) {
                return null;
              }
              city = listing.departureAirport?.city;
              state = listing.departureAirport?.country;
            }
            break;
          case 'hotel':
            listing = await hotelsDB.collection('hotels').findOne({ hotelId: booking.listing_id });
            if (listing) {
              // Apply provider filter
              if (providerFilter && listing.hotelName !== providerFilter.providerName) {
                return null;
              }
              city = listing.city;
              state = listing.state;
            }
            break;
          case 'car':
            listing = await carsDB.collection('cars').findOne({ carId: booking.listing_id });
            if (listing) {
              // Apply provider filter
              if (providerFilter && listing.company !== providerFilter.providerName) {
                return null;
              }
              city = listing.location?.city;
              state = listing.location?.state;
            }
            break;
        }
      } catch (error) {
        console.error(`Error fetching city for listing ${booking.listing_id}:`, error.message);
      }

      return {
        ...booking,
        city,
        state
      };
    })
  );

  return enriched.filter(item => item !== null);
};

/**
 * Enrich booking data with provider information
 */
const enrichWithProviderData = async (bookings, listingType, providerFilter) => {
  const flightsDB = getFlightsDB();
  const hotelsDB = getHotelsDB();
  const carsDB = getCarsDB();

  const enriched = await Promise.all(
    bookings.map(async (booking) => {
      let providerName = null;

      try {
        let listing;
        switch (listingType) {
          case 'flight':
            listing = await flightsDB.collection('flights').findOne({ flightId: booking.listing_id });
            providerName = listing?.airline;
            break;
          case 'hotel':
            listing = await hotelsDB.collection('hotels').findOne({ hotelId: booking.listing_id });
            providerName = listing?.hotelName;
            break;
          case 'car':
            listing = await carsDB.collection('cars').findOne({ carId: booking.listing_id });
            providerName = listing?.company;
            break;
        }

        // Apply provider filter
        if (providerFilter && providerName !== providerFilter.providerName) {
          return null;
        }
      } catch (error) {
        console.error(`Error fetching provider for listing ${booking.listing_id}:`, error.message);
      }

      return {
        ...booking,
        providerName
      };
    })
  );

  return enriched.filter(item => item !== null && item.providerName);
};

module.exports = {
  getTop10PropertiesByRevenue,
  getCityWiseRevenue,
  getTop10ProvidersByBookings
};