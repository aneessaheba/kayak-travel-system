from datetime import datetime
from typing import List, Optional, Dict

from pydantic import BaseModel, Field


class Deal(BaseModel):
  deal_uid: str
  kind: str
  source: Optional[str] = None
  title: Optional[str] = None
  origin: Optional[str] = None
  destination: Optional[str] = None
  hotel_location: Optional[str] = None
  price: float
  currency: str = "USD"
  availability: Optional[int] = None
  score: Optional[int] = None
  tags: List[str] = Field(default_factory=list)
  metadata: Dict = Field(default_factory=dict)
  created_at: datetime = Field(default_factory=datetime.utcnow)


class Bundle(BaseModel):
  bundle_uid: str
  flight_deal_uid: Optional[str] = None
  hotel_deal_uid: Optional[str] = None
  total_price: Optional[float] = None
  currency: str = "USD"
  fit_score: Optional[float] = None
  rationale: Optional[str] = None
  watch_flags: List[str] = Field(default_factory=list)
  created_at: datetime = Field(default_factory=datetime.utcnow)


class Watch(BaseModel):
  watch_uid: str
  target_uid: str
  threshold_price: Optional[float] = None
  min_inventory: Optional[int] = None
  user_ref: Optional[str] = None
  status: str = "active"
  created_at: datetime = Field(default_factory=datetime.utcnow)
