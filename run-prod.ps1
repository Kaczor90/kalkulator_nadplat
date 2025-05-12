Write-Host "Starting Kalkulator Nadplat in production mode..." -ForegroundColor Green

docker-compose -f docker-compose.prod.yml up --build -d

Write-Host "Production environment started in detached mode." -ForegroundColor Yellow
Write-Host "To stop it, run: docker-compose -f docker-compose.prod.yml down" -ForegroundColor Yellow 