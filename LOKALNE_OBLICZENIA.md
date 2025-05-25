# Lokalne Obliczenia Kredytowe - Dokumentacja

## 🎯 Przegląd

Kalkulator nadpłat kredytu został rozszerzony o możliwość wykonywania obliczeń lokalnie w przeglądarce użytkownika. Ta funkcjonalność działa jako:
- **Opcja dodatkowa** - użytkownik może wybrać tryb lokalny lub online
- **Automatyczny fallback** - gdy serwer nie działa, obliczenia przełączają się automatycznie na tryb lokalny
- **Rozwiązanie offline** - umożliwia korzystanie z kalkulatora bez połączenia z internetem

## ✨ Funkcjonalności

### Obsługiwane obliczenia:
- ✅ Raty równe i malejące
- ✅ Nadpłaty jednorazowe
- ✅ Nadpłaty cykliczne (miesięczne, kwartalne, półroczne, roczne)
- ✅ Trzy tryby nadpłat:
  - `reduce_period` - skrócenie okresu kredytowania
  - `reduce_installment` - zmniejszenie raty
  - `progressive_overpayment` - nadpłata progresywna
- ✅ Zmienne stopy procentowe w czasie
- ✅ Generowanie harmonogramów spłat
- ✅ Obliczenia oszczędności (kwotowe i czasowe)

### Interfejs użytkownika:
- 🔄 Przełącznik "Obliczenia lokalne/online"
- 🏷️ Wskaźnik typu obliczeń w wynikach
- ⚠️ Alerty o przełączeniu na tryb lokalny
- 📱 Responsywny design

## 🚀 Jak korzystać

### 1. Wybór trybu obliczeń
W kalkulatorze, przed obliczeniem, użytkownik może:
- **Włączyć przełącznik "Obliczenia lokalne"** - obliczenia będą wykonywane w przeglądarce
- **Pozostawić tryb online** - obliczenia będą wykonywane na serwerze z automatycznym fallback

### 2. Automatyczny fallback
Gdy serwer nie działa:
1. Aplikacja automatycznie przełącza się na obliczenia lokalne
2. Wyświetla alert informujący o przełączeniu
3. Kontynuuje obliczenia bez przerwy dla użytkownika

### 3. Identyfikacja typu obliczeń
W wynikach użytkownik widzi:
- 🌐 **"Obliczenia online"** - dane z serwera
- 💻 **"Obliczenia lokalne"** - dane obliczone w przeglądarce

## 🔧 Implementacja techniczna

### Struktura plików:
```
frontend/src/
├── utils/
│   ├── mortgageCalculations.ts     # Główna logika obliczeniowa
│   └── mortgageCalculations.test.ts # Testy jednostkowe
├── components/
│   ├── calculator/Calculator.tsx   # Przełącznik i logika wyboru
│   └── results/Results.tsx         # Obsługa lokalnych wyników
└── interfaces/mortgage.ts          # Typy TypeScript
```

### Kluczowe funkcje:
- `calculateMortgageLocally()` - główna funkcja obliczeń
- `calculateEqualInstallment()` - obliczenia rat równych
- `getAllOverpayments()` - generowanie nadpłat
- `getCurrentInterestRate()` - obsługa zmiennych stóp

### Przechowywanie danych:
- Lokalne wyniki są zapisywane w `localStorage`
- Identyfikatory zaczynają się od `local-` lub `local-fallback-`
- Dane są automatycznie ładowane przy ponownym otwarciu wyników

## 🧪 Testowanie

### Testy automatyczne:
```bash
npm test -- --testPathPattern=mortgageCalculations.test.ts
```

### Testy manualne:
1. **Test podstawowy**: Kredyt 300,000 PLN, 7.5%, 25 lat
2. **Test z nadpłatą jednorazową**: + 50,000 PLN w 6. miesiącu
3. **Test z nadpłatami cyklicznymi**: + 500 PLN miesięcznie
4. **Test offline**: Wyłącz serwer i sprawdź fallback

## 📊 Porównanie z backendem

### Zalety lokalnych obliczeń:
- ⚡ **Szybkość** - brak opóźnień sieciowych
- 🔒 **Prywatność** - dane nie opuszczają przeglądarki
- 📱 **Offline** - działanie bez internetu
- 💰 **Koszty** - mniejsze obciążenie serwera

### Ograniczenia:
- 🔢 **Precyzja** - możliwe minimalne różnice w zaokrągleniach
- 📦 **Rozmiar** - większy bundle aplikacji
- 🔄 **Synchronizacja** - ryzyko rozbieżności między implementacjami

## 🛠️ Rozwój i utrzymanie

### Dodawanie nowych funkcji:
1. Zaimplementuj w `mortgageCalculations.ts`
2. Dodaj testy w `mortgageCalculations.test.ts`
3. Zaktualizuj interfejsy w `interfaces/mortgage.ts`
4. Przetestuj zgodność z backendem

### Monitorowanie:
- Sprawdzaj logi konsoli dla debugowania
- Porównuj wyniki z backendem
- Śledź użycie lokalnych vs. API obliczeń

## 🔍 Rozwiązywanie problemów

### Typowe problemy:

1. **Różne wyniki między lokalnym a API**
   - Sprawdź wersje algorytmów
   - Porównaj parametry wejściowe
   - Zweryfikuj logikę nadpłat

2. **Błędy w obliczeniach**
   - Sprawdź logi konsoli
   - Zweryfikuj dane wejściowe
   - Uruchom testy jednostkowe

3. **Problemy z localStorage**
   - Sprawdź limity przeglądarki
   - Wyczyść stare dane
   - Zweryfikuj format JSON

### Debug:
```javascript
// W konsoli przeglądarki
localStorage.getItem('calculation-local-123456')
```

## 📈 Metryki i analityka

### Śledzone zdarzenia:
- Wybór trybu lokalnego przez użytkownika
- Automatyczne przełączenie na fallback
- Czas wykonania obliczeń
- Błędy w obliczeniach lokalnych

### Przykład logowania:
```javascript
console.log('Tryb obliczeń:', useLocalCalculation ? 'LOKALNY' : 'API');
console.log('Lokalne obliczenia zakończone pomyślnie');
```

## 🎉 Podsumowanie

Funkcjonalność lokalnych obliczeń znacząco poprawia:
- **User Experience** - szybsze obliczenia, działanie offline
- **Niezawodność** - automatyczny fallback przy problemach z serwerem
- **Elastyczność** - wybór trybu przez użytkownika

Implementacja zachowuje pełną kompatybilność z istniejącym API i nie wymaga zmian w backendzie. 