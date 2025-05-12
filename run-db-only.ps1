Write-Host "Starting MongoDB database for local development..." -ForegroundColor Blue

# Check if Docker is running
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Check for existing DB container
$existingContainer = docker ps -a -q --filter "name=mortgage-calculator-db"
if ($existingContainer) {
    Write-Host "Stopping and removing existing DB container..." -ForegroundColor Yellow
    docker stop $existingContainer 2>$null
    docker rm $existingContainer 2>$null
    Write-Host "Existing DB container removed." -ForegroundColor Green
}

# Start database with Docker Compose
Write-Host "Starting MongoDB container..." -ForegroundColor Green

try {
    docker-compose -f docker-compose.simple.yml up --build
} catch {
    Write-Host "Error running docker-compose: $_" -ForegroundColor Red
    exit 1
}

# Script will reach here when docker-compose is stopped
Write-Host "Database stopped." -ForegroundColor Yellow