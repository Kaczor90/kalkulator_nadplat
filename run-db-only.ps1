Write-Host "Starting only MongoDB database..." -ForegroundColor Green

docker-compose -f docker-compose.simple.yml up --build

Write-Host "Database environment stopped." -ForegroundColor Yellow