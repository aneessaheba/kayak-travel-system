from functools import lru_cache
from pymongo import MongoClient

from .config import settings


@lru_cache(maxsize=1)
def get_client() -> MongoClient:
  return MongoClient(settings.mongodb_uri)


def get_db():
  client = get_client()
  return client[settings.mongodb_db]
