import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { 
  FaFilter, FaSort, FaTimes, FaStar, FaPlane, FaHotel, FaCar,
  FaClock, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaDumbbell,
  FaParking, FaUtensils, FaSnowflake, FaTv, FaShieldAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import BookingCard from '../components/BookingCard';
import { fetchFlights } from '../store/slices/flightSlice';
import { fetchHotels } from '../store/slices/hotelSlice';
import { fetchCars } from '../store/slices/carSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import { SkeletonCard } from '../components/Skeleton';

const SearchResults = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const searchType = searchParams.get('type') || 'flights';
  
  const flights = useSelector((state) => state.flights);
  const hotels = useSelector((state) => state.hotels);
  const cars = useSelector((state) => state.cars);

  const [showFilters, setShowFilters] = useState(true);
  
  useEffect(() => {
    // Show filters by default on desktop, hide on mobile
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowFilters(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [sortBy, setSortBy] = useState('price');
  const getDefaultPriceMax = (type) => {
    switch (type) {
      case 'cars':
        return 500;
      case 'hotels':
        return 1500;
      default:
        return 3000;
    }
  };

  const [priceRange, setPriceRange] = useState([0, getDefaultPriceMax(searchType)]);
  const priceSliderMax = getDefaultPriceMax(searchType);
  
  // Flight filters
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [departureTime, setDepartureTime] = useState('');
  const [duration, setDuration] = useState('');
  const [cabinClass, setCabinClass] = useState('');
  
  // Hotel filters
  const [starRating, setStarRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  
  // Car filters
  const [carType, setCarType] = useState('');
  const [transmission, setTransmission] = useState('');
  const [seats, setSeats] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [rentalCompany, setRentalCompany] = useState('');
  
  // Background images based on search type
  const backgroundImages = {
    flights: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
    cars: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'
  };
  
  const currentBgImage = backgroundImages[searchType] || backgroundImages.flights;

  useEffect(() => {
    const params = {
      page: 1,
      limit: 20,
      sortBy,
      sortOrder: sortBy.includes('desc') ? 'desc' : 'asc',
    };

    if (searchType === 'flights') {
      // For flights, search by city name or airport code
      // The backend supports both - it checks if input is a 3-letter code (airport) or city name
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const returnDate = searchParams.get('returnDate');
      
      if (from) {
        params.from = from; // Backend will handle both airport codes and city names
      }
      if (to) {
        params.to = to; // Backend will handle both airport codes and city names
      }
      if (searchParams.get('departureDate')) params.departureDate = searchParams.get('departureDate');
      
      // Fetch outbound flights
      dispatch(fetchFlights(params));
      
      // If return date is provided, also fetch return flights (reverse direction)
      if (returnDate && from && to) {
        const returnParams = {
          from: to,  // Reverse: from becomes the destination
          to: from,  // Reverse: to becomes the origin
          departureDate: returnDate,  // Use return date
          page: params.page || 1,
          limit: params.limit || 20,
          sortBy: params.sortBy || 'price',
          sortOrder: params.sortOrder || 'asc',
          isReturn: true,  // Mark as return flight search (for Redux, not API)
        };
        dispatch(fetchFlights(returnParams));
      }
    } else if (searchType === 'hotels') {
      if (searchParams.get('city')) params.city = searchParams.get('city');
      if (searchParams.get('checkIn')) params.checkIn = searchParams.get('checkIn');
      dispatch(fetchHotels(params));
    } else if (searchType === 'cars') {
      if (searchParams.get('city')) params.city = searchParams.get('city');
      // Add pickup and return dates for car availability checking
      if (searchParams.get('pickupDate')) params.pickupDate = searchParams.get('pickupDate');
      if (searchParams.get('dropoffDate')) params.returnDate = searchParams.get('dropoffDate');
      dispatch(fetchCars(params));
    }
  }, [searchType, searchParams, sortBy, dispatch]);

  const getResults = () => {
    if (searchType === 'flights') {
      const returnDate = searchParams.get('returnDate');
      const flightList = flights.flights || [];
      
      // First, check if flights have embedded return flight data (returnDepartureDateTime)
      // These flights already have return information and should be displayed with return details
      const flightsWithReturnData = flightList.filter(flight => 
        flight.returnDepartureDateTime && flight.returnFlightId
      );
      
      // If return date is provided, also create round-trip combinations from separate flights
      if (returnDate && flights.returnFlights && flights.returnFlights.length > 0 && flightList.length > 0) {
        // Create combinations of outbound and return flights
        const roundTripFlights = [];
        flightList.forEach(outbound => {
          flights.returnFlights.forEach(returnFlight => {
            roundTripFlights.push({
              _id: `${outbound._id || outbound.id}_${returnFlight._id || returnFlight.id}`,
              id: `${outbound._id || outbound.id}_${returnFlight._id || returnFlight.id}`,
              outbound: outbound,
              return: returnFlight,
              isRoundTrip: true,
              // Total price is sum of both flights
              ticketPrice: (outbound.ticketPrice || outbound.fare || outbound.price || 0) + (returnFlight.ticketPrice || returnFlight.fare || returnFlight.price || 0),
              // Use outbound flight's airline for display
              airline: outbound.airline || returnFlight.airline || 'Airline',
            });
          });
        });
        
        // Combine flights with embedded return data and round-trip combinations
        // Remove duplicates (flights that already have return data shouldn't be combined again)
        const flightsWithoutReturn = flightList.filter(flight => 
          !flight.returnDepartureDateTime || !flight.returnFlightId
        );
        const combinedFlights = [...flightsWithReturnData, ...roundTripFlights];
        return combinedFlights.length > 0 ? combinedFlights : flightList;
      }
      
      // If no return date search, still return flights with embedded return data
      // These will be displayed with return flight information
      return flightList;
    }
    if (searchType === 'hotels') return hotels.hotels || [];
    if (searchType === 'cars') return cars.cars || [];
    return [];
  };

  const getLoading = () => {
    if (searchType === 'flights') return flights.loading || flights.returnLoading;
    if (searchType === 'hotels') return hotels.loading;
    if (searchType === 'cars') return cars.loading;
    return false;
  };

  const AMENITY_KEYWORDS = {
    wifi: ['wifi', 'wi-fi', 'internet'],
    pool: ['pool'],
    gym: ['gym', 'fitness'],
    parking: ['parking'],
    restaurant: ['restaurant', 'dining'],
    ac: ['air', 'ac'],
    tv: ['tv', 'television'],
    security: ['security', 'guard']
  };

  function parseTimeStringToHour(timeString) {
    if (!timeString || typeof timeString !== 'string') return null;
    const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hour = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return hour + minutes / 60;
  }

  function getDepartureHour(flight) {
    if (flight.departureDateTime) {
      return new Date(flight.departureDateTime).getHours();
    }
    if (flight.departureTime) {
      const parsed = parseTimeStringToHour(flight.departureTime);
      return parsed !== null ? Math.floor(parsed) : null;
    }
    return null;
  }

  function matchesDepartureWindow(flight, window) {
    if (!window) return true;
    const hour = getDepartureHour(flight);
    if (hour === null) return true;
    switch (window) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'evening':
        return hour >= 18 && hour < 24;
      case 'night':
        return hour >= 0 && hour < 6;
      default:
        return true;
    }
  }

  function getDurationMinutes(flight) {
    if (flight.duration) {
      const hours = flight.duration.hours || 0;
      const minutes = flight.duration.minutes || 0;
      return hours * 60 + minutes;
    }
    if (flight.departureDateTime && flight.arrivalDateTime) {
      return Math.abs(new Date(flight.arrivalDateTime) - new Date(flight.departureDateTime)) / 60000;
    }
    return null;
  }

  function matchesDurationFilter(flight, durationFilter) {
    if (!durationFilter) return true;
    const minutes = getDurationMinutes(flight);
    if (minutes === null) return true;
    switch (durationFilter) {
      case 'short':
        return minutes <= 180;
      case 'medium':
        return minutes > 180 && minutes <= 360;
      case 'long':
        return minutes > 360 && minutes <= 720;
      case 'very-long':
        return minutes > 720;
      default:
        return true;
    }
  }

  function hotelHasAmenity(hotel, amenityId) {
    const amenitiesList = (hotel.amenities || []).map((a) => a.toLowerCase());
    const keywords = AMENITY_KEYWORDS[amenityId];
    if (!keywords) return true;
    return keywords.some((keyword) => amenitiesList.some((amenity) => amenity.includes(keyword)));
  }

  function inferFuelType(car) {
    // Check various possible field names for fuel type
    if (car.fuelType) return String(car.fuelType).trim();
    if (car.fuel) return String(car.fuel).trim();
    // Fallback: infer from car ID if no fuel type is set
    const identifier = car.carId || car._id || '0';
    const numeric = parseInt(String(identifier).replace(/\D/g, ''), 10) || 0;
    return fuelTypes[numeric % fuelTypes.length];
  }

  function getItemPrice(item) {
    switch (searchType) {
      case 'flights':
        // For round-trip flights, use the combined price
        if (item.isRoundTrip) {
          return item.ticketPrice ?? null;
        }
        return item.ticketPrice ?? item.fare ?? item.price ?? null;
      case 'hotels':
        return item.pricePerNight ?? item.price ?? null;
      case 'cars':
        return item.dailyRentalPrice ?? item.pricePerDay ?? item.price ?? null;
      default:
        return null;
    }
  }

  const results = getResults();
  const loading = getLoading();

  const filteredResults = useMemo(() => {
    if (!results || results.length === 0) return [];

    const filtered = results.filter((item) => {
      const price = getItemPrice(item);
      if (price !== null) {
        if (price < priceRange[0] || price > priceRange[1]) return false;
      }

      if (searchType === 'flights') {
        // For round-trip flights, check both outbound and return
        const flightToCheck = item.isRoundTrip ? item.outbound : item;
        const returnFlightToCheck = item.isRoundTrip ? item.return : null;
        
        if (selectedAirlines.length > 0) {
          // For round-trip flights, both legs must match selected airlines
          // For one-way flights, just the outbound must match
          const outboundAirline = flightToCheck?.airline?.trim();
          const outboundMatch = outboundAirline && selectedAirlines.some(selected => 
            selected.trim().toLowerCase() === outboundAirline.toLowerCase()
          );
          
          if (item.isRoundTrip && returnFlightToCheck) {
            // Round-trip: both outbound and return must match
            const returnAirline = returnFlightToCheck?.airline?.trim();
            const returnMatch = returnAirline && selectedAirlines.some(selected => 
              selected.trim().toLowerCase() === returnAirline.toLowerCase()
            );
            if (!outboundMatch || !returnMatch) return false;
          } else {
            // One-way: only outbound must match
            if (!outboundMatch) return false;
          }
        }
        if (departureTime) {
          const outboundMatch = matchesDepartureWindow(flightToCheck, departureTime);
          const returnMatch = returnFlightToCheck ? matchesDepartureWindow(returnFlightToCheck, departureTime) : true;
          if (!outboundMatch && !returnMatch) return false;
        }
        if (duration) {
          const outboundMatch = matchesDurationFilter(flightToCheck, duration);
          const returnMatch = returnFlightToCheck ? matchesDurationFilter(returnFlightToCheck, duration) : true;
          if (!outboundMatch && !returnMatch) return false;
        }
        if (cabinClass) {
          const outboundMatch = flightToCheck.flightClass === cabinClass;
          const returnMatch = returnFlightToCheck ? returnFlightToCheck.flightClass === cabinClass : true;
          if (!outboundMatch && !returnMatch) return false;
        }
      } else if (searchType === 'hotels') {
        // Filter by city if specified in search params
        const searchCity = searchParams.get('city');
        if (searchCity) {
          const itemCity = (item.city || '').toLowerCase().trim();
          const searchCityLower = searchCity.toLowerCase().trim();
          // Must match exactly or start with the search city
          if (!itemCity.startsWith(searchCityLower)) return false;
        }
        // Star rating filter: show hotels with rating >= selected rating
        if (starRating > 0) {
          const itemRating = Number(item.starRating) || 0;
          if (itemRating < starRating) return false;
        }
        if (selectedAmenities.length && !selectedAmenities.every((amenity) => hotelHasAmenity(item, amenity))) return false;
      } else if (searchType === 'cars') {
        // Filter by city if specified in search params
        const searchCity = searchParams.get('city');
        if (searchCity) {
          const itemCity = (item.location?.city || item.pickupLocation || item.city || '').toLowerCase().trim();
          const searchCityLower = searchCity.toLowerCase().trim();
          // Must match exactly or start with the search city
          if (!itemCity.startsWith(searchCityLower)) return false;
        }
        if (carType && item.carType !== carType) return false;
        if (transmission && (item.transmissionType || item.transmission || '').toLowerCase() !== transmission.toLowerCase()) return false;
        if (seats && (item.numberOfSeats || item.seats || '').toString() !== seats) return false;
        if (fuelType) {
          const itemFuelType = inferFuelType(item);
          if (itemFuelType.toLowerCase() !== fuelType.toLowerCase()) return false;
        }
        if (rentalCompany && item.company !== rentalCompany) return false;
      }

      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const priceA = getItemPrice(a) ?? 0;
      const priceB = getItemPrice(b) ?? 0;
      if (sortBy === 'price-desc') {
        return priceB - priceA;
      }
      return priceA - priceB;
    });

    return sorted;
  }, [
    results,
    searchType,
    searchParams,
    priceRange,
    selectedAirlines,
    departureTime,
    duration,
    cabinClass,
    starRating,
    selectedAmenities,
    carType,
    transmission,
    seats,
    fuelType,
    rentalCompany,
    sortBy,
  ]);

  // Mock data structure for BookingCard - will be replaced with actual data
  const mockResults = [
    {
      id: 1,
      type: 'flight',
      from: 'NYC',
      to: 'LON',
      airline: 'American Airlines',
      flightNumber: 'AA123',
      departureTime: '08:00 AM',
      arrivalTime: '08:30 PM',
      passengers: 2,
      price: '$650',
      originalPrice: '$850',
      rating: 4.5,
    },
    {
      id: 2,
      type: 'hotel',
      name: 'Grand Plaza Hotel',
      location: 'Paris, France',
      address: '123 Champs-Élysées',
      stars: 5,
      checkIn: 'Dec 15, 2024',
      checkOut: 'Dec 20, 2024',
      price: '$120/night',
      originalPrice: '$150/night',
      rating: 4.8,
    },
    {
      id: 3,
      type: 'car',
      brand: 'BMW',
      model: '3 Series',
      type: 'Sedan',
      transmission: 'Automatic',
      pickupLocation: 'Airport',
      pickupDate: 'Dec 15, 2024',
      seats: 5,
      price: '$45/day',
      originalPrice: '$60/day',
      rating: 4.7,
    },
  ];

  const sortOptions = [
    { value: 'price', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
  ];

  // Filter options
  // Get unique airlines from the results dynamically
  const getAvailableAirlines = () => {
    if (searchType !== 'flights') return [];
    const airlineSet = new Set();
    results.forEach(item => {
      if (item.isRoundTrip && item.outbound) {
        if (item.outbound.airline) airlineSet.add(item.outbound.airline);
        if (item.return?.airline) airlineSet.add(item.return.airline);
      } else if (item.airline) {
        airlineSet.add(item.airline);
      }
    });
    return Array.from(airlineSet).sort();
  };
  
  const airlines = getAvailableAirlines().length > 0 
    ? getAvailableAirlines() 
    : ['American Airlines', 'Delta', 'United', 'Southwest', 'JetBlue', 'Alaska Airlines', 'British Airways'];
  const departureTimes = [
    { value: 'morning', label: 'Morning (6AM-12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM-6PM)' },
    { value: 'evening', label: 'Evening (6PM-12AM)' },
    { value: 'night', label: 'Night (12AM-6AM)' }
  ];
  const durations = [
    { value: 'short', label: 'Short (< 3 hours)' },
    { value: 'medium', label: 'Medium (3-6 hours)' },
    { value: 'long', label: 'Long (6-12 hours)' },
    { value: 'very-long', label: 'Very Long (> 12 hours)' }
  ];
  const cabinClasses = ['Economy', 'Premium Economy', 'Business', 'First Class'];
  
  const amenities = [
    { id: 'wifi', label: 'Free WiFi', icon: FaWifi },
    { id: 'pool', label: 'Swimming Pool', icon: FaSwimmingPool },
    { id: 'gym', label: 'Fitness Center', icon: FaDumbbell },
    { id: 'parking', label: 'Parking', icon: FaParking },
    { id: 'restaurant', label: 'Restaurant', icon: FaUtensils },
    { id: 'ac', label: 'Air Conditioning', icon: FaSnowflake },
    { id: 'tv', label: 'TV', icon: FaTv },
    { id: 'security', label: '24/7 Security', icon: FaShieldAlt }
  ];
  const carTypes = ['Sedan', 'SUV', 'Hatchback', 'Convertible', 'Luxury', 'Van', 'Truck'];
  const transmissionTypes = ['Automatic', 'Manual'];
  const seatsOptions = ['2', '4', '5', '7', '8+'];
  const fuelTypes = ['Gasoline', 'Electric', 'Hybrid', 'Diesel'];
  const rentalCompanies = ['Hertz', 'Enterprise', 'Avis', 'Budget', 'National', 'Alamo'];
  
  const handleAirlineToggle = (airline) => {
    setSelectedAirlines(prev => 
      prev.includes(airline) 
        ? prev.filter(a => a !== airline)
        : [...prev, airline]
    );
  };
  
  const handleAmenityToggle = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };
  
  useEffect(() => {
    setPriceRange([0, getDefaultPriceMax(searchType)]);
  }, [searchType]);

  const resetAllFilters = () => {
    setPriceRange([0, priceSliderMax]);
    setSelectedAirlines([]);
    setDepartureTime('');
    setDuration('');
    setCabinClass('');
    setStarRating(0);
    setSelectedAmenities([]);
    setDistance('');
    setCarType('');
    setTransmission('');
    setSeats('');
    setFuelType('');
    setRentalCompany('');
  };


  return (
    <div className="min-h-screen relative">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${currentBgImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
      </div>
      
      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-white">
            <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">
              {searchType === 'flights' && <><FaPlane className="inline mr-3" />Flight</>}
              {searchType === 'hotels' && <><FaHotel className="inline mr-3" />Hotel</>}
              {searchType === 'cars' && <><FaCar className="inline mr-3" />Car</>} Search Results
            </h1>
            <p className="text-white/90 text-lg drop-shadow">
              Found {filteredResults.length || results.length || mockResults.length} results
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                className="lg:w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 h-fit lg:sticky lg:top-24 max-h-[calc(100vh-8rem)] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <FaFilter className="mr-2 text-kayak-blue" />
                    Filters
                  </h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Price Range */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Price Range
                  </label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="range"
                      min="0"
                      max={priceSliderMax}
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value, 10)])}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                {/* Service-specific filters */}
                {searchType === 'flights' && (
                  <>
                    {/* Airlines Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Airlines
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {airlines.map((airline) => (
                          <label key={airline} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedAirlines.includes(airline)}
                              onChange={() => handleAirlineToggle(airline)}
                              className="w-4 h-4 text-kayak-blue border-gray-300 rounded focus:ring-kayak-blue"
                            />
                            <span className="text-sm text-gray-700">{airline}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Cabin Class Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Cabin Class
                      </label>
                      <select
                        value={cabinClass}
                        onChange={(e) => setCabinClass(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-kayak-blue"
                      >
                        <option value="">Any Class</option>
                        {cabinClasses.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {searchType === 'hotels' && (
                  <>
                    {/* Star Rating Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Star Rating
                      </label>
                      <div className="flex space-x-2 flex-wrap gap-2">
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setStarRating(rating === starRating ? 0 : rating)}
                            className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                              rating >= starRating && starRating > 0
                                ? 'bg-kayak-blue text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            <FaStar className="text-sm" />
                            <span className="text-sm font-semibold">{rating}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amenities Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Amenities
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {amenities.map((amenity) => {
                          const Icon = amenity.icon;
                          return (
                            <label key={amenity.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={selectedAmenities.includes(amenity.id)}
                                onChange={() => handleAmenityToggle(amenity.id)}
                                className="w-4 h-4 text-kayak-blue border-gray-300 rounded focus:ring-kayak-blue"
                              />
                              <Icon className="text-kayak-blue text-sm" />
                              <span className="text-sm text-gray-700">{amenity.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {searchType === 'cars' && (
                  <>
                    {/* Car Type Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Car Type
                      </label>
                      <select
                        value={carType}
                        onChange={(e) => setCarType(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-kayak-blue"
                      >
                        <option value="">All Types</option>
                        {carTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Transmission Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Transmission
                      </label>
                      <div className="space-y-2">
                        {transmissionTypes.map((trans) => (
                          <label key={trans} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="radio"
                              name="transmission"
                              value={trans}
                              checked={transmission === trans}
                              onChange={(e) => setTransmission(e.target.value)}
                              className="w-4 h-4 text-kayak-blue border-gray-300 focus:ring-kayak-blue"
                            />
                            <span className="text-sm text-gray-700">{trans}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Seats Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Number of Seats
                      </label>
                      <select
                        value={seats}
                        onChange={(e) => setSeats(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-kayak-blue"
                      >
                        <option value="">Any</option>
                        {seatsOptions.map((seat) => (
                          <option key={seat} value={seat}>{seat} Seats</option>
                        ))}
                      </select>
                    </div>

                    {/* Fuel Type Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Fuel Type
                      </label>
                      <select
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-kayak-blue"
                      >
                        <option value="">All Types</option>
                        {fuelTypes.map((fuel) => (
                          <option key={fuel} value={fuel}>{fuel}</option>
                        ))}
                      </select>
                    </div>

                    {/* Rental Company Filter */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Rental Company
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {rentalCompanies.map((company) => (
                          <label key={company} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rentalCompany === company}
                              onChange={() => setRentalCompany(rentalCompany === company ? '' : company)}
                              className="w-4 h-4 text-kayak-blue border-gray-300 rounded focus:ring-kayak-blue"
                            />
                            <span className="text-sm text-gray-700">{company}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Reset Filters */}
                <button
                  onClick={resetAllFilters}
                  className="w-full btn-secondary text-sm font-semibold"
                >
                  Reset All Filters
                </button>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 mb-6 flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-700 hover:text-kayak-blue transition-colors"
              >
                <FaFilter />
                <span className="font-semibold">Filters</span>
              </button>
              <div className="flex items-center space-x-4">
                <FaSort className="text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-kayak-blue bg-white"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
              {loading ? (
                <>
                  {Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} className="h-full">
                      <SkeletonCard />
                    </div>
                  ))}
                </>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((result, index) => (
                  <motion.div
                    key={result._id || result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="h-full"
                  >
                    <div className="h-full">
                      <BookingCard type={searchType.slice(0, -1)} data={result} />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No results found. Try adjusting your filters.</p>
                </div>
              )}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              <button className="btn-secondary">
                Load More Results
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;

