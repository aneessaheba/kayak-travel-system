import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaCar, FaArrowLeft, FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import { useToast } from '../context/ToastContext';
import { carAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminCarForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [formData, setFormData] = useState({
    carId: '',
    carType: 'Sedan',
    company: '',
    model: '',
    year: new Date().getFullYear(),
    transmissionType: 'Automatic',
    numberOfSeats: 5,
    dailyRentalPrice: 0,
    availabilityStatus: 'available',
    location: {
      city: '',
      state: '',
      address: ''
    },
    features: [],
  });

  const [errors, setErrors] = useState({});
  const [newFeature, setNewFeature] = useState('');

  const commonFeatures = ['GPS', 'Bluetooth', 'USB', 'Backup Camera', 'Sunroof', 'Leather Seats', 'Heated Seats', 'Navigation'];

  useEffect(() => {
    if (isEdit) {
      fetchCar();
    }
  }, [id]);

  const fetchCar = async () => {
    try {
      setFetching(true);
      const response = await carAPI.getCar(id);
      if (response.data.success) {
        const car = response.data.data;
        setFormData({
          carId: car.carId || '',
          carType: car.carType || 'Sedan',
          company: car.company || '',
          model: car.model || '',
          year: car.year || new Date().getFullYear(),
          transmissionType: car.transmissionType || 'Automatic',
          numberOfSeats: car.numberOfSeats || 5,
          dailyRentalPrice: car.dailyRentalPrice || car.pricePerDay || 0,
          availabilityStatus: car.availabilityStatus || 'available',
          location: car.location || { city: '', state: '', address: '' },
          features: car.features || [],
        });
      }
    } catch (error) {
      toast.error('Failed to fetch car details');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'year' || name === 'numberOfSeats' || name === 'dailyRentalPrice'
          ? parseFloat(value) || 0
          : value
      }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addFeature = () => {
    if (newFeature && !formData.features.includes(newFeature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.carId) newErrors.carId = 'Car ID is required';
    if (!formData.company) newErrors.company = 'Company is required';
    if (!formData.model) newErrors.model = 'Model is required';
    if (!formData.location.city) newErrors['location.city'] = 'City is required';
    if (formData.dailyRentalPrice <= 0) newErrors.dailyRentalPrice = 'Daily rental price must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        year: parseInt(formData.year),
        numberOfSeats: parseInt(formData.numberOfSeats),
        dailyRentalPrice: parseFloat(formData.dailyRentalPrice),
      };

      if (isEdit) {
        await carAPI.updateCar(id, submitData);
        toast.success('Car updated successfully');
      } else {
        await carAPI.createCar(submitData);
        toast.success('Car created successfully');
      }
      navigate('/admin/cars');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save car');
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
              onClick={() => navigate('/admin/cars')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isEdit ? 'Edit Car' : 'Add New Car'}
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Car ID *</label>
              <input
                type="text"
                name="carId"
                value={formData.carId}
                onChange={handleChange}
                className={`input-field ${errors.carId ? 'border-red-500' : ''}`}
                disabled={isEdit}
              />
              {errors.carId && <p className="mt-1 text-sm text-red-500">{errors.carId}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Company *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className={`input-field ${errors.company ? 'border-red-500' : ''}`}
                placeholder="Hertz"
              />
              {errors.company && <p className="mt-1 text-sm text-red-500">{errors.company}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Model *</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`input-field ${errors.model ? 'border-red-500' : ''}`}
                placeholder="Camry"
              />
              {errors.model && <p className="mt-1 text-sm text-red-500">{errors.model}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="input-field"
                min="2000"
                max={new Date().getFullYear() + 1}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Car Type</label>
              <select
                name="carType"
                value={formData.carType}
                onChange={handleChange}
                className="input-field"
              >
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Compact">Compact</option>
                <option value="Luxury">Luxury</option>
                <option value="Convertible">Convertible</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
              </select>
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Transmission</label>
              <select
                name="transmissionType"
                value={formData.transmissionType}
                onChange={handleChange}
                className="input-field"
              >
                <option value="Automatic">Automatic</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Seats</label>
              <input
                type="number"
                name="numberOfSeats"
                value={formData.numberOfSeats}
                onChange={handleChange}
                className="input-field"
                min="2"
                max="15"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Daily Rental Price ($) *</label>
              <input
                type="number"
                name="dailyRentalPrice"
                value={formData.dailyRentalPrice}
                onChange={handleChange}
                className={`input-field ${errors.dailyRentalPrice ? 'border-red-500' : ''}`}
                min="0"
                step="0.01"
              />
              {errors.dailyRentalPrice && <p className="mt-1 text-sm text-red-500">{errors.dailyRentalPrice}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Availability Status</label>
            <select
              name="availabilityStatus"
              value={formData.availabilityStatus}
              onChange={handleChange}
              className="input-field"
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Location *</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  className={`input-field ${errors['location.city'] ? 'border-red-500' : ''}`}
                />
                {errors['location.city'] && <p className="mt-1 text-sm text-red-500">{errors['location.city']}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-2"
                >
                  <span>{feature}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(feature)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <select
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                className="input-field flex-1"
              >
                <option value="">Select a feature...</option>
                {commonFeatures.filter(f => !formData.features.includes(f)).map(feature => (
                  <option key={feature} value={feature}>{feature}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={addFeature}
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
              onClick={() => navigate('/admin/cars')}
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
              <span>{isEdit ? 'Update Car' : 'Create Car'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCarForm;

