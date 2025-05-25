# Przewodnik wdrożenia na Render.com

## Przygotowanie do wdrożenia

### 1. Wypchnięcie kodu do GitHub

```bash
# Dodaj wszystkie zmiany
git add .

# Zatwierdź zmiany
git commit -m "feat: przygotowanie do wdrożenia produkcyjnego na Render.com"

# Wypchnij do GitHub
git push origin master
```

### 2. Konfiguracja zmiennych środowiskowych w Render

Po utworzeniu usług w Render, musisz skonfigurować następujące zmienne środowiskowe:

#### Backend Service (mortgage-calculator-backend)

W panelu Render, przejdź do ustawień backendu i dodaj zmienną:

- **MONGODB_URI**: `mongodb+srv://radekdsa:TWOJE_HASŁO@cluster0.h9egut1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
  
  ⚠️ **Ważne**: Zastąp `TWOJE_HASŁO` rzeczywistym hasłem do MongoDB Atlas.

## Kroki wdrożenia

### 1. Połącz GitHub z Render

1. Zaloguj się do [render.com](https://render.com)
2. Kliknij "New" → "Blueprint"
3. Połącz swoje konto GitHub
4. Wybierz repozytorium `kalkulator_nadplat`

### 2. Wdrożenie Blueprint

1. Render wykryje plik `render.yaml`
2. Przejrzyj konfigurację usług
3. Kliknij "Apply Blueprint"
4. Poczekaj na zakończenie wdrożenia

### 3. Konfiguracja zmiennych środowiskowych

Po utworzeniu usług:

1. Przejdź do usługi `mortgage-calculator-backend`
2. Kliknij "Environment"
3. Dodaj zmienną `MONGODB_URI` z pełnym connection stringiem
4. Zapisz zmiany - usługa zostanie automatycznie zrestartowana

### 4. Weryfikacja wdrożenia

Sprawdź czy aplikacja działa:

```bash
# Sprawdź health check backendu
curl https://mortgage-calculator-backend.onrender.com/api/health

# Sprawdź frontend
curl https://mortgage-calculator-frontend.onrender.com
```

## Adresy aplikacji

Po wdrożeniu aplikacja będzie dostępna pod adresami:

- **Frontend**: https://mortgage-calculator-frontend.onrender.com
- **Backend API**: https://mortgage-calculator-backend.onrender.com
- **Health Check**: https://mortgage-calculator-backend.onrender.com/api/health

## Rozwiązywanie problemów

### Problem z połączeniem do MongoDB

1. Sprawdź logi backendu w panelu Render
2. Upewnij się, że zmienna `MONGODB_URI` jest poprawnie ustawiona
3. Sprawdź czy IP Render jest dodany do whitelist w MongoDB Atlas

### Problem z buildowaniem

1. Sprawdź logi buildu w zakładce "Events"
2. Upewnij się, że wszystkie zależności są w `package.json`
3. Sprawdź czy ścieżki w `render.yaml` są poprawne

## Aktualizacja aplikacji

Aby zaktualizować aplikację:

1. Wprowadź zmiany w kodzie
2. Zatwierdź i wypchnij do GitHub:
   ```bash
   git add .
   git commit -m "feat: opis zmian"
   git push origin master
   ```
3. Render automatycznie wykryje zmiany i wdroży nową wersję

## Monitorowanie

- **Logi**: Dostępne w panelu każdej usługi
- **Metryki**: Zakładka "Metrics" w ustawieniach usługi
- **Alerty**: Można skonfigurować w ustawieniach konta 