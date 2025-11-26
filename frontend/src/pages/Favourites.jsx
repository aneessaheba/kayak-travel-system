import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaPlane, FaHotel, FaCar, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';
import BookingCard from '../components/BookingCard';
import { userAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Favourites = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'all', label: 'All', icon: FaHeart },
    { id: 'flights', label: 'Flights', icon: FaPlane },
    { id: 'hotels', label: 'Hotels', icon: FaHotel },
    { id: 'cars', label: 'Cars', icon: FaCar },
  ];

  useEffect(() => {
    if (!user?._id && !user?.id) {
      navigate('/login');
      return;
    }
    fetchFavourites();
  }, [user, activeTab]);

  const fetchFavourites = async () => {
    try {
      setLoading(true);
      const userId = user?._id || user?.id;
      if (!userId) return;

      const params = activeTab !== 'all' ? { type: activeTab.slice(0, -1) } : {};
      const response = await userAPI.getFavourites(userId, params);
      
      if (response.data.success) {
        // Transform favourites data to match BookingCard format
        const transformedFavourites = response.data.data.map(fav => ({
          ...fav.itemData,
          _id: fav.itemId,
          id: fav.itemId,
          type: fav.type,
        }));
        setFavourites(transformedFavourites);
      }
    } catch (error) {
      console.error('Error fetching favourites:', error);
      toast.error('Failed to load favourites');
    } finally {
      setLoading(false);
    }
  };

  // Refresh favourites when they change (handled by BookingCard's heart icon)
  const handleFavouriteChange = () => {
    fetchFavourites();
  };

  // Filter favourites by search query
  const filteredFavourites = favourites.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (item.type === 'flight') {
      return (
        item.airline?.toLowerCase().includes(query) ||
        item.flightNumber?.toLowerCase().includes(query) ||
        item.departureAirport?.city?.toLowerCase().includes(query) ||
        item.arrivalAirport?.city?.toLowerCase().includes(query)
      );
    } else if (item.type === 'hotel') {
      return (
        item.name?.toLowerCase().includes(query) ||
        item.address?.toLowerCase().includes(query) ||
        item.city?.toLowerCase().includes(query)
      );
    } else if (item.type === 'car') {
      return (
        item.brand?.toLowerCase().includes(query) ||
        item.model?.toLowerCase().includes(query) ||
        item.pickupLocation?.toLowerCase().includes(query)
      );
    }
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Favourites</h1>
          <p className="text-gray-600">Your saved flights, hotels, and cars</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-kayak-blue text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-kayak-blue-light'
                }`}
              >
                <Icon className="text-lg" />
                <span className="font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your favourites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
        </div>

        {/* Favourites List */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : filteredFavourites.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredFavourites.map((item, index) => (
              <motion.div
                key={item._id || item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                <BookingCard 
                  type={item.type} 
                  data={item} 
                  onFavouriteChange={handleFavouriteChange}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FaHeart className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No favourites yet</h3>
            <p className="text-gray-600 mb-6">
              Start saving your favorite flights, hotels, and cars!
            </p>
            <button 
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Explore Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favourites;

