#!/bin/bash

echo "🚀 Setting up Kayak Travel Booking System..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install all workspace dependencies
echo "📦 Installing workspace dependencies..."
npm run install:all

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start MongoDB, Redis, and Kafka (or use docker-compose up)"
echo "2. Configure .env files in each service"
echo "3. Run services: npm run start:gateway, npm run start:user, etc."

