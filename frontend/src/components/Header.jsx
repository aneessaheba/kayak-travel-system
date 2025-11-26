import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaPlane, FaHotel, FaCar, FaUser, FaBars, FaTimes, FaSignOutAlt, FaCog, FaHeart, FaBook, FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { logoutUser } from '../store/slices/authSlice';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('flights');
  const userMenuRef = useRef(null);
  
  // Sync activeTab with URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['flights', 'hotels', 'cars'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const tabs = [
    { id: 'flights', label: 'Flights', icon: FaPlane },
    { id: 'hotels', label: 'Hotels', icon: FaHotel },
    { id: 'cars', label: 'Cars', icon: FaCar },
  ];

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-3xl font-bold bg-gradient-to-r from-kayak-blue to-kayak-orange bg-clip-text text-transparent">
              KAYAK
            </div>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Navigate to home page and scroll to Hero section, or navigate to search page
                    if (window.location.pathname === '/') {
                      // If already on home page, scroll to Hero section
                      const heroSection = document.getElementById('hero-section');
                      if (heroSection) {
                        heroSection.scrollIntoView({ behavior: 'smooth' });
                        // Trigger tab change in Hero component by dispatching event
                        window.dispatchEvent(new CustomEvent('changeSearchTab', { detail: tab.id }));
                      }
                    } else {
                      // Navigate to home page with tab parameter
                      navigate(`/?tab=${tab.id}`);
                    }
                  }}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-kayak-blue text-white shadow-lg'
                      : 'text-gray-700 hover:bg-kayak-blue-light'
                  }`}
                >
                  <Icon className="text-lg" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            <button className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-kayak-blue transition-colors">
              <span className="text-sm font-medium">Help</span>
            </button>
            
            {isAuthenticated ? (
              <div className="relative hidden md:block" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-kayak-blue transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-kayak-blue text-white flex items-center justify-center font-semibold">
                    {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                  <span className="text-sm font-medium">{user?.firstName || 'User'}</span>
                </button>
                
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-kayak-blue-light transition-colors"
                      >
                        <FaUser className="text-sm" />
                        <span className="text-sm">Profile</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-kayak-blue-light transition-colors"
                      >
                        <FaCog className="text-sm" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                      <Link
                        to="/bookings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-kayak-blue-light transition-colors"
                      >
                        <FaBook className="text-sm" />
                        <span className="text-sm">My Bookings</span>
                      </Link>
                      <Link
                        to="/favourites"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-kayak-blue-light transition-colors"
                      >
                        <FaHeart className="text-sm" />
                        <span className="text-sm">Favourites</span>
                      </Link>
                      <Link
                        to="/notifications"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-kayak-blue-light transition-colors"
                      >
                        <FaBell className="text-sm" />
                        <span className="text-sm">Notifications</span>
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          dispatch(logoutUser());
                          navigate('/');
                        }}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-kayak-blue-light transition-colors"
                      >
                        <FaSignOutAlt className="text-sm" />
                        <span className="text-sm">Sign out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-kayak-blue transition-colors"
              >
                <FaUser className="text-xl" />
                <span className="text-sm font-medium">Sign in</span>
              </button>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-700 hover:text-kayak-blue transition-colors"
            >
              {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMenuOpen(false);
                      // Navigate to home page and scroll to Hero section
                      if (window.location.pathname === '/') {
                        const heroSection = document.getElementById('hero-section');
                        if (heroSection) {
                          heroSection.scrollIntoView({ behavior: 'smooth' });
                          window.dispatchEvent(new CustomEvent('changeSearchTab', { detail: tab.id }));
                        }
                      } else {
                        navigate(`/?tab=${tab.id}`);
                      }
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 ${
                      activeTab === tab.id
                        ? 'bg-kayak-blue text-white'
                        : 'text-gray-700 hover:bg-kayak-blue-light'
                    }`}
                  >
                    <Icon />
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                );
              })}
              <div className="mt-4 pt-4 border-t space-y-2">
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:text-kayak-blue">
                  Help
                </button>
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-kayak-blue flex items-center space-x-2"
                    >
                      <FaUser />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-kayak-blue flex items-center space-x-2"
                    >
                      <FaCog />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/bookings"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-kayak-blue flex items-center space-x-2"
                    >
                      <FaBook />
                      <span>My Bookings</span>
                    </Link>
                    <Link
                      to="/favourites"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-kayak-blue flex items-center space-x-2"
                    >
                      <FaHeart />
                      <span>Favourites</span>
                    </Link>
                    <Link
                      to="/notifications"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-kayak-blue flex items-center space-x-2"
                    >
                      <FaBell />
                      <span>Notifications</span>
                    </Link>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        dispatch(logoutUser());
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:text-kayak-blue flex items-center space-x-2"
                    >
                      <FaSignOutAlt />
                      <span>Sign out</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:text-kayak-blue flex items-center space-x-2"
                  >
                    <FaUser />
                    <span>Sign in</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;

