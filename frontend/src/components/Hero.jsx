import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlane, FaHotel, FaCar, FaSearch, FaCalendarAlt, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Hero = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('flights');
  
  // Listen for tab changes from Header component
  useEffect(() => {
    const handleTabChange = (event) => {
      const tabId = event.detail;
      if (['flights', 'hotels', 'cars'].includes(tabId)) {
        setActiveTab(tabId);
      }
    };
    
    // Check URL parameter for tab
    const tabParam = searchParams.get('tab');
    if (tabParam && ['flights', 'hotels', 'cars'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    window.addEventListener('changeSearchTab', handleTabChange);
    return () => {
      window.removeEventListener('changeSearchTab', handleTabChange);
    };
  }, [searchParams]);
  const [departureDate, setDepartureDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [checkInDate, setCheckInDate] = useState(null);
  const [checkOutDate, setCheckOutDate] = useState(null);
  const [pickupDate, setPickupDate] = useState(null);
  const [dropoffDate, setDropoffDate] = useState(null);

  const tabs = [
    { id: 'flights', label: 'Flights', icon: FaPlane },
    { id: 'hotels', label: 'Hotels', icon: FaHotel },
    { id: 'cars', label: 'Cars', icon: FaCar },
  ];

  const renderFlightsForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          From
        </label>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue" />
          <input
            type="text"
            placeholder="City or airport"
            className="input-field pl-10"
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          To
        </label>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-orange" />
          <input
            type="text"
            placeholder="City or airport"
            className="input-field pl-10"
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Departure
        </label>
        <div className="relative">
          <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue z-10" />
          <DatePicker
            selected={departureDate}
            onChange={(date) => setDepartureDate(date)}
            placeholderText="Select date"
            className="input-field pl-10 w-full"
            minDate={new Date()}
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Return
        </label>
        <div className="relative">
          <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue z-10" />
          <DatePicker
            selected={returnDate}
            onChange={(date) => setReturnDate(date)}
            placeholderText="Select date"
            className="input-field pl-10 w-full"
            minDate={departureDate || new Date()}
          />
        </div>
      </div>
    </div>
  );

  const renderHotelsForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Where
        </label>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue" />
          <input
            type="text"
            placeholder="City, hotel, or landmark"
            className="input-field pl-10"
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Check-in
        </label>
        <div className="relative">
          <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue z-10" />
          <DatePicker
            selected={checkInDate}
            onChange={(date) => setCheckInDate(date)}
            placeholderText="Check-in date"
            className="input-field pl-10 w-full"
            minDate={new Date()}
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Check-out
        </label>
        <div className="relative">
          <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue z-10" />
          <DatePicker
            selected={checkOutDate}
            onChange={(date) => setCheckOutDate(date)}
            placeholderText="Check-out date"
            className="input-field pl-10 w-full"
            minDate={checkInDate || new Date()}
          />
        </div>
      </div>
    </div>
  );

  const renderCarsForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pick-up location
        </label>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue" />
          <input
            type="text"
            placeholder="City or airport"
            className="input-field pl-10"
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Pick-up date
        </label>
        <div className="relative">
          <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue z-10" />
          <DatePicker
            selected={pickupDate}
            onChange={(date) => setPickupDate(date)}
            placeholderText="Pick-up date"
            className="input-field pl-10 w-full"
            minDate={new Date()}
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Drop-off date
        </label>
        <div className="relative">
          <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue z-10" />
          <DatePicker
            selected={dropoffDate}
            onChange={(date) => setDropoffDate(date)}
            placeholderText="Drop-off date"
            className="input-field pl-10 w-full"
            minDate={pickupDate || new Date()}
          />
        </div>
      </div>
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Travelers
        </label>
        <div className="relative">
          <FaUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-kayak-blue" />
          <input
            type="number"
            placeholder="1"
            min="1"
            className="input-field pl-10"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div id="hero-section" className="relative min-h-[600px] bg-gradient-to-br from-kayak-blue via-blue-600 to-kayak-blue-dark">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`
        }}
      />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Where to next?
          </h1>
          <p className="text-xl text-blue-100">
            Search flights, hotels, and rental cars
          </p>
        </motion.div>

        {/* Search Tabs */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-kayak-blue text-white shadow-lg'
                      : 'text-gray-700 hover:bg-kayak-blue-light'
                  }`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Forms */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'flights' && renderFlightsForm()}
            {activeTab === 'hotels' && renderHotelsForm()}
            {activeTab === 'cars' && renderCarsForm()}
          </motion.div>

          {/* Search Button */}
          <div className="mt-8">
            <button
              onClick={() => {
                const params = new URLSearchParams();
                params.set('type', activeTab);
                if (activeTab === 'flights') {
                  // Get form values and add to params
                  params.set('from', document.querySelector('input[placeholder="City or airport"]')?.value || '');
                  params.set('to', document.querySelectorAll('input[placeholder="City or airport"]')[1]?.value || '');
                  if (departureDate) {
                    params.set('departureDate', departureDate.toISOString().split('T')[0]);
                  }
                  if (returnDate) {
                    params.set('returnDate', returnDate.toISOString().split('T')[0]);
                  }
                } else if (activeTab === 'hotels') {
                  // Get hotel search form values
                  const cityInput = document.querySelector('input[placeholder="City, hotel, or landmark"]');
                  if (cityInput?.value) {
                    params.set('city', cityInput.value);
                  }
                  if (checkInDate) {
                    params.set('checkIn', checkInDate.toISOString().split('T')[0]);
                  }
                  if (checkOutDate) {
                    params.set('checkOut', checkOutDate.toISOString().split('T')[0]);
                  }
                } else if (activeTab === 'cars') {
                  // Get car search form values
                  const pickupInput = document.querySelector('input[placeholder="City or airport"]');
                  if (pickupInput?.value) {
                    params.set('city', pickupInput.value);
                  }
                  if (pickupDate) {
                    params.set('pickupDate', pickupDate.toISOString().split('T')[0]);
                  }
                  if (dropoffDate) {
                    params.set('dropoffDate', dropoffDate.toISOString().split('T')[0]);
                  }
                }
                navigate(`/search?${params.toString()}`);
              }}
              className="btn-primary w-full md:w-auto flex items-center justify-center space-x-2 text-lg px-8 py-4"
            >
              <FaSearch />
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;

