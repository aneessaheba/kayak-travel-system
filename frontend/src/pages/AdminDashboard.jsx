import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaHotel, FaPlane, FaCar, FaUsers, FaDollarSign, FaSignOutAlt, FaBook, FaCalendarAlt, FaChartBar } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { fetchAnalytics, adminLogout } from '../store/slices/adminSlice';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { BarChart, LineChart, PieChart, RevenueChart } from '../components/ChartComponents';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { admin, analytics, loading } = useSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAnalytics()).catch((error) => {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    });
  }, [dispatch, toast]);

  const handleLogout = () => {
    dispatch(adminLogout());
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  // Ensure analytics has default structure - MUST be defined before use
  const safeAnalytics = {
    stats: {
      totalRevenue: analytics?.stats?.totalRevenue || 0,
      totalBookings: analytics?.stats?.totalBookings || 0,
      totalUsers: analytics?.stats?.totalUsers || 0,
      totalFlights: analytics?.stats?.totalFlights || 0,
      totalHotels: analytics?.stats?.totalHotels || 0,
      totalCars: analytics?.stats?.totalCars || 0,
    },
    monthlyRevenue: analytics?.monthlyRevenue || [],
    monthlyBookings: analytics?.monthlyBookings || [],
    bookingTypeDistribution: analytics?.bookingTypeDistribution || [],
    bookingStatusDistribution: analytics?.bookingStatusDistribution || [],
    topProperties: analytics?.topProperties || [],
    cityWiseRevenue: analytics?.cityWiseRevenue || [],
    topProviders: analytics?.topProviders || [],
  };

  const statCards = [
    { 
      label: 'Total Revenue', 
      value: `$${safeAnalytics.stats.totalRevenue.toLocaleString()}`,
      icon: FaDollarSign, 
      color: 'from-green-500 to-green-600',
      change: '+12.5%'
    },
    { 
      label: 'Total Bookings', 
      value: safeAnalytics.stats.totalBookings.toLocaleString(),
      icon: FaChartLine, 
      color: 'from-blue-500 to-blue-600',
      change: '+8.2%'
    },
    { 
      label: 'Active Users', 
      value: safeAnalytics.stats.totalUsers.toLocaleString(),
      icon: FaUsers, 
      color: 'from-purple-500 to-purple-600',
      change: '+15.3%'
    },
    { 
      label: 'Total Properties', 
      value: (safeAnalytics.stats.totalHotels + safeAnalytics.stats.totalCars + safeAnalytics.stats.totalFlights).toLocaleString(),
      icon: FaHotel, 
      color: 'from-orange-500 to-orange-600',
      change: '+5.1%'
    },
  ];

  // Show loading only on initial load
  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {admin?.firstName || 'Admin'} {admin?.lastName || ''}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <button
              onClick={() => navigate('/admin/flights')}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <FaPlane className="text-blue-600 text-xl" />
              <span className="font-semibold text-gray-900">Manage Flights</span>
            </button>
            <button
              onClick={() => navigate('/admin/hotels')}
              className="flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <FaHotel className="text-purple-600 text-xl" />
              <span className="font-semibold text-gray-900">Manage Hotels</span>
            </button>
            <button
              onClick={() => navigate('/admin/cars')}
              className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <FaCar className="text-orange-600 text-xl" />
              <span className="font-semibold text-gray-900">Manage Cars</span>
            </button>
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <FaUsers className="text-green-600 text-xl" />
              <span className="font-semibold text-gray-900">Manage Users</span>
            </button>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="flex items-center space-x-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <FaBook className="text-indigo-600 text-xl" />
              <span className="font-semibold text-gray-900">View Bookings</span>
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-green-600 mt-1">{stat.change} from last month</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white text-xl" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Properties */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Properties</h2>
            {safeAnalytics?.topProperties && safeAnalytics.topProperties.length > 0 ? (
              <div className="space-y-4">
                {safeAnalytics.topProperties.map((property, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-900">{property.name}</p>
                      <p className="text-sm text-gray-600">{property.bookings} bookings</p>
                    </div>
                    <p className="text-lg font-bold text-green-600">${property.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </motion.div>

          {/* City Wise Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">City Wise Revenue</h2>
            {safeAnalytics?.cityWiseRevenue && safeAnalytics.cityWiseRevenue.length > 0 ? (
              <div className="space-y-4">
                {safeAnalytics.cityWiseRevenue.map((city, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <FaHotel className="text-white" />
                      </div>
                      <p className="font-semibold text-gray-900">{city.city}</p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">${city.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </motion.div>
        </div>

        {/* Revenue Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Monthly Revenue Trend</h2>
              <p className="text-sm text-gray-600 mt-1">Last 6 months revenue overview</p>
            </div>
            <FaChartBar className="text-green-600 text-xl" />
          </div>
          {safeAnalytics?.monthlyRevenue && safeAnalytics.monthlyRevenue.length > 0 ? (
            <RevenueChart
              data={safeAnalytics.monthlyRevenue}
              labelKey="month"
              valueKey="revenue"
              height={250}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No revenue data available</p>
          )}
        </motion.div>

        {/* Monthly Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Monthly Bookings Trend</h2>
              <p className="text-sm text-gray-600 mt-1">Booking volume over the last 6 months</p>
            </div>
            <FaCalendarAlt className="text-blue-600 text-xl" />
          </div>
          {safeAnalytics?.monthlyBookings && safeAnalytics.monthlyBookings.length > 0 ? (
            <LineChart
              data={safeAnalytics.monthlyBookings}
              labelKey="month"
              valueKey="bookings"
              color="blue"
              height={250}
            />
          ) : (
            <p className="text-gray-500 text-center py-8">No booking data available</p>
          )}
        </motion.div>

        {/* Booking Type & Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Type Distribution</h2>
            {safeAnalytics?.bookingTypeDistribution && safeAnalytics.bookingTypeDistribution.length > 0 ? (
              <PieChart
                data={safeAnalytics.bookingTypeDistribution}
                labelKey="type"
                valueKey="count"
                colors={['#3B82F6', '#8B5CF6', '#F59E0B']}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Status Distribution</h2>
            {safeAnalytics?.bookingStatusDistribution && safeAnalytics.bookingStatusDistribution.length > 0 ? (
              <PieChart
                data={safeAnalytics.bookingStatusDistribution}
                labelKey="status"
                valueKey="count"
                colors={['#10B981', '#F59E0B', '#EF4444', '#6B7280']}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </motion.div>
        </div>

        {/* Detailed Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Booking Type Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Types</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaPlane className="text-blue-600" />
                  <span className="text-sm text-gray-700">Flights</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{safeAnalytics?.stats?.totalFlights || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaHotel className="text-purple-600" />
                  <span className="text-sm text-gray-700">Hotels</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{safeAnalytics?.stats?.totalHotels || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaCar className="text-orange-600" />
                  <span className="text-sm text-gray-700">Cars</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{safeAnalytics?.stats?.totalCars || 0}</span>
              </div>
            </div>
          </motion.div>

          {/* Revenue Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Breakdown</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Total Revenue</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${safeAnalytics?.stats?.totalRevenue?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Total Bookings</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {safeAnalytics?.stats?.totalBookings?.toLocaleString() || '0'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">Avg per Booking</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${safeAnalytics?.stats?.totalRevenue && safeAnalytics?.stats?.totalBookings
                      ? (safeAnalytics.stats.totalRevenue / safeAnalytics.stats.totalBookings).toFixed(2)
                      : '0'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Top Providers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Providers</h2>
            {safeAnalytics?.topProviders && safeAnalytics.topProviders.length > 0 ? (
              <div className="space-y-3">
                {safeAnalytics.topProviders.map((provider, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{provider.name}</p>
                      <p className="text-xs text-gray-600">{provider.properties} properties</p>
                    </div>
                    <p className="text-sm font-bold text-green-600">${provider.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No data available</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
