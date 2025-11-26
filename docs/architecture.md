# System Architecture

## Overview

The Kayak Travel Booking System follows a 3-tier distributed architecture with microservices.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Tier 1: Client Layer                      │
│                    React/Redux Frontend                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Tier 2: Middleware Layer                        │
│  ┌──────────────┐                                           │
│  │ API Gateway  │                                           │
│  └──────┬───────┘                                           │
│         │                                                    │
│  ┌──────▼──────┬──────────┬──────────┬──────────┬─────────┐│
│  │ User Service│ Flight   │ Hotel    │ Car      │ Billing ││
│  │             │ Service  │ Service  │ Service  │ Service ││
│  └──────┬──────┴─────┬────┴─────┬────┴─────┬────┴─────┬──┘│
│         │            │           │          │           │   │
│         └────────────┴───────────┴──────────┴───────────┘   │
│                    │                                          │
│                    │ Kafka                                    │
│                    │                                          │
│         ┌──────────▼──────────┐                              │
│         │   AI Agent Service  │                              │
│         │   (FastAPI)         │                              │
│         └─────────────────────┘                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │
┌──────────────────────▼───────────────────────────────────────┐
│              Tier 3: Database Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │ MongoDB  │  │  Redis   │  │  SQLite  │                  │
│  │          │  │  Cache   │  │ (AI Agent)│                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

## Components

### Frontend (React/Redux)
- User interface
- State management with Redux
- API communication via API Gateway

### API Gateway
- Single entry point
- Request routing
- Authentication/Authorization
- Rate limiting

### Microservices
- **User Service**: User management, authentication
- **Flight Service**: Flight listings, search, booking
- **Hotel Service**: Hotel listings, search, booking
- **Car Service**: Car rental listings, search, booking
- **Billing Service**: Payment processing, transactions
- **Admin Service**: Admin dashboard, analytics

### AI Agent
- FastAPI service
- Langchain integration
- Deal detection
- Travel recommendations

### Message Queue
- Kafka for async communication
- Event-driven architecture

### Databases
- MongoDB: Primary data storage
- Redis: Caching layer
- SQLite: AI Agent local storage

