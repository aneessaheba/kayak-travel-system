# Kayak Distributed Travel System

Distributed Kayak clone with microservices, AI concierge, and managed data plane (MongoDB Atlas, Redis Cloud, Aiven Kafka).

## Features
- User: auth, search flights/hotels/cars, bookings, payments, history, reviews.
- Admin: CRUD on inventory, analytics, revenue, user management.
- AI agent: chat concierge with Gemini, Tavily search, and OpenWeather; builds bundles from deals.
- Infra: API Gateway, services, Kafka events (Aiven), Mongo Atlas, Redis Cloud cache.

## Managed Services
- **MongoDB Atlas**: use a cluster URI with db names (per-service or shared). Example: `mongodb+srv://user:pass@cluster/kayak_users?retryWrites=true&w=majority`.  https://cloud.mongodb.com/
- **Redis Cloud (free)**: `redis://default:<password>@<host>:<port>`. https://cloud.redis.io/
- **Aiven Kafka (mTLS)**: broker `kafka-22d33350-data-236-b354.h.aivencloud.com:21798` with CA/cert/key in `kafka/creds/` (git-ignored). https://console.aiven.io/

## Environment
`backend/.env` (used by services and seed scripts):
```
MONGODB_URI=...
REDIS_URL=...
KAFKA_BROKER=...
KAFKA_SSL_CA_PATH=./kafka/creds/ca.pem
KAFKA_SSL_CERT_PATH=./kafka/creds/service.cert
KAFKA_SSL_KEY_PATH=./kafka/creds/service.key
JWT_SECRET=...
```

`ai-agent/.env`:
```
MONGODB_URI=...    # reuse Atlas
MONGODB_DB=agent_db
REDIS_URL=...      # optional cache
GEMINI_API_KEY=...
TAVILY_API_KEY=...
OPENWEATHER_API_KEY=...
```

## Install
```bash
cd backend && npm install            # includes seed deps (mongo/redis/kafka/mongoose/bcrypt)
cd ai-agent && uv pip install -e .   # Python deps
cd frontend && npm install
```

## Run (Docker)
```bash
docker compose up --build
# gateway: http://localhost:5000, frontend: http://localhost:5173, ai-agent: http://localhost:8000
```

## Run (Local)
```bash
# Start services you need
npm run start:gateway --workspace=backend/api-gateway
npm run start:user --workspace=backend/services/user-service
# ... flight/hotel/car/billing/admin similarly
npm run dev:frontend --workspace=frontend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000  # ai-agent
```

## Seeding (uses backend/.env)
```bash
cd backend
npm run seed:minimal      # small dataset
npm run seed:database     # larger dataset
npm run create:admin      # default admin user
npm run seed:mongo        # ensure DBs/indexes
npm run seed:redis        # ping/prime Redis
npm run kafka:topics      # create Kafka topics (Aiven)
```

Kafka topics: `booking.created`, `payment.processed`, `payment.failed`.

## Service Ports
- Frontend 5173, Gateway 5000, Users 5001, Flights 5002, Hotels 5003, Cars 5004, Billing 5005, Admin 5006, AI Agent 8000.

## Frontend Chat
- Floating widget calls `/api/agent/chat` via gateway; WS at `/api/agent/events`. Override with `VITE_AGENT_URL`/`VITE_AGENT_WS` if needed.

## Notes
- Secrets/certs are git-ignored (`kafka/creds`, `.env` files).
- Ensure Atlas/Redis/Kafka allow your IP/network.
