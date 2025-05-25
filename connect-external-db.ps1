# Skrypt do uruchomienia aplikacji z połączeniem do zewnętrznej bazy danych MongoDB
# Użycie: .\connect-external-db.ps1 "mongodb://użytkownik:hasło@host:port/baza-danych"

param (
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString
)

Write-Host "Łączenie z zewnętrzną bazą danych: $ConnectionString" -ForegroundColor Green

# Zatrzymaj istniejące kontenery (oprócz bazy danych)
docker-compose stop proxy frontend backend

# Zapisz oryginalny MONGODB_URI
$env:ORIG_MONGODB_URI = $env:MONGODB_URI

# Ustaw nowy MONGODB_URI
$env:MONGODB_URI = $ConnectionString

# Uruchom aplikację z podanym connection string
docker-compose -f docker-compose.yml up -d --no-deps proxy frontend backend

Write-Host "`nAplikacja uruchomiona z połączeniem do zewnętrznej bazy danych!" -ForegroundColor Green
Write-Host "Frontend: http://localhost" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost/api" -ForegroundColor Cyan
Write-Host "Swagger: http://localhost/api/docs" -ForegroundColor Cyan

# Przywróć oryginalny MONGODB_URI (jeśli istniał)
if ($env:ORIG_MONGODB_URI) {
    $env:MONGODB_URI = $env:ORIG_MONGODB_URI
    Remove-Item Env:\ORIG_MONGODB_URI
}
else {
    Remove-Item Env:\MONGODB_URI
} 