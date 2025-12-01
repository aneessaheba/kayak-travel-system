import asyncio
import logging
import uuid
import re
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

from .config import settings
from .database import get_db
from .ingest import ingestion_loop
from .models import Deal, Bundle
from .tools import search_tavily, fetch_weather

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Agentic AI Recommendation Service", version="0.1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BundleRequest(BaseModel):
  origin: Optional[str] = None
  destination: Optional[str] = None
  budget: Optional[float] = None
  currency: str = "USD"
  dates: Optional[str] = Field(default=None, description="Freeform date string")
  preferences: List[str] = Field(default_factory=list)


class BundleResponse(BaseModel):
  bundles: List[Bundle]
  note: Optional[str] = None


active_ws_clients: List[WebSocket] = []
stop_event: asyncio.Event = asyncio.Event()


@app.on_event("startup")
async def on_startup():
  if settings.ingest_csv_path:
    asyncio.create_task(ingestion_loop(stop_event))
  logger.info("Service started with Mongo %s/%s", settings.mongodb_uri, settings.mongodb_db)


@app.on_event("shutdown")
async def on_shutdown():
  stop_event.set()


@app.get("/health")
async def health_check():
  return {
    "status": "ok",
    "service": "ai-agent",
    "environment": settings.environment,
  }


@app.post("/bundles", response_model=BundleResponse)
async def get_bundles(request: BundleRequest):
  bundles = []
  note = "Using placeholder planner; refine logic in subsequent iterations."
  try:
    db = get_db()
    deals = list(db["deals"].find())
    flights = [Deal(**d) for d in deals if d.get("kind") == "flight"]
    hotels = [Deal(**d) for d in deals if d.get("kind") == "hotel"]
    if flights and hotels:
      flight = flights[0]
      hotel = hotels[0]
      total_price = (flight.price or 0) + (hotel.price or 0)
      bundle = Bundle(
        bundle_uid=str(uuid.uuid4()),
        flight_deal_uid=flight.deal_uid,
        hotel_deal_uid=hotel.deal_uid,
        total_price=total_price,
        currency=request.currency,
        fit_score=1.0,
        rationale="Placeholder bundle composed from first available flight and hotel.",
      )
      bundles.append(bundle)
  except PyMongoError as exc:
    logger.error("Mongo error while building bundles: %s", exc)
    note = "Mongo unavailable; returning empty bundle set."
  return BundleResponse(bundles=bundles, note=note)


@app.websocket("/events")
async def websocket_endpoint(websocket: WebSocket):
  await websocket.accept()
  active_ws_clients.append(websocket)
  try:
    while True:
      await websocket.receive_text()  # simple echo / heartbeat
  except WebSocketDisconnect:
    active_ws_clients.remove(websocket)


@app.get("/")
async def root():
  return {"message": "Agentic AI Recommendation Service"}


class ChatRequest(BaseModel):
  message: str


class ChatResponse(BaseModel):
  reply: str


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(body: ChatRequest):
  weather_snippet = None
  tavily_snippet = None

  # Lightweight heuristics to call tools
  lower_msg = body.message.lower()

  def extract_location_for_weather(text: str) -> str:
    match = re.search(r"(?:weather|forecast|temperature|temp)\s*(?:in|for)?\s*([a-zA-Z\s,]+)", text, re.IGNORECASE)
    if match and match.group(1).strip():
      candidate = match.group(1)
    # fallback: try after "in"
    elif (m2 := re.search(r"\bin\s+([a-zA-Z\s,]+)", text, re.IGNORECASE)) and m2.group(1).strip():
      candidate = m2.group(1)
    else:
      candidate = text

    # Strip punctuation/numerics and drop trailing time qualifiers like "tomorrow"
    cleaned = re.sub(r"[^a-zA-Z\s,]", " ", candidate)
    for stop in ["tomorrow", "today", "tonight", "now", "this week", "next week", "forecast"]:
      parts = cleaned.lower().split(stop)
      if len(parts) > 1:
        cleaned = parts[0]
        break
    return cleaned.strip() or candidate.strip()

  if any(word in lower_msg for word in ["weather", "temperature", "temp", "forecast", "rain", "snow", "sunny"]):
    location = extract_location_for_weather(body.message)
    weather_snippet = await fetch_weather(location)
  if any(word in lower_msg for word in ["hotel", "flight", "deal", "trip", "package", "stay", "book", "booking"]):
    tavily_snippet = await search_tavily(body.message)

  # If no API key, fall back to echo with tool snippets
  if not settings.gemini_api_key:
    combined = []
    if weather_snippet:
      combined.append(weather_snippet)
    if tavily_snippet:
      combined.append(tavily_snippet)
    combined.append(f"Thanks! I received: {body.message}")
    return ChatResponse(reply="\n".join(combined))

  llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.gemini_api_key,
    temperature=0.4,
  )
  prompt = (
    "You are a concise travel concierge. "
    "Use any provided context (search results or weather) if present. "
    "Respond with one or two sentences that acknowledge the request, cite facts, and keep it actionable."
  )
  context_parts = []
  if tavily_snippet:
    context_parts.append(f"Search results:\n{tavily_snippet}")
  if weather_snippet:
    context_parts.append(f"Weather info:\n{weather_snippet}")
  context = "\n".join(context_parts)
  try:
    messages = [HumanMessage(content=prompt)]
    if context:
      messages.append(HumanMessage(content=context))
    messages.append(HumanMessage(content=body.message))
    msg = llm.invoke(messages)
    reply = msg.content if hasattr(msg, "content") else str(msg)
  except Exception as exc:
    logger.error("Gemini call failed: %s", exc)
    fallback_bits = []
    if tavily_snippet:
      fallback_bits.append(tavily_snippet)
    if weather_snippet:
      fallback_bits.append(weather_snippet)
    fallback_bits.append(f"Thanks! I received: {body.message}")
    fallback_bits.append("AI model is temporarily unavailable; returned cached/search context only.")
    reply = "\n".join(fallback_bits)
  return ChatResponse(reply=reply)


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(app, host="0.0.0.0", port=8000)
