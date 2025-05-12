# Wdrożenie na Render.com

Ten dokument zawiera szczegółowe instrukcje dotyczące wdrożenia aplikacji Kalkulator Nadpłat na platformie [render.com](https://render.com).

## Przygotowanie

1. Upewnij się, że Twoje zmiany są zatwierdzone i wypchnięte do repozytorium GitHub
2. Utwórz konto na [render.com](https://render.com) jeśli jeszcze go nie masz
3. Upewnij się, że plik `render.yaml` znajduje się w głównym katalogu projektu

## Krok 1: Połącz repozytorium GitHub z Render

1. Zaloguj się do panelu [render.com](https://render.com)
2. W górnym menu wybierz opcję "New" i kliknij "Blueprint"
3. Połącz swoje konto GitHub z Render jeśli jeszcze tego nie zrobiłeś
4. Wybierz repozytorium `kalkulator_nadplat` z listy

## Krok 2: Wdrożenie Blueprint

1. Render automatycznie wykryje plik `render.yaml` w Twoim repozytorium
2. Przejrzyj proponowane usługi (frontend, backend, baza danych)
3. Kliknij "Apply Blueprint"
4. Render zacznie proces wdrażania wszystkich usług

## Krok 3: Konfiguracja domen

Po zakończeniu wdrożenia, Twoje usługi będą dostępne pod automatycznie wygenerowanymi domenami:

- Frontend: `https://mortgage-calculator-frontend.onrender.com`
- Backend: `https://mortgage-calculator-backend.onrender.com`

Możesz skonfigurować własne domeny w ustawieniach każdej usługi.

## Krok 4: Monitorowanie

1. Na dashboardzie Render możesz monitorować status swoich usług
2. Sprawdź logi, aby upewnić się, że wszystko działa poprawnie
3. W zakładce "Metrics" znajdziesz informacje o wydajności aplikacji

## Rozwiązywanie problemów

### Problem z połączeniem do bazy danych

Jeśli backend nie może połączyć się z bazą danych:
1. Sprawdź zakładkę "Environment" w ustawieniach backendu
2. Upewnij się, że zmienna `MONGODB_URI` jest poprawnie ustawiona
3. Sprawdź, czy baza danych jest uruchomiona

### Problem z buildowaniem frontendu

Jeśli frontend nie builduje się poprawnie:
1. Sprawdź logi buildu w zakładce "Events"
2. Upewnij się, że wszystkie zależności są poprawnie zainstalowane
3. Sprawdź, czy zmienna `REACT_APP_API_URL` wskazuje na poprawny adres backendu

## Aktualizacja aplikacji

Aby zaktualizować aplikację:
1. Wprowadź zmiany w kodzie
2. Zatwierdź i wypchnij zmiany do repozytorium GitHub
3. Render automatycznie wykryje zmiany i zacznie proces wdrażania nowej wersji

## Przydatne polecenia

### Sprawdzenie statusu usług

```bash
curl https://mortgage-calculator-backend.onrender.com/api/health
```

### Tworzenie testowej kalkulacji

```bash
curl -X POST https://mortgage-calculator-backend.onrender.com/api/mortgage/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "loanAmount": 300000,
    "interestRate": 4.5,
    "loanTermYears": 25,
    "loanTermMonths": 0,
    "installmentType": "EQUAL",
    "startDate": "2023-01-01",
    "overpayments": []
  }'
``` 