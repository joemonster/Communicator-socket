/**
 * GŁÓWNY SERWER APLIKACJI
 *
 * Ten serwer łączy Next.js z Socket.io.
 * Nasłuchuje na porcie 3000 (można zmienić przez PORT w zmiennych środowiskowych).
 *
 * Architektura:
 * 1. Next.js obsługuje routing stron i API routes
 * 2. Socket.io działa na tym samym porcie co Next.js
 * 3. Komunikacja w czasie rzeczywistym odbywa się przez Socket.io
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { getUserById } = require('./lib/usersConfig');
const { getAllMessages, addMessage, addReaction, getOlderMessages, hasOlderMessages } = require('./lib/messageRepository');
const { initDatabase, startCleanupScheduler } = require('./lib/database');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Nasłuchuj na wszystkich interfejsach (dostęp z sieci lokalnej)
const port = process.env.PORT || 3000;

// Inicjalizacja Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Inicjalizacja bazy danych SQLite
  initDatabase();

  // Uruchom periodyczne czyszczenie starych danych
  startCleanupScheduler();

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Błąd obsługi żądania:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Inicjalizacja Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: '*', // W sieci lokalnej możemy to uprościć
      methods: ['GET', 'POST']
    }
  });

  /**
   * SOCKET.IO - OBSŁUGA POŁĄCZEŃ
   *
   * Główne zdarzenia:
   * - connection: nowe połączenie klienta
   * - disconnect: rozłączenie klienta
   * - chat:message: nowa wiadomość od klienta
   * - chat:typing: użytkownik pisze (opcjonalnie)
   */

  // Przechowywanie aktywnych użytkowników
  // Struktura: { socketId: { userId, userName } }
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`🔌 Nowe połączenie: ${socket.id}`);

    /**
     * Rejestracja użytkownika po połączeniu
     * Klient wysyła swoje userId, serwer weryfikuje i zapisuje
     */
    socket.on('user:register', (userId) => {
      const user = getUserById(userId);

      if (user) {
        connectedUsers.set(socket.id, {
          userId: user.id,
          userName: user.name,
          socketId: socket.id
        });

        console.log(`👤 Użytkownik zalogowany: ${user.name} (${socket.id})`);

        // Wyślij historię wiadomości do nowego użytkownika
        const history = getAllMessages();
        socket.emit('chat:history', history);

        // Zaktualizuj listę online użytkowników dla wszystkich
        broadcastOnlineUsers();
      }
    });

    /**
     * Obsługa nowej wiadomości (tekst lub obrazek)
     */
    socket.on('chat:message', (data) => {
      const user = connectedUsers.get(socket.id);

      if (!user) {
        socket.emit('error', { message: 'Nie jesteś zalogowany' });
        return;
      }

      try {
        // Zapisz wiadomość w repozytorium
        const message = addMessage({
          userId: user.userId,
          userName: user.userName,
          text: data.text || null,
          attachmentId: data.attachmentId || null
        });

        if (data.attachmentId) {
          console.log(`📷 Obrazek od ${user.userName}`);
        } else {
          console.log(`💬 Wiadomość od ${user.userName}: ${data.text}`);
        }

        // Rozgłoś wiadomość do wszystkich klientów
        io.emit('chat:message', message);
      } catch (err) {
        console.error('Błąd obsługi wiadomości:', err);
        socket.emit('error', { message: 'Nie udało się wysłać wiadomości' });
      }
    });

    /**
     * Obsługa ładowania starszych wiadomości
     */
    socket.on('chat:loadOlder', (data) => {
      const user = connectedUsers.get(socket.id);

      if (!user) {
        socket.emit('error', { message: 'Nie jesteś zalogowany' });
        return;
      }

      try {
        const olderMessages = getOlderMessages(data.beforeDate, data.limit || 50);
        const hasMore = olderMessages.length > 0 && hasOlderMessages(olderMessages[0]?.createdAt);

        socket.emit('chat:olderMessages', {
          messages: olderMessages,
          hasMore
        });

        console.log(`📜 Załadowano ${olderMessages.length} starszych wiadomości dla ${user.userName}`);
      } catch (err) {
        console.error('Błąd ładowania starszych wiadomości:', err);
        socket.emit('error', { message: 'Nie udało się załadować starszych wiadomości' });
      }
    });

    /**
     * Obsługa "użytkownik pisze"
     */
    socket.on('chat:typing', (isTyping) => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        socket.broadcast.emit('user:typing', {
          userId: user.userId,
          userName: user.userName,
          isTyping
        });
      }
    });

    /**
     * Obsługa reakcji na wiadomości
     */
    socket.on('message:reaction', (data) => {
      const user = connectedUsers.get(socket.id);

      if (!user) {
        socket.emit('error', { message: 'Nie jesteś zalogowany' });
        return;
      }

      try {
        const reactions = addReaction(
          data.messageId,
          data.emoji,
          data.userId
        );

        if (reactions) {
          // Rozgłoś zaktualizowane reakcje do wszystkich
          io.emit('message:reaction', {
            messageId: data.messageId,
            reactions
          });

          console.log(`👍 ${user.userName} reaguje ${data.emoji} na wiadomość`);
        }
      } catch (err) {
        console.error('Błąd dodawania reakcji:', err);
      }
    });

    /**
     * Rozłączenie użytkownika
     */
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id);

      if (user) {
        console.log(`👋 Użytkownik rozłączony: ${user.userName} (${socket.id})`);
        connectedUsers.delete(socket.id);
        broadcastOnlineUsers();
      } else {
        console.log(`🔌 Rozłączenie: ${socket.id}`);
      }
    });
  });

  /**
   * Pomocnicza funkcja: rozgłasza listę użytkowników online
   */
  function broadcastOnlineUsers() {
    const users = Array.from(connectedUsers.values()).map(u => ({
      userId: u.userId,
      userName: u.userName
    }));

    // Unikalne użytkowników (jeden użytkownik może mieć wiele połączeń)
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.userId, u])).values()
    );

    io.emit('users:online', uniqueUsers);
    console.log(`📡 Online użytkownicy:`, uniqueUsers.map(u => u.userName).join(', ') || 'brak');
  }

  // Start serwera
  httpServer.listen(port, () => {
    console.log('');
    console.log('🏠 ========================================');
    console.log('   DOMOWY CZAT - Serwer uruchomiony!');
    console.log('========================================');
    console.log('');
    console.log(`🌐 Lokalny dostęp:     http://localhost:${port}`);
    console.log(`📱 Z innych urządzeń:  http://<IP_SERWERA>:${port}`);
    console.log('');
    console.log('💡 Aby znaleźć IP serwera, użyj komendy:');
    console.log('   - Windows: ipconfig');
    console.log('   - Linux/Mac: ip addr lub ifconfig');
    console.log('');
    console.log(`🔧 Tryb: ${dev ? 'development' : 'production'}`);
    console.log('========================================');
    console.log('');
  });
});
