Write-Host "Starting Mortgage Calculator in PRODUCTION mode..." -ForegroundColor Magenta

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

# Prompt for MongoDB username and password for production environment
Write-Host "Setting up production MongoDB connection..." -ForegroundColor Yellow
$mongoDbUri = Read-Host "Enter your MongoDB Atlas connection string (or press Enter to use default)"
if ([string]::IsNullOrWhiteSpace($mongoDbUri)) {
    $mongoDbPassword = Read-Host "Enter your MongoDB Atlas password" -AsSecureString
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mongoDbPassword)
    $plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    
    # Default MongoDB Atlas URI with password inserted
    $mongoDbUri = "mongodb+srv://radekdsa:$plainPassword@cluster0.h9egut1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
}

# Ensure the backend/.env file has the correct production MongoDB URI
$envContent = Get-Content -Path "backend/.env" -ErrorAction SilentlyContinue
if ($envContent) {
    $updatedContent = $envContent -replace "MONGODB_URI=.*", "MONGODB_URI=$mongoDbUri"
    if ($updatedContent -notcontains "MONGODB_URI=") {
        $updatedContent += "MONGODB_URI=$mongoDbUri"
    }
    Set-Content -Path "backend/.env" -Value $updatedContent
    Write-Host "Updated backend/.env with production MongoDB URI." -ForegroundColor Green
}

# Create a temporary environment file for Docker Compose
$envFile = "docker-compose.prod.env"
"MONGODB_URI=$mongoDbUri" | Out-File -FilePath $envFile -Encoding utf8

# Check for existing containers
$existingContainers = docker ps -a -q --filter "name=mortgage-calculator-*"
if ($existingContainers) {
    Write-Host "Stopping and removing existing containers..." -ForegroundColor Yellow
    docker stop $existingContainers 2>$null
    docker rm $existingContainers 2>$null
    Write-Host "Existing containers removed." -ForegroundColor Green
}

# Start application with Docker Compose in production mode
Write-Host "Building and starting containers in PRODUCTION mode..." -ForegroundColor Green
Write-Host "Using production MongoDB with external connection" -ForegroundColor Magenta
Write-Host "This may take a few minutes for the first build..." -ForegroundColor Yellow

try {
    docker-compose -f docker-compose.prod.yml --env-file $envFile up --build
} catch {
    Write-Host "Error running docker-compose: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up the temporary env file
    if (Test-Path $envFile) {
        Remove-Item $envFile
    }
}

# Script will reach here when docker-compose is stopped
Write-Host "Application stopped." -ForegroundColor Yellow 