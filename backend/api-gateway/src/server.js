require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Service URLs
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:5001',
  flight: process.env.FLIGHT_SERVICE_URL || 'http://localhost:5002',
  hotel: process.env.HOTEL_SERVICE_URL || 'http://localhost:5003',
  car: process.env.CAR_SERVICE_URL || 'http://localhost:5004',
  billing: process.env.BILLING_SERVICE_URL || 'http://localhost:5005',
  admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:5006',
  agent: process.env.AGENT_SERVICE_URL || 'http://localhost:8000',
};

// Proxy routes - forward requests to respective microservices
app.use('/api/users', createProxyMiddleware({
  target: services.user,
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[API Gateway] ${req.method} ${req.url} -> ${services.user}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[API Gateway] Response: ${proxyRes.statusCode} for ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`[API Gateway] Error:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'User service unavailable', error: err.message });
    }
  }
}));

app.use('/api/flights', createProxyMiddleware({
  target: services.flight,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error(`[API Gateway] Error proxying to flight service:`, err.message);
    res.status(500).json({ success: false, message: 'Flight service unavailable' });
  }
}));

app.use('/api/hotels', createProxyMiddleware({
  target: services.hotel,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error(`[API Gateway] Error proxying to hotel service:`, err.message);
    res.status(500).json({ success: false, message: 'Hotel service unavailable' });
  }
}));

app.use('/api/cars', createProxyMiddleware({
  target: services.car,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error(`[API Gateway] Error proxying to car service:`, err.message);
    res.status(500).json({ success: false, message: 'Car service unavailable' });
  }
}));

app.use('/api/billing', createProxyMiddleware({
  target: services.billing,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error(`[API Gateway] Error proxying to billing service:`, err.message);
    res.status(500).json({ success: false, message: 'Billing service unavailable' });
  }
}));

app.use('/api/admin', createProxyMiddleware({
  target: services.admin,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error(`[API Gateway] Error proxying to admin service:`, err.message);
    res.status(500).json({ success: false, message: 'Admin service unavailable' });
  }
}));

// AI Agent proxy (HTTP + WS)
app.use('/api/agent', createProxyMiddleware({
  target: services.agent,
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    '^/api/agent': '',
  },
  logLevel: 'warn',
  onError: (err, req, res) => {
    console.error(`[API Gateway] Error proxying to AI agent:`, err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'AI agent unavailable' });
    }
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// 404 handler for unmatched routes (must be after all routes)
app.use((req, res) => {
  console.log(`[API Gateway] Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[API Gateway] Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Proxying to services:`);
  console.log(`   - User Service: ${services.user}`);
  console.log(`   - Flight Service: ${services.flight}`);
  console.log(`   - Hotel Service: ${services.hotel}`);
  console.log(`   - Car Service: ${services.car}`);
  console.log(`   - Billing Service: ${services.billing}`);
  console.log(`   - Admin Service: ${services.admin}`);
});
