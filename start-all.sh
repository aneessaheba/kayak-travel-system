#!/usr/bin/env bash
# start-all.sh — Start all Kayak microservices locally (Unix/macOS)
# Usage: ./start-all.sh [--skip-frontend] [--skip-agent]

set -e

SKIP_FRONTEND=false
SKIP_AGENT=false

for arg in "$@"; do
  case $arg in
    --skip-frontend) SKIP_FRONTEND=true ;;
    --skip-agent)    SKIP_AGENT=true ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT_DIR/backend"
FRONTEND="$ROOT_DIR/frontend"
AGENT="$ROOT_DIR/ai-agent"

# Load root .env if present
[ -f "$BACKEND/.env" ] && export $(grep -v '^#' "$BACKEND/.env" | xargs)

echo "========================================"
echo " Kayak Travel System — Local Startup"
echo "========================================"

start_service() {
  local name=$1
  local dir=$2
  local cmd=$3
  echo ""
  echo ">> Starting $name in $dir"
  cd "$dir" && eval "$cmd" &
  echo "   PID $! — $name"
}

# API Gateway
start_service "API Gateway       (5000)" "$BACKEND/api-gateway"        "npm start"

# Microservices
start_service "User Service      (5001)" "$BACKEND/services/user-service"     "npm start"
start_service "Flight Service    (5002)" "$BACKEND/services/flight-service"   "npm start"
start_service "Hotel Service     (5003)" "$BACKEND/services/hotel-service"    "npm start"
start_service "Car Service       (5004)" "$BACKEND/services/car-service"      "npm start"
start_service "Billing Service   (5005)" "$BACKEND/services/billing-service"  "npm start"
start_service "Admin Service     (5006)" "$BACKEND/services/admin-service"    "npm start"
start_service "Reviews Service   (3003)" "$BACKEND/services/reviews-service"  "npm start"

# AI Agent
if [ "$SKIP_AGENT" = false ]; then
  echo ""
  echo ">> Starting AI Agent (8000)"
  cd "$AGENT" && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
  echo "   PID $! — AI Agent"
fi

# Frontend
if [ "$SKIP_FRONTEND" = false ]; then
  echo ""
  echo ">> Starting Frontend (5173)"
  cd "$FRONTEND" && npm run dev &
  echo "   PID $! — Frontend"
fi

echo ""
echo "========================================"
echo " All services started."
echo " Gateway:  http://localhost:5000"
echo " Frontend: http://localhost:5173"
echo " AI Agent: http://localhost:8000"
echo ""
echo " Press Ctrl+C to stop all services."
echo "========================================"

wait
