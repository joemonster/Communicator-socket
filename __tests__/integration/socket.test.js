/**
 * Testy integracyjne dla Socket.io
 *
 * Sprawdzamy:
 * - Połączenie klienta z serwerem
 * - Rejestrację użytkownika
 * - Wysyłanie i odbieranie wiadomości
 * - Broadcast do wszystkich klientów
 * - Listę użytkowników online
 */

const { Server } = require('socket.io');
const { io: Client } = require('socket.io-client');
const { createServer } = require('http');
const { clearAllMessages } = require('../../lib/messageRepository');

describe('Socket.io Integration', () => {
  let io, serverSocket, clientSocket1, clientSocket2, httpServer;
  const PORT = 3001; // Inny port niż aplikacja

  beforeAll((done) => {
    // Utwórz serwer HTTP
    httpServer = createServer();

    // Utwórz serwer Socket.io
    io = new Server(httpServer);

    // Podstawowa obsługa połączeń (uproszczona wersja z server.js)
    const connectedUsers = new Map();

    io.on('connection', (socket) => {
      socket.on('user:register', (userId) => {
        connectedUsers.set(socket.id, {
          userId,
          userName: `User ${userId}`,
          socketId: socket.id
        });

        // Wyślij listę online
        const users = Array.from(connectedUsers.values()).map(u => ({
          userId: u.userId,
          userName: u.userName
        }));
        io.emit('users:online', users);
      });

      socket.on('chat:message', (data) => {
        const user = connectedUsers.get(socket.id);
        if (user) {
          const message = {
            id: `msg_${Date.now()}`,
            userId: user.userId,
            userName: user.userName,
            text: data.text,
            createdAt: new Date().toISOString()
          };
          io.emit('chat:message', message);
        }
      });

      socket.on('disconnect', () => {
        connectedUsers.delete(socket.id);
        const users = Array.from(connectedUsers.values()).map(u => ({
          userId: u.userId,
          userName: u.userName
        }));
        io.emit('users:online', users);
      });
    });

    // Uruchom serwer
    httpServer.listen(PORT, () => {
      done();
    });
  });

  afterAll((done) => {
    io.close();
    httpServer.close();
    done();
  });

  beforeEach(() => {
    clearAllMessages();
  });

  afterEach(() => {
    if (clientSocket1) {
      clientSocket1.disconnect();
      clientSocket1 = null;
    }
    if (clientSocket2) {
      clientSocket2.disconnect();
      clientSocket2 = null;
    }
  });

  it('powinno połączyć klienta z serwerem', (done) => {
    clientSocket1 = Client(`http://localhost:${PORT}`);

    clientSocket1.on('connect', () => {
      expect(clientSocket1.connected).toBe(true);
      done();
    });
  });

  it('powinno zarejestrować użytkownika i otrzymać listę online', (done) => {
    clientSocket1 = Client(`http://localhost:${PORT}`);

    clientSocket1.on('connect', () => {
      clientSocket1.emit('user:register', 'user1');
    });

    clientSocket1.on('users:online', (users) => {
      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0].userId).toBe('user1');
      done();
    });
  });

  it('powinno wysłać i odebrać wiadomość', (done) => {
    clientSocket1 = Client(`http://localhost:${PORT}`);

    clientSocket1.on('connect', () => {
      clientSocket1.emit('user:register', 'user1');
      clientSocket1.emit('chat:message', { text: 'Test wiadomości' });
    });

    clientSocket1.on('chat:message', (message) => {
      expect(message).toBeDefined();
      expect(message.text).toBe('Test wiadomości');
      expect(message.userId).toBe('user1');
      expect(message.id).toBeDefined();
      expect(message.createdAt).toBeDefined();
      done();
    });
  });

  it('powinno broadcast wiadomość do wszystkich klientów', (done) => {
    clientSocket1 = Client(`http://localhost:${PORT}`);
    clientSocket2 = Client(`http://localhost:${PORT}`);

    let receivedCount = 0;
    const testMessage = 'Broadcast test';

    const checkDone = () => {
      receivedCount++;
      if (receivedCount === 2) {
        done();
      }
    };

    clientSocket1.on('connect', () => {
      clientSocket1.emit('user:register', 'user1');
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit('user:register', 'user2');

      // Wyślij wiadomość z klienta 2
      clientSocket2.emit('chat:message', { text: testMessage });
    });

    // Oba klienty powinny odebrać wiadomość
    clientSocket1.on('chat:message', (message) => {
      if (message.text === testMessage) {
        expect(message.userId).toBe('user2');
        checkDone();
      }
    });

    clientSocket2.on('chat:message', (message) => {
      if (message.text === testMessage) {
        expect(message.userId).toBe('user2');
        checkDone();
      }
    });
  });

  it('powinno aktualizować listę użytkowników online', (done) => {
    clientSocket1 = Client(`http://localhost:${PORT}`);
    clientSocket2 = Client(`http://localhost:${PORT}`);

    let updateCount = 0;

    clientSocket1.on('users:online', (users) => {
      updateCount++;

      if (updateCount === 1) {
        // Pierwsza aktualizacja - tylko user1
        expect(users.length).toBe(1);
        expect(users[0].userId).toBe('user1');
      } else if (updateCount === 2) {
        // Druga aktualizacja - user1 i user2
        expect(users.length).toBe(2);
        const userIds = users.map(u => u.userId);
        expect(userIds).toContain('user1');
        expect(userIds).toContain('user2');
        done();
      }
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit('user:register', 'user1');

      // Poczekaj chwilę, potem połącz drugiego klienta
      setTimeout(() => {
        clientSocket2.on('connect', () => {
          clientSocket2.emit('user:register', 'user2');
        });
      }, 100);
    });
  });

  it('powinno usunąć użytkownika z listy online po rozłączeniu', (done) => {
    clientSocket1 = Client(`http://localhost:${PORT}`);
    clientSocket2 = Client(`http://localhost:${PORT}`);

    let updateCount = 0;

    clientSocket1.on('users:online', (users) => {
      updateCount++;

      if (updateCount === 3) {
        // Po rozłączeniu user2 - tylko user1
        expect(users.length).toBe(1);
        expect(users[0].userId).toBe('user1');
        done();
      }
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit('user:register', 'user1');
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit('user:register', 'user2');

      // Poczekaj, potem rozłącz klienta 2
      setTimeout(() => {
        clientSocket2.disconnect();
      }, 100);
    });
  });
});
