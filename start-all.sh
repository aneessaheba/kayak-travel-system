#!/bin/bash

# Kayak Travel Booking System - Complete Startup Script (Mac/Linux)
# This script starts MongoDB first, then all backend services and frontend

echo "🚀 Starting Kayak Travel Booking System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Step 1: Check and start MongoDB
echo -e "${CYAN}📦 Step 1: Checking MongoDB on port 27020...${NC}"

# Check if MongoDB is already running
if lsof -Pi :27020 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}   ✅ MongoDB is already running on port 27020${NC}"
else
    echo -e "${YELLOW}   MongoDB not running. Starting MongoDB...${NC}"
    
    # Create directories if they don't exist
    mkdir -p database/data
    mkdir -p database/logs
    
    # Start MongoDB in background
    mongod --port 27020 --dbpath ./database/data --logpath ./database/logs/mongod.log --fork
    
    # Wait for MongoDB to start
    echo -e "${YELLOW}   Waiting for MongoDB to start...${NC}"
    sleep 5
    
    # Verify MongoDB is running
    if lsof -Pi :27020 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}   ✅ MongoDB is running on port 27020!${NC}"
    else
        echo -e "${RED}   ❌ MongoDB failed to start. Please check manually.${NC}"
        exit 1
    fi
fi

echo ""

# Step 2: Start all backend services
echo -e "${CYAN}📦 Step 2: Starting backend services...${NC}"

# Array of services
services=(
    "User Service:start:user:5001"
    "Flight Service:start:flight:5002"
    "Hotel Service:start:hotel:5003"
    "Car Service:start:car:5004"
    "Billing Service:start:billing:5005"
    "Admin Service:start:admin:5006"
    "API Gateway:start:gateway:5000"
)

# Start each service in a new terminal window
for service in "${services[@]}"; do
    IFS=':' read -r name script port <<< "$service"
    echo -e "${YELLOW}   Starting $name...${NC}"
    
    # For Mac
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && npm run $script\""
    # For Linux (using gnome-terminal)
    elif command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd $(pwd) && npm run $script; exec bash"
    # For Linux (using xterm)
    elif command -v xterm &> /dev/null; then
        xterm -e "cd $(pwd) && npm run $script" &
    # Fallback: run in background
    else
        npm run $script > /dev/null 2>&1 &
    fi
    
    sleep 1
done

echo -e "${GREEN}   ✅ All backend services starting...${NC}"
echo ""

# Step 3: Start Frontend
echo -e "${CYAN}📦 Step 3: Starting Frontend...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && npm run dev:frontend\""
elif command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd) && npm run dev:frontend; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "cd $(pwd) && npm run dev:frontend" &
else
    npm run dev:frontend > /dev/null 2>&1 &
fi

echo -e "${GREEN}   ✅ Frontend starting on port 5173${NC}"
echo ""

# Step 4: Wait and verify services
echo -e "${CYAN}⏳ Waiting for services to start (10 seconds)...${NC}"
sleep 10

echo ""
echo -e "${CYAN}🔍 Verifying services...${NC}"

all_running=true
for service in "${services[@]}"; do
    IFS=':' read -r name script port <<< "$service"
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${GREEN}   $name (Port $port): ✅ Running${NC}"
    else
        echo -e "${RED}   $name (Port $port): ❌ Not Running${NC}"
        all_running=false
    fi
done

# Check frontend
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${GREEN}   Frontend (Port 5173): ✅ Running${NC}"
else
    echo -e "${RED}   Frontend (Port 5173): ❌ Not Running${NC}"
    all_running=false
fi

echo ""
if [ "$all_running" = true ]; then
    echo -e "${GREEN}🎉 All services are running!${NC}"
else
    echo -e "${YELLOW}⚠️  Some services may still be starting. Check the service windows.${NC}"
fi

echo ""
echo -e "${CYAN}📍 Service URLs:${NC}"
echo "   Frontend:     http://localhost:5173"
echo "   API Gateway:  http://localhost:5000"
echo ""
echo -e "${YELLOW}💡 Note: Services may need a few more seconds to fully connect to MongoDB.${NC}"
echo -e "${YELLOW}   Check the service windows for any connection errors.${NC}"
echo ""
echo -e "${GREEN}✅ Startup complete! All service windows are open.${NC}"

