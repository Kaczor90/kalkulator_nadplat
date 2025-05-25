Write-Host "Starting Mortgage Calculator in DEVELOPMENT mode..." -ForegroundColor Cyan

# Check if Docker is running
docker info > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

# Create .env files from templates if they don't exist
if (-not (Test-Path "frontend/.env")) {
    Write-Host "Creating frontend/.env file from template..." -ForegroundColor Yellow
    Copy-Item "frontend/env.template" "frontend/.env"
    Write-Host "Created frontend/.env file." -ForegroundColor Green
}

if (-not (Test-Path "backend/.env")) {
    Write-Host "Creating backend/.env file from template..." -ForegroundColor Yellow
    if (Test-Path "backend/env.template") {
        Copy-Item "backend/env.template" "backend/.env"
        Write-Host "Created backend/.env file." -ForegroundColor Green
    } else {
        Write-Host "Warning: No backend/env.template file found. Environment variables will be loaded from docker-compose.yml." -ForegroundColor Yellow
    }
}

# Ensure the backend/.env file has the correct development MongoDB URI
$envContent = Get-Content -Path "backend/.env" -ErrorAction SilentlyContinue
if ($envContent) {
    $updatedContent = $envContent -replace "MONGODB_URI=.*", "MONGODB_URI=mongodb://db:27017/mortgage-calculator"
    if ($updatedContent -notcontains "MONGODB_URI=") {
        $updatedContent += "MONGODB_URI=mongodb://db:27017/mortgage-calculator"
    }
    Set-Content -Path "backend/.env" -Value $updatedContent
    Write-Host "Updated backend/.env with local MongoDB URI." -ForegroundColor Green
}

# Check for existing containers
$existingContainers = docker ps -a -q --filter "name=mortgage-calculator-*"
if ($existingContainers) {
    Write-Host "Stopping and removing existing containers..." -ForegroundColor Yellow
    docker stop $existingContainers 2>$null
    docker rm $existingContainers 2>$null
    Write-Host "Existing containers removed." -ForegroundColor Green
}

# Start application with Docker Compose
Write-Host "Building and starting containers in DEVELOPMENT mode..." -ForegroundColor Green
Write-Host "Using local MongoDB at mongodb://db:27017/mortgage-calculator" -ForegroundColor Cyan
Write-Host "This may take a few minutes for the first build..." -ForegroundColor Yellow

try {
    docker-compose up --build
} catch {
    Write-Host "Error running docker-compose: $_" -ForegroundColor Red
    exit 1
}

# Script will reach here when docker-compose is stopped
Write-Host "Application stopped." -ForegroundColor Yellow 