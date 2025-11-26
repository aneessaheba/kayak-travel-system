import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlane, FaHotel, FaCar, FaCalendarAlt, FaUsers, FaCreditCard } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { createBooking } from '../store/slices/bookingSlice';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import { hotelAPI, flightAPI, carAPI } from '../services/api';

const BookingModal = ({ isOpen, onClose, item, type }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const { loading } = useSelector((state) => state.bookings);

  const [passengers, setPassengers] = useState(1);
  const [flightClass, setFlightClass] = useState('Economy');
  // Determine default trip type based on whether flight has return data
  const hasReturnData = type === 'flight' && (
    (item.isRoundTrip && item.outbound && item.return) ||
    ((item.hasReturnFlight || item.returnDepartureDateTime) && item.returnDepartureDateTime)
  );
  const [tripType, setTripType] = useState(hasReturnData ? 'round-trip' : 'one-way');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const modalContainerRef = useRef(null);
  
  // Update trip type when item changes
  useEffect(() => {
    if (type === 'flight') {
      const hasReturn = (
        (item.isRoundTrip && item.outbound && item.return) ||
        ((item.hasReturnFlight || item.returnDepartureDateTime) && item.returnDepartureDateTime)
      );
      // If user selected round-trip but flight has no return data, switch to one-way
      if (!hasReturn && tripType === 'round-trip') {
        setTripType('one-way');
      }
    }
  }, [item, type]);

  const icons = {
    flight: FaPlane,
    hotel: FaHotel,
    car: FaCar,
  };

  const Icon = icons[type] || FaPlane;

  const getItemPrice = () => {
    if (type === 'flight') {
      // Get base outbound price
      let outboundPrice = 0;
      let returnPrice = 0;
      
      // Handle round-trip flights (combined from two separate flights)
      if (item.isRoundTrip && item.outbound && item.return) {
        outboundPrice = item.outbound.ticketPrice || 0;
        returnPrice = item.return.ticketPrice || 0;
      }
      // Handle flight with embedded return flight information
      else if ((item.hasReturnFlight || item.returnDepartureDateTime) && item.returnDepartureDateTime) {
        outboundPrice = item.ticketPrice || 0;
        returnPrice = item.returnTicketPrice || 0;
      }
      // Single flight (one-way)
      else {
        outboundPrice = item.ticketPrice || item.price || 0;
        returnPrice = 0;
      }
      
      // Return price based on trip type selection
      if (tripType === 'one-way') {
        return outboundPrice;
      } else {
        // Round trip: outbound + return
        return outboundPrice + returnPrice;
      }
    } else if (type === 'hotel') {
      return item.pricePerNight || item.price || 0;
    } else if (type === 'car') {
      return item.dailyRentalPrice || item.pricePerDay || item.price || 0;
    }
    return item.price || 0;
  };

  const getClassUpgradePrice = () => {
    if (type !== 'flight') return 0;
    const classPrices = {
      'Economy': 0,
      'Premium Economy': 250,
      'Business': 500,
      'First Class': 750
    };
    return classPrices[flightClass] || 0;
  };

  const calculateTotal = () => {
    const basePrice = getItemPrice();
    const classUpgrade = getClassUpgradePrice();
    if (type === 'flight') {
      return (basePrice + classUpgrade) * passengers;
    } else if (type === 'hotel') {
      if (!checkIn || !checkOut) return basePrice;
      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
      return basePrice * nights * passengers;
    } else if (type === 'car') {
      if (!pickupDate || !returnDate) return basePrice;
      const days = Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24));
      return basePrice * days;
    }
    return basePrice;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?._id && !user?.id) {
      toast.error('Please log in to make a booking');
      onClose();
      return;
    }

    // Validate dates
    if (type === 'hotel' && (!checkIn || !checkOut)) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    // Validate max guests for hotels
    if (type === 'hotel' && item.maxGuests && passengers > item.maxGuests) {
      toast.error(`Maximum ${item.maxGuests} guest${item.maxGuests !== 1 ? 's' : ''} allowed for this hotel`);
      return;
    }
    if (type === 'car' && (!pickupDate || !returnDate)) {
      toast.error('Please select pickup and return dates');
      return;
    }

    // Validate payment details for card payments
    if (paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Please enter a valid 16-digit card number');
        return;
      }
      if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        toast.error('Please enter a valid expiry date (MM/YY)');
        return;
      }
      
      // Validate expiry date is not in the past
      const [month, year] = expiryDate.split('/');
      const expiryMonth = parseInt(month, 10);
      const expiryYear = 2000 + parseInt(year, 10); // Convert YY to YYYY
      const expiry = new Date(expiryYear, expiryMonth - 1); // Month is 0-indexed
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentDate = new Date(currentYear, currentMonth);
      
      if (expiry < currentDate) {
        toast.error('Card expiry date cannot be in the past');
        return;
      }
      
      if (!cvv || (cvv.length !== 3 && cvv.length !== 4)) {
        toast.error('Please enter a valid CVV (3-4 digits)');
        return;
      }
      if (!cardholderName || cardholderName.trim().length < 2) {
        toast.error('Please enter the cardholder name');
        return;
      }
    }

    const userId = user._id || user.id;
    const totalAmount = calculateTotal();

    // Prepare booking data
    const bookingData = {
      type: type,
      bookingDate: new Date().toISOString(),
      status: 'upcoming',
      details: {
        ...item,
        passengers: type === 'flight' ? passengers : undefined,
        flightClass: type === 'flight' ? flightClass : undefined,
        tripType: type === 'flight' ? tripType : undefined,
        guests: type === 'hotel' ? passengers : undefined,
        checkIn: type === 'hotel' ? checkIn : undefined,
        checkOut: type === 'hotel' ? checkOut : undefined,
        pickupDate: type === 'car' ? pickupDate : undefined,
        returnDate: type === 'car' ? returnDate : undefined,
      },
    };

    // Prepare billing data
    const billingId = `BILL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const billingData = {
      billingId: billingId,
      userId: userId,
      bookingType: type,
      bookingId: item._id || item.id || `temp-${Date.now()}`,
      totalAmountPaid: totalAmount * 1.1, // Include tax
      paymentMethod: paymentMethod,
      transactionStatus: 'completed',
      paymentDetails: (paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') ? {
        cardLast4: cardNumber.replace(/\s/g, '').slice(-4),
        cardType: cardNumber.replace(/\s/g, '').startsWith('4') ? 'Visa' : 
                  cardNumber.replace(/\s/g, '').startsWith('5') ? 'Mastercard' :
                  cardNumber.replace(/\s/g, '').startsWith('3') ? 'Amex' : 'Other',
        expiryDate: expiryDate,
        cardholderName: cardholderName,
      } : undefined,
      invoiceDetails: {
        items: [
          {
            description: type === 'flight' 
              ? `${item.airline || 'Flight'} - ${item.departureAirport?.city || ''} to ${item.arrivalAirport?.city || ''}`
              : type === 'hotel'
              ? `${item.name || 'Hotel'} - ${item.city || ''}`
              : `${item.brand || ''} ${item.model || ''} - ${item.pickupLocation || ''}`,
            quantity: type === 'hotel' 
              ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
              : type === 'car'
              ? Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))
              : passengers,
            price: getItemPrice(),
            total: totalAmount,
          },
        ],
        subtotal: totalAmount,
        tax: totalAmount * 0.1, // 10% tax
        discount: 0,
        total: totalAmount * 1.1,
      },
    };

    try {
      // Update availability before creating booking
      if (type === 'hotel') {
        try {
          // For hotels, we book 1 room per booking
          await hotelAPI.updateRooms(item._id || item.id, { rooms: 1 });
        } catch (roomError) {
          console.error('Error updating hotel rooms:', roomError);
          // Continue with booking even if room update fails (could be a race condition)
        }
      } else if (type === 'flight') {
        try {
          // For flights, update seats based on passengers and trip type
          const seatsToBook = tripType === 'round-trip' ? passengers * 2 : passengers;
          await flightAPI.updateSeats(item._id || item.id, { seats: seatsToBook });
        } catch (seatError) {
          console.error('Error updating flight seats:', seatError);
          // Continue with booking even if seat update fails
        }
      } else if (type === 'car') {
        try {
          // For cars, add booking dates to block the car for those dates
          if (pickupDate && returnDate) {
            const billingId = billingData.billingId || `BILL-${Date.now()}`;
            await carAPI.addBooking(item._id || item.id, {
              pickupDate: pickupDate,
              returnDate: returnDate,
              bookingId: billingId,
              userId: userId
            });
          }
        } catch (carError) {
          console.error('Error adding car booking:', carError);
          // If car is already booked, show error and stop booking
          if (carError.response?.status === 400) {
            toast.error(carError.response?.data?.message || 'Car is not available for the selected dates');
            return;
          }
          // Continue with booking for other errors
        }
      }

      const result = await dispatch(createBooking({ userId, bookingData, billingData })).unwrap();
      
      // Show success message immediately
      toast.success('✅ Booking confirmed successfully!');
      
      // Close modal after a delay to let user see the success message
      setTimeout(() => {
        onClose();
        
        // Trigger a page refresh to update search results after modal closes
        // This will cause SearchResults to refetch data
        if (window.location.pathname.includes('/search')) {
          setTimeout(() => {
            window.location.reload();
          }, 300); // Small delay to ensure modal closes first
        }
      }, 2000); // 2 second delay to ensure user sees the success message
    } catch (error) {
      console.error('Booking error:', error);
      // Handle different error formats
      let errorMessage = 'Failed to create booking. Please try again.';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.payload) {
        errorMessage = error.payload;
      }
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Scroll to top when modal opens
  useEffect(() => {
    if (isOpen) {
      // Scroll window to top first
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Small delay to ensure DOM is ready, then scroll modal container
      const scrollToTop = () => {
        if (modalContainerRef.current) {
          modalContainerRef.current.scrollTop = 0;
          modalContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
        // Also try to find by class as fallback
        const modalContainer = document.querySelector('.fixed.inset-0.z-50.overflow-y-auto');
        if (modalContainer) {
          modalContainer.scrollTop = 0;
          modalContainer.scrollTo({ top: 0, behavior: 'instant' });
        }
      };
      
      // Try immediately and after a short delay
      scrollToTop();
      setTimeout(scrollToTop, 50);
      setTimeout(scrollToTop, 200);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-[54]"
          />
          
          {/* Modal */}
          <motion.div
            ref={modalContainerRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[55] flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ scrollBehavior: 'auto' }}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-auto flex flex-col max-h-[75vh] overflow-hidden relative z-[60]">
              {/* Header - Always visible at top */}
              <div className="bg-white border-b px-3 py-2 flex items-center justify-between flex-shrink-0 rounded-t-xl sticky top-0 z-[70]">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-kayak-blue to-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                    <Icon className="text-white text-xs" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">Complete Your Booking</h2>
                    <p className="text-xs text-gray-500 truncate">
                      {type === 'flight' 
                        ? `${item.departureAirport?.city || ''} → ${item.arrivalAirport?.city || ''}`
                        : type === 'hotel'
                        ? `${item.name || 'Hotel'} - ${item.city || ''}`
                        : `${item.brand || ''} ${item.model || ''} - ${item.pickupLocation || ''}`
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FaTimes className="text-gray-500 text-sm" />
                </button>
              </div>

              {/* Form - Scrollable content */}
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="p-3 space-y-2.5">
                {/* Passengers/Guests */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    <FaUsers className="inline mr-2" />
                    {type === 'flight' ? 'Passengers' : type === 'hotel' ? 'Guests' : 'Rental Period'}
                  </label>
                  {type === 'car' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Pickup Date</label>
                        <input
                          type="date"
                          min={today}
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          required
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Return Date</label>
                        <input
                          type="date"
                          min={pickupDate || today}
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          required
                          className="input-field w-full"
                        />
                      </div>
                    </div>
                  ) : type === 'hotel' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Check-in</label>
                        <input
                          type="date"
                          min={today}
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          required
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Check-out</label>
                        <input
                          type="date"
                          min={checkIn || tomorrow}
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          required
                          className="input-field w-full"
                        />
                      </div>
                    </div>
                  ) : null}
                  
                  {type === 'flight' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Passengers</label>
                        <input
                          type="number"
                          min="1"
                          max={9}
                          value={passengers}
                          onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                          required
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Class</label>
                        <select
                          value={flightClass}
                          onChange={(e) => setFlightClass(e.target.value)}
                          required
                          className="input-field w-full"
                        >
                          <option value="Economy">Economy</option>
                          <option value="Premium Economy">Premium Economy</option>
                          <option value="Business">Business</option>
                          <option value="First Class">First Class</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {type === 'hotel' && (
                    <div>
                      <input
                        type="number"
                        min="1"
                        max={item.maxGuests || 10}
                        value={passengers}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          const maxGuests = item.maxGuests || 10;
                          if (value > maxGuests) {
                            toast.error(`Maximum ${maxGuests} guests allowed for this hotel`);
                            setPassengers(maxGuests);
                          } else {
                            setPassengers(value);
                          }
                        }}
                        required
                        className="input-field w-full mt-2"
                      />
                      {item.maxGuests && (
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum {item.maxGuests} guest{item.maxGuests !== 1 ? 's' : ''} allowed
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Trip Type (for flights) and Payment Method */}
                {type === 'flight' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        <FaPlane className="inline mr-2" />
                        Trip Type
                      </label>
                      <select
                        value={tripType}
                        onChange={(e) => setTripType(e.target.value)}
                        required
                        className="input-field w-full"
                      >
                        <option value="round-trip" disabled={!hasReturnData}>
                          Round Trip{!hasReturnData ? ' (Not Available)' : ''}
                        </option>
                        <option value="one-way">One Way</option>
                      </select>
                      {!hasReturnData && tripType === 'round-trip' && (
                        <p className="text-xs text-orange-600 mt-1">⚠️ Round trip not available for this flight. Switching to one-way.</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        <FaCreditCard className="inline mr-2" />
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        required
                        className="input-field w-full"
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="PayPal">PayPal</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      <FaCreditCard className="inline mr-2" />
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                      className="input-field w-full"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Debit Card">Debit Card</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                )}

                {/* Payment Details - Only show for Credit/Debit Card */}
                {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
                  <div className="space-y-2.5 bg-gray-50 p-2.5 rounded-md border border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 mb-2">Payment Information</h3>
                    
                    {/* Cardholder Name */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Cardholder Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                        placeholder="JOHN DOE"
                        required
                        className="input-field w-full"
                        maxLength={50}
                      />
                    </div>

                    {/* Card Number */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Card Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => {
                          // Remove all non-digits
                          let value = e.target.value.replace(/\D/g, '');
                          // Limit to 16 digits
                          if (value.length > 16) value = value.slice(0, 16);
                          // Add spaces every 4 digits
                          value = value.replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(value);
                        }}
                        placeholder="1234 5678 9012 3456"
                        required
                        className="input-field w-full"
                        maxLength={19} // 16 digits + 3 spaces
                      />
                    </div>

                    {/* Expiry and CVV */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Expiry Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            // Limit to 4 digits
                            if (value.length > 4) value = value.slice(0, 4);
                            // Add slash after 2 digits
                            if (value.length >= 2) {
                              value = value.slice(0, 2) + '/' + value.slice(2);
                            }
                            setExpiryDate(value);
                          }}
                          placeholder="MM/YY"
                          required
                          className="input-field w-full"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          CVV <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '');
                            // Limit to 4 digits (for Amex)
                            if (value.length > 4) value = value.slice(0, 4);
                            setCvv(value);
                          }}
                          placeholder="123"
                          required
                          className="input-field w-full"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    {/* Security Note */}
                    <div className="flex items-start space-x-2 text-xs text-gray-500">
                      <FaCreditCard className="mt-0.5" />
                      <p>Your payment information is secure and encrypted. We never store your full card details.</p>
                    </div>
                  </div>
                )}

                {/* Price Summary */}
                <div className="bg-gray-50 rounded-md p-2.5 space-y-1.5">
                  {type === 'flight' && (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">
                          {passengers} {passengers === 1 ? 'Passenger' : 'Passengers'} ({tripType === 'round-trip' ? 'Round Trip' : 'One Way'})
                        </span>
                        <span className="text-gray-900">${getItemPrice().toFixed(2)}</span>
                      </div>
                      {getClassUpgradePrice() > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Class Upgrade ({flightClass})</span>
                          <span className="text-gray-900">+${(getClassUpgradePrice() * passengers).toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {type === 'hotel' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {checkIn && checkOut 
                          ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
                          : 0} {checkIn && checkOut && Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) === 1 ? 'Night' : 'Nights'}
                      </span>
                      <span className="text-gray-900">${getItemPrice().toFixed(2)}</span>
                    </div>
                  )}
                  {type === 'car' && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">
                        {pickupDate && returnDate 
                          ? Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24))
                          : 0} {pickupDate && returnDate && Math.ceil((new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24)) === 1 ? 'Day' : 'Days'}
                      </span>
                      <span className="text-gray-900">${getItemPrice().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="text-gray-900">${(calculateTotal() * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-1.5 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-kayak-blue">${(calculateTotal() * 1.1).toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 btn-secondary text-sm py-2"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary text-sm py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </span>
                    ) : (
                      'Confirm Booking'
                    )}
                  </button>
                </div>
              </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;

