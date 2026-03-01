# Kayak Travel System

A full-stack, distributed travel booking platform inspired by Kayak. Built with a microservices architecture, event-driven payments via Apache Kafka, Redis caching, and an AI concierge agent powered by Google Gemini. The system is deployed on **AWS EC2** and uses managed cloud services for all data infrastructure.

---

## What Was Built

### Overview
This project replicates the core experience of Kayak — users can search and book flights, hotels, and car rentals, manage their bookings, leave reviews, and interact with an AI travel assistant. An admin dashboard provides full inventory management and revenue analytics. The entire backend is split into independent microservices behind a single API Gateway.

---

## Architecture

```
                        ┌─────────────────────┐
                        │   React Frontend     │
                        │   (Vite + Redux)     │
                        └──────────┬──────────┘
                                   │ HTTP
                        ┌──────────▼──────────┐
                        │    API Gateway       │
                        │    (Port 5000)       │
                        └──┬───┬───┬───┬───┬──┘
                           │   │   │   │   │
              ┌────────────┘   │   │   │   └────────────┐
              │          ┌─────┘   └──────┐             │
              ▼          ▼         ▼      ▼             ▼
        User Svc    Flight Svc  Hotel  Car Svc    Billing Svc
        (5001)      (5002)      (5003) (5004)     (5005)
        MySQL       MongoDB     MongoDB MongoDB    MySQL
           │
    ┌──────┴────────┐
    ▼               ▼
Admin Svc      Reviews Svc    AI Agent
(5006)         (3003)         (8000 - Python/FastAPI)
MySQL+Mongo    MongoDB        Gemini + Tavily + OpenWeather
```

**Managed Cloud Services:**
- **MongoDB Atlas** — flights, hotels, cars, reviews collections
- **Redis Cloud** — user session cache, review cache, analytics cache
- **Aiven Kafka** — event streaming for booking/payment events (mTLS)

---

## Services

### API Gateway (Port 5000)
- Single entry point for all client requests
- HTTP proxy middleware routing to each microservice
- WebSocket proxy support for AI agent real-time events
- 30-second timeout, CORS handling, global error responses

### User Service (Port 5001) — MySQL + Redis
- Registration with bcrypt password hashing
- Login with JWT token generation
- Full profile CRUD (name, address, city, state, zip, phone, profile image)
- Redis cache: `user:id:{id}` and `user:email:{email}` with 1-hour TTL
- Cache invalidation on update/delete

### Flight Service (Port 5002) — MongoDB
- Round-trip flight model (outbound + return leg in one document)
- Flight classes: Economy, Business, First
- Real-time seat availability tracking
- Passenger reviews embedded per flight
- Indexed on airport codes, departure date, price, class

### Hotel Service (Port 5003) — MongoDB
- Multiple room types per hotel: Single, Double, Suite, Deluxe, Presidential
- Per-room pricing and availability
- Star ratings, amenities, guest reviews
- Indexed on city/state, star rating, price, guest rating

### Car Service (Port 5004) — MongoDB
- Car types: SUV, Sedan, Compact, Luxury, Convertible, Van, Truck
- Transmission type, fuel type, seating capacity
- Availability states: available, rented, maintenance
- Booking history with dates and user references
- Indexed on type, location city, daily price, availability

### Billing Service (Port 5005) — MySQL + Kafka
- Transaction records for all booking types (flight, hotel, car)
- Payment method tracking
- Invoice PDF generation (pdfkit)
- Revenue analytics and user spending history
- Consumes `booking.created` from Kafka, produces `payment.processed` / `payment.failed`

### Reviews Service (Port 3003) — MongoDB + Redis
- Centralized reviews for flights, hotels, and cars
- Rating aggregation with distribution (1–5 stars)
- Redis cache for review lists and stats with 1-hour TTL
- Unique constraint prevents duplicate reviews per user per entity
- "Mark as helpful" counter on each review
- Indexed on entity type/id, user id, created date

### Admin Service (Port 5006) — MySQL + MongoDB + Redis
- Admin JWT authentication
- Analytics: top 10 properties by revenue, city-wise revenue breakdown, top providers by bookings
- Cross-database queries: billing data from MySQL enriched with listing details from MongoDB
- Redis-cached analytics responses

### AI Agent Service (Port 8000) — Python / FastAPI

#### Chat Pipeline (`POST /chat`)
Each request runs a multi-stage pipeline before the LLM is called:

**1. Tool activation (heuristic)**
- Weather tool → calls OpenWeather API when the query mentions weather/temp/forecast
- Web search tool → calls Tavily API when the query mentions hotels/flights/deals

**2. RAG retrieval over live inventory (`rag.py`)**
- Embeds the user query using Google `text-embedding-004` (`retrieval_query` task type)
- Loads up to 200 deals from `agent_db.deals` (populated by the ingest loop)
- For each deal, retrieves its document embedding from Redis cache or generates a new one via the embedding API and stores it with a 1-hour TTL
- Scores every deal by cosine similarity against the query embedding
- Returns the top-k most semantically relevant candidates

**3. Multi-signal retrieval ranking (`ranking.py`)**
- Re-ranks RAG candidates using a weighted linear scoring model:
  - `0.55 × relevance` — cosine similarity from the embedding stage
  - `0.25 × price_fit` — lower price preferred; over-budget items penalised 5×
  - `0.15 × availability` — higher inventory depth preferred
  - `0.05 × kind_bonus` — boost for user's preferred category (flight/hotel/car)
- Weights calibrated on domain query-item pairs from the Kayak travel dataset

**4. LLM synthesis (Gemini 2.5 Flash)**
- Ranked inventory context + web search results + weather data are all injected into the prompt
- Gemini generates a concise, fact-grounded travel recommendation
- Graceful fallback (returns context directly) if the API key is unavailable

#### Other Agent Endpoints
- **Bundle planner** (`POST /bundles`): combines flights + hotels from MongoDB into scored packages; accepts `budget`, `destination`, `preferences`
- **WebSocket** (`/events`): real-time event broadcasting to connected clients
- **Ingestion pipeline** (`ingest.py`): loads travel deals from CSV into `agent_db.deals` on a configurable interval (default 15 min)

---

## Frontend (Port 5173)

Built with React 18, Vite, Redux Toolkit, Tailwind CSS, and Framer Motion.

**User-facing pages:**
- Home with hero and popular destinations
- Flight, hotel, and car search with filters
- Booking modal with payment flow
- Dashboard: booking history and profile management
- Favourites, notifications

**Admin pages:**
- Login and dashboard with analytics charts
- Inventory management: create/edit flights (with round-trip details), hotels (with room types), cars
- Bookings management and user management

**UI components:**
- **ScrollToTop** — animated scroll-to-top button (Framer Motion fade/scale, appears after 400 px)
- **SeatSelection** — interactive 30-row flight seat map; First / Business / Economy zones colour-coded; deterministic taken-seat pattern
- **RoomSelection** — hotel room picker showing price, bed type, max occupancy, amenities, and rooms remaining
- **ReviewModal** — star-rating (hover + click) and text form; POSTs to Reviews Service with JWT auth
- **FlightReviewsModal / HotelReviewsModal / CarReviewsModal** — fetches reviews + aggregated stats, renders a 5-star distribution bar chart, helpful-vote button, and embedded ReviewModal

**AI Chatbot widget:**
- Floating button (bottom-right) available on all pages
- Connects to `/api/agent/chat` via the gateway
- Displays Gemini-powered travel recommendations inline

---

## Event-Driven Flow

```
User books → POST /api/billing/bookings
           → Billing service publishes to Kafka: booking.created
           → Billing consumer processes payment
           → Publishes: payment.processed or payment.failed
```

Kafka topics: `booking.created`, `payment.processed`, `payment.failed`
Kafka cluster: Aiven (mTLS with CA/cert/key in `kafka/creds/`)

**Kafka monitor** — real-time console dashboard for the booking pipeline:

```bash
node kafka/monitor-bookings.js
# Filter to one topic
node kafka/monitor-bookings.js --topic payment.processed
# Replay from beginning
node kafka/monitor-bookings.js --from beginning
```

Colour-coded output shows each event as it arrives, with per-topic counters.

---

## AWS Deployment

The system is hosted on **AWS EC2**. The Docker Compose stack runs on an EC2 instance with all three containers (gateway, frontend, AI agent) deployed together. Individual microservices run as separate Node.js processes on the same instance.

**Infrastructure setup:**
- EC2 instance running Ubuntu with Docker and Docker Compose installed
- Inbound security group rules: port 5000 (API Gateway), 5173 (Frontend), 8000 (AI Agent)
- MongoDB Atlas, Redis Cloud, and Aiven Kafka are external managed services — no databases run on EC2
- Kafka SSL credentials stored in `kafka/creds/` (mounted as a read-only volume)
- Environment variables injected at container runtime via `docker-compose.yml`

**To deploy on a fresh EC2 instance:**
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@<ec2-public-ip>

# Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu

# Clone repo and set up credentials
git clone <repo-url>
cd kayak-travel-system
# Place kafka/creds/ca.pem, service.cert, service.key
# Place ai-agent/.env with API keys

# Build and run
docker compose up --build -d
```

---

## Environment Variables

**`backend/.env`** (used by all Node.js services and seed scripts):
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
REDIS_URL=redis://default:<password>@<host>:<port>
KAFKA_BROKER=<broker-host>:<port>
KAFKA_SSL_CA_PATH=./kafka/creds/ca.pem
KAFKA_SSL_CERT_PATH=./kafka/creds/service.cert
KAFKA_SSL_KEY_PATH=./kafka/creds/service.key
JWT_SECRET=<your-secret>
MYSQL_HOST=<host>
MYSQL_USER=<user>
MYSQL_PASSWORD=<password>
MYSQL_DATABASE=<db>
```

**`ai-agent/.env`**:
```
MONGODB_URI=...
MONGODB_DB=agent_db
REDIS_URL=...             # used for RAG embedding cache (1-hour TTL per document)
GEMINI_API_KEY=...        # used for LLM chat and text-embedding-004 embeddings
TAVILY_API_KEY=...
OPENWEATHER_API_KEY=...
RAG_ENABLED=true          # set to false to skip RAG retrieval
RAG_TOP_K=5               # number of candidates returned by RAG before re-ranking
```

---

## Service Ports

| Service        | Port | Database       |
|----------------|------|----------------|
| Frontend       | 5173 | —              |
| API Gateway    | 5000 | —              |
| User Service   | 5001 | MySQL + Redis  |
| Flight Service | 5002 | MongoDB        |
| Hotel Service  | 5003 | MongoDB        |
| Car Service    | 5004 | MongoDB        |
| Billing Service| 5005 | MySQL + Kafka  |
| Admin Service  | 5006 | MySQL + MongoDB|
| Reviews Service| 3003 | MongoDB + Redis|
| AI Agent       | 8000 | MongoDB        |

---

## Quick Start

The `start-all.sh` (macOS/Linux) and `start-all.ps1` (Windows) scripts launch every
service in one command:

```bash
# macOS / Linux
chmod +x start-all.sh
./start-all.sh

# Skip optional services
./start-all.sh --skip-frontend --skip-agent

# Windows PowerShell
.\start-all.ps1
```

Each service starts in the background. Logs go to the terminal that launched the script.

---

## Run with Docker

```bash
docker compose up --build
# Gateway:  http://localhost:5000
# Frontend: http://localhost:5173
# AI Agent: http://localhost:8000
```

## Run Locally (without Docker)

```bash
# API Gateway
cd backend/api-gateway && npm install && npm start

# Each microservice (in separate terminals)
cd backend/services/user-service    && npm install && npm start
cd backend/services/flight-service  && npm install && npm start
cd backend/services/hotel-service   && npm install && npm start
cd backend/services/car-service     && npm install && npm start
cd backend/services/billing-service && npm install && npm start
cd backend/services/admin-service   && npm install && npm start
cd backend/services/reviews-service && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev

# AI Agent
cd ai-agent && uv pip install -e . && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Performance Testing (JMeter)

Load tests were run with 50 concurrent users, 30 s ramp-up, 120 s duration against three
incremental configurations. Full results: [`jmeter/PERFORMANCE_TEST_RESULTS.md`](jmeter/PERFORMANCE_TEST_RESULTS.md).

| Endpoint group              | Config A (base) p95 | Config C (+Redis+Kafka) p95 | Improvement |
|-----------------------------|---------------------|-----------------------------|-------------|
| Flight / Hotel / Car search | 580 ms              | 89 ms                       | **−85 %**   |
| User profile reads          | 510 ms              | 35 ms                       | **−93 %**   |
| Booking + billing           | 980 ms              | 190 ms                      | **−81 %**   |

To re-run the tests:
```bash
mkdir -p jmeter/results
jmeter -n -t jmeter/KAYAK_PERFORMANCE_TEST_PLAN.jmx \
  -JTHREADS=50 -JRAMP_UP=30 -JDURATION=120 \
  -l jmeter/results/results.csv \
  -e -o jmeter/results/report/
```

---

## Database Seeding

```bash
cd backend
npm run seed:minimal      # small dataset for testing
npm run seed:database     # larger realistic dataset
npm run create:admin      # create default admin user
npm run seed:mongo        # create MongoDB indexes
npm run seed:redis        # ping and prime Redis
npm run kafka:topics      # create Kafka topics on Aiven
```

---

## Tech Stack

| Layer         | Technology                                              |
|---------------|---------------------------------------------------------|
| Frontend      | React 18, Vite, Redux Toolkit, Tailwind CSS, Framer Motion |
| API Gateway   | Node.js, Express, http-proxy-middleware                 |
| Backend       | Node.js, Express (per-service)                         |
| AI Agent      | Python, FastAPI, LangChain, Google Gemini 2.5 Flash, text-embedding-004 |
| Databases     | MongoDB Atlas, MySQL                                    |
| Cache         | Redis Cloud                                             |
| Message Queue | Apache Kafka (Aiven, mTLS)                              |
| External APIs | Tavily (web search), OpenWeather                        |
| Auth          | JWT, bcryptjs                                           |
| DevOps        | Docker, Docker Compose, AWS EC2                         |

---

## Key Decisions

- **All flights are round-trip** — the Flight schema stores both the outbound and return legs in one document, simplifying booking logic.
- **Reviews are centralised** — a dedicated Reviews Service handles ratings for flights, hotels, and cars, rather than embedding reviews in each collection.
- **Redis cache-aside pattern** — every read checks Redis first; writes invalidate affected keys. TTLs: 1 hour for user/review data, configurable for analytics.
- **Kafka for payment events** — booking creation and payment outcome are decoupled; the billing service is the sole consumer and producer for financial events.
- **RAG pipeline** — each `/chat` request embeds the user query and retrieves the most semantically similar deals from MongoDB before calling Gemini. Document embeddings are cached in Redis to avoid redundant API calls on repeated queries.
- **Multi-signal ranking** — retrieved candidates are re-ranked by a weighted linear model (relevance + price fit + availability + category preference) before being injected into the LLM prompt, giving Gemini the highest-quality context.

---

## Documentation

- **Architecture deep-dive** — [`docs/architecture.md`](docs/architecture.md) covers the full service map, booking and AI chat data flows, database schemas, Redis key patterns, Kafka topics, API Gateway routing, and AWS deployment layout.
- **Performance results** — [`jmeter/PERFORMANCE_TEST_RESULTS.md`](jmeter/PERFORMANCE_TEST_RESULTS.md)

---

## Notes

- Kafka credentials (`kafka/creds/`) and `.env` files are git-ignored — never committed.
- Ensure MongoDB Atlas, Redis Cloud, and Aiven Kafka allow connections from your EC2 IP or security group.
- The `JWT_SECRET` in `docker-compose.yml` should be replaced with a strong random secret before any production use.
