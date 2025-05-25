#!/usr/bin/env pwsh

# Skrypt do testowania połączenia z MongoDB Atlas
Write-Host "Testowanie połączenia z MongoDB Atlas..." -ForegroundColor Green

# Ustawienie zmiennej środowiskowej
$env:MONGODB_URI = "mongodb+srv://radekdsa:Kaczor1990%21%40%23@cluster0.h9egut1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

Write-Host "Connection string ustawiony" -ForegroundColor Yellow

# Sprawdzenie czy Node.js jest dostępny
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Node.js nie jest dostępny!" -ForegroundColor Red
    exit 1
}

# Sprawdzenie czy mongoose jest zainstalowany
if (Test-Path "node_modules/mongoose") {
    Write-Host "Mongoose jest zainstalowany" -ForegroundColor Green
} else {
    Write-Host "Instalowanie zależności..." -ForegroundColor Yellow
    npm install
}

# Uruchomienie testu połączenia
Write-Host "Uruchamianie testu połączenia..." -ForegroundColor Yellow
node src/scripts/test-mongodb-connection.js 