const Car = require('../models/Car');

exports.createCar = async (req, res) => {
  try {
    const car = new Car(req.body);
    await car.save();
    res.status(201).json({ success: true, message: 'Car created successfully', data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating car', error: error.message });
  }
};

exports.getCars = async (req, res) => {
  try {
    const { carType, city, minPrice, maxPrice, pickupDate, returnDate, sortBy = 'dailyRentalPrice', sortOrder = 'asc', page = 1, limit = 20 } = req.query;
    const query = { availabilityStatus: 'available' };
    
    if (carType) query.carType = carType;
    if (city) {
      // Match city name from the start (case-insensitive) to prevent partial matches
      const cityTrimmed = city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
      query['location.city'] = new RegExp(`^${cityTrimmed}`, 'i');
    }
    if (minPrice || maxPrice) {
      query.dailyRentalPrice = {};
      if (minPrice) query.dailyRentalPrice.$gte = Number(minPrice);
      if (maxPrice) query.dailyRentalPrice.$lte = Number(maxPrice);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (page - 1) * limit;

    // First, get all cars matching the basic criteria
    let cars = await Car.find(query).sort(sort).skip(skip).limit(Number(limit));
    
    // If pickupDate and returnDate are provided, filter out cars that are booked for those dates
    if (pickupDate && returnDate) {
      const pickup = new Date(pickupDate);
      const returnD = new Date(returnDate);
      
      // Set time to start/end of day for accurate comparison
      pickup.setUTCHours(0, 0, 0, 0);
      returnD.setUTCHours(23, 59, 59, 999);
      
      cars = cars.filter(car => {
        // Check if car has any bookings that overlap with the requested dates
        if (!car.bookings || car.bookings.length === 0) {
          return true; // Car is available if no bookings
        }
        
        // Check for date overlap: booking overlaps if:
        // - booking pickup <= requested return AND booking return >= requested pickup
        const hasOverlap = car.bookings.some(booking => {
          const bookingPickup = new Date(booking.pickupDate);
          const bookingReturn = new Date(booking.returnDate);
          bookingPickup.setUTCHours(0, 0, 0, 0);
          bookingReturn.setUTCHours(23, 59, 59, 999);
          
          // Overlap exists if booking dates intersect with requested dates
          return bookingPickup <= returnD && bookingReturn >= pickup;
        });
        
        // Car is available if no overlap found
        return !hasOverlap;
      });
    }

    const total = await Car.countDocuments(query);

    res.json({ success: true, data: cars, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cars', error: error.message });
  }
};

exports.getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching car', error: error.message });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, message: 'Car updated successfully', data: car });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating car', error: error.message });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, message: 'Car deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting car', error: error.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { userId, userName, rating, comment } = req.body;
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    
    car.customerReviews.push({ userId, userName, rating, comment });
    const totalRating = car.customerReviews.reduce((sum, review) => sum + review.rating, 0);
    car.carRating.average = totalRating / car.customerReviews.length;
    car.carRating.count = car.customerReviews.length;
    await car.save();

    res.json({ success: true, message: 'Review added successfully', data: car.customerReviews[car.customerReviews.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding review', error: error.message });
  }
};

// Add booking dates (for booking)
exports.addBooking = async (req, res) => {
  try {
    const { pickupDate, returnDate, bookingId, userId } = req.body;
    const car = await Car.findById(req.params.id);

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found'
      });
    }

    // Validate dates
    if (!pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date and return date are required'
      });
    }

    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    
    if (returnD <= pickup) {
      return res.status(400).json({
        success: false,
        message: 'Return date must be after pickup date'
      });
    }

    // Check if car is already booked for these dates
    if (car.bookings && car.bookings.length > 0) {
      pickup.setUTCHours(0, 0, 0, 0);
      returnD.setUTCHours(23, 59, 59, 999);
      
      const hasOverlap = car.bookings.some(booking => {
        const bookingPickup = new Date(booking.pickupDate);
        const bookingReturn = new Date(booking.returnDate);
        bookingPickup.setUTCHours(0, 0, 0, 0);
        bookingReturn.setUTCHours(23, 59, 59, 999);
        
        // Overlap exists if booking dates intersect with requested dates
        return bookingPickup <= returnD && bookingReturn >= pickup;
      });

      if (hasOverlap) {
        return res.status(400).json({
          success: false,
          message: 'Car is already booked for the selected dates'
        });
      }
    }

    // Initialize bookings array if it doesn't exist
    if (!car.bookings) {
      car.bookings = [];
    }

    // Add the booking
    car.bookings.push({
      pickupDate: pickup,
      returnDate: returnD,
      bookingId: bookingId || `BOOK-${Date.now()}`,
      userId: userId || 'unknown'
    });

    await car.save();

    res.json({
      success: true,
      message: 'Booking added successfully',
      data: {
        bookings: car.bookings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding booking',
      error: error.message
    });
  }
};

