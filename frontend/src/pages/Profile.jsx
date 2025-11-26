import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaBirthdayCake, FaGlobe, FaLanguage, FaDollarSign, FaUserShield, FaPlane } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { updateUser } from '../store/slices/authSlice';
import { useToast } from '../context/ToastContext';
import { userAPI } from '../services/api';

// US States with abbreviations
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

// Gender options
const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

// Language options
const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Italian', label: 'Italian' },
  { value: 'Portuguese', label: 'Portuguese' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Arabic', label: 'Arabic' },
];

// Currency options
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
];

// Seat preference options
const SEAT_PREFERENCE_OPTIONS = [
  { value: 'Window', label: 'Window' },
  { value: 'Aisle', label: 'Aisle' },
  { value: 'Middle', label: 'Middle' },
  { value: 'No Preference', label: 'No Preference' },
];

// Meal preference options
const MEAL_PREFERENCE_OPTIONS = [
  { value: 'Vegetarian', label: 'Vegetarian' },
  { value: 'Vegan', label: 'Vegan' },
  { value: 'Halal', label: 'Halal' },
  { value: 'Kosher', label: 'Kosher' },
  { value: 'Gluten-Free', label: 'Gluten-Free' },
  { value: 'No Preference', label: 'No Preference' },
];

// Helper function to decode JWT and get user ID
const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const Profile = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [userId, setUserId] = useState(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
  });

  // Get user ID from token or user object
  useEffect(() => {
    const id = user?._id || user?.id || getUserIdFromToken();
    setUserId(id);
    console.log('Profile - User object:', user);
    console.log('Profile - User ID from token:', getUserIdFromToken());
    console.log('Profile - Final User ID:', id);
  }, [user]);

  // Fetch fresh user data when component mounts or userId changes
  useEffect(() => {
    const fetchUserData = async () => {
      const finalUserId = userId || user?._id || user?.id || getUserIdFromToken();
      if (finalUserId) {
        try {
          console.log('Fetching user data for ID:', finalUserId);
          const response = await userAPI.getUser(finalUserId);
          if (response.data.success) {
            console.log('Fetched user data:', JSON.stringify(response.data.data, null, 2));
            console.log('Emergency Contact:', response.data.data.emergencyContact);
            console.log('Travel Preferences:', response.data.data.travelPreferences);
            dispatch(updateUser(response.data.data));
            localStorage.setItem('user', JSON.stringify(response.data.data));
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };
    // Fetch user data when component mounts or userId becomes available
    if (userId || user?._id) {
      fetchUserData();
    }
  }, [userId]); // Run when userId changes
  
  // Update form data when user changes
  useEffect(() => {
    if (user) {
      console.log('Updating formData from user object:', user);
      console.log('User emergencyContact:', user.emergencyContact);
      console.log('User travelPreferences:', user.travelPreferences);
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || '',
        city: user?.city || '',
        state: user?.state || '',
        zipCode: user?.zipCode || '',
        gender: user?.gender || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        country: user?.country || 'USA',
        preferredLanguage: user?.preferredLanguage || 'English',
        currency: user?.currency || 'USD',
        emergencyContact: {
          name: user?.emergencyContact?.name || '',
          phone: user?.emergencyContact?.phone || '',
          relationship: user?.emergencyContact?.relationship || '',
        },
        travelPreferences: {
          passportNumber: user?.travelPreferences?.passportNumber || '',
          frequentFlyerNumber: user?.travelPreferences?.frequentFlyerNumber || '',
          seatPreference: user?.travelPreferences?.seatPreference || 'No Preference',
          mealPreference: user?.travelPreferences?.mealPreference || 'No Preference',
        },
      });
      console.log('FormData updated:', {
        emergencyContact: {
          name: user?.emergencyContact?.name || '',
          phone: user?.emergencyContact?.phone || '',
          relationship: user?.emergencyContact?.relationship || '',
        },
        travelPreferences: {
          passportNumber: user?.travelPreferences?.passportNumber || '',
          frequentFlyerNumber: user?.travelPreferences?.frequentFlyerNumber || '',
          seatPreference: user?.travelPreferences?.seatPreference || 'No Preference',
          mealPreference: user?.travelPreferences?.mealPreference || 'No Preference',
        },
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        emergencyContact: {
          ...formData.emergencyContact,
          [field]: value,
        },
      });
    } else if (name.startsWith('travelPreferences.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        travelPreferences: {
          ...formData.travelPreferences,
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSave = async () => {
    try {
      // Try to get user ID from multiple sources
      const finalUserId = userId || user?._id || user?.id || getUserIdFromToken();
      
      if (!finalUserId) {
        toast.error('User ID not found. Please log in again.');
        console.error('No user ID available. User object:', user);
        return;
      }
      
      console.log('Updating user with ID:', finalUserId);
      console.log('Update data:', formData);
      
      // Prepare update data - ensure nested objects are properly structured
      const updateData = {
        ...formData,
        // Ensure dateOfBirth is properly formatted if it exists
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
      };
      
      console.log('Update data being sent to API:', JSON.stringify(updateData, null, 2));
      
      const response = await userAPI.updateUser(finalUserId, updateData);
      
      console.log('Update response:', response.data);
      
      if (response.data.success) {
        console.log('Update successful! Response data:', JSON.stringify(response.data.data, null, 2));
        console.log('Response emergencyContact:', response.data.data.emergencyContact);
        console.log('Response travelPreferences:', response.data.data.travelPreferences);
        
        // Update Redux store with the new user data
        dispatch(updateUser(response.data.data));
        
        // Also update localStorage to persist the data
        localStorage.setItem('user', JSON.stringify(response.data.data));
        
        // Wait a bit then refetch to ensure database has the latest
        setTimeout(async () => {
          try {
            const refreshedUser = await userAPI.getUser(finalUserId);
            if (refreshedUser.data.success) {
              console.log('Refreshed user data after save:', JSON.stringify(refreshedUser.data.data, null, 2));
              console.log('Refreshed emergencyContact:', refreshedUser.data.data.emergencyContact);
              console.log('Refreshed travelPreferences:', refreshedUser.data.data.travelPreferences);
              dispatch(updateUser(refreshedUser.data.data));
              localStorage.setItem('user', JSON.stringify(refreshedUser.data.data));
            }
          } catch (refreshError) {
            console.warn('Could not refresh user data:', refreshError);
          }
        }, 500);
        
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      } else {
        toast.error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      city: user?.city || '',
      state: user?.state || '',
      zipCode: user?.zipCode || '',
      gender: user?.gender || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      country: user?.country || 'USA',
      preferredLanguage: user?.preferredLanguage || 'English',
      currency: user?.currency || 'USD',
      emergencyContact: {
        name: user?.emergencyContact?.name || '',
        phone: user?.emergencyContact?.phone || '',
        relationship: user?.emergencyContact?.relationship || '',
      },
      travelPreferences: {
        passportNumber: user?.travelPreferences?.passportNumber || '',
        frequentFlyerNumber: user?.travelPreferences?.frequentFlyerNumber || '',
        seatPreference: user?.travelPreferences?.seatPreference || 'No Preference',
        mealPreference: user?.travelPreferences?.mealPreference || 'No Preference',
      },
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">My Profile</h1>
              <p className="text-gray-600">Manage your personal information and preferences</p>
            </div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-kayak-blue hover:bg-kayak-blue-dark text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <FaEdit />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-200"
                >
                  <FaTimes />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  className="bg-kayak-blue hover:bg-kayak-blue-dark text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 shadow-md transition-all duration-200 hover:shadow-lg"
                >
                  <FaSave />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Profile Card with Enhanced Box Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-6 overflow-hidden"
        >
          {/* Avatar Section with Enhanced Box */}
          <div className="bg-gradient-to-br from-kayak-blue-light to-blue-50 rounded-xl p-6 mb-8 border border-blue-100">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-kayak-blue to-kayak-orange flex items-center justify-center text-white text-5xl font-bold shadow-lg ring-4 ring-white">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {user?.firstName} {user?.lastName}
                </h2>
                <div className="flex items-center space-x-4 mb-2">
                  <p className="text-gray-600 flex items-center">
                    <FaEnvelope className="mr-2 text-gray-400" />
                    {user?.email}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 border border-gray-200 shadow-sm">
                    ID: {user?.userId}
                  </span>
                  {user?.gender && (
                    <span className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-700 border border-gray-200 shadow-sm">
                      {user.gender}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields with Enhanced Boxes */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-1 h-6 bg-kayak-blue rounded-full mr-3"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-kayak-blue-light transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kayak-blue focus:ring-2 focus:ring-kayak-blue-light bg-white text-gray-900 transition-all"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.firstName || 'N/A'}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-kayak-blue-light transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kayak-blue focus:ring-2 focus:ring-kayak-blue-light bg-white text-gray-900 transition-all"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.lastName || 'N/A'}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-kayak-blue-light transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaEnvelope className="text-gray-500" />
                  <span>Email</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 text-gray-600 cursor-not-allowed"
                    disabled
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.email || 'N/A'}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-kayak-blue-light transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaPhone className="text-gray-500" />
                  <span>Phone Number</span>
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kayak-blue focus:ring-2 focus:ring-kayak-blue-light bg-white text-gray-900 transition-all"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.phoneNumber || 'N/A'}</p>
                )}
              </div>

              <div className="md:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-kayak-blue-light transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaMapMarkerAlt className="text-gray-500" />
                  <span>Address</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kayak-blue focus:ring-2 focus:ring-kayak-blue-light bg-white text-gray-900 transition-all"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.address || 'N/A'}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-kayak-blue-light transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kayak-blue focus:ring-2 focus:ring-kayak-blue-light bg-white text-gray-900 transition-all"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.city || 'N/A'}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-kayak-blue-light transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                {isEditing ? (
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kayak-blue focus:ring-2 focus:ring-kayak-blue-light bg-white text-gray-900 transition-all"
                  >
                    <option value="">Select a state</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.value} - {state.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {formData.state 
                      ? `${formData.state} - ${US_STATES.find(s => s.value === formData.state)?.label || formData.state}`
                      : user?.state || 'N/A'}
                  </p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-kayak-blue-light transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-kayak-blue focus:ring-2 focus:ring-kayak-blue-light bg-white text-gray-900 transition-all"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.zipCode || 'N/A'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information Section with Enhanced Boxes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-kayak-blue-light flex items-center justify-center">
                  <FaUser className="text-kayak-blue" />
                </div>
                <span>Personal Information</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100 hover:border-purple-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaUser className="text-purple-600" />
                  <span>Gender</span>
                </label>
                {isEditing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white text-gray-900 transition-all"
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.gender || 'N/A'}</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-100 hover:border-blue-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaBirthdayCake className="text-blue-600" />
                  <span>Date of Birth</span>
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white text-gray-900 transition-all"
                    max={new Date().toISOString().split('T')[0]}
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {user?.dateOfBirth
                      ? new Date(user.dateOfBirth).toLocaleDateString()
                      : 'N/A'}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100 hover:border-green-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaGlobe className="text-green-600" />
                  <span>Country</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white text-gray-900 transition-all"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.country || 'N/A'}</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-100 hover:border-orange-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaLanguage className="text-orange-600" />
                  <span>Preferred Language</span>
                </label>
                {isEditing ? (
                  <select
                    name="preferredLanguage"
                    value={formData.preferredLanguage}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white text-gray-900 transition-all"
                  >
                    {LANGUAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.preferredLanguage || 'N/A'}</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-5 border border-indigo-100 hover:border-indigo-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaDollarSign className="text-indigo-600" />
                  <span>Currency</span>
                </label>
                {isEditing ? (
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white text-gray-900 transition-all"
                  >
                    {CURRENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{user?.currency || 'N/A'}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Emergency Contact Section with Enhanced Boxes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <FaUserShield className="text-red-600" />
                </div>
                <span>Emergency Contact</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-100 hover:border-red-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="emergencyContact.name"
                    value={formData.emergencyContact.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white text-gray-900 transition-all"
                    placeholder="Full name"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {user?.emergencyContact?.name || 'N/A'}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-100 hover:border-red-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="emergencyContact.phone"
                    value={formData.emergencyContact.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white text-gray-900 transition-all"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {user?.emergencyContact?.phone || 'N/A'}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 border border-red-100 hover:border-red-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Relationship
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="emergencyContact.relationship"
                    value={formData.emergencyContact.relationship}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-red-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-white text-gray-900 transition-all"
                    placeholder="e.g., Spouse, Parent, Friend"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {user?.emergencyContact?.relationship || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Travel Preferences Section with Enhanced Boxes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <FaPlane className="text-cyan-600" />
                </div>
                <span>Travel Preferences</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-5 border border-cyan-100 hover:border-cyan-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaUser className="text-cyan-600" />
                  <span>Passport Number</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="travelPreferences.passportNumber"
                    value={formData.travelPreferences.passportNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white text-gray-900 transition-all"
                    placeholder="Enter passport number"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {user?.travelPreferences?.passportNumber
                      ? '••••••••' + user.travelPreferences.passportNumber.slice(-4)
                      : 'N/A'}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-5 border border-cyan-100 hover:border-cyan-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                  <FaPlane className="text-cyan-600" />
                  <span>Frequent Flyer Number</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="travelPreferences.frequentFlyerNumber"
                    value={formData.travelPreferences.frequentFlyerNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white text-gray-900 transition-all"
                    placeholder="Enter frequent flyer number"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {user?.travelPreferences?.frequentFlyerNumber || 'N/A'}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-5 border border-cyan-100 hover:border-cyan-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Seat Preference
                </label>
                {isEditing ? (
                  <select
                    name="travelPreferences.seatPreference"
                    value={formData.travelPreferences.seatPreference}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white text-gray-900 transition-all"
                  >
                    {SEAT_PREFERENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {user?.travelPreferences?.seatPreference || 'N/A'}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-5 border border-cyan-100 hover:border-cyan-300 transition-all">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meal Preference
                </label>
                {isEditing ? (
                  <select
                    name="travelPreferences.mealPreference"
                    value={formData.travelPreferences.mealPreference}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-cyan-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 bg-white text-gray-900 transition-all"
                  >
                    {MEAL_PREFERENCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-gray-900 font-medium text-lg">
                    {user?.travelPreferences?.mealPreference || 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;

