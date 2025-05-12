# Build stage
FROM --platform=linux/amd64 node:18-alpine AS build
WORKDIR /app

# Install dependencies with caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Development stage
FROM --platform=linux/amd64 node:18-alpine AS development
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development
ENV WDS_SOCKET_PORT=0

# Start development server
CMD ["npm", "start"]

# Production stage
FROM --platform=linux/amd64 nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Copy built assets from build stage
COPY --from=build /app/build .

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Add metadata
LABEL maintainer="Kalkulator Nadpłat Team"
LABEL version="1.0"
LABEL description="Frontend for Kalkulator Nadpłat application"

# Expose port 80
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"] 