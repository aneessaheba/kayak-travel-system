import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FaPlane, FaEdit, FaTrash, FaPlus, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { fetchFlights } from '../store/slices/flightSlice';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { flightAPI } from '../services/api';

const AdminFlights = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { flights, loading } = useSelector((state) => state.flights);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFlights, setFilteredFlights] = useState([]);

  useEffect(() => {
    dispatch(fetchFlights({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (flights && flights.length > 0) {
      const filtered = flights.filter(flight =>
        flight.airline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.departureAirport?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.arrivalAirport?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.flightId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFlights(filtered);
    } else {
      setFilteredFlights([]);
    }
  }, [flights, searchTerm]);

  const handleDelete = async (flightId) => {
    if (!window.confirm('Are you sure you want to delete this flight?')) return;
    
    try {
      await flightAPI.deleteFlight(flightId);
      toast.success('Flight deleted successfully');
      dispatch(fetchFlights({ limit: 100 }));
    } catch (error) {
      toast.error('Failed to delete flight');
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
                <h1 className="text-3xl font-bold text-gray-900">Manage Flights</h1>
                <p className="text-gray-600 mt-1">Total: {filteredFlights.length} flights</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin/flights/new')}
              className="btn-primary flex items-center space-x-2"
            >
              <FaPlus />
              <span>Add Flight</span>
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
              placeholder="Search flights by airline, city, or flight ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full max-w-md"
            />
          </div>
        </div>

        {/* Flights Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flight ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Airline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFlights.length > 0 ? (
                  filteredFlights.map((flight) => (
                    <tr key={flight._id || flight.flightId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {flight.flightId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {flight.airline}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {flight.departureAirport?.city || 'N/A'} → {flight.arrivalAirport?.city || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {flight.departureDateTime ? new Date(flight.departureDateTime).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ${flight.ticketPrice || flight.fare || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {flight.availableSeats || 0} / {flight.totalAvailableSeats || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => navigate(`/admin/flights/${flight._id || flight.flightId}/edit`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(flight._id || flight.flightId)}
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
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? 'No flights found matching your search' : 'No flights available'}
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

export default AdminFlights;

