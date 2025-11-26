const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');

const generateToken = (adminId) => {
  return jwt.sign({ adminId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(admin._id);
    res.json({ success: true, message: 'Login successful', data: { admin: admin.toJSON(), token } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Fetch data from all services in parallel
    const [usersRes, flightsRes, hotelsRes, carsRes, revenueRes] = await Promise.allSettled([
      axios.get('http://localhost:5001/api/users?limit=1').catch(() => ({ data: { data: [] } })),
      axios.get('http://localhost:5002/api/flights?limit=1').catch(() => ({ data: { data: [] } })),
      axios.get('http://localhost:5003/api/hotels?limit=1').catch(() => ({ data: { data: [] } })),
      axios.get('http://localhost:5004/api/cars?limit=1').catch(() => ({ data: { data: [] } })),
      axios.get(`http://localhost:5005/api/billing/stats/revenue${startDate || endDate ? `?startDate=${startDate || ''}&endDate=${endDate || ''}` : ''}`).catch(() => ({ data: { data: { totalRevenue: 0, totalTransactions: 0 } } }))
    ]);

    // Get counts from each service using API calls with large limits
    let totalUsers = 0;
    let totalFlights = 0;
    let totalHotels = 0;
    let totalCars = 0;
    
    try {
      const usersData = await axios.get('http://localhost:5001/api/users?limit=10000').catch(() => ({ data: { data: [] } }));
      totalUsers = usersData.data?.data?.length || 0;
    } catch (err) {
      console.error('Error counting users:', err.message);
    }
    
    try {
      const flightsData = await axios.get('http://localhost:5002/api/flights?limit=10000').catch(() => ({ data: { data: [] } }));
      totalFlights = flightsData.data?.data?.length || 0;
    } catch (err) {
      console.error('Error counting flights:', err.message);
    }
    
    try {
      const hotelsData = await axios.get('http://localhost:5003/api/hotels?limit=10000').catch(() => ({ data: { data: [] } }));
      totalHotels = hotelsData.data?.data?.length || 0;
    } catch (err) {
      console.error('Error counting hotels:', err.message);
    }
    
    try {
      const carsData = await axios.get('http://localhost:5004/api/cars?limit=10000').catch(() => ({ data: { data: [] } }));
      totalCars = carsData.data?.data?.length || 0;
    } catch (err) {
      console.error('Error counting cars:', err.message);
    }
    const revenueData = revenueRes.status === 'fulfilled' ? revenueRes.value.data.data : { totalRevenue: 0, totalTransactions: 0 };

    // Get top hotels by city
    let topHotels = [];
    let cityWiseRevenue = [];
    try {
      const hotelsData = await axios.get('http://localhost:5003/api/hotels?limit=100').catch(() => ({ data: { data: [] } }));
      const hotels = hotelsData.data.data || [];
      
      // Group by city and calculate revenue from actual bookings only
      const cityMap = {};
      try {
        const billingResponse = await axios.get('http://localhost:5005/api/billing', {
          params: { bookingType: 'hotel', limit: 10000 }
        }).catch(() => ({ data: { data: [] } }));
        
        const hotelBookings = billingResponse.data.data || [];
        
        hotelBookings.forEach(booking => {
          const hotelCity = booking.bookingDetails?.city || 
                          hotels.find(h => h.hotelId === booking.bookingDetails?.hotelId)?.city ||
                          'Unknown';
          
          if (!cityMap[hotelCity]) {
            cityMap[hotelCity] = { city: hotelCity, revenue: 0 };
          }
          cityMap[hotelCity].revenue += booking.totalAmountPaid || 0;
        });
        
        cityWiseRevenue = Object.values(cityMap)
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
          .map(item => ({ city: item.city, revenue: Math.round(item.revenue) }));
      } catch (error) {
        console.error('Error calculating city revenue:', error.message);
        cityWiseRevenue = [];
      }

      // Top properties - ONLY from actual bookings in billing service
      // Fetch all hotel bookings once, then match to hotels
      try {
        const billingResponse = await axios.get('http://localhost:5005/api/billing', {
          params: { bookingType: 'hotel', limit: 10000 }
        }).catch(() => ({ data: { data: [] } }));
        
        const allHotelBookings = billingResponse.data.data || [];
        
        // Group bookings by hotel
        const hotelRevenueMap = {};
        allHotelBookings.forEach(booking => {
          const hotelId = booking.bookingDetails?.hotelId;
          const hotelName = booking.bookingDetails?.hotelName;
          const key = hotelId || hotelName || 'unknown';
          
          if (!hotelRevenueMap[key]) {
            hotelRevenueMap[key] = {
              name: hotelName || 'Unknown Hotel',
              revenue: 0,
              bookings: 0
            };
          }
          hotelRevenueMap[key].revenue += booking.totalAmountPaid || 0;
          hotelRevenueMap[key].bookings += 1;
        });
        
        // Convert to array and sort by revenue
        topHotels = Object.values(hotelRevenueMap)
          .filter(h => h.bookings > 0) // Only hotels with actual bookings
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
      } catch (error) {
        console.error('Error fetching top hotels from bookings:', error.message);
        topHotels = [];
      }
    } catch (error) {
      console.error('Error fetching hotel analytics:', error.message);
      topHotels = []; // Ensure empty array on error
      cityWiseRevenue = []; // Ensure empty array on error
    }
    
    // If no hotels with bookings found, ensure empty array
    if (!topHotels || topHotels.length === 0) {
      topHotels = [];
    }
    if (!cityWiseRevenue || cityWiseRevenue.length === 0) {
      cityWiseRevenue = [];
    }

    // Get monthly revenue data (last 6 months)
    let monthlyRevenue = [];
    let monthlyBookings = [];
    let bookingTypeDistribution = [];
    let bookingStatusDistribution = [];
    
    try {
      const billingData = await axios.get('http://localhost:5005/api/billing?limit=10000').catch(() => ({ data: { data: [] } }));
      const billings = billingData.data.data || [];
      
      // Calculate monthly revenue and bookings for last 6 months
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: date.toLocaleString('default', { month: 'short' }),
          year: date.getFullYear(),
          monthIndex: date.getMonth(),
          yearIndex: date.getFullYear()
        });
      }
      
      monthlyRevenue = months.map(m => {
        const monthBillings = billings.filter(b => {
          if (!b.dateOfTransaction) return false;
          const bDate = new Date(b.dateOfTransaction);
          return bDate.getMonth() === m.monthIndex && 
                 bDate.getFullYear() === m.yearIndex &&
                 b.transactionStatus === 'completed';
        });
        return {
          month: m.month,
          revenue: monthBillings.reduce((sum, b) => sum + (b.totalAmountPaid || 0), 0)
        };
      });
      
      monthlyBookings = months.map(m => {
        const monthBillings = billings.filter(b => {
          if (!b.dateOfTransaction) return false;
          const bDate = new Date(b.dateOfTransaction);
          return bDate.getMonth() === m.monthIndex && 
                 bDate.getFullYear() === m.yearIndex;
        });
        return {
          month: m.month,
          bookings: monthBillings.length
        };
      });
      
      // Booking type distribution
      const typeCounts = {};
      billings.forEach(b => {
        const type = b.bookingType || 'unknown';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      bookingTypeDistribution = Object.entries(typeCounts).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
        percentage: billings.length > 0 ? ((count / billings.length) * 100).toFixed(1) : 0
      }));
      
      // Booking status distribution
      const statusCounts = {};
      billings.forEach(b => {
        const status = b.transactionStatus || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      bookingStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: billings.length > 0 ? ((count / billings.length) * 100).toFixed(1) : 0
      }));
    } catch (error) {
      console.error('Error calculating time-based analytics:', error.message);
    }

    // Top providers - only calculate from actual booking data
    let topProviders = [];
    try {
      const billingResponse = await axios.get('http://localhost:5005/api/billing?limit=10000').catch(() => ({ data: { data: [] } }));
      const allBookings = billingResponse.data.data || [];
      
      const providerMap = {};
      allBookings.forEach(booking => {
        let providerName = 'Unknown';
        if (booking.bookingType === 'flight') {
          providerName = booking.bookingDetails?.airline || 'Unknown Airline';
        } else if (booking.bookingType === 'hotel') {
          providerName = booking.bookingDetails?.hotelName || 'Unknown Hotel';
        } else if (booking.bookingType === 'car') {
          providerName = booking.bookingDetails?.company || 'Unknown Company';
        }
        
        if (!providerMap[providerName]) {
          providerMap[providerName] = { name: providerName, revenue: 0, properties: 0 };
        }
        providerMap[providerName].revenue += booking.totalAmountPaid || 0;
        providerMap[providerName].properties += 1;
      });
      
      topProviders = Object.values(providerMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    } catch (error) {
      console.error('Error calculating top providers:', error.message);
      topProviders = [];
    }

    const analytics = {
      stats: {
        totalUsers,
        totalFlights,
        totalHotels,
        totalCars,
        totalRevenue: revenueData.totalRevenue || 0,
        totalBookings: revenueData.totalTransactions || 0,
      },
      topProperties: topHotels,
      cityWiseRevenue,
      topProviders,
      monthlyRevenue,
      monthlyBookings,
      bookingTypeDistribution,
      bookingStatusDistribution
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Error fetching analytics', error: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json({ success: true, message: 'Admin created successfully', data: admin.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating admin', error: error.message });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json({ success: true, data: admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching admins', error: error.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    delete req.body.password;
    const admin = await Admin.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin updated successfully', data: admin.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating admin', error: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting admin', error: error.message });
  }
};

