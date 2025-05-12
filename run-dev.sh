#!/bin/bash

echo "Starting Kalkulator Nadplat in development mode..."

docker-compose -f docker-compose.yml up --build

echo "Development environment stopped." 