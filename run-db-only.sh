#!/bin/bash

echo "Starting only MongoDB database..."

docker-compose -f docker-compose.simple.yml up --build

echo "Database environment stopped." 