# Backend Commands

```bash
# Install dependencies
npm install

# Start individual services
npm run start:user
npm run start:flight
npm run start:hotel
npm run start:car
npm run start:billing
npm run start:admin
npm run dev:frontend

# Database operations (ensure backend/.env is set)
npm run seed:minimal      # Seed minimal data
npm run seed:database     # Seed full database
npm run create:admin      # Create admin user
npm run seed:mongo        # Ensure Mongo DBs/collections/indexes (uses env)
npm run seed:redis        # Ping/prime Redis (uses env)
npm run kafka:topics      # Create Kafka topics (uses env)

# Development mode (with auto-reload)
npm run dev:user
npm run dev:flight
# etc.
```
