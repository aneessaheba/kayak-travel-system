import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


async def search_tavily(query: str) -> Optional[str]:
  api_key = os.getenv("TAVILY_API_KEY")
  if not api_key:
    return None
  try:
    async with httpx.AsyncClient(timeout=10) as client:
      resp = await client.post(
        "https://api.tavily.com/search",
        json={"api_key": api_key, "query": query, "max_results": 3},
      )
      resp.raise_for_status()
      data = resp.json()
      results = data.get("results") or []
      snippets = [f"- {r.get('title')}: {r.get('content')}" for r in results if r.get("content")]
      return "\n".join(snippets)[:1000] if snippets else None
  except Exception as exc:
    logger.error("Tavily search failed: %s", exc)
    return None


async def fetch_weather(location: str) -> Optional[str]:
  api_key = os.getenv("OPENWEATHER_API_KEY")
  if not api_key:
    return None
  try:
    async with httpx.AsyncClient(timeout=10) as client:
      resp = await client.get(
        "https://api.openweathermap.org/data/2.5/weather",
        params={"q": location, "appid": api_key, "units": "metric"},
      )
      resp.raise_for_status()
      data = resp.json()
      main = data.get("main", {})
      weather = data.get("weather", [{}])[0]
      temp = main.get("temp")
      feels = main.get("feels_like")
      desc = weather.get("description")
      return f"Weather in {location}: {desc}, temp {temp}°C, feels {feels}°C"
  except Exception as exc:
    logger.error("OpenWeather fetch failed: %s", exc)
    return None
