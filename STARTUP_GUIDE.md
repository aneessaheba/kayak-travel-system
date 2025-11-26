# 🚀 Kayak Project - Startup Guide

## 📝 SIMPLEST INSTRUCTIONS - What to Type

### Terminal 1 - MongoDB (START HERE):
```powershell
cd E:\Kayak
.\frontend\start-mongodb-27020.ps1
```
**Wait until you see:** `"waiting for connections on port 27020"`

### Terminal 2 - User Service:
```powershell
cd E:\Kayak
npm run start:user
```

### Terminal 3 - Flight Service:
```powershell
cd E:\Kayak
npm run start:flight
```

### Terminal 4 - Hotel Service:
```powershell
cd E:\Kayak
npm run start:hotel
```

### Terminal 5 - Car Service:
```powershell
cd E:\Kayak
npm run start:car
```

### Terminal 6 - Billing Service:
```powershell
cd E:\Kayak
npm run start:billing
```

### Terminal 7 - Admin Service:
```powershell
cd E:\Kayak
npm run start:admin
```

### Terminal 8 - Frontend:
```powershell
cd E:\Kayak
npm run dev:frontend
```

**Then open:** http://localhost:5173

---

## Quick Start (Automated - Recommended)

### Option 1: Use the Automated Script (Easiest)
**1 Terminal Needed**

```powershell
# Navigate to project directory
cd E:\Kayak

# Run the automated startup script
npm run start:all
```

This will:
- ✅ Check and start MongoDB on port 27020
- ✅ Start all 7 backend services (each in its own window)
- ✅ Start AI Agent (if configured)
- ✅ Start Frontend
- ✅ Verify all services are running

**Total Windows Opened: 9-10** (MongoDB + 7 services + AI Agent + Frontend)

---

## Manual Step-by-Step Startup (More Control)

### Prerequisites Check
Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ MongoDB installed
- ✅ Python 3.10+ installed (for AI Agent, optional)
- ✅ All dependencies installed (`npm install` in root directory)

---

## Step-by-Step Manual Startup

### **Terminal 1: MongoDB** (Required)

**EASIEST OPTION - Use the startup script:**
```powershell
cd E:\Kayak
.\frontend\start-mongodb-27020.ps1
```

**OR if the script doesn't work, type this directly:**
```powershell
cd E:\Kayak
mongod --port 27020 --dbpath E:\Kayak\database\data --logpath E:\Kayak\database\logs\mongod.log
```

**What you'll see:**
- The terminal will show MongoDB starting up
- Look for: `"waiting for connections on port 27020"`
- **Keep this terminal open** - MongoDB needs to keep running
- To stop MongoDB: Press `Ctrl+C` in this terminal

**Note:** If you get an error like "mongod is not recognized", MongoDB might not be in your PATH. Use the PowerShell script above instead.

---

### **Terminal 2: User Service** (Port 5001)
```powershell
cd E:\Kayak
npm run start:user
```

**Wait for:** `"✅ Connected to MongoDB - User Service"` and `"🚀 User Service running on port 5001"`

---

### **Terminal 3: Flight Service** (Port 5002)
```powershell
cd E:\Kayak
npm run start:flight
```

**Wait for:** `"✅ Connected to MongoDB - Flight Service"` and `"🚀 Flight Service running on port 5002"`

---

### **Terminal 4: Hotel Service** (Port 5003)
```powershell
cd E:\Kayak
npm run start:hotel
```

**Wait for:** `"✅ Connected to MongoDB - Hotel Service"` and `"🚀 Hotel Service running on port 5003"`

---

### **Terminal 5: Car Service** (Port 5004)
```powershell
cd E:\Kayak
npm run start:car
```

**Wait for:** `"✅ Connected to MongoDB - Car Service"` and `"🚀 Car Service running on port 5004"`

---

### **Terminal 6: Billing Service** (Port 5005)
```powershell
cd E:\Kayak
npm run start:billing
```

**Wait for:** `"✅ Connected to MongoDB - Billing Service"` and `"🚀 Billing Service running on port 5005"`

---

### **Terminal 7: Admin Service** (Port 5006)
```powershell
cd E:\Kayak
npm run start:admin
```

**Wait for:** `"✅ Connected to MongoDB - Admin Service"` and `"🚀 Admin Service running on port 5006"`

---

### **Terminal 8: API Gateway** (Port 5000) - Optional
```powershell
cd E:\Kayak
npm run start:gateway
```

**Wait for:** `"🚀 API Gateway running on port 5000"`

---

### **Terminal 9: Frontend** (Port 5173)
```powershell
cd E:\Kayak
npm run dev:frontend
```

**Wait for:** `"Local: http://localhost:5173"`

---

### **Terminal 10: AI Agent** (Port 8000) - Optional
```powershell
cd E:\Kayak\ai-agent
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Wait for:** `"Uvicorn running on http://0.0.0.0:8000"`

---

## Service Ports Summary

| Service | Port | Required | Status Check URL |
|---------|------|----------|------------------|
| MongoDB | 27020 | ✅ **YES** | N/A (check process) |
| User Service | 5001 | ✅ **YES** | http://localhost:5001/health |
| Flight Service | 5002 | ✅ **YES** | http://localhost:5002/health |
| Hotel Service | 5003 | ✅ **YES** | http://localhost:5003/health |
| Car Service | 5004 | ✅ **YES** | http://localhost:5004/health |
| Billing Service | 5005 | ✅ **YES** | http://localhost:5005/health |
| Admin Service | 5006 | ✅ **YES** | http://localhost:5006/health |
| API Gateway | 5000 | ⚠️ Optional | http://localhost:5000/health |
| Frontend | 5173 | ✅ **YES** | http://localhost:5173 |
| AI Agent | 8000 | ⚠️ Optional | http://localhost:8000/docs |

---

## Verification Steps

### 1. Check MongoDB
```powershell
# In a new terminal
mongosh --port 27020
# Should connect successfully
# Type: exit
```

### 2. Check All Services
Open browser and visit each health endpoint:
- http://localhost:5001/health
- http://localhost:5002/health
- http://localhost:5003/health
- http://localhost:5004/health
- http://localhost:5005/health
- http://localhost:5006/health

Each should return: `{"status":"ok","service":"..."}`

### 3. Check Frontend
- Open: http://localhost:5173
- Should see the Kayak home page

---

## Quick Verification Script

Run this in PowerShell to check all services:

```powershell
$services = @(
    @{Name="User Service"; Port=5001},
    @{Name="Flight Service"; Port=5002},
    @{Name="Hotel Service"; Port=5003},
    @{Name="Car Service"; Port=5004},
    @{Name="Billing Service"; Port=5005},
    @{Name="Admin Service"; Port=5006},
    @{Name="API Gateway"; Port=5000},
    @{Name="Frontend"; Port=5173}
)

Write-Host "🔍 Checking Services..." -ForegroundColor Cyan
foreach ($service in $services) {
    $result = Test-NetConnection -ComputerName localhost -Port $service.Port -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($result) {
        Write-Host "✅ $($service.Name) (Port $($service.Port)): Running" -ForegroundColor Green
    } else {
        Write-Host "❌ $($service.Name) (Port $($service.Port)): Not Running" -ForegroundColor Red
    }
}
```

---

## Common Issues & Solutions

### Issue 1: MongoDB Not Starting
**Error:** `Port 27020 already in use` or `Cannot connect to MongoDB`

**Solution:**
```powershell
# Check if MongoDB is already running
Get-Process mongod -ErrorAction SilentlyContinue

# If running, kill it
Stop-Process -Name mongod -Force

# Or use a different port
mongod --port 27021 --dbpath E:\Kayak\database\data
```

### Issue 2: Service Won't Connect to MongoDB
**Error:** `MongoDB connection error`

**Solution:**
1. Ensure MongoDB is running on port 27020
2. Check MongoDB logs: `E:\Kayak\database\logs\mongod.log`
3. Verify the connection string in service's `.env` file

### Issue 3: Port Already in Use
**Error:** `Port 5001 already in use` (or any port)

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :5001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change the port in the service's .env file
```

### Issue 4: Dependencies Not Installed
**Error:** `Cannot find module 'express'`

**Solution:**
```powershell
# Install all dependencies from root
cd E:\Kayak
npm install

# Or install for specific service
cd E:\Kayak\backend\services\user-service
npm install
```

### Issue 5: Frontend Not Loading
**Error:** Blank page or connection errors

**Solution:**
1. Check if frontend is running: http://localhost:5173
2. Check browser console for errors
3. Verify API endpoints in `frontend/src/services/api.js`
4. Ensure all backend services are running

---

## Stopping All Services

### Option 1: Close All Terminals
Simply close all terminal windows. Services will stop.

### Option 2: Kill All Node Processes
```powershell
# Kill all Node.js processes (WARNING: This kills ALL Node processes)
Get-Process node | Stop-Process -Force

# Kill MongoDB
Stop-Process -Name mongod -Force
```

### Option 3: Kill Specific Ports
```powershell
# Kill process on specific port (replace 5001 with port number)
$port = 5001
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($process) { Stop-Process -Id $process -Force }
```

---

## Development vs Production Mode

### Development Mode (with auto-reload)
Use `dev:` scripts instead of `start:`:
```powershell
npm run dev:user
npm run dev:flight
# etc.
```

### Production Mode
Use `start:` scripts (no auto-reload):
```powershell
npm run start:user
npm run start:flight
# etc.
```

---

## Recommended Startup Order

1. **MongoDB** (Terminal 1) - Must start first
2. **User Service** (Terminal 2) - Core service
3. **Flight Service** (Terminal 3)
4. **Hotel Service** (Terminal 4)
5. **Car Service** (Terminal 5)
6. **Billing Service** (Terminal 6)
7. **Admin Service** (Terminal 7)
8. **API Gateway** (Terminal 8) - Optional
9. **Frontend** (Terminal 9) - Start last
10. **AI Agent** (Terminal 10) - Optional

**Wait 5-10 seconds between starting each service** to allow MongoDB connections to establish.

---

## Quick Reference Commands

```powershell
# Start everything (automated)
npm run start:all

# Start individual services
npm run start:user      # User Service (5001)
npm run start:flight   # Flight Service (5002)
npm run start:hotel    # Hotel Service (5003)
npm run start:car      # Car Service (5004)
npm run start:billing  # Billing Service (5005)
npm run start:admin    # Admin Service (5006)
npm run start:gateway  # API Gateway (5000)
npm run dev:frontend    # Frontend (5173)

# Check service health
curl http://localhost:5001/health
curl http://localhost:5002/health
# etc.

# Access URLs
# Frontend: http://localhost:5173
# Admin Login: http://localhost:5173/admin/login
# User Login: http://localhost:5173/login
```

---

## Tips for Daily Work

1. **Save Terminal Layout**: Use Windows Terminal with saved layouts
2. **Use Scripts**: Create shortcuts for common commands
3. **Monitor Logs**: Keep MongoDB logs visible in a separate window
4. **Health Checks**: Bookmark health check URLs for quick verification
5. **Start MongoDB First**: Always start MongoDB before services
6. **Wait for Connections**: Give services 5-10 seconds to connect to MongoDB

---

## Next Steps After Startup

1. ✅ Verify all services are running (health checks)
2. ✅ Open frontend: http://localhost:5173
3. ✅ Test user login/registration
4. ✅ Test admin login: http://localhost:5173/admin/login
5. ✅ Test search functionality
6. ✅ Test booking flow

---

**Last Updated**: November 26, 2025
**Project Path**: E:\Kayak

