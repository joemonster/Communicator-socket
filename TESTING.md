# 🧪 Przewodnik Testowania

Ten dokument opisuje framework testowy i sposób uruchamiania testów w aplikacji Domowy Czat.

---

## 📋 Spis treści

1. [Framework testowy](#-framework-testowy)
2. [Uruchamianie testów](#-uruchamianie-testów)
3. [Struktura testów](#-struktura-testów)
4. [Pokrycie testami](#-pokrycie-testami)
5. [Pisanie własnych testów](#-pisanie-własnych-testów)
6. [GitHub Actions CI/CD](#-github-actions-cicd)

---

## 🛠 Framework testowy

Aplikacja używa następujących narzędzi do testowania:

- **Jest** - Framework testowy dla JavaScript
- **React Testing Library** - Testowanie komponentów React
- **node-mocks-http** - Mockowanie HTTP request/response dla API routes
- **Socket.io** - Testowanie komunikacji WebSocket

---

## 🚀 Uruchamianie testów

### Wszystkie testy z pokryciem kodu

```bash
npm test
```

To uruchomi wszystkie testy i wygeneruje raport pokrycia kodu (coverage).

### Tryb watch (ciągłe testowanie)

```bash
npm run test:watch
```

Testy będą uruchamiane automatycznie po każdej zmianie w kodzie.

### Tylko testy jednostkowe

```bash
npm run test:unit
```

### Tylko testy integracyjne

```bash
npm run test:integration
```

### Pojedynczy plik testowy

```bash
npx jest __tests__/unit/usersConfig.test.js
```

---

## 📁 Struktura testów

```
__tests__/
├── unit/                          # Testy jednostkowe
│   ├── usersConfig.test.js       # Testy lib/usersConfig.js
│   ├── messageRepository.test.js # Testy lib/messageRepository.js
│   ├── api-auth-login.test.js    # Testy /api/auth/login
│   ├── api-auth-me.test.js       # Testy /api/auth/me
│   └── LoginPage.test.js         # Testy pages/index.js
│
└── integration/                   # Testy integracyjne
    └── socket.test.js            # Testy Socket.io (pełna komunikacja)
```

---

## 📊 Pokrycie testami

### Co jest testowane?

#### ✅ **Logika biznesowa (lib/)**

**lib/usersConfig.js** (100% pokrycia)
- ✅ Pobieranie wszystkich użytkowników
- ✅ Walidacja użytkownika (poprawne/niepoprawne hasło)
- ✅ Pobieranie użytkownika po ID
- ✅ Obsługa błędnych danych (null, undefined, puste stringi)

**lib/messageRepository.js** (100% pokrycia)
- ✅ Dodawanie wiadomości
- ✅ Pobieranie wszystkich wiadomości
- ✅ Czyszczenie historii
- ✅ Walidacja struktury wiadomości
- ✅ Generowanie unikalnych ID
- ✅ Limit 1000 wiadomości

#### ✅ **API Routes**

**pages/api/auth/login.js**
- ✅ Poprawne logowanie
- ✅ Niepoprawne hasło
- ✅ Brak wymaganych danych
- ✅ Niepoprawna metoda HTTP (GET zamiast POST)
- ✅ Ustawianie cookie
- ✅ Wszystkie domyślni użytkownicy

**pages/api/auth/me.js**
- ✅ Zwracanie danych zalogowanego użytkownika
- ✅ Obsługa braku sesji
- ✅ Obsługa nieprawidłowej sesji
- ✅ Weryfikacja wszystkich użytkowników

#### ✅ **Komponenty React**

**pages/index.js (LoginPage)**
- ✅ Renderowanie tytułu i kafelków
- ✅ Ładowanie użytkowników z API
- ✅ Wybór użytkownika i formularz hasła
- ✅ Anulowanie wyboru
- ✅ Obsługa błędów logowania
- ✅ Przekierowanie do czatu po sukcesie
- ✅ Wyłączanie przycisku przy pustym haśle

#### ✅ **Socket.io (Integracja)**

- ✅ Połączenie klienta z serwerem
- ✅ Rejestracja użytkownika
- ✅ Wysyłanie i odbieranie wiadomości
- ✅ Broadcast do wszystkich klientów
- ✅ Lista użytkowników online
- ✅ Usuwanie użytkownika po rozłączeniu

---

## 📈 Raport pokrycia

Po uruchomieniu `npm test`, raport pokrycia zostanie wygenerowany w folderze `coverage/`.

Aby zobaczyć raport w przeglądarce:

```bash
npm test
open coverage/lcov-report/index.html
```

**Wymagane progi pokrycia:**
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

---

## ✍️ Pisanie własnych testów

### Przykład testu jednostkowego

```javascript
// __tests__/unit/myFunction.test.js
const { myFunction } = require('../../lib/myModule');

describe('myFunction', () => {
  it('powinno zwrócić oczekiwaną wartość', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('powinno rzucić błąd przy nieprawidłowych danych', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Przykład testu komponentu React

```javascript
// __tests__/unit/MyComponent.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../../components/MyComponent';

describe('MyComponent', () => {
  it('powinno renderować tekst', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('powinno obsłużyć kliknięcie', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Przykład testu API route

```javascript
// __tests__/unit/api-my-route.test.js
const { createMocks } = require('node-mocks-http');
const handler = require('../../pages/api/my-route').default;

describe('/api/my-route', () => {
  it('powinno zwrócić 200 OK', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(true);
  });
});
```

---

## 🔍 Debugging testów

### Wyświetlanie console.log w testach

```bash
npx jest --verbose
```

### Uruchomienie tylko jednego testu

Dodaj `.only` do testu:

```javascript
it.only('powinno...',() => {
  // Ten test zostanie uruchomiony
});
```

### Pominięcie testu

Dodaj `.skip`:

```javascript
it.skip('powinno...', () => {
  // Ten test zostanie pominięty
});
```

### Wyświetlenie struktury DOM

W teście komponentu:

```javascript
import { render, screen } from '@testing-library/react';
import { debug } from '@testing-library/react';

it('powinno...', () => {
  const { container } = render(<MyComponent />);
  debug(container); // Wyświetla DOM w konsoli
});
```

---

## 🎯 Best Practices

### 1. **Testuj zachowanie, nie implementację**

❌ Źle:
```javascript
expect(component.state.count).toBe(5);
```

✅ Dobrze:
```javascript
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. **Używaj opisowych nazw testów**

❌ Źle:
```javascript
it('works', () => { ... });
```

✅ Dobrze:
```javascript
it('powinno wyświetlić komunikat błędu przy pustym polu', () => { ... });
```

### 3. **Arrange-Act-Assert (AAA)**

```javascript
it('powinno...', () => {
  // Arrange - przygotuj dane
  const user = { name: 'Jan' };

  // Act - wykonaj akcję
  const result = formatUser(user);

  // Assert - sprawdź wynik
  expect(result).toBe('Jan');
});
```

### 4. **Izoluj testy**

Każdy test powinien być niezależny. Używaj `beforeEach` do resetowania stanu:

```javascript
beforeEach(() => {
  clearAllMessages();
});
```

### 5. **Mock tylko to, co konieczne**

Mockuj zewnętrzne zależności (API, bazy danych), ale nie mockuj logiki aplikacji.

---

## 🐛 Rozwiązywanie problemów

### Problem: "Cannot find module"

**Rozwiązanie:** Sprawdź ścieżkę importu. W testach używaj relatywnych ścieżek:

```javascript
// Dobrze
const { myFunc } = require('../../lib/myModule');

// Źle (może nie działać w testach)
import { myFunc } from 'lib/myModule';
```

### Problem: "ReferenceError: window is not defined"

**Rozwiązanie:** To kod klienta uruchamiany w środowisku Node.js. Upewnij się, że test używa `testEnvironment: 'jsdom'` (w `jest.config.js`).

### Problem: Test timeout przy Socket.io

**Rozwiązanie:** Zwiększ timeout dla konkretnego testu:

```javascript
it('powinno...', (done) => {
  // ...
}, 10000); // 10 sekund
```

### Problem: Mock fetch nie działa

**Rozwiązanie:** Upewnij się, że mockujesz fetch przed renderowaniem:

```javascript
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  fetch.mockClear();
});
```

---

## 📚 Dodatkowe zasoby

- **Jest Documentation:** https://jestjs.io/
- **React Testing Library:** https://testing-library.com/react
- **Testing Best Practices:** https://testingjavascript.com/

---

## ✅ Checklist przed commitem

Przed commitowaniem kodu, upewnij się, że:

- [ ] Wszystkie testy przechodzą (`npm test`)
- [ ] Pokrycie kodu spełnia wymagane progi
- [ ] Nowe funkcje mają testy
- [ ] Nie ma testów `.skip` lub `.only` (chyba że celowo)
- [ ] Komunikaty testów są opisowe

---

**Miłego testowania! 🧪**

---

## 🚀 GitHub Actions CI/CD

Projekt jest skonfigurowany z automatycznym CI/CD przez GitHub Actions.

### Co się dzieje automatycznie?

Przy każdym push lub pull request uruchamiane są:

#### 1. **Testy** (`test` job)
- ✅ Testy jednostkowe (`npm run test:unit`)
- ✅ Testy integracyjne (`npm run test:integration`)
- ✅ Wszystkie testy z coverage (`npm test`)
- ✅ Generowanie raportu pokrycia kodu
- ✅ Upload coverage do Codecov (opcjonalnie)

**Matrix testing:**
- Node.js 18.x
- Node.js 20.x

#### 2. **Build** (`build` job)
- ✅ Instalacja zależności
- ✅ Build Next.js (`npm run build`)
- ✅ Weryfikacja, że build się kompiluje
- ✅ Archiwizacja buildu

#### 3. **Lint Check** (`lint-check` job)
- ✅ Sprawdzenie struktury package.json
- ✅ Weryfikacja, że testy istnieją

#### 4. **Security** (`security` job)
- ✅ npm audit - skanowanie podatności
- ✅ Sprawdzenie zależności

### Plik konfiguracyjny

`.github/workflows/ci.yml`

### Jak sprawdzić status?

1. **W GitHub:**
   - Przejdź do zakładki "Actions"
   - Zobacz historię wszystkich uruchomień
   - Sprawdź logi dla każdego joba

2. **Badge w README:**
   ```markdown
   ![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
   ```

### Artifacts

Po każdym buildzieuruchamiany na CI, dostępne są:

- **coverage-report** - raport pokrycia kodu (HTML)
- **nextjs-build** - skompilowana aplikacja Next.js

Pobierz je z zakładki "Actions" → wybrany workflow → "Artifacts"

### Lokalne uruchomienie przed pushem

Aby upewnić się, że CI przejdzie:

```bash
# 1. Uruchom testy
npm test

# 2. Zbuduj aplikację
npm run build

# 3. Sprawdź audit
npm audit
```

### Wyłączenie CI dla commita

Jeśli chcesz pominąć CI dla konkretnego commita:

```bash
git commit -m "docs: update README [skip ci]"
```

### Troubleshooting CI

#### Problem: Testy failują na CI ale działają lokalnie

**Rozwiązanie:**
1. Sprawdź wersję Node.js (`node --version`)
2. Użyj `npm ci` zamiast `npm install`
3. Sprawdź, czy wszystkie pliki są commitowane

#### Problem: Build failuje na CI

**Rozwiązanie:**
1. Uruchom `npm run build` lokalnie
2. Sprawdź logi buildu w GitHub Actions
3. Upewnij się, że package.json ma wszystkie zależności

#### Problem: Coverage nie jest uploadowany

**Rozwiązanie:**
1. Sprawdź, czy Codecov jest skonfigurowany
2. Dodaj CODECOV_TOKEN do GitHub Secrets
3. Lub usuń krok upload z workflow

---

**Testy wykonują się automatycznie na GitHub Actions! ✅**
