# MongoDB Environment Setup Guide

This project is configured to work with two different MongoDB environments:

1. **Development Environment** - Uses a local MongoDB instance running in Docker
2. **Production Environment** - Uses a remote MongoDB Atlas instance

## Development Environment Setup

The development environment uses a local MongoDB instance that is automatically started as part of the Docker Compose setup.

### How to Start Development Environment

Simply run the development script:

```powershell
.\run-dev.ps1
```

This script will:
- Create the necessary environment files if they don't exist
- Set the MongoDB connection string to use the local Docker MongoDB instance
- Start all services with docker-compose

The connection string used is: `mongodb://db:27017/mortgage-calculator`

## Production Environment Setup

The production environment is configured to connect to a MongoDB Atlas instance or any other remote MongoDB server.

### How to Start Production Environment

Run the production script:

```powershell
.\run-prod.ps1
```

This script will:
- Create the necessary environment files if they don't exist
- Prompt you for a MongoDB Atlas connection string (or use the default if none provided)
- If using the default, it will prompt for your MongoDB Atlas password
- Configure the production environment to use the external MongoDB instance
- Start all services with docker-compose using the production configuration

### MongoDB Atlas Setup

If you don't already have a MongoDB Atlas account and cluster:

1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Set up database access and create a user with appropriate permissions
4. Get your connection string from the Atlas dashboard
5. When running `run-prod.ps1`, enter this connection string when prompted

## Troubleshooting

### Unable to connect to the database

If you see an error like:
```
mortgage-calculator-backend | [Nest] 1 - ERROR [MongooseModule] Unable to connect to the database. Retrying...
```

For development environment:
- Make sure Docker is running properly
- Check if the MongoDB container is running: `docker ps | grep mortgage-calculator-db`
- Try restarting the services: `.\run-dev.ps1`

For production environment:
- Verify your MongoDB Atlas connection string is correct
- Check that the IP address of your machine is whitelisted in MongoDB Atlas
- Ensure your MongoDB Atlas user has the correct permissions
- Try running with a different connection string

## Environment Variables

The following environment variables are used for MongoDB configuration:

- `MONGODB_URI`: The MongoDB connection string
- `MONGODB_PASSWORD`: The password for MongoDB Atlas (if using the default connection string)
- `NODE_ENV`: Set to 'development' or 'production' to determine which configuration to use 