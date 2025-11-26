const Hotel = require('../models/Hotel');

exports.createHotel = async (req, res) => {
  try {
    console.log('Create hotel request body:', JSON.stringify(req.body, null, 2));
    console.log('Max guests in create request:', req.body.maxGuests);
    
    // Ensure maxGuests is set if not provided
    let maxGuestsValue = 1;
    if (req.body.maxGuests !== undefined && req.body.maxGuests !== null && req.body.maxGuests !== '') {
      maxGuestsValue = parseInt(req.body.maxGuests);
      if (isNaN(maxGuestsValue) || maxGuestsValue < 1) {
        maxGuestsValue = 1;
      }
    }
    
    // Explicitly set maxGuests to ensure it's saved
    req.body.maxGuests = maxGuestsValue;
    
    const hotel = new Hotel(req.body);
    // Explicitly set maxGuests on the hotel object to ensure Mongoose saves it
    hotel.maxGuests = maxGuestsValue;
    await hotel.save();
    
    console.log('Created hotel maxGuests:', hotel.maxGuests);
    console.log('Created hotel full data:', JSON.stringify(hotel.toObject(), null, 2));
    
    res.status(201).json({ success: true, message: 'Hotel created successfully', data: hotel });
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({ success: false, message: 'Error creating hotel', error: error.message });
  }
};

exports.getHotels = async (req, res) => {
  try {
    const { city, state, starRating, minPrice, maxPrice, sortBy = 'hotelRating.average', sortOrder = 'desc', page = 1, limit = 20 } = req.query;
    const query = {};
    
    if (city) {
      // Match city name (case-insensitive) - allow partial matches for multi-word cities
      // Escape special regex characters but allow spaces
      const cityTrimmed = city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use word boundary or start of string to match "new york" in "New York" or "New York City"
      query.city = new RegExp(`^${cityTrimmed}`, 'i');
    }
    if (state) query.state = new RegExp(state, 'i');
    if (starRating) query.starRating = Number(starRating);
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }
    query.availableRooms = { $gt: 0 };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (page - 1) * limit;

    const hotels = await Hotel.find(query).sort(sort).skip(skip).limit(Number(limit));
    const total = await Hotel.countDocuments(query);

    res.json({ success: true, data: hotels, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hotels', error: error.message });
  }
};

exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    
    console.log('Get hotel by ID - maxGuests:', hotel.maxGuests);
    
    res.json({ success: true, data: hotel });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hotel', error: error.message });
  }
};

exports.updateHotel = async (req, res) => {
  try {
    console.log('Update hotel request body:', JSON.stringify(req.body, null, 2));
    console.log('Max guests in request:', req.body.maxGuests);
    console.log('Max guests type:', typeof req.body.maxGuests);
    
    // Ensure maxGuests is a number if provided
    if (req.body.maxGuests !== undefined && req.body.maxGuests !== null && req.body.maxGuests !== '') {
      req.body.maxGuests = parseInt(req.body.maxGuests);
      if (isNaN(req.body.maxGuests) || req.body.maxGuests < 1) {
        req.body.maxGuests = 1;
      }
    } else {
      // If maxGuests is not provided, keep existing value or set to 1
      const existingHotel = await Hotel.findById(req.params.id).lean();
      if (existingHotel && existingHotel.maxGuests) {
        req.body.maxGuests = existingHotel.maxGuests;
      } else {
        req.body.maxGuests = 1;
      }
    }
    
    console.log('Max guests after processing:', req.body.maxGuests);
    
    // Use updateOne with $set to ensure all fields including maxGuests are saved
    const updateResult = await Hotel.updateOne(
      { _id: req.params.id },
      { $set: req.body },
      { runValidators: true }
    );
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }
    
    console.log('Update result:', updateResult);
    console.log('Modified count:', updateResult.modifiedCount);
    
    // Fetch the updated hotel to return
    const hotel = await Hotel.findById(req.params.id);
    
    console.log('Updated hotel maxGuests:', hotel?.maxGuests);
    console.log('Updated hotel full data:', JSON.stringify(hotel.toObject(), null, 2));
    
    res.json({ success: true, message: 'Hotel updated successfully', data: hotel });
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ success: false, message: 'Error updating hotel', error: error.message });
  }
};

exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    res.json({ success: true, message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting hotel', error: error.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { userId, userName, rating, comment } = req.body;
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });
    
    hotel.guestReviews.push({ userId, userName, rating, comment });
    const totalRating = hotel.guestReviews.reduce((sum, review) => sum + review.rating, 0);
    hotel.hotelRating.average = totalRating / hotel.guestReviews.length;
    hotel.hotelRating.count = hotel.guestReviews.length;
    await hotel.save();

    res.json({ success: true, message: 'Review added successfully', data: hotel.guestReviews[hotel.guestReviews.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding review', error: error.message });
  }
};

// Update available rooms (for booking)
exports.updateRooms = async (req, res) => {
  try {
    const { rooms } = req.body;
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    if (hotel.availableRooms < rooms) {
      return res.status(400).json({
        success: false,
        message: 'Not enough rooms available'
      });
    }

    hotel.availableRooms -= rooms;
    await hotel.save();

    res.json({
      success: true,
      message: 'Rooms updated successfully',
      data: {
        availableRooms: hotel.availableRooms
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating rooms',
      error: error.message
    });
  }
};

