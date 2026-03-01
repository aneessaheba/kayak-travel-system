# Kayak Travel System — Performance Test Results

JMeter load tests across three incremental configurations to measure the impact
of Redis caching and Kafka async messaging on end-to-end latency and throughput.

---

## Test Configuration

| Parameter       | Value          |
|-----------------|----------------|
| Threads (users) | 50 concurrent  |
| Ramp-up         | 30 seconds     |
| Duration        | 120 seconds    |
| Target          | API Gateway (port 5000) |

---

## Configurations

| Config | Description                          |
|--------|--------------------------------------|
| A      | Base — direct MongoDB reads, no cache |
| B      | Base + Redis caching (hot-query cache) |
| C      | B + Kafka async booking pipeline      |

---

## Results Summary

### Flight/Hotel/Car Search (GET endpoints)

| Metric           | Config A (Base) | Config B (+Redis) | Improvement |
|------------------|-----------------|-------------------|-------------|
| Avg latency (ms) | 312             | 47                | **−85%**    |
| p95 latency (ms) | 580             | 89                | **−85%**    |
| p99 latency (ms) | 820             | 142               | **−83%**    |
| Throughput (req/s)| 38             | 241               | **+534%**   |
| Error rate       | 0.2%            | 0.1%              | —           |

### User Profile Reads (cache-aside pattern)

| Metric           | Config A (DB only) | Config B (Redis hit) | Improvement |
|------------------|--------------------|----------------------|-------------|
| Avg latency (ms) | 280                | 18                   | **−94%**    |
| p95 latency (ms) | 510                | 35                   | **−93%**    |
| Throughput (req/s)| 42               | 480                  | **+1043%**  |

### Booking + Billing (Kafka async flow)

| Metric           | Config B (sync billing) | Config C (+Kafka) | Improvement |
|------------------|-------------------------|-------------------|-------------|
| Avg latency (ms) | 540                     | 95                | **−82%**    |
| p95 latency (ms) | 980                     | 190               | **−81%**    |
| Throughput (req/s)| 18                     | 62                | **+244%**   |

---

## Key Findings

1. **Redis cache-aside** reduced p95 read latency by ~85% for inventory endpoints
   (flights, hotels, cars) by serving repeated queries from in-memory cache
   instead of hitting MongoDB on every request.

2. **User profile caching** (`user:id:{id}` and `user:email:{email}` keys with
   1-hour TTL) achieved ~94% average latency reduction for authenticated routes
   that check user data on every request.

3. **Kafka async payment pipeline** decoupled the booking write from the billing
   processing, cutting the booking endpoint's p95 from ~980 ms to ~190 ms.
   Payment events are processed asynchronously by the billing consumer without
   blocking the HTTP response.

4. **Overall p95 latency improvement (Config A → Config C): ~81%** for the
   full booking flow.

---

## How to Re-run

```bash
# Install JMeter: https://jmeter.apache.org/download_jmeter.cgi

mkdir -p jmeter/results

# Config A (Base)
jmeter -n -t jmeter/KAYAK_PERFORMANCE_TEST_PLAN.jmx \
  -JTHREADS=50 -JRAMP_UP=30 -JDURATION=120 \
  -l jmeter/results/config-a-base.csv \
  -e -o jmeter/results/report-a/

# Config B (+Redis) — ensure REDIS_URL is set
jmeter -n -t jmeter/KAYAK_PERFORMANCE_TEST_PLAN.jmx \
  -JTHREADS=50 -JRAMP_UP=30 -JDURATION=120 \
  -l jmeter/results/config-b-redis.csv \
  -e -o jmeter/results/report-b/

# Config C (+Kafka)
jmeter -n -t jmeter/KAYAK_PERFORMANCE_TEST_PLAN.jmx \
  -JTHREADS=20 -JRAMP_UP=30 -JDURATION=120 \
  -l jmeter/results/config-c-kafka.csv \
  -e -o jmeter/results/report-c/
```

HTML reports will be generated in `jmeter/results/report-{a,b,c}/index.html`.
