# Agentic AI Recommendation Service — Delivery Plan

High-level changes needed
- FastAPI app scaffold with HTTP + WebSocket endpoints (`/health`, `/bundles`, `/watches`, `/events`).
- Settings and secrets via `.env` (Mongo/Redis/Kafka/LLM keys) with sane defaults.
- Data layer: SQLModel + SQLite schema for deals, bundles, watches, sessions/events.
- Deals Agent: ingestion (CSV/mock), normalization, scoring/tagging rules, persistence, and event emission (in-proc + optional Kafka).
- Concierge Agent: intent parsing (rule-based), bundle planner from cached deals, fit scoring, explanation templates, policy Q&A from metadata.
- Watcher: scheduled checks for price/inventory deltas, emits events to WebSocket clients (and Kafka if configured).
- Kafka optionality: aiokafka producers/consumers wired behind feature flag; local in-memory queue fallback.
- Tests/smoke scripts for endpoints and background tasks.
- Ops: Dockerfile/compose integration, uv venv instructions, sample data slices.

Feature status
- FastAPI app scaffold (HTTP + WS): Not started
- Settings loader (.env), config wiring: Not started
- SQLModel schema (deals, bundles, watches, sessions): Not started
- Ingestion pipeline (CSV/mock → normalize → store): Not started
- Deal detector & tagger (score + tags + events): Not started
- Concierge planner (bundles + fit score + explanations): Not started
- Policy Q&A (refund/pets/amenities from metadata): Not started
- Watches & notifier (scheduler + WS events): Not started
- Kafka integration (aiokafka produce/consume, feature-flagged): Not started
- In-memory queue fallback when Kafka off: Not started
- Tests/smoke checks (HTTP/WS, pipelines): Not started
- Sample data slices + load scripts: Not started
- Docker/compose wiring for ai-agent service: Not started
- Auth/session handling (if needed): Not started

Next steps (to pick one by one)
1) Scaffold FastAPI app with `/health` and `/events` WS echo; add settings loader from `.env`.
2) Add SQLModel models/tables and bootstrap DB init.
3) Implement in-process ingestion + detector loop (CSV mock) storing deals.
4) Build concierge planner + bundle/explanation responses for `/bundles`.
5) Add watches + scheduler + WS broadcasting; gate Kafka support behind env flag.
