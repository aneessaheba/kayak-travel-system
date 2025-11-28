FROM node:18-alpine

WORKDIR /app

# Install production dependencies for all workspaces
COPY package*.json ./
COPY . .
RUN npm ci --omit=dev

ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

# Default to starting the API gateway; override the command to run a specific service
CMD ["npm", "run", "start:gateway"]
