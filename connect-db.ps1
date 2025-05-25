# Skrypt do łączenia aplikacji z zewnętrzną bazą danych MongoDB
# Użycie: .\connect-db.ps1 [dbHost] [port] [nazwa_bazy] [użytkownik] [hasło]

param (
    [Parameter(Position=0)]
    [string]$DbHost = "localhost",
    
    [Parameter(Position=1)]
    [string]$Port = "27017",
    
    [Parameter(Position=2)]
    [string]$Database = "mortgage-calculator",
    
    [Parameter(Position=3)]
    [string]$Username,
    
    [Parameter(Position=4)]
    [string]$Password
)

# Budowanie connection stringa
$ConnectionString = "mongodb://"

# Dodanie danych uwierzytelniających, jeśli podane
if ($Username -and $Password) {
    $ConnectionString += "$Username`:$Password@"
}

# Dodanie pozostałych danych
$ConnectionString += "$DbHost`:$Port/$Database"

Write-Host "Łączenie z bazą danych: $ConnectionString" -ForegroundColor Green

# Zatrzymaj istniejące kontenery (oprócz bazy danych)
docker-compose stop backend

# Ustaw zmienną środowiskową MONGODB_URI
$env:MONGODB_URI = $ConnectionString

# Uruchom backend z nowym połączeniem
docker-compose up -d backend

Write-Host "`nBackend uruchomiony z połączeniem do wybranej bazy danych!" -ForegroundColor Green
Write-Host "Backend API: http://localhost/api" -ForegroundColor Cyan
Write-Host "Swagger: http://localhost/api/docs" -ForegroundColor Cyan

# Czekaj na input użytkownika przed zakończeniem skryptu
Write-Host "`nNaciśnij Enter, aby zakończyć ten skrypt i przywrócić domyślne ustawienia" -ForegroundColor Yellow
Read-Host

# Wyłącz backend
docker-compose stop backend

# Usuń zmienną środowiskową MONGODB_URI
Remove-Item Env:\MONGODB_URI -ErrorAction SilentlyContinue

# Uruchom backend z domyślnymi ustawieniami
docker-compose up -d backend

Write-Host "`nPrzywrócono domyślne połączenie z bazą danych" -ForegroundColor Green 