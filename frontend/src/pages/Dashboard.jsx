import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaPlane, FaHotel, FaCar, FaCalendarAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import BookingCard from '../components/BookingCard';
import { userAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    hotelsBooked: 0,
    carsRented: 0,
    totalSaved: 0,
  });

  useEffect(() => {
    if (!user?._id && !user?.id) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;
      if (!userId) return;

      const response = await userAPI.getBookings(userId);
      if (response.data.success) {
        const allBookings = response.data.data || [];
        
        console.log('Raw bookings from API:', allBookings);
        console.log('Total bookings received:', allBookings.length);
        
        // Transform bookings to match expected format (similar to Bookings page)
        const transformedBookings = allBookings.map((booking) => {
          const details = booking.details || {};
          const bookingDate = new Date(booking.bookingDate || Date.now());
          
          if (booking.type === 'flight') {
            return {
              ...booking,
              _id: booking._id || booking.bookingId,
              id: booking._id || booking.bookingId,
              type: 'flight',
              from: details.departureAirport?.city || details.from || 'N/A',
              to: details.arrivalAirport?.city || details.to || 'N/A',
              airline: details.airline || 'Airline',
              flightNumber: details.flightNumber || details.flightId || 'N/A',
              date: details.departureDateTime || details.departureDate || bookingDate,
              departureDate: details.departureDateTime || details.departureDate || bookingDate,
              price: details.ticketPrice || details.price || 0,
              originalPrice: details.originalPrice || null,
              bookingDate: bookingDate,
              status: booking.status || 'upcoming',
            };
          } else if (booking.type === 'hotel') {
            return {
              ...booking,
              _id: booking._id || booking.bookingId,
              id: booking._id || booking.bookingId,
              type: 'hotel',
              name: details.hotelName || details.name || 'Hotel',
              location: details.city || details.location || 'N/A',
              address: details.address || 'N/A',
              date: details.checkIn || bookingDate,
              checkInDate: details.checkIn || bookingDate,
              price: details.pricePerNight || details.price || 0,
              originalPrice: details.originalPrice || null,
              bookingDate: bookingDate,
              status: booking.status || 'upcoming',
            };
          } else if (booking.type === 'car') {
            return {
              ...booking,
              _id: booking._id || booking.bookingId,
              id: booking._id || booking.bookingId,
              type: 'car',
              brand: details.brand || details.company || 'Car',
              model: details.model || 'N/A',
              name: `${details.brand || details.company || 'Car'} ${details.model || ''}`,
              pickupLocation: details.pickupLocation || details.location || 'N/A',
              date: details.pickupDate || bookingDate,
              pickupDate: details.pickupDate || bookingDate,
              price: details.dailyRentalPrice || details.pricePerDay || details.price || 0,
              originalPrice: details.originalPrice || null,
              bookingDate: bookingDate,
              status: booking.status || 'upcoming',
            };
          }
          // Default: return booking with original type if it exists
          return { 
            ...booking, 
            type: booking.type || 'unknown', 
            bookingDate: bookingDate 
          };
        }).filter(booking => booking.type !== 'unknown'); // Filter out bookings without a valid type

        console.log('Transformed bookings:', transformedBookings);
        console.log('Total transformed bookings:', transformedBookings.length);
        
        setBookings(transformedBookings);

        // Calculate stats - count all booking types properly
        const flights = transformedBookings.filter(b => b.type === 'flight').length;
        const hotels = transformedBookings.filter(b => b.type === 'hotel').length;
        const cars = transformedBookings.filter(b => b.type === 'car').length;
        
        // Total trips should be the sum of all valid bookings
        const totalTrips = flights + hotels + cars;
        
        console.log('Dashboard stats calculation:', { 
          totalBookings: transformedBookings.length,
          flights, 
          hotels, 
          cars, 
          totalTrips,
          breakdown: {
            flights: transformedBookings.filter(b => b.type === 'flight'),
            hotels: transformedBookings.filter(b => b.type === 'hotel'),
            cars: transformedBookings.filter(b => b.type === 'car'),
          }
        });
        
        setStats({
          totalTrips: totalTrips,
          hotelsBooked: hotels,
          carsRented: cars,
          totalSaved: 0, // Not used anymore but keeping for compatibility
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(booking => {
    const travelDate = booking.departureDate || booking.checkInDate || booking.pickupDate || booking.date || booking.bookingDate;
    return travelDate && new Date(travelDate) >= new Date();
  }).slice(0, 2);

  const pastBookings = bookings.filter(booking => {
    const travelDate = booking.departureDate || booking.checkInDate || booking.pickupDate || booking.date || booking.bookingDate;
    return travelDate && new Date(travelDate) < new Date();
  }).slice(0, 2);

  const statCards = [
    { label: 'Total Trips', value: stats.totalTrips.toString(), icon: FaPlane, color: 'from-blue-500 to-blue-600' },
    { label: 'Hotels Booked', value: stats.hotelsBooked.toString(), icon: FaHotel, color: 'from-purple-500 to-purple-600' },
    { label: 'Cars Rented', value: stats.carsRented.toString(), icon: FaCar, color: 'from-orange-500 to-orange-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your travel overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <Icon className="text-white text-xl" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Upcoming Bookings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Trips</h2>
            <button 
              onClick={() => navigate('/bookings')}
              className="text-kayak-blue hover:text-kayak-blue-dark font-semibold"
            >
              View All
            </button>
          </div>
          {upcomingBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {upcomingBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {booking.type === 'flight' 
                        ? `${booking.from || 'N/A'} → ${booking.to || 'N/A'}`
                        : booking.type === 'hotel'
                        ? booking.name || 'Hotel'
                        : booking.type === 'car'
                        ? `${booking.brand || 'Car'} ${booking.model || ''}`
                        : booking.name || 'Booking'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center space-x-1">
                      <FaCalendarAlt className="text-kayak-blue" />
                      <span>
                        {booking.date || booking.departureDate || booking.checkInDate || booking.pickupDate
                          ? new Date(booking.date || booking.departureDate || booking.checkInDate || booking.pickupDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'N/A'}
                      </span>
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-kayak-blue">
                        ${typeof booking.price === 'number' ? booking.price.toFixed(2) : booking.price || '0.00'}
                      </span>
                      <button 
                        onClick={() => navigate('/bookings')}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming trips</h3>
              <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Search Now
              </button>
            </div>
          )}
        </div>

        {/* Past Bookings */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Past Trips</h2>
            <button 
              onClick={() => navigate('/bookings')}
              className="text-kayak-blue hover:text-kayak-blue-dark font-semibold"
            >
              View All
            </button>
          </div>
          {pastBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pastBookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card p-6 opacity-75">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {booking.type === 'flight' 
                          ? `${booking.from || 'N/A'} → ${booking.to || 'N/A'}`
                          : booking.type === 'hotel'
                          ? booking.name || 'Hotel'
                          : booking.type === 'car'
                          ? `${booking.brand || 'Car'} ${booking.model || ''}`
                          : booking.name || 'Booking'}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center space-x-1">
                        <FaCalendarAlt className="text-kayak-blue" />
                        <span>
                          {booking.date || booking.departureDate || booking.checkInDate || booking.pickupDate
                            ? new Date(booking.date || booking.departureDate || booking.checkInDate || booking.pickupDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </span>
                      </p>
                    </div>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold">
                      Review
                    </button>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-600">
                        ${typeof booking.price === 'number' ? booking.price.toFixed(2) : booking.price || '0.00'}
                      </span>
                      <button 
                        onClick={() => navigate('/bookings')}
                        className="text-kayak-blue hover:text-kayak-blue-dark font-semibold text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No past trips</h3>
              <p className="text-gray-600">Your completed trips will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

