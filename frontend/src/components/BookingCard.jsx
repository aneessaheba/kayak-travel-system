import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaPlane, FaHotel, FaCar, FaStar, FaClock, FaMapMarkerAlt, FaUsers, FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { userAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import BookingModal from './BookingModal';

const BookingCard = ({ type, data, onFavouriteChange, hideBookButton = false }) => {
  const { user } = useSelector((state) => state.auth);
  const toast = useToast();
  const [isFavourite, setIsFavourite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const icons = {
    flight: FaPlane,
    hotel: FaHotel,
    car: FaCar,
  };

  const Icon = icons[type] || FaPlane;

  const formatCard = () => {
    switch (type) {
        case 'flight':
          // Helper function to format date using UTC to avoid timezone conversion issues
          const formatDateUTC = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            const year = date.getUTCFullYear();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const month = monthNames[date.getUTCMonth()];
            const day = date.getUTCDate();
            return `${month} ${day}, ${year}`;
          };
          
          // Handle round-trip flights (combined from two separate flights)
          if (data.isRoundTrip && data.outbound && data.return) {
            const outbound = data.outbound;
            const returnFlight = data.return;
            
          const outboundFrom = outbound.departureAirport?.city || outbound.departureAirport?.code || outbound.origin || outbound.from || 'N/A';
          const outboundTo = outbound.arrivalAirport?.city || outbound.arrivalAirport?.code || outbound.destination || outbound.to || 'N/A';
          
          const outboundDepartDate = outbound.departureDateTime
            ? formatDateUTC(outbound.departureDateTime)
            : 'N/A';
          const returnDepartDate = returnFlight.departureDateTime
            ? formatDateUTC(returnFlight.departureDateTime)
            : 'N/A';
          
          const outboundDepartTime = outbound.departureDateTime 
            ? new Date(outbound.departureDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
            : outbound.departureTime || 'N/A';
          const outboundArriveTime = outbound.arrivalDateTime 
            ? new Date(outbound.arrivalDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
            : outbound.arrivalTime || 'N/A';
          const returnDepartTime = returnFlight.departureDateTime 
            ? new Date(returnFlight.departureDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
            : returnFlight.departureTime || 'N/A';
          const returnArriveTime = returnFlight.arrivalDateTime 
            ? new Date(returnFlight.arrivalDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
            : returnFlight.arrivalTime || 'N/A';
          
          return {
            title: `${outboundFrom} ↔ ${outboundTo}`,
            subtitle: `${data.airline || 'Airline'} • ${outbound.flightId || outbound.flightNumber || 'N/A'}`,
            details: [
              { icon: FaClock, text: `${outboundDepartDate} • Depart: ${outboundDepartTime}` },
              { icon: FaClock, text: `Return ${returnDepartDate} • Depart: ${returnDepartTime}` },
            ],
            price: data.ticketPrice || 0,
            rating: null, // Removed rating
          };
        }
        
        // Handle flight with embedded return flight information (hasReturnFlight: true)
        // Check if return flight data exists (either hasReturnFlight flag or returnDepartureDateTime)
        if ((data.hasReturnFlight || data.returnDepartureDateTime) && data.returnDepartureDateTime) {
          const from = data.departureAirport?.city || data.departureAirport?.code || data.origin || data.from || 'N/A';
          const to = data.arrivalAirport?.city || data.arrivalAirport?.code || data.destination || data.to || 'N/A';
          // Return flight reverses the route
          const returnFrom = to;
          const returnTo = from;
          
          const departDate = data.departureDateTime 
            ? formatDateUTC(data.departureDateTime)
            : 'N/A';
          const returnDepartDate = data.returnDepartureDateTime 
            ? formatDateUTC(data.returnDepartureDateTime)
            : 'N/A';
          
          const departureTime = data.departureDateTime 
            ? new Date(data.departureDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
            : data.departureTime || 'N/A';
          const arrivalTime = data.arrivalDateTime 
            ? new Date(data.arrivalDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
            : data.arrivalTime || 'N/A';
          const returnDepartTime = data.returnDepartureDateTime 
            ? new Date(data.returnDepartureDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'N/A';
          const returnArriveTime = data.returnArrivalDateTime 
            ? new Date(data.returnArrivalDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
            : 'N/A';
          
          // Calculate total price (outbound + return)
          const totalPrice = (data.ticketPrice || 0) + (data.returnTicketPrice || 0);
          
          return {
            title: `${from} ↔ ${to}`,
            subtitle: `${data.airline || 'Airline'} • ${data.flightId || 'N/A'}`,
            details: [
              { icon: FaClock, text: `${departDate} • Depart: ${departureTime}` },
              { icon: FaClock, text: `Return ${returnDepartDate} • Depart: ${returnDepartTime}` },
            ],
            price: totalPrice,
            rating: null, // Removed rating
          };
        }
        
        // Handle single flight (one-way)
        const from = data.departureAirport?.city || data.departureAirport?.code || data.origin || data.from || 'N/A';
        const to = data.arrivalAirport?.city || data.arrivalAirport?.code || data.destination || data.to || 'N/A';
        const departureDate = data.departureDateTime 
          ? formatDateUTC(data.departureDateTime)
          : 'N/A';
        const departureTime = data.departureDateTime 
          ? new Date(data.departureDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
          : data.departureTime || 'N/A';
        const arrivalTime = data.arrivalDateTime 
          ? new Date(data.arrivalDateTime).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })
          : data.arrivalTime || 'N/A';
        return {
          title: `${from} → ${to}`,
          subtitle: `${data.airline || 'Airline'} • ${data.flightNumber || data.flightId || 'N/A'}`,
          details: [
            { icon: FaClock, text: `${departureDate} • Depart: ${departureTime}` },
          ],
          price: data.ticketPrice || data.fare || data.price || 0,
          rating: null, // Removed rating
        };
      case 'hotel':
        return {
          title: data.hotelName || data.name || 'Hotel',
          subtitle: `${data.city || data.location || 'Location'} • ${data.starRating || data.stars || 'N/A'} stars`,
          details: [
            { icon: FaMapMarkerAlt, text: data.address || data.location || 'Address not available' },
            { icon: FaClock, text: `Check-in: ${data.checkInTime || 'Flexible'}` },
            { icon: FaUsers, text: `${data.availableRooms || data.roomsAvailable || data.rooms || 'N/A'} rooms available` },
          ],
          price: data.pricePerNight || data.price || 0,
          rating: data.rating?.average || data.averageRating || data.rating || null,
        };
      case 'car':
        // Infer fuel type if not directly available
        const getFuelType = () => {
          if (data.fuelType) return data.fuelType;
          if (data.fuel) return data.fuel;
          // Fallback: infer from car ID
          const identifier = data.carId || data._id || '0';
          const numeric = parseInt(String(identifier).replace(/\D/g, ''), 10) || 0;
          const fuelTypes = ['Gasoline', 'Electric', 'Hybrid', 'Diesel'];
          return fuelTypes[numeric % fuelTypes.length];
        };
        return {
          title: `${data.company || data.brand || 'Car'} ${data.model || ''}`,
          subtitle: `${data.carType || data.type || 'Vehicle'} • ${data.transmissionType || data.transmission || 'Auto'}`,
          details: [
            { icon: FaUsers, text: `${data.numberOfSeats || data.seats || data.capacity || 'N/A'} seats` },
            { icon: FaCar, text: `Fuel: ${getFuelType()}` },
          ],
          price: data.dailyRentalPrice || data.pricePerDay || data.price || 0,
          rating: data.carRating?.average || data.rating?.average || data.averageRating || data.rating || null,
        };
      default:
        return { title: '', subtitle: '', details: [], price: 0, rating: null };
    }
  };

  const cardInfo = formatCard();

  // Check if item is already in favourites
  useEffect(() => {
    const checkFavourite = async () => {
      if (!user?._id && !user?.id) return;
      
      try {
        const userId = user?._id || user?.id;
        const itemId = data._id || data.id;
        const itemType = type === 'flight' ? 'flight' : type === 'hotel' ? 'hotel' : 'car';
        
        if (!itemId) return;
        
        const response = await userAPI.getFavourites(userId, { type: itemType });
        if (response.data.success) {
          const exists = response.data.data.some(
            fav => fav.itemId === itemId && fav.type === itemType
          );
          setIsFavourite(exists);
        }
      } catch (error) {
        // Silently fail - user might not be logged in
      }
    };
    
    checkFavourite();
  }, [user, data, type]);

  const handleToggleFavourite = async (e) => {
    e.stopPropagation();
    
    if (!user?._id && !user?.id) {
      toast.error('Please log in to add favourites');
      return;
    }

    setIsLoading(true);
    try {
      const userId = user?._id || user?.id;
      const itemId = data._id || data.id;
      const itemType = type === 'flight' ? 'flight' : type === 'hotel' ? 'hotel' : 'car';
      
      if (!itemId) {
        toast.error('Invalid item');
        return;
      }

      if (isFavourite) {
        // Remove from favourites
        const response = await userAPI.removeFavourite(userId, {
          itemId,
          type: itemType
        });
        
        if (response.data.success) {
          setIsFavourite(false);
          toast.success('Removed from favourites');
          if (onFavouriteChange) onFavouriteChange();
        }
      } else {
        // Add to favourites
        const response = await userAPI.addFavourite(userId, {
          itemId,
          type: itemType,
          itemData: data
        });
        
        if (response.data.success) {
          setIsFavourite(true);
          toast.success('Added to favourites');
          if (onFavouriteChange) onFavouriteChange();
        }
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already')) {
        setIsFavourite(true);
        toast.info('Already in favourites');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update favourites');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 h-full flex flex-col hover:shadow-2xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 min-w-[3rem] min-h-[3rem] bg-gradient-to-br from-kayak-blue to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="text-white text-xl w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{cardInfo.title}</h3>
            <p className="text-sm text-gray-600">{cardInfo.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {user && (
            <button
              onClick={handleToggleFavourite}
              disabled={isLoading}
              className={`p-2 rounded-full transition-all duration-200 ${
                isFavourite
                  ? 'text-red-500 hover:bg-red-50'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            >
              {isFavourite ? (
                <FaHeart className="text-lg" />
              ) : (
                <FaRegHeart className="text-lg" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4 flex-1">
        {cardInfo.details.map((detail, index) => {
          const DetailIcon = detail.icon;
          return (
            <div key={index} className="flex items-center space-x-2 text-gray-600 text-sm">
              <DetailIcon className="text-kayak-blue" />
              <span>{detail.text}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t gap-3">
        <div className="flex items-baseline gap-1 min-w-0 flex-1 overflow-hidden">
          <span className="text-xl font-bold text-kayak-blue whitespace-nowrap">
            {typeof cardInfo.price === 'number' ? `$${cardInfo.price.toFixed(2)}` : cardInfo.price}
          </span>
          {type === 'hotel' && <span className="text-sm text-gray-600 whitespace-nowrap">/night</span>}
          {type === 'car' && <span className="text-sm text-gray-600 whitespace-nowrap">/day</span>}
          {data.originalPrice && (
            <span className="text-xs text-gray-500 line-through ml-1 whitespace-nowrap hidden sm:inline">
              {typeof data.originalPrice === 'number' ? `$${data.originalPrice.toFixed(2)}` : data.originalPrice}
            </span>
          )}
        </div>
        {!hideBookButton && (
          <button 
            onClick={() => {
              if (!user?._id && !user?.id) {
                toast.info('Please log in to make a booking');
                return;
              }
              setShowBookingModal(true);
            }}
            className="btn-primary text-sm px-3 py-2 whitespace-nowrap flex-shrink-0 ml-2"
          >
            Book Now
          </button>
        )}
      </div>
      
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        item={data}
        type={type}
      />
    </motion.div>
  );
};

export default BookingCard;

