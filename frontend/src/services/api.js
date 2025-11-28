import axios from 'axios';

// Create axios instance with base URL
// Temporarily bypassing API Gateway due to timeout issues - connecting directly to services
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api', // Direct to user service
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Admin API instance
const adminApi = axios.create({
  baseURL: 'http://localhost:5006/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Add token interceptor to admin API
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Create separate instances for different services
const flightApi = axios.create({
  baseURL: 'http://localhost:5002/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const hotelApi = axios.create({
  baseURL: 'http://localhost:5003/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

const carApi = axios.create({
  baseURL: 'http://localhost:5004/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Add token interceptors to all API instances
[api, flightApi, hotelApi, carApi].forEach((apiInstance) => {
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// User Service API
export const userAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getUser: (id) => api.get(`/users/${id}`),
  getUserByEmail: (email) => api.get(`/users/email/${email}`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
      addBooking: (id, data) => api.post(`/users/${id}/bookings`, data),
      getBookings: (id, params) => api.get(`/users/${id}/bookings`, { params }),
      cancelBooking: (id, data) => api.put(`/users/${id}/bookings/cancel`, data),
  addReview: (id, data) => api.post(`/users/${id}/reviews`, data),
  getReviews: (id, params) => api.get(`/users/${id}/reviews`, { params }),
  addFavourite: (id, data) => api.post(`/users/${id}/favourites`, data),
  removeFavourite: (id, params) => api.delete(`/users/${id}/favourites`, { params }),
  getFavourites: (id, params) => api.get(`/users/${id}/favourites`, { params }),
  getNotifications: (id, params) => api.get(`/users/${id}/notifications`, { params }),
  markNotificationAsRead: (id, data) => api.put(`/users/${id}/notifications/read`, data),
  markAllNotificationsAsRead: (id) => api.put(`/users/${id}/notifications/read-all`),
  deleteNotification: (id, params) => api.delete(`/users/${id}/notifications`, { params }),
  createNotification: (id, data) => api.post(`/users/${id}/notifications`, data),
};

// Flight Service API - using direct service connection
export const flightAPI = {
  getFlights: (params) => flightApi.get('/flights', { params }),
  getFlight: (id) => flightApi.get(`/flights/${id}`),
  getFlightByFlightId: (flightId) => flightApi.get(`/flights/flight/${flightId}`),
  createFlight: (data) => flightApi.post('/flights', data),
  updateFlight: (id, data) => flightApi.put(`/flights/${id}`, data),
  deleteFlight: (id) => flightApi.delete(`/flights/${id}`),
  addReview: (id, data) => flightApi.post(`/flights/${id}/reviews`, data),
  updateSeats: (id, data) => flightApi.put(`/flights/${id}/seats`, data),
};

// Hotel Service API - using direct service connection
export const hotelAPI = {
  getHotels: (params) => hotelApi.get('/hotels', { params }),
  getHotel: (id) => hotelApi.get(`/hotels/${id}`),
  createHotel: (data) => hotelApi.post('/hotels', data),
  updateHotel: (id, data) => hotelApi.put(`/hotels/${id}`, data),
  deleteHotel: (id) => hotelApi.delete(`/hotels/${id}`),
  addReview: (id, data) => hotelApi.post(`/hotels/${id}/reviews`, data),
  updateRooms: (id, data) => hotelApi.put(`/hotels/${id}/rooms`, data),
};

// Car Service API - using direct service connection
export const carAPI = {
  getCars: (params) => carApi.get('/cars', { params }),
  getCar: (id) => carApi.get(`/cars/${id}`),
  createCar: (data) => carApi.post('/cars', data),
  updateCar: (id, data) => carApi.put(`/cars/${id}`, data),
  deleteCar: (id) => carApi.delete(`/cars/${id}`),
  addReview: (id, data) => carApi.post(`/cars/${id}/reviews`, data),
  addBooking: (id, data) => carApi.post(`/cars/${id}/bookings`, data),
};

// Billing Service API - using direct service connection
const billingApi = axios.create({
  baseURL: 'http://localhost:5005/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Add token interceptor to billing API
billingApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

billingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const billingAPI = {
  getBillings: (params) => billingApi.get('/billing', { params }),
  getBilling: (id) => billingApi.get(`/billing/${id}`),
  createBilling: (data) => billingApi.post('/billing', data),
  updateBilling: (id, data) => billingApi.put(`/billing/${id}`, data),
  processRefund: (id, data) => billingApi.post(`/billing/${id}/refund`, data),
  getRevenueStats: (params) => billingApi.get('/billing/stats/revenue', { params }),
};

// Admin Service API
export const adminAPI = {
  login: (data) => adminApi.post('/admin/login', data),
  getAnalytics: (params) => adminApi.get('/admin/analytics', { params }),
  getAdmins: () => adminApi.get('/admin/admins'),
  createAdmin: (data) => adminApi.post('/admin/admins', data),
  updateAdmin: (id, data) => adminApi.put(`/admin/admins/${id}`, data),
  deleteAdmin: (id) => adminApi.delete(`/admin/admins/${id}`),
};

// AI Agent (via gateway by default)
const agentApi = axios.create({
  baseURL: import.meta.env.VITE_AGENT_URL || '/api/agent',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export const sendChatMessage = (payload) => agentApi.post('/chat', payload);

export default api;
