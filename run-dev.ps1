Write-Host "Starting Kalkulator Nadplat in development mode..." -ForegroundColor Green

docker-compose -f docker-compose.yml up --build

Write-Host "Development environment stopped." -ForegroundColor Yellow 