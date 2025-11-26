# MongoDB Startup Script for Port 27020
# Run this script to start MongoDB on port 27020

$mongoPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
if (-not (Test-Path $mongoPath)) {
    $mongoPath = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
}
if (-not (Test-Path $mongoPath)) {
    $mongoPath = "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
}

if (-not (Test-Path $mongoPath)) {
    Write-Host "âŒ MongoDB not found. Please update the path in this script." -ForegroundColor Red
    exit
}

$dbPath = "E:\Kayak\database\data"
$logPath = "E:\Kayak\database\logs\mongod.log"

# Create directories if they don't exist
if (-not (Test-Path $dbPath)) { New-Item -ItemType Directory -Path $dbPath -Force | Out-Null }
if (-not (Test-Path (Split-Path $logPath))) { New-Item -ItemType Directory -Path (Split-Path $logPath) -Force | Out-Null }

Write-Host "Starting MongoDB on port 27020..." -ForegroundColor Green
Write-Host "Database path: $dbPath" -ForegroundColor Cyan
Write-Host "Log path: $logPath" -ForegroundColor Cyan
Write-Host "
Press Ctrl+C to stop MongoDB" -ForegroundColor Yellow

& $mongoPath --port 27020 --dbpath $dbPath --logpath $logPath
