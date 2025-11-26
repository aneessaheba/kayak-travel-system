# 🛠️ Setup Guide for Team Members

This guide will help you get the Kayak project running on your system in **5 minutes**.

## ✅ Prerequisites Check

Before starting, make sure you have:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
   ```bash
   node --version  # Should show v18.0.0 or higher
   ```

2. **MongoDB 6.0+** - [Download here](https://www.mongodb.com/try/download/community)
   ```bash
   mongod --version  # Should show MongoDB version
   ```

3. **Git** - [Download here](https://git-scm.com/)
   ```bash
   git --version
   ```

## 🚀 Quick Setup (5 Minutes)

### Step 1: Clone the Repository

```bash
git clone https://github.com/aneessaheba/kayak-distributed-travel-system.git
cd kayak-distributed-travel-system
```

### Step 2: Install Dependencies

```bash
npm install
```

**This may take 2-3 minutes** - it installs all dependencies for frontend and all backend services.

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

**That's it!** The script will:
- ✅ Start MongoDB automatically
- ✅ Start all 7 backend services
- ✅ Start the frontend
- ✅ Open everything in separate windows

### Step 4: Open the Application

1. Wait 10-15 seconds for all services to start
2. Open your browser: **http://localhost:5173**
3. You should see the Kayak home page!

## 🎯 First Time Setup

### Create Admin User (Optional)

After services are running, create an admin account:

```bash
npm run create:admin
```

Then login at: http://localhost:5173/admin/login

### Seed Sample Data (Optional)

To populate with sample flights, hotels, and cars:

```bash
# Minimal data (recommended for first run)
npm run seed:minimal

# Full database (10,000+ records - takes 5-10 minutes)
npm run seed:database
```

## 🔍 Verify Everything is Working

### Check Services

Open these URLs in your browser - each should show `{"status":"ok"}`:

- http://localhost:5001/health (User Service)
- http://localhost:5002/health (Flight Service)
- http://localhost:5003/health (Hotel Service)
- http://localhost:5004/health (Car Service)
- http://localhost:5005/health (Billing Service)
- http://localhost:5006/health (Admin Service)

### Test the Application

1. **User Registration:**
   - Go to http://localhost:5173
   - Click "Sign Up"
   - Create an account

2. **Search & Book:**
   - Search for flights/hotels/cars
   - Try booking something

3. **Admin Dashboard:**
   - Login as admin: http://localhost:5173/admin/login
   - View analytics and manage listings

## 🐛 Common Issues

### Issue: MongoDB Won't Start

**Windows:**
```powershell
# Check if MongoDB is already running
Get-Process mongod -ErrorAction SilentlyContinue

# If not, start it manually
.\frontend\start-mongodb-27020.ps1
```

**Mac/Linux:**
```bash
# Check if MongoDB is running
lsof -i :27020

# If not, start it
mongod --port 27020 --dbpath ./database/data --logpath ./database/logs/mongod.log
```

### Issue: Port Already in Use

If you get "Port already in use" error:

**Windows:**
```powershell
# Find what's using the port (replace 5001 with your port)
netstat -ano | findstr :5001
# Kill the process (replace PID)
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
# Find and kill process on port
lsof -ti:5001 | xargs kill -9
```

### Issue: Dependencies Not Installing

```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Services Won't Connect to MongoDB

1. Make sure MongoDB is running (check Terminal 1)
2. Check MongoDB logs: `database/logs/mongod.log`
3. Verify MongoDB is on port 27020: `mongosh --port 27020`

## 📝 Manual Startup (If Script Doesn't Work)

If the automated script doesn't work, start services manually:

### Terminal 1 - MongoDB
```bash
# Windows
.\frontend\start-mongodb-27020.ps1

# Mac/Linux
mongod --port 27020 --dbpath ./database/data --logpath ./database/logs/mongod.log
```

### Terminal 2-8 - Backend Services
```bash
npm run start:user      # Terminal 2
npm run start:flight    # Terminal 3
npm run start:hotel     # Terminal 4
npm run start:car       # Terminal 5
npm run start:billing   # Terminal 6
npm run start:admin     # Terminal 7
npm run start:gateway   # Terminal 8 (Optional)
```

### Terminal 9 - Frontend
```bash
npm run dev:frontend
```

## 🎓 Next Steps

1. ✅ Read the [README.md](./README.md) for project overview
2. ✅ Check [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) for detailed instructions
3. ✅ Explore the codebase
4. ✅ Start developing!

## 💡 Tips

- **Keep MongoDB running** - Don't close Terminal 1
- **Check service logs** - Each terminal shows service status
- **Use health checks** - Verify services before testing
- **Start MongoDB first** - Always start MongoDB before other services

## 🆘 Need Help?

1. Check the [Troubleshooting](#-common-issues) section above
2. Read the full [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)
3. Open an issue on GitHub
4. Ask your team members

---

**Happy Coding! 🚀**

