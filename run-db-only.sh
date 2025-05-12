#!/bin/bash

echo -e "\e[34mStarting MongoDB database for local development...\e[0m"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "\e[31mError: Docker is not running. Please start Docker and try again.\e[0m"
    exit 1
fi

# Check for existing DB container
EXISTING_CONTAINER=$(docker ps -a -q --filter "name=mortgage-calculator-db")
if [ ! -z "$EXISTING_CONTAINER" ]; then
    echo -e "\e[33mStopping and removing existing DB container...\e[0m"
    docker stop $EXISTING_CONTAINER 2>/dev/null
    docker rm $EXISTING_CONTAINER 2>/dev/null
    echo -e "\e[32mExisting DB container removed.\e[0m"
fi

# Start database with Docker Compose
echo -e "\e[32mStarting MongoDB container...\e[0m"

docker-compose -f docker-compose.simple.yml up --build

# Script will reach here when docker-compose is stopped
echo -e "\e[33mDatabase stopped.\e[0m" 