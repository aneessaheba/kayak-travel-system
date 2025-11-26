import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaHotel, FaArrowLeft, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { hotelAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminHotelForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [formData, setFormData] = useState({
    hotelId: '',
    hotelName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    starRating: 3,
    numberOfRooms: 0,
    availableRooms: 0,
    pricePerNight: 0,
    maxGuests: 1, // Changed from 0 to 1 to match default
    amenities: [],
  });

  const [errors, setErrors] = useState({});
  const [newAmenity, setNewAmenity] = useState('');

  const commonAmenities = ['WiFi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Parking', 'Air Conditioning', 'Room Service', 'Bar', 'Business Center'];

  useEffect(() => {
    if (isEdit) {
      fetchHotel();
    }
  }, [id]);

  const fetchHotel = async () => {
    try {
      setFetching(true);
      const response = await hotelAPI.getHotel(id);
      if (response.data.success) {
        const hotel = response.data.data;
        console.log('Fetched hotel data:', hotel);
        console.log('Fetched hotel maxGuests:', hotel.maxGuests);
        setFormData({
          hotelId: hotel.hotelId || '',
          hotelName: hotel.hotelName || '',
          address: hotel.address || '',
          city: hotel.city || '',
          state: hotel.state || '',
          zipCode: hotel.zipCode || '',
          starRating: hotel.starRating || 3,
          numberOfRooms: hotel.numberOfRooms || hotel.totalRooms || 0,
          availableRooms: hotel.availableRooms || 0,
          pricePerNight: hotel.pricePerNight || hotel.averagePrice || 0,
          maxGuests: (hotel.maxGuests !== undefined && hotel.maxGuests !== null) ? hotel.maxGuests : 1,
          amenities: hotel.amenities || [],
        });
      }
    } catch (error) {
      toast.error('Failed to fetch hotel details');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'starRating' || name === 'numberOfRooms' || name === 'availableRooms' || name === 'pricePerNight' || name === 'maxGuests' ? parseFloat(value) || 0 : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const addAmenity = () => {
    if (newAmenity && !formData.amenities.includes(newAmenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.hotelId) newErrors.hotelId = 'Hotel ID is required';
    if (!formData.hotelName) newErrors.hotelName = 'Hotel name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.zipCode) newErrors.zipCode = 'Zip code is required';
    if (formData.pricePerNight <= 0) newErrors.pricePerNight = 'Price per night must be greater than 0';
    if (formData.numberOfRooms <= 0) newErrors.numberOfRooms = 'Number of rooms must be greater than 0';
    if (formData.maxGuests <= 0) newErrors.maxGuests = 'Max guests must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      // Read maxGuests directly from DOM to ensure we have the latest value
      const maxGuestsInput = document.querySelector('input[name="maxGuests"]');
      const maxGuestsValue = maxGuestsInput ? parseInt(maxGuestsInput.value) || parseInt(formData.maxGuests) || 1 : parseInt(formData.maxGuests) || 1;
      
      const submitData = {
        hotelId: formData.hotelId,
        hotelName: formData.hotelName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        starRating: parseInt(formData.starRating),
        numberOfRooms: parseInt(formData.numberOfRooms),
        availableRooms: parseInt(formData.availableRooms),
        pricePerNight: parseFloat(formData.pricePerNight),
        maxGuests: maxGuestsValue,
        amenities: formData.amenities,
      };

      console.log('Submitting hotel data:', JSON.stringify(submitData, null, 2));
      console.log('Max guests value:', submitData.maxGuests);
      console.log('Max guests type:', typeof submitData.maxGuests);
      console.log('Max guests from DOM:', maxGuestsInput?.value);
      console.log('Max guests from formData:', formData.maxGuests);

      if (isEdit) {
        const response = await hotelAPI.updateHotel(id, submitData);
        console.log('Update response:', response.data);
        if (response.data?.data) {
          console.log('Updated hotel maxGuests:', response.data.data.maxGuests);
        }
        toast.success('Hotel updated successfully');
      } else {
        await hotelAPI.createHotel(submitData);
        toast.success('Hotel created successfully');
      }
      navigate('/admin/hotels');
    } catch (error) {
      console.error('Error saving hotel:', error);
      toast.error(error.response?.data?.message || 'Failed to save hotel');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/hotels')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Edit Hotel' : 'Add New Hotel'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hotel ID *</label>
              <input
                type="text"
                name="hotelId"
                value={formData.hotelId}
                onChange={handleChange}
                className={`input-field ${errors.hotelId ? 'border-red-500' : ''}`}
              />
              {errors.hotelId && <p className="mt-1 text-sm text-red-500">{errors.hotelId}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Hotel Name *</label>
              <input
                type="text"
                name="hotelName"
                value={formData.hotelName}
                onChange={handleChange}
                className={`input-field ${errors.hotelName ? 'border-red-500' : ''}`}
              />
              {errors.hotelName && <p className="mt-1 text-sm text-red-500">{errors.hotelName}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`input-field ${errors.address ? 'border-red-500' : ''}`}
            />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`input-field ${errors.city ? 'border-red-500' : ''}`}
              />
              {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`input-field ${errors.state ? 'border-red-500' : ''}`}
              />
              {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code *</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className={`input-field ${errors.zipCode ? 'border-red-500' : ''}`}
              />
              {errors.zipCode && <p className="mt-1 text-sm text-red-500">{errors.zipCode}</p>}
            </div>
          </div>

          {/* Rating & Rooms */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Star Rating *</label>
              <select
                name="starRating"
                value={formData.starRating}
                onChange={handleChange}
                className="input-field w-full h-[42px]"
              >
                <option value={1}>1 Star</option>
                <option value={2}>2 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={5}>5 Stars</option>
              </select>
              <div className="h-5"></div>
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Total Rooms *</label>
              <input
                type="number"
                name="numberOfRooms"
                value={formData.numberOfRooms}
                onChange={handleChange}
                className={`input-field w-full h-[42px] ${errors.numberOfRooms ? 'border-red-500' : ''}`}
                min="1"
              />
              {errors.numberOfRooms ? (
                <p className="mt-1 text-sm text-red-500">{errors.numberOfRooms}</p>
              ) : (
                <div className="h-5"></div>
              )}
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Available Rooms *</label>
              <input
                type="number"
                name="availableRooms"
                value={formData.availableRooms}
                onChange={handleChange}
                className="input-field w-full h-[42px]"
                min="0"
                max={formData.numberOfRooms}
              />
              <div className="h-5"></div>
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price/Night ($) *</label>
              <input
                type="number"
                name="pricePerNight"
                value={formData.pricePerNight}
                onChange={handleChange}
                className={`input-field w-full h-[42px] ${errors.pricePerNight ? 'border-red-500' : ''}`}
                min="0"
                step="0.01"
              />
              {errors.pricePerNight ? (
                <p className="mt-1 text-sm text-red-500">{errors.pricePerNight}</p>
              ) : (
                <div className="h-5"></div>
              )}
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Guests *</label>
              <input
                type="number"
                name="maxGuests"
                value={formData.maxGuests}
                onChange={handleChange}
                className={`input-field w-full h-[42px] ${errors.maxGuests ? 'border-red-500' : ''}`}
                min="1"
              />
              {errors.maxGuests ? (
                <p className="mt-1 text-sm text-red-500">{errors.maxGuests}</p>
              ) : (
                <div className="h-5"></div>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{amenity}</span>
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <select
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                className="input-field flex-1"
              >
                <option value="">Select an amenity...</option>
                {commonAmenities.filter(a => !formData.amenities.includes(a)).map(amenity => (
                  <option key={amenity} value={amenity}>{amenity}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addAmenity}
                className="btn-secondary flex items-center space-x-2"
              >
                <FaPlus />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/hotels')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? <LoadingSpinner size="sm" /> : <FaSave />}
              <span>{isEdit ? 'Update Hotel' : 'Create Hotel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminHotelForm;

