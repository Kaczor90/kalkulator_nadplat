# Lista kontrolna wdrożenia na Render.com

## ✅ Przygotowanie kodu

- [x] Kod wypchnięty do GitHub
- [x] Plik `render.yaml` skonfigurowany
- [x] Wrażliwe dane usunięte z konfiguracji
- [x] Skrypty build i start skonfigurowane w package.json
- [x] .gitignore poprawnie skonfigurowany

## 🚀 Kroki wdrożenia na Render.com

### 1. Logowanie i połączenie z GitHub
- [ ] Zaloguj się na [render.com](https://render.com)
- [ ] Połącz konto GitHub z Render
- [ ] Autoryzuj dostęp do repozytorium `kalkulator_nadplat`

### 2. Utworzenie Blueprint
- [ ] Kliknij "New" → "Blueprint"
- [ ] Wybierz repozytorium `kalkulator_nadplat`
- [ ] Render wykryje plik `render.yaml`
- [ ] Przejrzyj konfigurację usług
- [ ] Kliknij "Apply Blueprint"

### 3. Konfiguracja zmiennych środowiskowych
Po utworzeniu usług:

#### Backend (mortgage-calculator-backend)
- [ ] Przejdź do ustawień usługi backend
- [ ] Kliknij zakładkę "Environment"
- [ ] Dodaj zmienną `MONGODB_URI`:
  ```
  mongodb+srv://radekdsa:TWOJE_HASŁO@cluster0.h9egut1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
  ```
- [ ] Zastąp `TWOJE_HASŁO` rzeczywistym hasłem MongoDB
- [ ] Zapisz zmiany (usługa zostanie zrestartowana)

### 4. Weryfikacja wdrożenia
- [ ] Sprawdź logi wszystkich usług
- [ ] Przetestuj health check: `https://mortgage-calculator-backend.onrender.com/api/health`
- [ ] Przetestuj frontend: `https://mortgage-calculator-frontend.onrender.com`
- [ ] Wykonaj testową kalkulację kredytu

### 5. Konfiguracja MongoDB Atlas (jeśli potrzebna)
- [ ] Dodaj IP Render do whitelist w MongoDB Atlas
- [ ] Sprawdź połączenie z bazą danych w logach backendu

## 📋 Adresy po wdrożeniu

- **Frontend**: https://mortgage-calculator-frontend.onrender.com
- **Backend API**: https://mortgage-calculator-backend.onrender.com
- **Health Check**: https://mortgage-calculator-backend.onrender.com/api/health
- **API Docs**: https://mortgage-calculator-backend.onrender.com/api

## 🔧 Rozwiązywanie problemów

### Jeśli backend nie startuje:
1. Sprawdź logi w panelu Render
2. Upewnij się, że `MONGODB_URI` jest poprawnie ustawiona
3. Sprawdź czy wszystkie zależności są zainstalowane

### Jeśli frontend nie ładuje się:
1. Sprawdź logi buildu
2. Upewnij się, że `REACT_APP_API_URL` wskazuje na backend
3. Sprawdź czy build się zakończył pomyślnie

### Jeśli baza danych nie działa:
1. Sprawdź połączenie MongoDB w logach
2. Zweryfikuj connection string
3. Sprawdź whitelist IP w MongoDB Atlas

## 📈 Po wdrożeniu

- [ ] Skonfiguruj monitoring w panelu Render
- [ ] Ustaw alerty dla usług
- [ ] Przetestuj wszystkie funkcjonalności aplikacji
- [ ] Udokumentuj adresy produkcyjne

## 🔄 Aktualizacje

Aby zaktualizować aplikację:
1. Wprowadź zmiany w kodzie
2. Zatwierdź i wypchnij do GitHub
3. Render automatycznie wdroży nową wersję 