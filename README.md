# 🏠 Domowy Czat - Aplikacja Socket.io Demo

Prosta, atrakcyjna wizualnie aplikacja webowa do komunikacji między komputerami w jednej sieci domowej (LAN/Wi-Fi). Aplikacja służy jednocześnie jako demo biblioteki Socket.io.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![Socket.io](https://img.shields.io/badge/Socket.io-4.6-green)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-%E2%89%A550%25-success)

---

## 📋 Spis treści

1. [Funkcjonalności](#-funkcjonalności)
2. [Technologie](#-technologie)
3. [Struktura projektu](#-struktura-projektu)
4. [Instalacja](#-instalacja)
5. [Uruchomienie](#-uruchomienie)
6. [Dostęp z innych urządzeń](#-dostęp-z-innych-urządzeń)
7. [Testy](#-testy)
8. [Konfiguracja](#-konfiguracja)
9. [Jak działa Socket.io](#-jak-działa-socketio)
10. [Rozbudowa](#-rozbudowa)

---

## ✨ Funkcjonalności

### ✅ Zrealizowane:

- **Logowanie z prostymi hasłami** - wybór użytkownika z kafelków + hasło
- **Czat w czasie rzeczywistym** - jeden wspólny pokój dla wszystkich
- **Historia wiadomości** - przechowywana w pamięci serwera
- **Powiadomienia dźwiękowe** - dźwięk przy nowych wiadomościach od innych
- **Animacje** - płynne slide-up i pulse przy nowych wiadomościach
- **Lista użytkowników online** - boczny panel z aktywnymi użytkownikami
- **Responsywny design** - działa na komputerach i tabletach
- **Wiadomości w stylu Messenger** - kolorowe dymki, zaokrąglone rogi
- **Auto-scroll** - automatyczne przewijanie do najnowszej wiadomości
- **Status połączenia** - informacja o statusie online/offline

---

## 🛠 Technologie

### Backend:
- **Next.js 14** - framework React z renderowaniem po stronie serwera
- **Node.js** - środowisko uruchomieniowe
- **Socket.io 4.6** - komunikacja w czasie rzeczywistym (WebSocket)
- **Cookie** - proste zarządzanie sesją

### Frontend:
- **React 18** - biblioteka UI
- **CSS Modules** - stylowanie komponentów
- **Socket.io Client** - komunikacja z serwerem

---

## 📁 Struktura projektu

```
Communicator-socket/
├── lib/
│   ├── usersConfig.js         # ⚙️ Konfiguracja użytkowników i haseł
│   ├── messageRepository.js   # 💾 Zarządzanie historią wiadomości
│   └── socket.js              # 🔌 Klient Socket.io
│
├── pages/
│   ├── _app.js                # Next.js App wrapper
│   ├── index.js               # 🔐 Strona logowania
│   ├── chat.js                # 💬 Strona czatu
│   └── api/
│       ├── auth/
│       │   ├── login.js       # API: logowanie
│       │   ├── logout.js      # API: wylogowanie
│       │   └── me.js          # API: sprawdzenie sesji
│       └── users.js           # API: lista użytkowników
│
├── styles/
│   ├── globals.css            # Globalne style
│   ├── Login.module.css       # Style strony logowania
│   └── Chat.module.css        # Style czatu
│
├── public/
│   ├── notification.wav       # 🔊 Dźwięk powiadomienia
│   └── NOTIFICATION_SOUND.md  # Instrukcja dźwięków
│
├── scripts/
│   └── generate_notification.py  # Skrypt generowania dźwięku
│
├── server.js                  # 🚀 Główny serwer (Next.js + Socket.io)
├── package.json               # Zależności projektu
└── README.md                  # Dokumentacja
```

---

## 📦 Instalacja

### 1. Sklonuj repozytorium lub skopiuj pliki

```bash
cd /ścieżka/do/projektu
```

### 2. Zainstaluj zależności

```bash
npm install
```

To zainstaluje:
- `next` - framework
- `react` & `react-dom` - biblioteka UI
- `socket.io` & `socket.io-client` - komunikacja w czasie rzeczywistym
- `cookie` - zarządzanie ciasteczkami

---

## 🚀 Uruchomienie

### Tryb deweloperski (development)

```bash
npm run dev
```

Aplikacja uruchomi się na **http://localhost:3000**

### Tryb produkcyjny (production)

```bash
npm run build
npm start
```

---

## 📱 Dostęp z innych urządzeń

Aby uzyskać dostęp do aplikacji z innych komputerów/tabletów w tej samej sieci Wi-Fi:

### 1. Znajdź adres IP swojego komputera

**Na Windows:**
```bash
ipconfig
```
Szukaj linii `IPv4 Address` - np. `192.168.0.10`

**Na Linux/Mac:**
```bash
ip addr
# lub
ifconfig
# lub
hostname -I
```

### 2. Na innych urządzeniach wpisz w przeglądarce:

```
http://192.168.0.10:3000
```
*(Zastąp `192.168.0.10` swoim adresem IP)*

### 3. Gotowe! 🎉

Teraz możesz zalogować się i czatować z różnych urządzeń w domu.

---

## 🧪 Testy

Aplikacja posiada kompletny zestaw testów jednostkowych i integracyjnych.

### Uruchomienie testów:

```bash
# Wszystkie testy z pokryciem kodu
npm test

# Tryb watch (ciągłe testowanie)
npm run test:watch

# Tylko testy jednostkowe
npm run test:unit

# Tylko testy integracyjne
npm run test:integration
```

### Co jest testowane?

✅ **Logika biznesowa** (lib/)
- usersConfig.js - walidacja użytkowników, hasła
- messageRepository.js - historia wiadomości, limity

✅ **API Routes**
- /api/auth/login - logowanie, błędy, cookie
- /api/auth/me - sesje, autoryzacja

✅ **Komponenty React**
- LoginPage - kafelki, formularze, przekierowania

✅ **Socket.io**
- Połączenia WebSocket
- Broadcast wiadomości
- Lista użytkowników online

### Dokumentacja testów:

Pełny przewodnik testowania: **[TESTING.md](TESTING.md)**

**Pokrycie kodu:**
- Branches: ≥50%
- Functions: ≥50%
- Lines: ≥50%
- Statements: ≥50%

---

## ⚙️ Konfiguracja

### 🔐 Zmiana użytkowników i haseł

Edytuj plik: **`lib/usersConfig.js`**

```javascript
const USERS = {
  mama: {
    id: 'mama',
    name: 'Mama',
    password: 'mama123',
    color: '#E3F2FD'
  },
  // Dodaj nowych użytkowników tutaj...
};
```

**Aby dodać nowego użytkownika:**
1. Skopiuj istniejący wpis
2. Zmień `id`, `name`, `password` i opcjonalnie `color`
3. Zapisz plik i zrestartuj serwer

---

### 💾 Historia wiadomości

Aktualnie wiadomości są przechowywane w **pamięci serwera** (plik `lib/messageRepository.js`).

**Po restarcie serwera historia się zeruje.**

#### Jak dodać bazę danych?

Plik `lib/messageRepository.js` zawiera szczegółowe komentarze, gdzie i jak dodać obsługę bazy danych.

**Przykład dla SQLite:**

```javascript
// Zainstaluj: npm install better-sqlite3
const Database = require('better-sqlite3');
const db = new Database('chat.db');

// Utwórz tabelę
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    text TEXT,
    createdAt TEXT
  )
`);

function getAllMessages() {
  return db.prepare('SELECT * FROM messages ORDER BY createdAt ASC').all();
}

function addMessage(message) {
  const fullMessage = { /* ... */ };
  db.prepare('INSERT INTO messages VALUES (?, ?, ?, ?, ?)')
    .run(fullMessage.id, fullMessage.userId, fullMessage.userName,
         fullMessage.text, fullMessage.createdAt);
  return fullMessage;
}
```

**Inne opcje:**
- **MongoDB** - dobry dla większych projektów
- **PostgreSQL** - dla zaawansowanych funkcji
- **JSON file** - prosty backup (kod zakomentowany w `messageRepository.js`)

---

### 🔊 Dźwięk powiadomienia

Domyślnie używany jest plik **`public/notification.wav`** (wygenerowany automatycznie).

**Aby zmienić dźwięk:**
1. Znajdź lub nagraj własny dźwięk (MP3 lub WAV)
2. Zapisz go jako `public/notification.wav` lub `public/notification.mp3`
3. Jeśli używasz MP3, zmień w `pages/chat.js` linię 174:
   ```javascript
   <audio ref={audioRef} src="/notification.mp3" preload="auto" />
   ```

**Sugerowane źródła:**
- https://freesound.org
- https://notificationsounds.com
- https://zapsplat.com

---

## 🔌 Jak działa Socket.io

### Krok po kroku:

#### 1. **Użytkownik loguje się** (strona `/`)
   - Wybiera użytkownika z kafelka
   - Wpisuje hasło
   - API `/api/auth/login` sprawdza hasło
   - Ustawia cookie z sesją
   - Przekierowuje do `/chat`

#### 2. **Strona czatu inicjalizuje Socket.io** (`pages/chat.js`)
   - Wywołuje `initSocket(userId)` z `lib/socket.js`
   - Tworzy połączenie WebSocket z serwerem

#### 3. **Serwer odbiera połączenie** (`server.js`)
   - Zdarzenie `connection` uruchamia się
   - Klient wysyła `user:register` z `userId`
   - Serwer weryfikuje użytkownika i zapisuje go w `connectedUsers`

#### 4. **Wymiana danych:**

**Serwer → Klient:**
- `chat:history` - historia wiadomości przy połączeniu
- `chat:message` - nowa wiadomość (broadcast do wszystkich)
- `users:online` - lista aktualnie online użytkowników

**Klient → Serwer:**
- `user:register` - rejestracja po połączeniu
- `chat:message` - wysłanie nowej wiadomości
- `chat:typing` - informacja o pisaniu (opcjonalnie)

#### 5. **Wysłanie wiadomości:**
   - Użytkownik wpisuje tekst i klika "Wyślij"
   - `sendMessage(text)` wysyła zdarzenie `chat:message` do serwera
   - Serwer zapisuje wiadomość w `messageRepository`
   - Serwer rozgłasza (`io.emit`) wiadomość do **wszystkich** klientów
   - Wszyscy odbierają wiadomość i aktualizują UI

#### 6. **Powiadomienia:**
   - Gdy przychodzi nowa wiadomość, React sprawdza `message.userId`
   - Jeśli to **nie** jest własna wiadomość, odtwarza dźwięk
   - Animacja `slideUp` i `pulse` dla nowego dymka

#### 7. **Rozłączenie:**
   - Użytkownik zamyka przeglądarkę lub wylogowuje się
   - Zdarzenie `disconnect` uruchamia się na serwerze
   - Serwer usuwa użytkownika z `connectedUsers`
   - Broadcast nowej listy `users:online` do pozostałych

---

### 📊 Diagram przepływu:

```
┌─────────────┐         WebSocket          ┌─────────────┐
│   Klient 1  │ ◄─────────────────────────► │   Serwer    │
│  (Mama)     │                             │  Socket.io  │
└─────────────┘                             └─────────────┘
                                                   ▲
                                                   │
                    ┌──────────────────────────────┼──────────────┐
                    │                              │              │
              WebSocket                       WebSocket      WebSocket
                    │                              │              │
                    ▼                              ▼              ▼
            ┌─────────────┐              ┌─────────────┐  ┌─────────────┐
            │   Klient 2  │              │   Klient 3  │  │   Klient 4  │
            │   (Tata)    │              │  (Michał)   │  │   (Salon)   │
            └─────────────┘              └─────────────┘  └─────────────┘
```

**Broadcast** = Serwer wysyła wiadomość do **wszystkich** połączonych klientów jednocześnie!

---

## 🚀 Rozbudowa

### Pomysły na dalszy rozwój:

#### ✅ Łatwe:
- **Emoji picker** - dodaj wybór emoji
- **Timestamp formatting** - bardziej przyjazne daty ("2 minuty temu")
- **Typing indicator** - "Mama pisze..."
- **Avatary** - małe zdjęcia zamiast inicjałów
- **Dark mode** - ciemny motyw

#### 🔧 Średnie:
- **Wiele pokoi** - osobne kanały (#ogólny, #salon, #prywatne)
- **Prywatne wiadomości** - 1-on-1 czat
- **Pliki i zdjęcia** - upload obrazków
- **Edycja i usuwanie** - możliwość edycji własnych wiadomości
- **Notifications API** - powiadomienia systemowe przeglądarki

#### 🔥 Zaawansowane:
- **Baza danych** - SQLite/MongoDB/PostgreSQL
- **Reakcje na wiadomości** - ❤️ 👍 😂
- **Video/Audio chat** - WebRTC
- **Szyfrowanie** - E2E encryption
- **PWA** - Progressive Web App (działa offline)
- **Synchronizacja** - między wieloma urządzeniami tego samego użytkownika

---

## 🔒 Bezpieczeństwo

⚠️ **UWAGA:** Ta aplikacja jest zaprojektowana **tylko dla sieci domowej**.

### Aktualne zabezpieczenia:
- Proste hasła (w kodzie)
- Cookie-based sessions
- Brak HTTPS (nie jest potrzebne w LAN)

### Jeśli chcesz wystawić do internetu:
1. ❌ **NIE używaj tego kodu bez zmian!**
2. ✅ Dodaj HTTPS (Let's Encrypt)
3. ✅ Zastąp hasła przez bcrypt hashing
4. ✅ Użyj JWT lub secure session tokens
5. ✅ Dodaj rate limiting
6. ✅ Dodaj CSRF protection
7. ✅ Waliduj wszystkie dane wejściowe
8. ✅ Użyj environment variables dla sekretów

---

## 📄 Licencja

Projekt edukacyjny - możesz swobodnie modyfikować i używać w celach domowych.

---

## 🤝 Wsparcie

Masz pytania lub problemy?

1. Sprawdź konsolę przeglądarki (F12 → Console)
2. Sprawdź logi serwera w terminalu
3. Upewnij się, że porty nie są zablokowane przez firewall
4. Sprawdź, czy urządzenia są w tej samej sieci Wi-Fi

---

## 📝 Changelog

### v1.0.0 (2025-01-17)
- ✅ Pierwsze wydanie
- ✅ Logowanie z prostymi hasłami
- ✅ Czat w czasie rzeczywistym
- ✅ Powiadomienia dźwiękowe
- ✅ Messenger-style UI
- ✅ Lista użytkowników online

---

**Zbudowane z ❤️ dla komunikacji domowej**

🏠 **Miłego czatowania!**
