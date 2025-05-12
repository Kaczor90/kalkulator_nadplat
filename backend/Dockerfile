# Build stage
FROM --platform=linux/amd64 node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
COPY tsconfig*.json ./
COPY src/ src/

# Create needed directories
RUN mkdir -p dist/config

# Build the application
RUN npm run build

# Add explicit copy of config directory to ensure it's included in the build
RUN cp -r src/config dist/ || echo "Config copy failed"

# Development stage - modyfikacja
FROM --platform=linux/amd64 node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Kopiuję cały kod źródłowy
COPY . .
# Ensure the build runs
RUN npm run build

# Uruchamiam aplikację
CMD ["node", "dist/main"]

# Production stage
FROM --platform=linux/amd64 node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps
COPY --from=build /app/dist ./dist
EXPOSE 3010
CMD ["node", "dist/main"] 