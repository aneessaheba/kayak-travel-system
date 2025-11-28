import os
from functools import lru_cache
from pydantic import BaseModel, Field


class Settings(BaseModel):
  app_name: str = "Agentic AI Recommendation Service"
  environment: str = Field(default="development", alias="ENVIRONMENT")
  mongodb_uri: str = Field(default="mongodb://localhost:27017", alias="MONGODB_URI")
  mongodb_db: str = Field(default="agent_db", alias="MONGODB_DB")
  redis_url: str | None = Field(default=None, alias="REDIS_URL")
  ingest_csv_path: str | None = Field(default="data/mock/deals.csv", alias="INGEST_CSV_PATH")
  ingest_interval_seconds: int = Field(default=900, alias="INGEST_INTERVAL_SECONDS")
  gemini_api_key: str | None = Field(default=None, alias="GEMINI_API_KEY")

  class Config:
    populate_by_name = True


@lru_cache(maxsize=1)
def get_settings() -> Settings:
  data = {
    "ENVIRONMENT": os.getenv("ENVIRONMENT", "development"),
    "MONGODB_URI": os.getenv("MONGODB_URI", "mongodb://localhost:27017"),
    "MONGODB_DB": os.getenv("MONGODB_DB", "agent_db"),
    "REDIS_URL": os.getenv("REDIS_URL"),
    "INGEST_CSV_PATH": os.getenv("INGEST_CSV_PATH", "data/mock/deals.csv"),
    "INGEST_INTERVAL_SECONDS": int(os.getenv("INGEST_INTERVAL_SECONDS", "900")),
    "GEMINI_API_KEY": os.getenv("GEMINI_API_KEY"),
  }
  return Settings.model_validate(data)


settings = get_settings()
