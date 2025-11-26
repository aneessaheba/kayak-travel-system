# 🛫 Kayak Travel Booking System

A distributed 3-tier travel booking system similar to Kayak, supporting flights, hotels, and car rentals with AI-powered recommendations.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start (3 Steps)](#-quick-start-3-steps)
- [Detailed Setup](#-detailed-setup)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [API Endpoints](#-api-endpoints)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## ✨ Features

### User Features
- 🔐 User registration and authentication
- 🔍 Search flights, hotels, and cars
- 🎯 Advanced filtering (price, dates, location, ratings)
- 📅 Book reservations
- 💳 Payment processing
- 📊 View booking history
- ⭐ Submit reviews

### Admin Features
- 📊 Analytics dashboard with charts
- 🏨 Manage hotels, flights, and cars (CRUD)
- 👥 User account management
- 💰 Revenue tracking and reports
- 📈 Top properties, city-wise revenue analytics

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MongoDB** 6.0+ ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))
- **Python 3.10+** (Optional, for AI Agent) ([Download](https://www.python.org/))

### Verify Installation

```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be v9.0.0 or higher
mongod --version  # Should show MongoDB version
```

## 🚀 Quick Start (3 Steps)

### Step 1: Clone the Repository

```bash
git clone https://github.com/aneessaheba/kayak-distributed-travel-system.git
cd kayak-distributed-travel-system
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies for frontend, backend services, and shared packages.

### Step 3: Start Everything

**Windows:**
```bash
npm run start:all
```

**Mac/Linux:**
```bash
chmod +x start-all.sh
./start-all.sh
```

**Or manually (if automated script doesn't work):**

1. **Start MongoDB** (Terminal 1):
   ```bash
   # Windows
   .\frontend\start-mongodb-27020.ps1
   
   # Mac/Linux
   mongod --port 27020 --dbpath ./database/data --logpath ./database/logs/mongod.log
   ```

2. **Start Backend Services** (Terminals 2-8):
   ```bash
   npm run start:user      # Terminal 2
   npm run start:flight    # Terminal 3
   npm run start:hotel     # Terminal 4
   npm run start:car       # Terminal 5
   npm run start:billing   # Terminal 6
   npm run start:admin     # Terminal 7
   npm run start:gateway   # Terminal 8 (Optional)
   ```

3. **Start Frontend** (Terminal 9):
   ```bash
   npm run dev:frontend
   ```

4. **Open Browser:**
   - Frontend: http://localhost:5173
   - Admin Login: http://localhost:5173/admin/login

## 📖 Detailed Setup

### 1. MongoDB Setup

#### Windows
```powershell
# Create database directories
New-Item -ItemType Directory -Path ".\database\data" -Force
New-Item -ItemType Directory -Path ".\database\logs" -Force

# Start MongoDB
.\frontend\start-mongodb-27020.ps1
```

#### Mac/Linux
```bash
# Create database directories
mkdir -p database/data database/logs

# Start MongoDB
mongod --port 27020 --dbpath ./database/data --logpath ./database/logs/mongod.log
```

**Verify MongoDB is running:**
```bash
# Should connect successfully
mongosh --port 27020
# Type 'exit' to quit
```

### 2. Environment Variables

Create `.env` files in each service directory (optional - defaults are provided):

**Example for `backend/services/user-service/.env`:**
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27020/kayak_users
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

**Note:** The project works with default values, so you can skip this step for now.

### 3. Seed Database (Optional)

To populate the database with sample data:

```bash
# Minimal seed (recommended for first run)
npm run seed:minimal

# Full seed (10,000+ records - takes longer)
npm run seed:database

# Create admin user
npm run create:admin
```

### 4. Verify Installation

Check all services are running:

```bash
# Health checks
curl http://localhost:5001/health  # User Service
curl http://localhost:5002/health  # Flight Service
curl http://localhost:5003/health  # Hotel Service
curl http://localhost:5004/health  # Car Service
curl http://localhost:5005/health  # Billing Service
curl http://localhost:5006/health  # Admin Service
```

Each should return: `{"status":"ok","service":"..."}`

## 📁 Project Structure

```
kayak-distributed-travel-system/
├── frontend/                 # React/Redux Frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store
│   │   └── services/        # API services
│   └── package.json
│
├── backend/
│   ├── api-gateway/         # API Gateway (Optional)
│   └── services/
│       ├── user-service/    # User management (Port 5001)
│       ├── flight-service/  # Flight management (Port 5002)
│       ├── hotel-service/   # Hotel management (Port 5003)
│       ├── car-service/     # Car rental (Port 5004)
│       ├── billing-service/ # Billing & payments (Port 5005)
│       └── admin-service/   # Admin dashboard (Port 5006)
│
├── database/
│   ├── data/               # MongoDB data files
│   ├── logs/               # MongoDB logs
│   └── seeds/              # Database seed scripts
│
├── ai-agent/               # FastAPI AI Service (Optional)
├── scripts/                # Utility scripts
├── docs/                   # Documentation
└── README.md
```

## 🔧 Technology Stack

### Frontend
- **React** 18+ - UI framework
- **Redux Toolkit** - State management
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Vite** - Build tool

### Backend
- **Node.js** 18+ - Runtime
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Infrastructure
- **MongoDB** - Primary database
- **Redis** - Caching (planned)
- **Kafka** - Messaging (planned)

## 🌐 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| User Service | 5001 | http://localhost:5001 |
| Flight Service | 5002 | http://localhost:5002 |
| Hotel Service | 5003 | http://localhost:5003 |
| Car Service | 5004 | http://localhost:5004 |
| Billing Service | 5005 | http://localhost:5005 |
| Admin Service | 5006 | http://localhost:5006 |
| API Gateway | 5000 | http://localhost:5000 |
| MongoDB | 27020 | mongodb://localhost:27020 |

## 🔌 API Endpoints

### User Service (Port 5001)
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Flight Service (Port 5002)
- `GET /api/flights` - Search flights (with filters)
- `POST /api/flights` - Create flight (admin)
- `GET /api/flights/:id` - Get flight by ID
- `PUT /api/flights/:id` - Update flight (admin)
- `DELETE /api/flights/:id` - Delete flight (admin)

### Hotel Service (Port 5003)
- `GET /api/hotels` - Search hotels (with filters)
- `POST /api/hotels` - Create hotel (admin)
- `GET /api/hotels/:id` - Get hotel by ID
- `PUT /api/hotels/:id` - Update hotel (admin)
- `DELETE /api/hotels/:id` - Delete hotel (admin)

### Car Service (Port 5004)
- `GET /api/cars` - Search cars (with filters)
- `POST /api/cars` - Create car (admin)
- `GET /api/cars/:id` - Get car by ID
- `PUT /api/cars/:id` - Update car (admin)
- `DELETE /api/cars/:id` - Delete car (admin)

### Billing Service (Port 5005)
- `POST /api/billing` - Create billing record
- `GET /api/billing` - Get billings (with filters)
- `GET /api/billing/stats/revenue` - Revenue statistics

### Admin Service (Port 5006)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/analytics` - Get analytics data

## 🐛 Troubleshooting

### MongoDB Won't Start

**Error:** `Port 27020 already in use`

**Solution:**
```bash
# Windows
netstat -ano | findstr :27020
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:27020 | xargs kill -9
```

### Service Won't Connect to MongoDB

**Error:** `MongoDB connection error`

**Solution:**
1. Ensure MongoDB is running: `mongosh --port 27020`
2. Check MongoDB logs: `database/logs/mongod.log`
3. Verify port 27020 is not blocked by firewall

### Port Already in Use

**Error:** `Port 5001 already in use` (or any port)

**Solution:**
```bash
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5001 | xargs kill -9
```

### Dependencies Not Installing

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend Not Loading

**Error:** Blank page or connection errors

**Solution:**
1. Check if frontend is running: http://localhost:5173
2. Check browser console for errors
3. Verify all backend services are running
4. Check `frontend/src/services/api.js` for correct API URLs

## 📚 Additional Documentation

- [Startup Guide](./STARTUP_GUIDE.md) - Detailed startup instructions
- [Project Status](./PROJECT_STATUS.md) - Implementation status
- [Project Plan](./PROJECT_PLAN.md) - Project architecture and plan

## 👥 Default Credentials

After running `npm run create:admin`, you can login with:

**Admin:**
- Email: `admin@kayak.com`
- Password: `admin123` (or check seed script)

**Note:** Change default passwords in production!

## 🚦 Development Commands

```bash
# Install dependencies
npm install

# Start all services (automated)
npm run start:all

# Start individual services
npm run start:user
npm run start:flight
npm run start:hotel
npm run start:car
npm run start:billing
npm run start:admin
npm run dev:frontend

# Database operations
npm run seed:minimal      # Seed minimal data
npm run seed:database     # Seed full database
npm run create:admin     # Create admin user

# Development mode (with auto-reload)
npm run dev:user
npm run dev:flight
# etc.
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

ISC

## 👨‍💻 Authors

- Your Name - [GitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Inspired by Kayak.com
- Built for Distributed Systems course project

---

**Need Help?** Open an issue on [GitHub](https://github.com/aneessaheba/kayak-distributed-travel-system/issues)

**Last Updated:** November 2025
