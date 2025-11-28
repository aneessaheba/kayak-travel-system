FROM node:18-alpine

WORKDIR /app

# Install only the gateway dependencies (no monorepo root present in the image)
COPY backend/api-gateway/package*.json ./
RUN npm install --omit=dev

# Copy gateway source
COPY backend/api-gateway ./

ENV NODE_ENV=production \
    PORT=5000

EXPOSE 5000

CMD ["npm", "start"]
