import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaHotel, FaEdit, FaTrash, FaPlus, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { fetchHotels } from '../store/slices/hotelSlice';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { hotelAPI } from '../services/api';

const AdminHotels = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { hotels, loading } = useSelector((state) => state.hotels);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHotels, setFilteredHotels] = useState([]);

  useEffect(() => {
    dispatch(fetchHotels({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (hotels && hotels.length > 0) {
      const filtered = hotels.filter(hotel =>
        hotel.hotelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.state?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHotels(filtered);
    } else {
      setFilteredHotels([]);
    }
  }, [hotels, searchTerm]);

  const handleDelete = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) return;
    
    try {
      await hotelAPI.deleteHotel(hotelId);
      toast.success('Hotel deleted successfully');
      dispatch(fetchHotels({ limit: 100 }));
    } catch (error) {
      toast.error('Failed to delete hotel');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Hotels</h1>
                <p className="text-gray-600 mt-1">Total: {filteredHotels.length} hotels</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/hotels/new')}
              className="btn-primary flex items-center space-x-2"
            >
              <FaPlus />
              <span>Add Hotel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search hotels by name, city, or state..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full max-w-md"
            />
          </div>
        </div>

        {/* Hotels Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Night</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHotels.length > 0 ? (
                  filteredHotels.map((hotel) => (
                    <tr key={hotel._id || hotel.hotelId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{hotel.hotelName}</div>
                        <div className="text-sm text-gray-500">{hotel.hotelType || 'Hotel'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {hotel.city}, {hotel.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-yellow-500">★</span>
                          <span className="text-sm text-gray-900 ml-1">
                            {hotel.starRating || hotel.hotelRating?.average || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${hotel.pricePerNight || hotel.averagePrice || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {hotel.totalRooms || hotel.availableRooms || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/hotels/${hotel._id || hotel.hotelId}/edit`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(hotel._id || hotel.hotelId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No hotels found matching your search' : 'No hotels available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHotels;

