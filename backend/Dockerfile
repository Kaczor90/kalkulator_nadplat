# Build stage
FROM --platform=linux/amd64 node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Development stage - modyfikacja
FROM --platform=linux/amd64 node:18-alpine AS development
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
FROM --platform=linux/amd64 node:18-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps
COPY --from=build /app/dist ./dist
EXPOSE 3010
CMD ["node", "dist/main"] 