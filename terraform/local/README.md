# Local infra/local — services & quick setup

Services available:

- `kafka` — Kafka broker (port 9092)
- `kafka-connect` — Kafka Connect worker (port 8083)
- `kafdrop` — Kafka UI (port 9000) - http://localhost:9000
- `mysql` — MySQL 8.0 (port 3306)
- `mongo` — MongoDB 7.0 (port 27017)
- `redis` — Redis 7.2 (port 6379)

## Quick setup

```bash
cd infra/local
docker compose up -d    # start all services
docker compose logs -f  # view logs
docker compose down     # stop and remove
```

## Credentials

**MySQL:**
- Root: `root` / `password`
- User: `kayak` / `password`
- Database: `kayak`

**MongoDB:**
- User: `root` / `password`

**Redis:** No authentication

## Connection strings

```bash
# MySQL
mysql -h localhost -P 3306 -u kayak -pkayakpass kayak

# MongoDB
mongosh mongodb://root:password@localhost:27017

# Redis
redis-cli -h localhost -p 6379

# Kafka
# Bootstrap server: localhost:9092
```

## Volumes

Persistent data stored in Docker volumes:
- `kafka_data` - Kafka logs
- `mysql_data` - MySQL data
- `mongo_data` - MongoDB data

To reset all data: `docker compose down -v`
