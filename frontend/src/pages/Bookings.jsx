import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaPlane, FaHotel, FaCar, FaCalendarAlt, FaEye, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';
import BookingCard from '../components/BookingCard';
import { userAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Bookings = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (user?._id || user?.id) {
      fetchBookings();
    } else {
      navigate('/login');
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;
      const response = await userAPI.getBookings(userId);
      if (response.data.success) {
        // Transform booking data to match component expectations
        const transformedBookings = (response.data.data || []).map((booking) => {
          const details = booking.details || {};
          const bookingDate = new Date(booking.bookingDate || Date.now());
          const status = booking.status || 'upcoming';
          
          // Determine if booking is upcoming, past, or cancelled
          let calculatedStatus = status;
          if (status !== 'cancelled') {
            const travelDate = booking.type === 'flight' 
              ? new Date(details.departureDateTime || details.departureDate || bookingDate)
              : booking.type === 'hotel'
              ? new Date(details.checkIn || bookingDate)
              : new Date(details.pickupDate || bookingDate);
            
            if (travelDate < new Date()) {
              calculatedStatus = 'completed';
            } else {
              calculatedStatus = 'upcoming';
            }
          }

          if (booking.type === 'flight') {
            return {
              ...booking,
              _id: booking._id || booking.bookingId,
              id: booking._id || booking.bookingId,
              bookingId: booking.bookingId || booking._id,
              from: details.departureAirport?.city || details.from || 'N/A',
              to: details.arrivalAirport?.city || details.to || 'N/A',
              airline: details.airline || 'Airline',
              flightNumber: details.flightNumber || details.flightId || 'N/A',
              departureTime: details.departureDateTime 
                ? new Date(details.departureDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
                : details.departureTime || 'N/A',
              arrivalTime: details.arrivalDateTime
                ? new Date(details.arrivalDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
                : details.arrivalTime || 'N/A',
              date: details.departureDateTime || details.departureDate || bookingDate,
              price: details.ticketPrice || details.price || 0,
              status: calculatedStatus,
              bookingDate: bookingDate,
            };
          } else if (booking.type === 'hotel') {
            return {
              ...booking,
              _id: booking._id || booking.bookingId,
              id: booking._id || booking.bookingId,
              bookingId: booking.bookingId || booking._id,
              name: details.hotelName || details.name || 'Hotel',
              location: details.city || details.location || 'N/A',
              address: details.address || 'N/A',
              checkIn: details.checkIn || bookingDate,
              checkOut: details.checkOut || 'N/A',
              price: details.pricePerNight || details.price || 0,
              status: calculatedStatus,
              bookingDate: bookingDate,
            };
          } else if (booking.type === 'car') {
            return {
              ...booking,
              _id: booking._id || booking.bookingId,
              id: booking._id || booking.bookingId,
              bookingId: booking.bookingId || booking._id,
              brand: details.brand || details.company || 'Car',
              model: details.model || 'N/A',
              pickupLocation: details.pickupLocation || details.location || 'N/A',
              pickupDate: details.pickupDate || bookingDate,
              returnDate: details.returnDate || 'N/A',
              price: details.dailyRentalPrice || details.pricePerDay || details.price || 0,
              status: calculatedStatus,
              bookingDate: bookingDate,
            };
          }
          return { 
            ...booking, 
            status: calculatedStatus, 
            bookingDate: bookingDate,
            bookingId: booking.bookingId || booking._id,
          };
        });
        setBookings(transformedBookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return booking.status === 'upcoming';
    if (filter === 'past') return booking.status === 'completed';
    if (filter === 'cancelled') return booking.status === 'cancelled';
    return true;
  });

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCancel = async (booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const userId = user?._id || user?.id;
      // Use bookingId from the booking object, or _id as fallback
      const bookingId = booking.bookingId || booking._id || booking.id;
      
      const response = await userAPI.cancelBooking(userId, { bookingId });
      
      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings(); // Refresh bookings
      } else {
        toast.error(response.data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getBackgroundImage = (type) => {
    const images = {
      flight: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80',
      hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      car: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
    };
    return images[type] || images.flight;
  };

  const filters = [
    { id: 'all', label: 'All Bookings' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'past', label: 'Past' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage and view all your travel bookings</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-6 py-3 rounded-lg transition-all duration-300 ${
                filter === f.id
                  ? 'bg-kayak-blue text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-kayak-blue-light'
              }`}
            >
              <span className="font-semibold">{f.label}</span>
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking, index) => (
              <motion.div
                key={booking.id || booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card overflow-hidden p-0"
              >
                {/* Background Image Section */}
                <div 
                  className="relative h-48 bg-cover bg-center"
                  style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${getBackgroundImage(booking.type)})`,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-between p-6">
                    <div className="flex items-center space-x-4 text-white">
                      {booking.type === 'flight' && <FaPlane className="text-3xl" />}
                      {booking.type === 'hotel' && <FaHotel className="text-3xl" />}
                      {booking.type === 'car' && <FaCar className="text-3xl" />}
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          {booking.type === 'flight'
                            ? `${booking.from} → ${booking.to}`
                            : booking.type === 'hotel'
                            ? booking.name
                            : `${booking.brand} ${booking.model}`}
                        </h3>
                        <p className="text-sm text-gray-200 flex items-center space-x-1">
                          <FaCalendarAlt />
                          <span>
                            {booking.date || booking.checkIn || booking.pickupDate
                              ? new Date(booking.date || booking.checkIn || booking.pickupDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'N/A'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-white">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          booking.status === 'upcoming'
                            ? 'bg-green-500 text-white'
                            : booking.status === 'completed'
                            ? 'bg-blue-500 text-white'
                            : booking.status === 'cancelled'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {booking.status === 'upcoming' ? 'Upcoming' : 
                         booking.status === 'completed' ? 'Completed' :
                         booking.status === 'cancelled' ? 'Cancelled' : 'Confirmed'}
                      </span>
                      <p className="text-2xl font-bold mt-2">
                        ${typeof booking.price === 'number' ? booking.price.toFixed(2) : booking.price}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="mb-4">
                    <BookingCard type={booking.type} data={booking} hideBookButton={true} />
                  </div>
                  <div className="flex space-x-3 pt-4 border-t">
                    <button 
                      onClick={() => handleViewDetails(booking)}
                      className="btn-secondary flex items-center space-x-2 flex-1"
                    >
                      <FaEye />
                      <span>View Details</span>
                    </button>
                    {(booking.status === 'upcoming' || booking.status === 'confirmed') && (
                      <button 
                        onClick={() => handleCancel(booking)}
                        className="btn-primary flex items-center space-x-2 bg-red-500 hover:bg-red-600 flex-1"
                      >
                        <FaTimes />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FaCalendarAlt className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all'
                ? "You haven't made any bookings yet. Start planning your next trip!"
                : `No ${filter} bookings found.`}
            </p>
            <button onClick={() => navigate('/')} className="btn-primary">Start Booking</button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600">Booking ID</label>
                  <p className="text-gray-900">{selectedBooking.id || selectedBooking._id}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Status</label>
                  <p className="text-gray-900 capitalize">{selectedBooking.status}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Booking Date</label>
                  <p className="text-gray-900">
                    {selectedBooking.bookingDate
                      ? new Date(selectedBooking.bookingDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600">Total Amount</label>
                  <p className="text-gray-900 font-bold">
                    ${typeof selectedBooking.price === 'number' ? selectedBooking.price.toFixed(2) : selectedBooking.price}
                  </p>
                </div>
              </div>
              {selectedBooking.type === 'flight' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Flight Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Airline:</span> {selectedBooking.airline}</p>
                      <p><span className="font-semibold">Flight Number:</span> {selectedBooking.flightNumber}</p>
                      <p><span className="font-semibold">Route:</span> {selectedBooking.from} → {selectedBooking.to}</p>
                      <p><span className="font-semibold">Departure:</span> {selectedBooking.departureTime}</p>
                      <p><span className="font-semibold">Arrival:</span> {selectedBooking.arrivalTime}</p>
                    </div>
                  </div>
                </>
              )}
              {selectedBooking.type === 'hotel' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Hotel Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Hotel:</span> {selectedBooking.name}</p>
                      <p><span className="font-semibold">Location:</span> {selectedBooking.location}</p>
                      <p><span className="font-semibold">Address:</span> {selectedBooking.address}</p>
                      <p><span className="font-semibold">Check-in:</span> {selectedBooking.checkIn ? new Date(selectedBooking.checkIn).toLocaleDateString() : 'N/A'}</p>
                      <p><span className="font-semibold">Check-out:</span> {selectedBooking.checkOut ? new Date(selectedBooking.checkOut).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
              {selectedBooking.type === 'car' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Car Rental Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Vehicle:</span> {selectedBooking.brand} {selectedBooking.model}</p>
                      <p><span className="font-semibold">Pickup Location:</span> {selectedBooking.pickupLocation}</p>
                      <p><span className="font-semibold">Pickup Date:</span> {selectedBooking.pickupDate ? new Date(selectedBooking.pickupDate).toLocaleDateString() : 'N/A'}</p>
                      <p><span className="font-semibold">Return Date:</span> {selectedBooking.returnDate ? new Date(selectedBooking.returnDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
