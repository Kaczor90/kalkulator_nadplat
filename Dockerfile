# Multistage build file for render.com
FROM --platform=linux/amd64 node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ENV REACT_APP_API_URL=/api
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Build backend
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# Final stage
FROM --platform=linux/amd64 node:18-alpine AS production
WORKDIR /app

# Copy frontend build
COPY --from=frontend-builder /app/frontend/build ./public

# Copy backend build and packages
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm install --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Expose the port
EXPOSE 10000

# Start the application
CMD ["node", "dist/main.js"] 