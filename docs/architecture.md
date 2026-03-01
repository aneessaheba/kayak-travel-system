# System Architecture

## Overview

The Kayak Travel Booking System is a production-grade distributed application built on a
microservices architecture. Nine independently deployable services communicate through an
API Gateway, a Kafka event bus, and a shared caching layer. All services are containerised
and deployed on AWS EC2 behind a reverse proxy.

---

## Service Map

```
                        ┌──────────────────────────────┐
                        │   React 18 + Vite Frontend    │
                        │   Redux Toolkit · Tailwind     │
                        │   Framer Motion · port 5173   │
                        └──────────────┬───────────────┘
                                       │ HTTP/REST
                        ┌──────────────▼───────────────┐
                        │      API Gateway              │
                        │  Express + http-proxy-middle  │
                        │  JWT validation · port 5000   │
                        └──┬────┬────┬────┬────┬────┬──┘
                           │    │    │    │    │    │
             ┌─────────────┘    │    │    │    │    └──────────────┐
             │           ┌──────┘    │    │    └──────┐            │
             ▼           ▼           ▼    ▼           ▼            ▼
        ┌─────────┐ ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────────┐ ┌──────┐
        │  User   │ │ Flight  │ │Hotel │ │ Car  │ │ Billing  │ │Admin │
        │ Service │ │ Service │ │Svc   │ │ Svc  │ │ Service  │ │ Svc  │
        │  :5001  │ │  :5002  │ │:5003 │ │:5004 │ │  :5005   │ │:5006 │
        └────┬────┘ └────┬────┘ └──┬───┘ └──┬───┘ └────┬─────┘ └──┬───┘
             │           │         │         │           │          │
             │      ┌────┴─────────┴─────────┴──┐        │          │
             │      │    Reviews Service  :3003  │        │          │
             │      └───────────────────────────┘        │          │
             │                                            │          │
        ┌────▼──────────────────────────────────────┐    │          │
        │         MySQL (users + bookings)           │    │          │
        │         MongoDB Atlas (inventory)          │    │          │
        │         Redis Cloud (cache-aside)          │    │          │
        └───────────────────────────────────────────┘    │          │
                                                          │          │
                    ┌─────────────────────────────────────┘          │
                    │ booking.created / payment.* Kafka topics        │
                    ▼                                                  │
        ┌───────────────────────────────────┐                         │
        │  AI Agent Service  :8000          │                         │
        │  FastAPI + LangChain + Gemini     │◄────────────────────────┘
        │  RAG pipeline · Redis embed cache │     /api/agent proxy
        └───────────────────────────────────┘
```

---

## Port Reference

| Service          | Port | Tech Stack                        |
|------------------|------|-----------------------------------|
| Frontend         | 5173 | React 18, Vite, Redux Toolkit     |
| API Gateway      | 5000 | Express, http-proxy-middleware    |
| User Service     | 5001 | Express, MySQL, JWT, bcrypt       |
| Flight Service   | 5002 | Express, MongoDB Atlas            |
| Hotel Service    | 5003 | Express, MongoDB Atlas            |
| Car Service      | 5004 | Express, MongoDB Atlas            |
| Billing Service  | 5005 | Express, MySQL, Kafka producer    |
| Admin Service    | 5006 | Express, MongoDB + MySQL          |
| Reviews Service  | 3003 | Express, MongoDB                  |
| AI Agent         | 8000 | FastAPI, LangChain, Google Gemini |

---

## Booking Data Flow

```
User clicks "Book"
       │
       ▼
  API Gateway (/api/billing)
       │
       ▼
  Billing Service  ──── writes booking row to MySQL ────► booking.created Kafka topic
       │                                                          │
       │  HTTP 200 returned immediately                           ▼
       │                                            Billing Consumer reads event
       ▼                                            processes payment async
  Frontend shows confirmation                       writes payment result to MySQL
                                                    emits payment.processed or
                                                    payment.failed event
```

The Kafka async pipeline decouples booking creation from payment processing, cutting
p95 booking latency from ~980 ms (synchronous) to ~190 ms.

---

## AI Chat Data Flow (RAG Pipeline)

```
User message → POST /api/agent/chat
       │
       ├─ Tool heuristics
       │   ├─ weather keywords  → OpenWeatherMap API
       │   └─ travel keywords   → Tavily web search
       │
       ├─ RAG retrieval (if RAG_ENABLED=true and GEMINI_API_KEY set)
       │   ├─ Embed query via Google text-embedding-004 (retrieval_query)
       │   ├─ Fetch up to 200 deals from agent_db.deals (MongoDB)
       │   ├─ For each deal:
       │   │   ├─ Check Redis cache  key: rag:embed:md5(text)  TTL 1h
       │   │   └─ On miss: embed via text-embedding-004, cache result
       │   └─ Cosine similarity score → top-k candidates
       │
       ├─ Re-ranking (multi-signal model)
       │   ├─ relevance    × 0.55  (semantic similarity)
       │   ├─ price_fit    × 0.25  (lower price = better; ×0.2 penalty if over budget)
       │   ├─ availability × 0.15  (more inventory = lower booking risk)
       │   └─ kind_bonus   × 0.05  (matches preferred_kind: flight/hotel/car)
       │
       └─ Gemini 2.5 Flash inference
           system_prompt + rag_context + search_results + weather + user_message
                       │
                       ▼
               ChatResponse(reply=...)
```

---

## Database Schema (per service)

### MySQL — User Service (`kayak_users`)

| Table         | Key Columns                                                    |
|---------------|----------------------------------------------------------------|
| `users`       | id, name, email, password (bcrypt), phone, profile_pic, role  |
| `otp_codes`   | id, user_id, otp, expires_at, used                            |

### MySQL — Billing Service (`kayak_billing`)

| Table      | Key Columns                                                               |
|------------|---------------------------------------------------------------------------|
| `bookings` | id, user_id, entity_type, entity_id, price, currency, status, created_at |
| `payments` | id, booking_id, gateway, transaction_id, status, amount, created_at      |

### MongoDB Atlas — Inventory (`kayak`)

| Collection | Key Fields                                                               |
|------------|--------------------------------------------------------------------------|
| `flights`  | _id, airline, origin, destination, date, price, seats, duration          |
| `hotels`   | _id, name, location, price_per_night, stars, amenities, rooms_available  |
| `cars`     | _id, make, model, location, price_per_day, transmission, available       |

### MongoDB — Reviews (`kayak` or `agent_db`)

| Collection | Key Fields                                                               |
|------------|--------------------------------------------------------------------------|
| `reviews`  | _id, entity_type, entity_id, user_id, rating (1-5), comment, created_at |

### MongoDB — AI Agent (`agent_db`)

| Collection | Key Fields                                                                    |
|------------|-------------------------------------------------------------------------------|
| `deals`    | deal_uid, kind, source, title, origin, destination, price, availability, tags |

---

## Redis Key Patterns

| Key Pattern               | Value              | TTL    | Used by                       |
|---------------------------|--------------------|--------|-------------------------------|
| `user:id:{id}`            | JSON user object   | 1 hour | User Service (profile reads)  |
| `user:email:{email}`      | JSON user object   | 1 hour | User Service (auth lookups)   |
| `flights:{query_hash}`    | JSON array         | 5 min  | Flight Service (search cache) |
| `hotels:{query_hash}`     | JSON array         | 5 min  | Hotel Service (search cache)  |
| `cars:{query_hash}`       | JSON array         | 5 min  | Car Service (search cache)    |
| `rag:embed:md5({text})`   | JSON float array   | 1 hour | AI Agent (embedding cache)    |

---

## Kafka Topics

| Topic               | Producer         | Consumer         | Payload                            |
|---------------------|------------------|------------------|------------------------------------|
| `booking.created`   | Billing Service  | Billing Consumer | booking_id, user_id, amount        |
| `payment.processed` | Billing Consumer | Notification Svc | booking_id, transaction_id, status |
| `payment.failed`    | Billing Consumer | Notification Svc | booking_id, error, retry_count     |

Kafka cluster: Aiven (managed), mTLS authentication, SSL transport.

---

## API Gateway Routing

| Prefix          | Target Service   | Port |
|-----------------|------------------|------|
| `/api/auth`     | User Service     | 5001 |
| `/api/users`    | User Service     | 5001 |
| `/api/flights`  | Flight Service   | 5002 |
| `/api/hotels`   | Hotel Service    | 5003 |
| `/api/cars`     | Car Service      | 5004 |
| `/api/billing`  | Billing Service  | 5005 |
| `/api/admin`    | Admin Service    | 5006 |
| `/api/reviews`  | Reviews Service  | 3003 |
| `/api/agent`    | AI Agent         | 8000 |

---

## AWS Deployment

```
AWS EC2 (Ubuntu 22.04)
├── Nginx reverse proxy (port 80/443)
│   └── proxy_pass → Node processes managed by PM2
├── PM2 process manager
│   ├── api-gateway (port 5000)
│   ├── user-service (port 5001)
│   ├── flight-service (port 5002)
│   ├── hotel-service (port 5003)
│   ├── car-service (port 5004)
│   ├── billing-service (port 5005)
│   ├── admin-service (port 5006)
│   └── reviews-service (port 3003)
├── Python (venv) — AI Agent via uvicorn (port 8000)
└── Frontend — Vite build served as static files via Nginx
```

External managed services:
- **MongoDB Atlas** — cloud-hosted replica set, shared tier
- **Redis Cloud** — managed Redis, TLS-enabled
- **Aiven Kafka** — managed Kafka cluster, mTLS certs in `/certs`

---

## Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Service communication | REST via API Gateway | Simple, debuggable, JWT validated at one entry point |
| Async payment flow | Kafka | Decouples booking latency from payment processing |
| Read caching | Redis cache-aside | ~85% p95 latency reduction for inventory endpoints |
| AI LLM | Google Gemini 2.5 Flash | Cost-efficient, 1M token context, fast inference |
| Embeddings | Google text-embedding-004 | Best-in-class MTEB score, native Gemini integration |
| RAG retrieval | Cosine similarity (pure Python) | No numpy dependency, sufficient for ≤200-item corpora |
| Re-ranking | Weighted linear model | Transparent, tunable weights, no training data required |
| Frontend state | Redux Toolkit | Predictable, DevTools support, RTK slice pattern |
