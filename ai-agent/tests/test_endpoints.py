import os

import pytest
from fastapi.testclient import TestClient

# Ensure ingestion loop is skipped in tests
os.environ.setdefault("INGEST_CSV_PATH", "")

from app.main import app  # noqa: E402


@pytest.fixture
def client():
  with TestClient(app) as c:
    yield c


def test_health(client):
  resp = client.get("/health")
  assert resp.status_code == 200
  data = resp.json()
  assert data["status"] == "ok"
  assert data["service"] == "ai-agent"


def test_chat_echo(client):
  payload = {"message": "Hello agent"}
  resp = client.post("/chat", json=payload)
  assert resp.status_code == 200
  data = resp.json()
  assert "reply" in data
  assert "Hello agent" in data["reply"]
