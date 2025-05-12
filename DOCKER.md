# Docker Setup for Kalkulator Nadpłat

This document explains the Docker setup for the Kalkulator Nadpłat application and provides instructions on how to run the application in development and production environments.

## Architecture

The application consists of four main services:

1. **Frontend** - React application with Material UI v7.
2. **Backend** - API server that processes mortgage calculations.
3. **Database** - MongoDB instance for storing calculation results.
4. **Proxy** - NGINX server that routes requests to the frontend and backend.

## Development Environment

### Prerequisites

- Docker and Docker Compose installed
- Git

### Running the Application in Development Mode

To start the application in development mode, run the following command:

```bash
# On Linux/Mac
./dev.sh

# On Windows
dev.bat
```

This will build and start all the necessary containers with the following features:

- Hot reloading for frontend and backend
- Source code mounted as volumes for easy development
- Proxy server routing requests to the appropriate services

The application will be available at:

- Frontend: http://localhost:3000
- API: http://localhost/api
- API Documentation: http://localhost/api/docs

### Development Container Configuration

- **Frontend**: Runs on port 3000 with React development server
- **Backend**: Runs on port 3010 with Node.js
- **Database**: MongoDB running on port 27017
- **Proxy**: NGINX running on port 80, routing requests to frontend and backend

## Production Environment

### Building and Deploying for Production

To deploy the application in production mode, run:

```bash
# On Windows
deploy.bat

# On Linux/Mac
./deploy.sh
```

This will:

1. Build optimized production images
2. Start the services in production mode
3. Serve the application on port 80

### Production Container Configuration

- **Frontend**: Served by NGINX with optimized static assets
- **Backend**: Optimized Node.js server with production settings
- **Database**: MongoDB with persistent volume
- **Proxy**: NGINX with production configuration, including caching and compression

## Configuration

### Environment Variables

#### Frontend

- `REACT_APP_API_URL` - URL of the API (default: `/api` in production, `http://localhost/api` in development)
- `REACT_APP_THEME_PRIMARY_COLOR` - Primary theme color (default: `#2563EB`)
- `REACT_APP_THEME_SECONDARY_COLOR` - Secondary theme color (default: `#10B981`)

#### Backend

- `NODE_ENV` - Environment (development or production)
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Port to run the server on (default: 3010)
- `MAX_PDF_SIZE` - Maximum size of PDF files in bytes (default: 10MB)

## Useful Commands

### Viewing Logs

```bash
# Development
docker-compose logs -f

# Production
docker-compose -f docker-compose.prod.yml logs -f
```

### Stopping the Application

```bash
# Development
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml down
```

### Rebuilding Containers

```bash
# Development
docker-compose up -d --build

# Production
docker-compose -f docker-compose.prod.yml up -d --build
```

## Performance Optimizations

The Docker setup includes the following optimizations:

### Frontend

- GZIP compression for static assets
- Proper caching headers for improved load times
- Optimized Docker build process with multi-stage builds

### Backend

- Increased timeout settings for PDF generation
- Optimized MongoDB connection pooling
- Health checks for all services

### Proxy

- GZIP compression
- WebSocket support for development
- Increased timeout and body size limits for large requests 