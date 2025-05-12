# Kalkulator nadpłat kredytu hipotecznego

Aplikacja do kalkulacji nadpłat kredytu hipotecznego.

## Architektura

Aplikacja jest zbudowana w architekturze mikroserwisowej i składa się z następujących komponentów:

1. **Proxy** - Serwer Nginx działający jako reverse proxy
2. **Frontend** - Aplikacja React z TypeScript, Material UI, React Router i Redux
3. **Backend** - API REST w NestJS z TypeScript
4. **Baza danych** - MongoDB

## Struktura projektu

```
kalkulator_nadplat/
├── proxy/
│   ├── Dockerfile
│   └── nginx.conf
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── calculator/  # Komponenty kalkulatora
│   │   │   ├── common/      # Wspólne komponenty
│   │   │   └── results/     # Komponenty wyników
│   │   ├── interfaces/      # Definicje typów TypeScript
│   │   └── store/           # Redux store i API
│   ├── Dockerfile
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── interfaces/      # Definicje interfejsów
│   │   ├── mortgage/        # Moduł kalkulatora kredytów
│   │   │   ├── dto/         # Data Transfer Objects
│   │   │   └── schemas/     # Schematy MongoDB
│   ├── Dockerfile
│   └── package.json
├── db/
├── docker-compose.yml        # Konfiguracja dla środowiska deweloperskiego
├── docker-compose.prod.yml   # Konfiguracja dla środowiska produkcyjnego
├── docker-compose.simple.yml # Konfiguracja tylko dla bazy danych
├── run-dev.ps1               # Skrypt uruchamiający środowisko deweloperskie (Windows)
├── run-dev.sh                # Skrypt uruchamiający środowisko deweloperskie (Linux/macOS)
├── run-prod.ps1              # Skrypt uruchamiający środowisko produkcyjne (Windows)
├── run-prod.sh               # Skrypt uruchamiający środowisko produkcyjne (Linux/macOS)
├── run-db-only.ps1           # Skrypt uruchamiający tylko bazę danych (Windows)
├── run-db-only.sh            # Skrypt uruchamiający tylko bazę danych (Linux/macOS)
├── README.md
```

## Funkcjonalności

Kalkulator kredytu hipotecznego oferuje następujące funkcjonalności:

- **Dane podstawowe kredytu**:
  - Kwota kredytu
  - Oprocentowanie nominalne
  - Możliwość dodania zmian oprocentowania w czasie
  - Okres kredytowania (lata i miesiące)
  - Typ rat (równe lub malejące)
  - Data rozpoczęcia kredytu

- **Zarządzanie nadpłatami**:
  - Dodawanie nadpłat jednorazowych
  - Konfiguracja nadpłat cyklicznych (miesięczne, kwartalne, półroczne, roczne)
  - Wybór efektu nadpłat (skrócenie okresu lub zmniejszenie raty)

- **Wyniki i raporty**:
  - Porównanie scenariusza z nadpłatami i bez nadpłat
  - Interaktywne wykresy (saldo zadłużenia, struktura rat)
  - Szczegółowy harmonogram spłat
  - Eksport raportu PDF

## Endpoints API

### Backend API

- `POST /api/mortgage/calculate` - Kalkulacja kredytu z uwzględnieniem nadpłat
- `GET /api/mortgage/:id` - Pobranie wyników kalkulacji po ID
- `GET /api/mortgage` - Pobranie wszystkich kalkulacji

Dokumentacja API dostępna pod: http://localhost/api/docs

## Uruchomienie lokalnie

Aby uruchomić aplikację lokalnie, wykonaj następujące kroki:

```bash
# Sklonuj repozytorium
git clone [URL_repozytorium]
cd kalkulator_nadplat
```

### Uruchamianie środowiska deweloperskiego

#### Windows
```powershell
# Uruchom aplikację w trybie deweloperskim
./run-dev.ps1
```

#### Linux/macOS
```bash
# Nadaj uprawnienia wykonywania dla skryptów
chmod +x *.sh

# Uruchom aplikację w trybie deweloperskim
./run-dev.sh
```

### Uruchamianie środowiska produkcyjnego

#### Windows
```powershell
# Uruchom aplikację w trybie produkcyjnym
./run-prod.ps1
```

#### Linux/macOS
```bash
# Uruchom aplikację w trybie produkcyjnym
./run-prod.sh
```

### Uruchamianie tylko bazy danych (dla lokalnego developmentu frontendowego/backendowego)

#### Windows
```powershell
# Uruchom tylko bazę danych MongoDB
./run-db-only.ps1
```

#### Linux/macOS
```bash
# Uruchom tylko bazę danych MongoDB
./run-db-only.sh
```

Po uruchomieniu:
- Frontend jest dostępny pod adresem: http://localhost
- Backend API jest dostępne pod adresem: http://localhost/api
- Dokumentacja API (Swagger): http://localhost/api/docs
- Baza danych MongoDB jest dostępna pod adresem: mongodb://localhost:27017

## Wdrożenie na render.com

Aplikacja jest skonfigurowana do wdrożenia na platformie render.com. Proces wdrożenia jest zautomatyzowany dzięki plikowi `render.yaml`.

### Kroki wdrożenia

1. Utwórz konto na [render.com](https://render.com) jeśli jeszcze go nie masz
2. Połącz swoje konto render.com z repozytorium GitHub
3. Na dashboardzie render.com wybierz "New Blueprint Instance"
4. Wybierz swoje repozytorium GitHub z aplikacją
5. render.com automatycznie wykryje plik `render.yaml` i skonfiguruje usługi:
   * Frontend (aplikacja statyczna)
   * Backend (serwer NestJS)
   * Baza danych MongoDB

### Monitorowanie i zarządzanie

Po wdrożeniu aplikacji możesz:
* Monitorować logi swoich usług w panelu render.com
* Skonfigurować domeny niestandardowe (custom domains)
* Skalować swoją aplikację w razie potrzeby
* Ustawić zmienne środowiskowe bezpośrednio w panelu render.com

### Ograniczenia wersji darmowej

* MongoDB w darmowym planie ma limit 256MB danych
* Usługi web automatycznie usypiają po okresie nieaktywności
* Istnieją ograniczenia co do liczby wywołań API w wersji darmowej

## Material UI v7

Aplikacja używa najnowszej wersji Material UI v7, która wprowadza kilka istotnych zmian:

- Zaktualizowana struktura komponentów Grid
- Ulepszone wsparcie dla tematyzacji
- Wsparcie dla zmiennych CSS
- Lepsze wsparcie dla React 19
- Ulepszony efekt ripple (wymaga odpowiedniej konfiguracji w testach)

Aplikacja korzysta z tematyzacji poprzez zmienne środowiskowe:
- `REACT_APP_THEME_PRIMARY_COLOR` - Kolor główny aplikacji
- `REACT_APP_THEME_SECONDARY_COLOR` - Kolor dodatkowy aplikacji

### Kompatybilność z testami

Ze względu na zmiany w efekcie ripple w Material UI v7, w testach należy używać `await act` do symulacji interakcji użytkownika:

```javascript
// Zamiast
fireEvent.click(button);

// Użyj
await act(async () => fireEvent.mouseDown(button));
```

## Środowiska

Aplikacja obsługuje różne środowiska:

- **Lokalny development** - uruchamiany za pomocą `docker-compose up`
- **Produkcja** - Dockerfiles zawierają multi-stage builds dla wersji produkcyjnej

## Technologie

- **Frontend**:
  - React 19
  - TypeScript
  - Material UI v7
  - React Router v7
  - Redux Toolkit
  - RTK Query
  - Recharts (wykresy)
  - html2canvas & jsPDF (generowanie PDF)

- **Backend**:
  - NestJS
  - TypeScript
  - Mongoose (MongoDB)
  - Swagger (dokumentacja API)
  - class-validator & class-transformer

- **Baza danych**:
  - MongoDB

- **Infrastruktura**:
  - Docker
  - Nginx 