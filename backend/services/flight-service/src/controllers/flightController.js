const Flight = require('../models/Flight');

// Helper function to process flight data for saving/updating
const processFlightData = (data) => {
  const processedData = { ...data };

  // Ensure duration.minutes is always 0 as per UI removal
  if (processedData.duration) {
    processedData.duration.minutes = 0;
  }

  // Ensure returnDuration.minutes is always 0
  if (processedData.returnDuration) {
    processedData.returnDuration.minutes = 0;
  }

  // Remove undefined values, but keep null values for return fields (they need to be validated)
  // Don't remove return flight fields even if they're null - let validation catch them
  Object.keys(processedData).forEach(key => {
    // Never delete return flight fields - they are required and must be validated
    if (key.startsWith('return')) {
      return; // Skip return fields
    }
    if (processedData[key] === undefined) {
      delete processedData[key];
    }
  });

  return processedData;
};

// Create new flight
exports.createFlight = async (req, res) => {
  try {
    // Debug: Log incoming data
    console.log('Create flight request body:', JSON.stringify(req.body, null, 2));
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Return fields in request body:', {
      returnFlightId: req.body.returnFlightId,
      returnDepartureDateTime: req.body.returnDepartureDateTime,
      returnArrivalDateTime: req.body.returnArrivalDateTime,
      returnDuration: req.body.returnDuration,
      returnTicketPrice: req.body.returnTicketPrice,
      returnFlightClass: req.body.returnFlightClass,
      returnTotalAvailableSeats: req.body.returnTotalAvailableSeats,
      returnAvailableSeats: req.body.returnAvailableSeats
    });
    
    // Check for required return flight fields before processing
    const requiredReturnFields = [
      'returnFlightId',
      'returnDepartureDateTime',
      'returnArrivalDateTime',
      'returnDuration',
      'returnTicketPrice',
      'returnFlightClass',
      'returnTotalAvailableSeats',
      'returnAvailableSeats'
    ];
    
    const missingFields = requiredReturnFields.filter(field => {
      if (field === 'returnDuration') {
        // Check if returnDuration exists and has hours > 0
        return !req.body.returnDuration || !req.body.returnDuration.hours || req.body.returnDuration.hours === 0;
      }
      // Check if field exists and is not empty string, null, or undefined
      const value = req.body[field];
      // Explicitly check for null, undefined, empty string, or empty after trimming
      if (value === null || value === undefined) {
        return true; // Field is missing
      }
      if (value === '') {
        return true; // Field is empty string
      }
      if (typeof value === 'string' && value.trim() === '') {
        return true; // Field is only whitespace
      }
      return false; // Field has a value
    });
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required return flight fields:', missingFields);
      console.error('Request body keys:', Object.keys(req.body));
      console.error('Request body return fields:', {
        returnFlightId: req.body.returnFlightId,
        returnDepartureDateTime: req.body.returnDepartureDateTime,
        returnArrivalDateTime: req.body.returnArrivalDateTime,
        returnDuration: req.body.returnDuration,
        returnTicketPrice: req.body.returnTicketPrice,
        returnFlightClass: req.body.returnFlightClass
      });
      return res.status(400).json({
        success: false,
        message: 'Missing required return flight fields',
        missingFields: missingFields,
        receivedData: Object.keys(req.body),
        details: missingFields.includes('returnDuration') 
          ? `Return duration is missing or invalid. Received: ${JSON.stringify(req.body.returnDuration)}`
          : undefined
      });
    }
    
    // Process the request body
    const flightData = processFlightData(req.body);
    
    // Debug: Log processed data
    console.log('Processed flight data:', JSON.stringify(flightData, null, 2));
    console.log('Return flight fields in processed data:', {
      returnFlightId: flightData.returnFlightId,
      returnDepartureDateTime: flightData.returnDepartureDateTime,
      returnArrivalDateTime: flightData.returnArrivalDateTime,
      returnDuration: flightData.returnDuration,
      returnTicketPrice: flightData.returnTicketPrice,
      returnFlightClass: flightData.returnFlightClass
    });
    
    // Validate the flight data before saving
    console.log('Creating Flight document with data keys:', Object.keys(flightData));
    console.log('Return fields in flightData before creating Flight:', {
      returnFlightId: flightData.returnFlightId,
      returnDepartureDateTime: flightData.returnDepartureDateTime,
      returnArrivalDateTime: flightData.returnArrivalDateTime,
      returnDuration: flightData.returnDuration,
      returnTicketPrice: flightData.returnTicketPrice
    });
    
    const flight = new Flight(flightData);
    
    // Log the flight document before validation
    console.log('Flight document created. Return fields in flight object:', {
      returnFlightId: flight.returnFlightId,
      returnDepartureDateTime: flight.returnDepartureDateTime,
      returnArrivalDateTime: flight.returnArrivalDateTime,
      returnDuration: flight.returnDuration,
      returnTicketPrice: flight.returnTicketPrice
    });
    
    // Explicitly validate before saving to catch any missing required fields
    try {
      await flight.validate();
      console.log('✅ Mongoose validation passed');
    } catch (validationError) {
      console.error('❌ Mongoose validation error:', validationError);
      console.error('Validation error details:', validationError.errors);
      return res.status(400).json({
        success: false,
        message: 'Flight validation failed',
        error: validationError.message,
        details: validationError.errors ? Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message
        })) : undefined
      });
    }
    
    await flight.save();
    console.log('✅ Flight saved to database');
    
    // Debug: Log saved flight
    console.log('Flight created successfully. Return flight fields:', {
      returnFlightId: flight.returnFlightId,
      returnDepartureDateTime: flight.returnDepartureDateTime,
      returnArrivalDateTime: flight.returnArrivalDateTime,
      returnTicketPrice: flight.returnTicketPrice,
      returnDuration: flight.returnDuration
    });

    res.status(201).json({
      success: true,
      message: 'Flight created successfully',
      data: flight
    });
  } catch (error) {
    console.error('Error creating flight:', error);
    console.error('Error details:', error.errors || error.message);
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Error creating flight',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
};

// Get all flights with filters
exports.getFlights = async (req, res) => {
  try {
    const {
      from,
      to,
      departureDate,
      returnDate,
      flightClass,
      minPrice,
      maxPrice,
      sortBy = 'departureDateTime',
      sortOrder = 'asc',
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};

    if (from) {
      // Support both airport code and city name search
      const fromUpper = from.toUpperCase();
      // Check if it's a 3-letter code (likely airport code)
      if (from.length === 3 && /^[A-Z]{3}$/.test(fromUpper)) {
        query['departureAirport.code'] = fromUpper;
      } else {
        // Search by city name
        query['departureAirport.city'] = new RegExp(from, 'i');
      }
    }

    if (to) {
      // Support both airport code and city name search
      const toUpper = to.toUpperCase();
      // Check if it's a 3-letter code (likely airport code)
      if (to.length === 3 && /^[A-Z]{3}$/.test(toUpper)) {
        query['arrivalAirport.code'] = toUpper;
      } else {
        // Search by city name
        query['arrivalAirport.city'] = new RegExp(to, 'i');
      }
    }

    if (departureDate) {
      // Parse the date string (format: YYYY-MM-DD)
      // Create date range for the entire day in UTC to avoid timezone issues
      const dateParts = departureDate.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        
        // Start of day in UTC (00:00:00.000)
        const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
        // End of day in UTC (23:59:59.999)
        const endDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
        
        query.departureDateTime = { $gte: startDate, $lte: endDate };
      } else {
        // Fallback for other date formats
        const searchDate = new Date(departureDate);
        const startDate = new Date(searchDate);
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date(searchDate);
        endDate.setUTCHours(23, 59, 59, 999);
        query.departureDateTime = { $gte: startDate, $lte: endDate };
      }
    }

    if (flightClass) {
      query.flightClass = flightClass;
    }

    if (minPrice || maxPrice) {
      query.ticketPrice = {};
      if (minPrice) query.ticketPrice.$gte = Number(minPrice);
      if (maxPrice) query.ticketPrice.$lte = Number(maxPrice);
    }

    // Only show flights with available seats
    query.availableSeats = { $gt: 0 };

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    const flights = await Flight.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Flight.countDocuments(query);

    res.json({
      success: true,
      data: flights,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching flights',
      error: error.message
    });
  }
};

// Get flight by ID
exports.getFlightById = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    res.json({
      success: true,
      data: flight
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching flight',
      error: error.message
    });
  }
};

// Get flight by flight ID
exports.getFlightByFlightId = async (req, res) => {
  try {
    const flight = await Flight.findOne({ flightId: req.params.flightId.toUpperCase() });
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    res.json({
      success: true,
      data: flight
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching flight',
      error: error.message
    });
  }
};

// Update flight
exports.updateFlight = async (req, res) => {
  try {
    // Debug: Log incoming data
    console.log('Update flight request body:', JSON.stringify(req.body, null, 2));
    
    // Check for required return flight fields before processing
    const requiredReturnFields = [
      'returnFlightId',
      'returnDepartureDateTime',
      'returnArrivalDateTime',
      'returnDuration',
      'returnTicketPrice',
      'returnFlightClass',
      'returnTotalAvailableSeats',
      'returnAvailableSeats'
    ];
    
    const missingFields = requiredReturnFields.filter(field => {
      if (field === 'returnDuration') {
        // Check if returnDuration exists and has hours > 0
        return !req.body.returnDuration || !req.body.returnDuration.hours || req.body.returnDuration.hours === 0;
      }
      // Check if field exists and is not empty string
      const value = req.body[field];
      return !value || value === '' || (typeof value === 'string' && value.trim() === '');
    });
    
    if (missingFields.length > 0) {
      console.error('Missing required return flight fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: 'Missing required return flight fields',
        missingFields: missingFields,
        receivedData: Object.keys(req.body)
      });
    }
    
    // Process the request body
    const updateData = processFlightData(req.body);
    
    // Debug: Log processed data
    console.log('Processed update data:', JSON.stringify(updateData, null, 2));
    console.log('Return flight fields in update data:', {
      returnFlightId: updateData.returnFlightId,
      returnDepartureDateTime: updateData.returnDepartureDateTime,
      returnArrivalDateTime: updateData.returnArrivalDateTime,
      returnDuration: updateData.returnDuration,
      returnTicketPrice: updateData.returnTicketPrice,
      returnFlightClass: updateData.returnFlightClass
    });
    
    // First, get the existing flight to merge with update data
    const existingFlight = await Flight.findById(req.params.id);
    if (!existingFlight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }
    
    // Merge update data with existing flight data to ensure all required fields are present
    // This is necessary because runValidators validates the entire document
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
        // Handle nested objects (like duration, returnDuration, airports)
        if (typeof updateData[key] === 'object' && !Array.isArray(updateData[key]) && !(updateData[key] instanceof Date) && updateData[key] !== null) {
          existingFlight[key] = { ...(existingFlight[key] || {}), ...updateData[key] };
        } else {
          existingFlight[key] = updateData[key];
        }
      }
    });
    
    // Debug: Log the merged data before validation
    console.log('Merged flight data before save:', {
      returnFlightId: existingFlight.returnFlightId,
      returnDepartureDateTime: existingFlight.returnDepartureDateTime,
      returnArrivalDateTime: existingFlight.returnArrivalDateTime,
      returnDuration: existingFlight.returnDuration,
      returnTicketPrice: existingFlight.returnTicketPrice,
      returnFlightClass: existingFlight.returnFlightClass,
      returnTotalAvailableSeats: existingFlight.returnTotalAvailableSeats,
      returnAvailableSeats: existingFlight.returnAvailableSeats
    });
    
    // Validate and save the document
    // This ensures all required fields (including return fields) are validated
    try {
      await existingFlight.validate();
    } catch (validationError) {
      console.error('Validation error:', validationError);
      console.error('Validation error details:', validationError.errors);
      throw validationError;
    }
    await existingFlight.save();
    
    // Fetch the updated flight to return it
    const flight = await Flight.findById(req.params.id);
    
    // Debug: Log saved flight
    console.log('Flight updated successfully. Return flight fields:', {
      returnFlightId: flight.returnFlightId,
      returnDepartureDateTime: flight.returnDepartureDateTime,
      returnArrivalDateTime: flight.returnArrivalDateTime,
      returnTicketPrice: flight.returnTicketPrice,
      returnDuration: flight.returnDuration
    });
    
    // Verify the update was successful by checking the database
    const verifyFlight = await Flight.findById(req.params.id).lean();
    console.log('Verification - Flight return fields in DB:', {
      returnFlightId: verifyFlight?.returnFlightId,
      returnDepartureDateTime: verifyFlight?.returnDepartureDateTime,
      returnArrivalDateTime: verifyFlight?.returnArrivalDateTime,
      returnTicketPrice: verifyFlight?.returnTicketPrice,
      returnDuration: verifyFlight?.returnDuration
    });

    res.json({
      success: true,
      message: 'Flight updated successfully',
      data: flight
    });
  } catch (error) {
    console.error('Error updating flight:', error);
    // Return more detailed error information
    const statusCode = error.name === 'ValidationError' ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: 'Error updating flight',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
};

// Delete flight
exports.deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    res.json({
      success: true,
      message: 'Flight deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting flight',
      error: error.message
    });
  }
};

// Add review
exports.addReview = async (req, res) => {
  try {
    const { userId, userName, rating, comment } = req.body;
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    // Add review
    flight.passengerReviews.push({
      userId,
      userName,
      rating,
      comment
    });

    // Update average rating
    const totalRating = flight.passengerReviews.reduce((sum, review) => sum + review.rating, 0);
    flight.flightRating.average = totalRating / flight.passengerReviews.length;
    flight.flightRating.count = flight.passengerReviews.length;

    await flight.save();

    res.json({
      success: true,
      message: 'Review added successfully',
      data: flight.passengerReviews[flight.passengerReviews.length - 1]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};

// Update available seats (for booking)
exports.updateSeats = async (req, res) => {
  try {
    const { seats } = req.body;
    const flight = await Flight.findById(req.params.id);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    if (flight.availableSeats < seats) {
      return res.status(400).json({
        success: false,
        message: 'Not enough seats available'
      });
    }

    flight.availableSeats -= seats;
    await flight.save();

    res.json({
      success: true,
      message: 'Seats updated successfully',
      data: {
        availableSeats: flight.availableSeats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating seats',
      error: error.message
    });
  }
};

