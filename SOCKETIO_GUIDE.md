# 📖 Socket.io - Przewodnik Edukacyjny

## Co to jest Socket.io?

Socket.io to biblioteka JavaScript, która umożliwia **dwukierunkową komunikację w czasie rzeczywistym** między serwerem a przeglądarką.

### Główne cechy:
- ✅ **Real-time** - wiadomości docierają natychmiast
- ✅ **Dwukierunkowa** - serwer ↔ klient mogą się swobodnie komunikować
- ✅ **Automatyczne reconnect** - po utracie połączenia automatycznie się łączy
- ✅ **Fallback** - jeśli WebSocket nie działa, używa innych metod
- ✅ **Room support** - łatwe grupowanie użytkowników

---

## 🔄 Tradycyjne HTTP vs Socket.io

### Tradycyjne HTTP:
```
Klient  →  [REQUEST]  →  Serwer
        ←  [RESPONSE] ←
```
- Klient **zawsze** inicjuje komunikację
- Serwer **nie może** wysłać danych bez zapytania
- Każde żądanie to nowe połączenie

### Socket.io (WebSocket):
```
Klient  ⇄  [PERSISTENT CONNECTION]  ⇄  Serwer
```
- Połączenie jest **stałe**
- **Obie strony** mogą wysyłać dane w dowolnym momencie
- **Jedno** połączenie dla wielu wiadomości

---

## 📡 Jak działa w naszej aplikacji

### 1. Inicjalizacja połączenia

**Serwer (server.js):**
```javascript
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log('Nowy użytkownik:', socket.id);

  // Tutaj obsługujemy zdarzenia...
});
```

**Klient (lib/socket.js):**
```javascript
import { io } from 'socket.io-client';

const socket = io();  // Połącz się z serwerem

socket.on('connect', () => {
  console.log('Połączono!', socket.id);
});
```

---

### 2. Wysyłanie zdarzeń

#### Klient → Serwer (emit):
```javascript
// Klient wysyła wiadomość
socket.emit('chat:message', { text: 'Cześć!' });
```

```javascript
// Serwer odbiera
socket.on('chat:message', (data) => {
  console.log('Otrzymano:', data.text);
});
```

#### Serwer → Klient (emit):
```javascript
// Serwer wysyła do WSZYSTKICH
io.emit('chat:message', message);

// Serwer wysyła do JEDNEGO klienta
socket.emit('error', { message: 'Błąd!' });

// Serwer wysyła do WSZYSTKICH OPRÓCZ nadawcy
socket.broadcast.emit('user:joined', { name: 'Mama' });
```

---

### 3. Przepływ wiadomości w naszej aplikacji

```
┌──────────────────────────────────────────────────────────┐
│ 1. Użytkownik wpisuje wiadomość "Cześć!"                  │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 2. React wywołuje: sendMessage('Cześć!')                  │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 3. socket.emit('chat:message', { text: 'Cześć!' })        │
│    [Wysłanie do serwera przez WebSocket]                  │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 4. SERWER otrzymuje zdarzenie 'chat:message'              │
│    - Odczytuje userId z connectedUsers                    │
│    - Tworzy obiekt wiadomości                             │
│    - Zapisuje do messageRepository                        │
└───────────────────┬──────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────────┐
│ 5. io.emit('chat:message', message)                       │
│    [BROADCAST - wysyłka do WSZYSTKICH klientów]           │
└───────────────────┬──────────────────────────────────────┘
                    │
        ┌───────────┴───────────┬───────────┐
        │                       │           │
        ▼                       ▼           ▼
   ┌─────────┐            ┌─────────┐  ┌─────────┐
   │ Klient 1│            │ Klient 2│  │ Klient 3│
   │ (Mama)  │            │ (Tata)  │  │ (Michał)│
   └────┬────┘            └────┬────┘  └────┬────┘
        │                      │            │
        ▼                      ▼            ▼
┌──────────────────────────────────────────────────────────┐
│ 6. Każdy klient odbiera 'chat:message'                    │
│    - Sprawdza, czy wiadomość jest od siebie               │
│    - Jeśli NIE, odtwarza dźwięk                           │
│    - Dodaje wiadomość do state (setMessages)              │
│    - React renderuje nowy dymek                           │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Kluczowe zdarzenia w aplikacji

### Zdarzenia klienta → serwer:

| Zdarzenie        | Kiedy                           | Dane                      |
|------------------|---------------------------------|---------------------------|
| `user:register`  | Po połączeniu z serwerem        | `userId` (string)         |
| `chat:message`   | Wysłanie wiadomości             | `{ text: string }`        |
| `chat:typing`    | Użytkownik pisze (opcjonalnie)  | `boolean`                 |
| `disconnect`     | Zamknięcie przeglądarki/logout  | (automatyczne)            |

### Zdarzenia serwer → klient:

| Zdarzenie        | Kiedy                           | Dane                      |
|------------------|---------------------------------|---------------------------|
| `chat:history`   | Zaraz po połączeniu             | `Message[]`               |
| `chat:message`   | Nowa wiadomość od kogokolwiek   | `Message`                 |
| `users:online`   | Ktoś dołączył/wyszedł           | `User[]`                  |
| `error`          | Błąd (np. brak autoryzacji)     | `{ message: string }`     |

---

## 💡 Przydatne wzorce

### 1. Acknowledgments (potwierdzenia)

```javascript
// Klient
socket.emit('chat:message', { text: 'Cześć' }, (response) => {
  if (response.ok) {
    console.log('Wiadomość wysłana!');
  }
});

// Serwer
socket.on('chat:message', (data, callback) => {
  // Przetwórz wiadomość...
  callback({ ok: true });
});
```

### 2. Pokoje (Rooms)

```javascript
// Dołącz do pokoju
socket.join('salon');

// Wyślij tylko do pokoju
io.to('salon').emit('message', 'Tylko dla salonu');

// Opuść pokój
socket.leave('salon');
```

### 3. Namespaces (różne kanały)

```javascript
// Serwer
const chatNamespace = io.of('/chat');
const notificationsNamespace = io.of('/notifications');

// Klient
const chatSocket = io('/chat');
const notifSocket = io('/notifications');
```

---

## 🔧 Debugging

### 1. Sprawdź status połączenia:
```javascript
console.log('Połączony:', socket.connected);
console.log('ID socketu:', socket.id);
```

### 2. Loguj wszystkie zdarzenia:
```javascript
// Klient
socket.onAny((event, ...args) => {
  console.log(`Zdarzenie: ${event}`, args);
});
```

### 3. Sprawdź aktywne połączenia (serwer):
```javascript
console.log('Połączonych:', io.engine.clientsCount);
```

### 4. DevTools Network:
- Otwórz DevTools (F12)
- Zakładka **Network**
- Filtr: **WS** (WebSocket)
- Zobacz ruch danych w czasie rzeczywistym

---

## 🚀 Optymalizacja

### 1. Binary data
Socket.io może wysyłać binarne dane (obrazy, pliki):
```javascript
socket.emit('image', buffer);
```

### 2. Compression
Automatyczna kompresja dla dużych wiadomości:
```javascript
const io = new Server(httpServer, {
  perMessageDeflate: true
});
```

### 3. Middleware
Walidacja przed połączeniem:
```javascript
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (isValid(token)) {
    next();
  } else {
    next(new Error('Invalid token'));
  }
});
```

---

## 📚 Dodatkowe zasoby

- **Oficjalna dokumentacja:** https://socket.io/docs/
- **Przykłady:** https://socket.io/get-started/
- **GitHub:** https://github.com/socketio/socket.io

---

## 🎓 Ćwiczenia

Spróbuj dodać te funkcje samodzielnie:

1. **Typing indicator** - pokaż "X pisze..." gdy ktoś wpisuje wiadomość
2. **Online/Offline status** - pokaż kropkę przy użytkownikach (zielona/szara)
3. **Private messages** - wyślij wiadomość tylko do jednego użytkownika
4. **Message reactions** - dodaj reakcje (👍 ❤️) do wiadomości
5. **Rooms** - utwórz wiele pokoi (#ogólny, #losowe)

---

**Socket.io to potężne narzędzie - teraz wiesz jak go używać! 🎉**
