# Łączenie aplikacji z zewnętrzną bazą danych MongoDB

Ten dokument zawiera instrukcje, jak połączyć aplikację Kalkulator Nadpłat z zewnętrzną bazą danych MongoDB.

## Opcja 1: Użycie skryptu connect-db.ps1 (Windows)

Przygotowany skrypt `connect-db.ps1` ułatwia połączenie aplikacji z zewnętrzną bazą danych MongoDB.

### Składnia

```powershell
.\connect-db.ps1 [dbHost] [port] [nazwa_bazy] [użytkownik] [hasło]
```

### Przykłady użycia

- Połączenie z lokalną bazą MongoDB na domyślnym porcie:
  ```powershell
  .\connect-db.ps1 localhost 27017 mortgage-calculator
  ```

- Połączenie z bazą danych MongoDB Atlas:
  ```powershell
  .\connect-db.ps1 cluster0.abcde.mongodb.net 27017 mortgage-calculator userABC passwordXYZ
  ```

- Połączenie z inną zdalną bazą MongoDB wymagającą uwierzytelnienia:
  ```powershell
  .\connect-db.ps1 10.0.0.5 27017 mortgage-calculator admin secret123
  ```

Po uruchomieniu skryptu backend aplikacji zostanie połączony z wybraną bazą danych. Naciśnięcie klawisza Enter przywróci domyślne ustawienia.

## Opcja 2: Ręczna zmiana zmiennej środowiskowej

Możesz także ręcznie zmienić zmienną środowiskową `MONGODB_URI` w pliku `docker-compose.override.yml`:

1. Otwórz plik `docker-compose.override.yml` w edytorze tekstu
2. Zmień wartość zmiennej `MONGODB_URI` na odpowiedni connection string
3. Zrestartuj backend: `docker-compose restart backend`

## Opcja 3: Tymczasowe połączenie za pomocą zmiennych środowiskowych

### Windows (PowerShell)

```powershell
$env:MONGODB_URI = "mongodb://użytkownik:hasło@host:port/baza-danych"
docker-compose restart backend
```

### Linux/macOS (bash)

```bash
export MONGODB_URI="mongodb://użytkownik:hasło@host:port/baza-danych"
docker-compose restart backend
```

## Format connection string MongoDB

Connection string MongoDB ma zwykle format:

```
mongodb://[użytkownik:hasło@]host[:port]/baza-danych
```

Przykłady:
- `mongodb://localhost:27017/mortgage-calculator` - lokalna baza bez uwierzytelniania
- `mongodb://admin:password123@localhost:27017/mortgage-calculator` - lokalna baza z uwierzytelnianiem
- `mongodb+srv://username:password@cluster0.abcde.mongodb.net/mortgage-calculator` - MongoDB Atlas 