#!/bin/bash

echo -e "\e[35mStarting Mortgage Calculator in PRODUCTION mode...\e[0m"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "\e[31mError: Docker is not running. Please start Docker and try again.\e[0m"
    exit 1
fi

# Create .env files from templates if they don't exist
if [ ! -f "frontend/.env" ]; then
    echo -e "\e[33mCreating frontend/.env file from template...\e[0m"
    cp frontend/env.template frontend/.env
    echo -e "\e[32mCreated frontend/.env file.\e[0m"
fi

if [ ! -f "backend/.env" ]; then
    echo -e "\e[33mCreating backend/.env file from template...\e[0m"
    if [ -f "backend/env.template" ]; then
        cp backend/env.template backend/.env
        echo -e "\e[32mCreated backend/.env file.\e[0m"
    else
        echo -e "\e[33mWarning: No backend/env.template file found. Environment variables will be loaded from docker-compose.yml.\e[0m"
    fi
fi

# Check for existing containers
EXISTING_CONTAINERS=$(docker ps -a -q --filter "name=mortgage-calculator-*")
if [ ! -z "$EXISTING_CONTAINERS" ]; then
    echo -e "\e[33mStopping and removing existing containers...\e[0m"
    docker stop $EXISTING_CONTAINERS 2>/dev/null
    docker rm $EXISTING_CONTAINERS 2>/dev/null
    echo -e "\e[32mExisting containers removed.\e[0m"
fi

# Start application with Docker Compose in production mode
echo -e "\e[32mBuilding and starting containers in PRODUCTION mode...\e[0m"
echo -e "\e[33mThis may take a few minutes for the first build...\e[0m"

docker-compose -f docker-compose.prod.yml up --build

# Script will reach here when docker-compose is stopped
echo -e "\e[33mApplication stopped.\e[0m" 