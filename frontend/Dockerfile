FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies using frontend package manifest
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source
COPY frontend ./

# Inject API endpoints at build time (override with build args if needed)
ARG VITE_AGENT_URL=http://localhost:5000/api/agent
ARG VITE_AGENT_WS=ws://localhost:5000/api/agent/events
ENV VITE_AGENT_URL=${VITE_AGENT_URL}
ENV VITE_AGENT_WS=${VITE_AGENT_WS}

# Build Vite app
RUN npm run build

FROM nginx:1.25-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
