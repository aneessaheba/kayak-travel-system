# Kayak Travel Booking System - Project Plan

## 📋 Project Overview
A distributed 3-tier travel booking system similar to Kayak, supporting flights, hotels, and car rentals with AI-powered recommendations.

## 🏗️ Architecture Overview

### 3-Tier Architecture
1. **Tier 1 - Client**: React/Redux frontend application
2. **Tier 2 - Middleware**: Node.js/Express microservices + Kafka messaging
3. **Tier 3 - Database**: MongoDB + Redis caching

### Additional Services
- **AI Agent**: FastAPI + Langchain for travel recommendations
- **Message Queue**: Kafka for async communication
- **Caching**: Redis for performance optimization

## 📁 Proposed Folder Structure

```
kayak/
├── frontend/                    # React/Redux Client Application
│   ├── public/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── store/               # Redux store configuration
│   │   │   ├── slices/          # Redux slices (users, flights, hotels, etc.)
│   │   │   └── middleware/      # Redux middleware
│   │   ├── services/            # API service calls
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions
│   │   ├── styles/              # Global styles, themes
│   │   └── App.jsx
│   ├── package.json
│   └── .env
│
├── backend/                     # Node.js Backend Services
│   ├── services/                # Microservices
│   │   ├── user-service/
│   │   │   ├── src/
│   │   │   │   ├── controllers/
│   │   │   │   ├── models/
│   │   │   │   ├── routes/
│   │   │   │   ├── middleware/
│   │   │   │   ├── services/
│   │   │   │   ├── utils/
│   │   │   │   └── server.js
│   │   │   ├── tests/
│   │   │   ├── package.json
│   │   │   └── .env.example
│   │   │
│   │   ├── flight-service/
│   │   ├── hotel-service/
│   │   ├── car-service/
│   │   ├── billing-service/
│   │   └── admin-service/
│   │
│   ├── api-gateway/             # API Gateway (optional but recommended)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── server.js
│   │   └── package.json
│   │
│   └── shared/                  # Shared backend utilities
│       ├── models/              # Shared data models
│       ├── utils/               # Common utilities
│       ├── constants/           # Shared constants
│       └── middleware/          # Shared middleware (auth, validation)
│
├── ai-agent/                    # FastAPI AI Recommendation Service
│   ├── app/
│   │   ├── agents/              # Langchain agents
│   │   │   ├── deals_agent.py
│   │   │   └── concierge_agent.py
│   │   ├── api/                 # FastAPI routes
│   │   │   ├── endpoints/
│   │   │   └── websocket.py
│   │   ├── models/              # Pydantic models
│   │   ├── services/            # Business logic
│   │   ├── database/            # SQLModel/SQLite setup
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── database/                    # Database Management
│   ├── schemas/                 # MongoDB schemas/models
│   │   ├── user.schema.js
│   │   ├── flight.schema.js
│   │   ├── hotel.schema.js
│   │   ├── car.schema.js
│   │   ├── billing.schema.js
│   │   └── admin.schema.js
│   ├── migrations/              # Database migrations
│   ├── seeds/                   # Seed data scripts
│   │   ├── generate-users.js
│   │   ├── generate-flights.js
│   │   ├── generate-hotels.js
│   │   └── generate-cars.js
│   └── scripts/                 # DB utility scripts
│
├── kafka/                       # Kafka Configuration & Logic
│   ├── producers/               # Kafka producers
│   │   ├── frontend-producer.js
│   │   └── ai-agent-producer.js
│   ├── consumers/               # Kafka consumers
│   │   ├── user-consumer.js
│   │   ├── booking-consumer.js
│   │   └── billing-consumer.js
│   ├── topics/                  # Topic definitions
│   │   └── topics.config.js
│   └── config/                  # Kafka configuration
│       └── kafka.config.js
│
├── docker/                      # Docker Configuration
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── Dockerfile.ai-agent
│   ├── docker-compose.yml      # Local development
│   ├── docker-compose.prod.yml # Production
│   └── .dockerignore
│
├── k8s/                         # Kubernetes Manifests
│   ├── deployments/
│   │   ├── frontend-deployment.yaml
│   │   ├── backend-services/
│   │   └── ai-agent-deployment.yaml
│   ├── services/
│   ├── configmaps/
│   ├── secrets/
│   └── ingress/
│
├── aws/                         # AWS Deployment Configs
│   ├── cloudformation/          # CloudFormation templates
│   ├── terraform/               # Terraform configs (if used)
│   ├── ecs/                     # ECS task definitions
│   └── lambda/                  # Lambda functions (if any)
│
├── scripts/                     # Utility Scripts
│   ├── setup.sh                 # Initial setup script
│   ├── seed-database.js         # Populate DB with 10K+ records
│   ├── performance-test.sh      # JMeter test runner
│   └── deploy.sh                # Deployment script
│
├── tests/                       # Integration & E2E Tests
│   ├── integration/
│   ├── e2e/
│   └── performance/             # JMeter test plans
│
├── docs/                        # Documentation
│   ├── architecture.md
│   ├── api-documentation.md
│   ├── database-schema.md
│   └── deployment.md
│
├── .gitignore
├── README.md
└── package.json                 # Root package.json (npm workspaces - monorepo)
```

## 🎯 Implementation Phases

### Phase 1: Foundation & Setup (Week 1)
- [ ] Create folder structure
- [ ] Initialize all services with basic setup
- [ ] Set up MongoDB schemas
- [ ] Configure development environment
- [ ] Set up basic CI/CD structure

### Phase 2: Core Services (Week 2-3)
- [ ] User Service (CRUD, authentication)
- [ ] Flight Service (CRUD, search, filter)
- [ ] Hotel Service (CRUD, search, filter)
- [ ] Car Service (CRUD, search, filter)
- [ ] Database seeding (10K+ records)

### Phase 3: Business Logic (Week 4-5)
- [ ] Billing Service
- [ ] Booking functionality
- [ ] Admin Service
- [ ] Admin dashboard with charts/analytics
- [ ] Payment processing

### Phase 4: Integration & Messaging (Week 6)
- [ ] Kafka setup and configuration
- [ ] Frontend-Backend communication via Kafka
- [ ] Event-driven architecture implementation
- [ ] Redis caching implementation

### Phase 5: AI Agent (Week 7)
- [ ] FastAPI service setup
- [ ] Langchain integration
- [ ] Deals Agent (scheduled scans)
- [ ] Concierge Agent (chat interface)
- [ ] WebSocket implementation for real-time updates

### Phase 6: Frontend (Week 8-9)
- [ ] React app setup with Redux
- [ ] User interface components
- [ ] Search and filter functionality
- [ ] Booking flow
- [ ] Admin dashboard UI
- [ ] Integration with AI agent chat

### Phase 7: Performance & Optimization (Week 10)
- [ ] Redis caching strategy
- [ ] Database query optimization
- [ ] Load testing with JMeter
- [ ] Performance metrics collection
- [ ] Scalability improvements

### Phase 8: Containerization & Deployment (Week 11)
- [ ] Docker containerization
- [ ] Docker Compose for local development
- [ ] Kubernetes manifests
- [ ] AWS deployment configurations
- [ ] CI/CD pipeline

### Phase 9: Testing & Documentation (Week 12)
- [ ] Integration tests
- [ ] E2E tests
- [ ] API documentation
- [ ] Architecture documentation
- [ ] Deployment guides

## 🔧 Technology Stack

### Frontend
- React 18+
- Redux Toolkit
- React Router
- Axios/Fetch
- Material-UI or Tailwind CSS

### Backend
- Node.js 18+
- Express.js
- JavaScript (ES6+)
- MongoDB (Mongoose)
- Redis (node-redis)
- Kafka (kafkajs)
- JWT for authentication

### AI Agent
- Python 3.10+
- FastAPI
- Langchain
- OpenAI API
- WebSockets
- SQLModel/SQLite

### Infrastructure
- Docker & Docker Compose
- Kubernetes
- AWS (EC2, ECS, RDS, S3, etc.)
- Apache JMeter (performance testing)

## 📊 Key Features to Implement

### User Features
- User registration/login
- Profile management
- Search flights/hotels/cars
- Filter by various criteria
- Book reservations
- Payment processing
- View booking history
- Submit reviews

### Admin Features
- Manage listings (CRUD)
- User account management
- View/modify bills
- Analytics dashboard:
  - Top 10 properties by revenue
  - City-wise revenue
  - Top providers with max properties sold

### AI Agent Features
- Natural language trip planning
- Deal detection and tagging
- Bundle recommendations
- Price/watch alerts
- Policy/logistics Q&A

## 🚀 Scalability Requirements

- Handle 10,000+ listings
- Support 10,000+ users
- Process 100,000+ billing records
- Support 100+ simultaneous users
- Performance metrics for:
  - Base (B)
  - Base + SQL Caching (B+S)
  - Base + Caching + Kafka (B+S+K)
  - Base + Caching + Kafka + Other optimizations

## ✅ Technical Decisions

- **API Gateway**: ✅ Yes - Single entry point for all backend services
- **Monorepo**: ✅ Yes - npm workspaces for managing all services
- **AWS**: 📋 Planned for later - Structure ready, configs added when needed
- **Language**: ✅ JavaScript (ES6+) - No TypeScript

## 📝 Next Steps

1. ✅ Review and approve folder structure
2. ✅ Initialize project structure
3. Set up development environment
4. Begin Phase 1 implementation

