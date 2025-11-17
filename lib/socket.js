/**
 * SOCKET.IO - KLIENT
 *
 * Ten moduł zarządza połączeniem Socket.io po stronie przeglądarki.
 *
 * Jak działa:
 * 1. Użytkownik loguje się → strona czatu inicjalizuje połączenie przez initSocket()
 * 2. Klient rejestruje się na serwerze przez zdarzenie 'user:register'
 * 3. Serwer wysyła historię wiadomości i listę użytkowników online
 * 4. Klient może wysyłać wiadomości i odbierać nowe w czasie rzeczywistym
 * 5. Przy rozłączeniu klient próbuje automatycznie się połączyć ponownie
 *
 * Edukacyjne wyjaśnienie Socket.io:
 * - Socket.io używa WebSocket (lub innych metod) do dwukierunkowej komunikacji
 * - emit() wysyła zdarzenie do serwera
 * - on() nasłuchuje zdarzeń od serwera
 * - Automatyczne reconnect w przypadku utraty połączenia
 */

import { io } from 'socket.io-client';

let socket = null;

/**
 * Inicjalizuje połączenie Socket.io
 * @param {string} userId - ID zalogowanego użytkownika
 * @returns {object} instancja socket
 */
export function initSocket(userId) {
  // Jeśli już jest połączenie, zamknij je
  if (socket) {
    socket.disconnect();
  }

  // Utwórz nowe połączenie
  socket = io({
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  // Zdarzenie: połączono
  socket.on('connect', () => {
    console.log('✅ Socket.io połączony:', socket.id);

    // Zarejestruj użytkownika na serwerze
    socket.emit('user:register', userId);
  });

  // Zdarzenie: rozłączono
  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.io rozłączony:', reason);
  });

  // Zdarzenie: błąd połączenia
  socket.on('connect_error', (error) => {
    console.error('🔴 Błąd połączenia Socket.io:', error);
  });

  return socket;
}

/**
 * Wysyła wiadomość na czat
 * @param {string} text - treść wiadomości
 */
export function sendMessage(text) {
  if (!socket || !socket.connected) {
    console.error('Socket nie jest połączony');
    return false;
  }

  socket.emit('chat:message', { text });
  return true;
}

/**
 * Wysyła informację, że użytkownik pisze
 * @param {boolean} isTyping - czy użytkownik pisze
 */
export function sendTyping(isTyping) {
  if (!socket || !socket.connected) {
    return;
  }

  socket.emit('chat:typing', isTyping);
}

/**
 * Nasłuchuje zdarzeń Socket.io
 * @param {string} event - nazwa zdarzenia
 * @param {function} callback - funkcja obsługująca zdarzenie
 */
export function onSocketEvent(event, callback) {
  if (!socket) {
    console.warn('Socket nie został zainicjalizowany');
    return;
  }

  socket.on(event, callback);
}

/**
 * Usuwa nasłuchiwanie zdarzenia
 * @param {string} event - nazwa zdarzenia
 * @param {function} callback - funkcja do usunięcia (opcjonalnie)
 */
export function offSocketEvent(event, callback) {
  if (!socket) {
    return;
  }

  if (callback) {
    socket.off(event, callback);
  } else {
    socket.off(event);
  }
}

/**
 * Rozłącza socket
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Sprawdza, czy socket jest połączony
 */
export function isConnected() {
  return socket && socket.connected;
}

/**
 * Pobiera instancję socketu (do zaawansowanych użyć)
 */
export function getSocket() {
  return socket;
}
