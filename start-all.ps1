# Kayak Travel Booking System - Complete Startup Script
# This script starts MongoDB first, then all backend services and frontend

Write-Host "🚀 Starting Kayak Travel Booking System..." -ForegroundColor Green
Write-Host ""

# Step 1: Check and start MongoDB
Write-Host "📦 Step 1: Checking MongoDB on port 27020..." -ForegroundColor Cyan
$mongoRunning = Test-NetConnection -ComputerName localhost -Port 27020 -WarningAction SilentlyContinue -InformationLevel Quiet

if (-not $mongoRunning) {
    Write-Host "   MongoDB not running. Starting MongoDB..." -ForegroundColor Yellow
    
    # Find MongoDB executable
    $mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
    if (-not (Test-Path $mongoPath)) {
        $mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
    }
    if (-not (Test-Path $mongoPath)) {
        $mongoPath = "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
    }
    
    if (-not (Test-Path $mongoPath)) {
        Write-Host "❌ MongoDB not found. Please install MongoDB or update the path in this script." -ForegroundColor Red
        exit 1
    }
    
    # Create directories if needed
    $dbPath = "E:\Kayak\database\data"
    $logPath = "E:\Kayak\database\logs\mongod.log"
    if (-not (Test-Path $dbPath)) { New-Item -ItemType Directory -Path $dbPath -Force | Out-Null }
    if (-not (Test-Path (Split-Path $logPath))) { New-Item -ItemType Directory -Path (Split-Path $logPath) -Force | Out-Null }
    
    # Start MongoDB in background
    Start-Process -FilePath $mongoPath -ArgumentList "--port","27020","--dbpath","$dbPath","--logpath","$logPath" -WindowStyle Minimized
    
    Write-Host "   Waiting for MongoDB to start..." -ForegroundColor Yellow
    $maxAttempts = 20
    $attempt = 0
    do {
        Start-Sleep -Seconds 2
        $attempt++
        $mongoRunning = Test-NetConnection -ComputerName localhost -Port 27020 -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($mongoRunning) {
            Write-Host "   ✅ MongoDB is running on port 27020!" -ForegroundColor Green
            break
        }
        Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    } while ($attempt -lt $maxAttempts)
    
    if (-not $mongoRunning) {
        Write-Host "❌ MongoDB failed to start after $maxAttempts attempts. Please check manually." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✅ MongoDB is already running on port 27020" -ForegroundColor Green
}

Write-Host ""

# Step 2: Start all backend services
Write-Host "📦 Step 2: Starting backend services..." -ForegroundColor Cyan
$services = @(
    @{Name="API Gateway"; Script="start:gateway"; Port=5000},
    @{Name="User Service"; Script="start:user"; Port=5001},
    @{Name="Flight Service"; Script="start:flight"; Port=5002},
    @{Name="Hotel Service"; Script="start:hotel"; Port=5003},
    @{Name="Car Service"; Script="start:car"; Port=5004},
    @{Name="Billing Service"; Script="start:billing"; Port=5005},
    @{Name="Admin Service"; Script="start:admin"; Port=5006}
)

foreach ($service in $services) {
    Write-Host "   Starting $($service.Name)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\Kayak; npm run $($service.Script)" -WindowStyle Normal
    Start-Sleep -Milliseconds 500
}

Write-Host "   ✅ All backend services starting..." -ForegroundColor Green
Write-Host ""

# Step 3: Start AI Agent
Write-Host "📦 Step 3: Starting AI Agent..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\Kayak\ai-agent; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal
Write-Host "   ✅ AI Agent starting on port 8000" -ForegroundColor Green
Write-Host ""

# Step 4: Start Frontend
Write-Host "📦 Step 4: Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd E:\Kayak; npm run dev:frontend" -WindowStyle Normal
Write-Host "   ✅ Frontend starting on port 5173" -ForegroundColor Green
Write-Host ""

# Step 5: Wait and verify services
Write-Host "⏳ Waiting for services to start (10 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🔍 Verifying services..." -ForegroundColor Cyan
$allRunning = $true
foreach ($service in $services) {
    $result = Test-NetConnection -ComputerName localhost -Port $service.Port -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($result) {
        $status = "✅ Running"
        $color = "Green"
    } else {
        $status = "❌ Not Running"
        $color = "Red"
        $allRunning = $false
    }
    $portNum = $service.Port
    Write-Host "   $($service.Name) (Port $portNum): $status" -ForegroundColor $color
}

$aiAgentRunning = Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue -InformationLevel Quiet
if ($aiAgentRunning) {
    $aiStatus = "✅ Running"
    $aiColor = "Green"
} else {
    $aiStatus = "❌ Not Running"
    $aiColor = "Red"
}
Write-Host "   AI Agent (Port 8000): $aiStatus" -ForegroundColor $aiColor

Write-Host ""
if ($allRunning -and $aiAgentRunning) {
    Write-Host "🎉 All services are running!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some services may still be starting. Check the service windows." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "📍 Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:     http://localhost:5173" -ForegroundColor White
Write-Host "   API Gateway:  http://localhost:5000" -ForegroundColor White
Write-Host "   AI Agent:     http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "💡 Note: Services may need a few more seconds to fully connect to MongoDB." -ForegroundColor Yellow
Write-Host "   Check the service windows for any connection errors." -ForegroundColor Yellow

Write-Host ""
Write-Host "✅ Startup complete! All service windows are open." -ForegroundColor Green

