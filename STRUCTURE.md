# 📁 Struktura Projektu - Domowy Czat

## 🗂 Kompletna struktura katalogów

```
Communicator-socket/
│
├── 📄 README.md                      # Główna dokumentacja projektu
├── 📄 QUICKSTART.md                  # Szybki start (3 kroki)
├── 📄 SOCKETIO_GUIDE.md              # Przewodnik edukacyjny Socket.io
├── 📄 STRUCTURE.md                   # Ten plik - opis struktury
│
├── 📄 package.json                   # Zależności NPM
├── 📄 next.config.js                 # Konfiguracja Next.js
├── 📄 server.js                      # 🚀 Główny serwer (Next.js + Socket.io)
├── 📄 .gitignore                     # Pliki ignorowane przez Git
│
├── 📂 lib/                           # Biblioteki i logika biznesowa
│   ├── 📄 usersConfig.js            # ⚙️ Konfiguracja użytkowników i haseł
│   ├── 📄 messageRepository.js      # 💾 Zarządzanie historią wiadomości
│   └── 📄 socket.js                 # 🔌 Klient Socket.io (przeglądarka)
│
├── 📂 pages/                         # Strony Next.js
│   ├── 📄 _app.js                   # Wrapper aplikacji Next.js
│   ├── 📄 index.js                  # 🔐 Strona logowania
│   ├── 📄 chat.js                   # 💬 Strona czatu
│   │
│   └── 📂 api/                       # API Routes (backend endpoints)
│       ├── 📄 users.js              # GET /api/users - lista użytkowników
│       └── 📂 auth/
│           ├── 📄 login.js          # POST /api/auth/login
│           ├── 📄 logout.js         # POST /api/auth/logout
│           └── 📄 me.js             # GET /api/auth/me - sprawdź sesję
│
├── 📂 styles/                        # Style CSS
│   ├── 📄 globals.css               # Globalne style aplikacji
│   ├── 📄 Login.module.css          # Style strony logowania
│   └── 📄 Chat.module.css           # Style czatu (Messenger-style)
│
├── 📂 public/                        # Pliki statyczne (dostępne publicznie)
│   ├── 🔊 notification.wav          # Dźwięk powiadomienia
│   └── 📄 NOTIFICATION_SOUND.md     # Instrukcja zmiany dźwięku
│
└── 📂 scripts/                       # Skrypty pomocnicze
    └── 📄 generate_notification.py  # Generator dźwięku powiadomienia
```

---

## 📋 Szczegółowy opis plików

### 🎯 Główne pliki konfiguracyjne

#### `package.json`
Definiuje zależności i skrypty NPM:
- `npm run dev` - uruchamia w trybie development
- `npm run build` - buduje produkcyjną wersję
- `npm start` - uruchamia w trybie production

#### `server.js` ⭐
**Serce aplikacji!** Łączy Next.js z Socket.io:
- Inicjalizuje serwer HTTP
- Konfiguruje Socket.io
- Obsługuje połączenia WebSocket
- Zarządza użytkownikami online
- Broadcast wiadomości

#### `next.config.js`
Podstawowa konfiguracja Next.js

---

### 📚 Biblioteki (`lib/`)

#### `lib/usersConfig.js` 🔑
**Konfiguracja użytkowników:**
- Obiekt `USERS` z listą użytkowników
- Funkcja `validateUser()` - sprawdza hasło
- Funkcja `getUserById()` - pobiera dane użytkownika
- **Tu zmieniasz hasła i dodajesz użytkowników!**

#### `lib/messageRepository.js` 💾
**Zarządzanie historią:**
- `getAllMessages()` - pobiera wszystkie wiadomości
- `addMessage(message)` - dodaje nową wiadomość
- `clearAllMessages()` - czyści historię
- **Aktualnie przechowuje w pamięci** (tablica)
- **Zakomentowany kod** dla zapisu do pliku JSON
- **Instrukcje** jak dodać bazę danych

#### `lib/socket.js` 🔌
**Klient Socket.io (przeglądarka):**
- `initSocket(userId)` - inicjalizuje połączenie
- `sendMessage(text)` - wysyła wiadomość
- `onSocketEvent(event, callback)` - nasłuchuje zdarzeń
- `disconnectSocket()` - rozłącza
- **Używany w `pages/chat.js`**

---

### 🎨 Strony (`pages/`)

#### `pages/_app.js`
Wrapper Next.js - ładuje globalne style

#### `pages/index.js` 🔐
**Strona logowania:**
- Wyświetla kafelki użytkowników
- Formularz hasła
- Komunikacja z `/api/auth/login`
- Przekierowanie do `/chat` po zalogowaniu

#### `pages/chat.js` 💬
**Główna strona czatu:**
- Inicjalizacja Socket.io
- Wyświetlanie wiadomości
- Pole do wpisywania
- Lista użytkowników online
- Powiadomienia dźwiękowe
- Auto-scroll

---

### 🌐 API Routes (`pages/api/`)

#### `pages/api/users.js`
```
GET /api/users
```
Zwraca listę wszystkich użytkowników (bez haseł)

#### `pages/api/auth/login.js`
```
POST /api/auth/login
Body: { userId: string, password: string }
```
Sprawdza hasło i ustawia cookie z sesją

#### `pages/api/auth/logout.js`
```
POST /api/auth/logout
```
Usuwa cookie z sesją

#### `pages/api/auth/me.js`
```
GET /api/auth/me
```
Sprawdza, czy użytkownik jest zalogowany (na podstawie cookie)

---

### 🎨 Style (`styles/`)

#### `globals.css`
Globalne style CSS (reset, fonty)

#### `Login.module.css`
Style strony logowania:
- Kafelki użytkowników
- Formularz hasła
- Gradient background
- Animacje

#### `Chat.module.css`
Style czatu (Messenger-style):
- Dymki wiadomości
- Sidebar z użytkownikami
- Input field
- Animacje (slideUp, pulse)
- Responsywność

---

### 📦 Pliki publiczne (`public/`)

#### `notification.wav` 🔊
Prosty dźwięk powiadomienia (wygenerowany automatycznie)

#### `NOTIFICATION_SOUND.md`
Instrukcje:
- Jak zmienić dźwięk
- Skąd pobrać dźwięki
- Formaty (MP3, WAV)

---

### 🛠 Skrypty (`scripts/`)

#### `generate_notification.py`
Skrypt Python generujący prosty beep (440 Hz, 0.3s)

Użycie:
```bash
cd scripts
python3 generate_notification.py
```

---

## 🔄 Przepływ danych

### 1. Logowanie
```
pages/index.js
    ↓ (formularz)
POST /api/auth/login
    ↓ (sprawdza hasło w lib/usersConfig.js)
Ustawia cookie
    ↓
Przekierowanie → pages/chat.js
```

### 2. Inicjalizacja czatu
```
pages/chat.js
    ↓ (sprawdza sesję)
GET /api/auth/me
    ↓ (pobiera userId z cookie)
initSocket(userId) → lib/socket.js
    ↓ (WebSocket)
server.js → socket.on('connection')
    ↓
Wysyła historię + listę online
```

### 3. Wysłanie wiadomości
```
pages/chat.js (użytkownik wpisuje)
    ↓
sendMessage(text) → lib/socket.js
    ↓ (emit 'chat:message')
server.js → socket.on('chat:message')
    ↓
lib/messageRepository.js → addMessage()
    ↓
io.emit('chat:message') → BROADCAST
    ↓
Wszyscy klienci → pages/chat.js
    ↓ (React state update)
Renderowanie nowego dymka + dźwięk
```

---

## 📊 Zależności między plikami

```
server.js
├── requires: lib/usersConfig.js
├── requires: lib/messageRepository.js
└── serves: pages/* (Next.js)

pages/chat.js
├── imports: lib/socket.js
├── uses: /api/auth/me
└── renders: styles/Chat.module.css

pages/index.js
├── uses: /api/users
├── uses: /api/auth/login
└── renders: styles/Login.module.css

pages/api/auth/login.js
└── requires: lib/usersConfig.js

lib/socket.js
└── connects to: server.js (WebSocket)
```

---

## 🎯 Gdzie szukać czego?

| Potrzebuję...                    | Szukaj w...                   |
|----------------------------------|-------------------------------|
| Zmienić hasła                    | `lib/usersConfig.js`          |
| Dodać bazę danych                | `lib/messageRepository.js`    |
| Zmienić wygląd czatu             | `styles/Chat.module.css`      |
| Dodać nowe zdarzenie Socket.io   | `server.js` + `lib/socket.js` |
| Zmienić logikę logowania         | `pages/api/auth/login.js`     |
| Dodać nową stronę                | `pages/nazwa.js`              |
| Zmienić dźwięk powiadomienia     | `public/notification.wav`     |

---

## 🚀 Co dalej?

Sugerowane rozszerzenia (od najłatwiejszych):

1. **Emoji picker** - dodaj w `pages/chat.js`
2. **Typing indicator** - rozszerz `lib/socket.js` + `server.js`
3. **Wiele pokoi** - użyj `socket.join(room)` w `server.js`
4. **Baza danych** - zamień `lib/messageRepository.js`
5. **Private messages** - użyj `socket.to(userId).emit()`

---

**Teraz znasz każdy plik w projekcie! 🎓**
