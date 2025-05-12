#!/bin/bash

echo "Starting Kalkulator Nadplat in production mode..."

docker-compose -f docker-compose.prod.yml up --build -d

echo "Production environment started in detached mode."
echo "To stop it, run: docker-compose -f docker-compose.prod.yml down" 