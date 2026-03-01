# start-all.ps1 — Start all Kayak microservices locally (Windows PowerShell)
# Usage: .\start-all.ps1 [-SkipFrontend] [-SkipAgent]

param(
  [switch]$SkipFrontend,
  [switch]$SkipAgent
)

$Root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = "$Root\backend"
$Frontend= "$Root\frontend"
$Agent   = "$Root\ai-agent"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Kayak Travel System — Local Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

function Start-Service {
  param([string]$Name, [string]$Dir, [string]$Cmd)
  Write-Host "`n>> Starting $Name" -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Dir'; $Cmd" -WindowStyle Normal
}

# API Gateway
Start-Service "API Gateway       (5000)" "$Backend\api-gateway"               "npm start"

# Microservices
Start-Service "User Service      (5001)" "$Backend\services\user-service"     "npm start"
Start-Service "Flight Service    (5002)" "$Backend\services\flight-service"   "npm start"
Start-Service "Hotel Service     (5003)" "$Backend\services\hotel-service"    "npm start"
Start-Service "Car Service       (5004)" "$Backend\services\car-service"      "npm start"
Start-Service "Billing Service   (5005)" "$Backend\services\billing-service"  "npm start"
Start-Service "Admin Service     (5006)" "$Backend\services\admin-service"    "npm start"
Start-Service "Reviews Service   (3003)" "$Backend\services\reviews-service"  "npm start"

# AI Agent
if (-not $SkipAgent) {
  Start-Service "AI Agent          (8000)" "$Agent" "uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
}

# Frontend
if (-not $SkipFrontend) {
  Start-Service "Frontend          (5173)" "$Frontend" "npm run dev"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " All services launched in separate windows." -ForegroundColor Green
Write-Host " Gateway:  http://localhost:5000" -ForegroundColor White
Write-Host " Frontend: http://localhost:5173" -ForegroundColor White
Write-Host " AI Agent: http://localhost:8000" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan
