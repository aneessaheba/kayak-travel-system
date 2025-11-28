import asyncio
import logging
import uuid
from pathlib import Path
from typing import Iterable, List

import pandas as pd
from pymongo import UpdateOne

from .config import settings
from .database import get_db
from .models import Deal

logger = logging.getLogger(__name__)


def _load_rows(path: Path) -> Iterable[dict]:
  if not path.exists():
    logger.warning("Ingest skipped: CSV not found at %s", path)
    return []
  try:
    df = pd.read_csv(path)
    return df.to_dict(orient="records")
  except Exception as exc:
    logger.error("Failed to read CSV %s: %s", path, exc)
    return []


def _normalize_row(row: dict) -> Deal:
  deal_uid = str(row.get("deal_uid") or row.get("id") or uuid.uuid4())
  kind = (row.get("kind") or row.get("type") or "hotel").lower()
  title = row.get("title") or row.get("name")
  price = float(row.get("price", 0))
  currency = row.get("currency") or "USD"
  availability = row.get("availability") or row.get("inventory") or None
  tags = row.get("tags") or []
  if isinstance(tags, str):
    tags = [t.strip() for t in tags.split(",") if t.strip()]
  return Deal(
    deal_uid=deal_uid,
    kind=kind,
    source=row.get("source") or "csv",
    title=title,
    origin=row.get("origin") or row.get("from"),
    destination=row.get("destination") or row.get("to"),
    hotel_location=row.get("hotel_location") or row.get("neighbourhood") or row.get("city"),
    price=price,
    currency=currency,
    availability=int(availability) if availability is not None else None,
    score=int(row.get("score")) if row.get("score") is not None else None,
    tags=tags,
    metadata=row,
  )


def _upsert_deals(records: List[Deal]):
  db = get_db()
  ops = []
  for record in records:
    ops.append(
      UpdateOne(
        {"deal_uid": record.deal_uid},
        {"$set": record.model_dump()},
        upsert=True,
      )
    )
  if ops:
    db["deals"].bulk_write(ops, ordered=False)


async def ingest_once():
  path = Path(settings.ingest_csv_path) if settings.ingest_csv_path else None
  if not path:
    logger.info("Ingestion path not configured; skipping.")
    return
  rows = _load_rows(path)
  deals = [_normalize_row(row) for row in rows]
  if not deals:
    return
  await asyncio.get_running_loop().run_in_executor(None, _upsert_deals, deals)
  logger.info("Ingested %d deals from %s", len(deals), path)


async def ingestion_loop(stop_event: asyncio.Event):
  while not stop_event.is_set():
    await ingest_once()
    try:
      await asyncio.wait_for(stop_event.wait(), timeout=settings.ingest_interval_seconds)
    except asyncio.TimeoutError:
      continue
