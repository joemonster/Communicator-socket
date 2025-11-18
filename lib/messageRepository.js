/**
 * REPOZYTORIUM WIADOMOŚCI
 *
 * Aktualnie wiadomości są przechowywane w pamięci (tablica messages).
 * Po restarcie serwera historia się zeruje.
 *
 * JAK ZMIENIĆ NA BAZĘ DANYCH:
 * 1. Zainstaluj driver bazy (np. sqlite3, mongodb, pg)
 * 2. Zamień implementację getAllMessages() i addMessage()
 * 3. W getAllMessages() - wykonaj SELECT/find() z bazy
 * 4. W addMessage() - wykonaj INSERT/create() do bazy
 * 5. Zachowaj te same interfejsy (zwracany typ Message)
 *
 * Struktura wiadomości (Message):
 * {
 *   id: string,          // unikalny identyfikator
 *   userId: string,      // id użytkownika
 *   userName: string,    // nazwa wyświetlana
 *   text: string,        // treść wiadomości
 *   createdAt: string,   // timestamp w formacie ISO
 *   reactions: object    // reakcje: { "❤️": ["userId1", "userId2"], "👍": ["userId3"] }
 * }
 */

// Tymczasowe przechowywanie w pamięci
let messages = [];

/**
 * Pobiera wszystkie wiadomości z historii
 * @returns {Array} tablica wiadomości
 */
function getAllMessages() {
  // TUTAJ: Zamień na SELECT * FROM messages ORDER BY createdAt ASC
  return [...messages];
}

/**
 * Dodaje nową wiadomość do historii
 * @param {Object} message - obiekt wiadomości
 * @returns {Object} dodana wiadomość
 */
function addMessage(message) {
  // Walidacja
  if (!message.userId || !message.userName || !message.text) {
    throw new Error('Nieprawidłowa struktura wiadomości');
  }

  // Tworzenie pełnej wiadomości z ID i timestampem
  const fullMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: message.userId,
    userName: message.userName,
    text: message.text.trim(),
    createdAt: new Date().toISOString(),
    reactions: {} // Puste reakcje na start
  };

  // TUTAJ: Zamień na INSERT INTO messages VALUES (...)
  messages.push(fullMessage);

  // Opcjonalnie: ogranicz rozmiar tablicy w pamięci (np. do ostatnich 1000 wiadomości)
  if (messages.length > 1000) {
    messages = messages.slice(-1000);
  }

  return fullMessage;
}

/**
 * Czyści całą historię (użyteczne do testów)
 */
function clearAllMessages() {
  // TUTAJ: Zamień na DELETE FROM messages
  messages = [];
}

/**
 * Dodaje lub usuwa reakcję na wiadomość
 * @param {string} messageId - ID wiadomości
 * @param {string} emoji - emoji reakcji
 * @param {string} userId - ID użytkownika reagującego
 * @returns {object|null} zaktualizowane reakcje lub null jeśli wiadomość nie istnieje
 */
function addReaction(messageId, emoji, userId) {
  const message = messages.find(m => m.id === messageId);

  if (!message) {
    return null;
  }

  // Inicjalizuj reactions jeśli nie istnieje
  if (!message.reactions) {
    message.reactions = {};
  }

  // Inicjalizuj tablicę dla danego emoji jeśli nie istnieje
  if (!message.reactions[emoji]) {
    message.reactions[emoji] = [];
  }

  // Toggle reakcji - dodaj lub usuń
  const userIndex = message.reactions[emoji].indexOf(userId);
  if (userIndex === -1) {
    // Dodaj reakcję
    message.reactions[emoji].push(userId);
  } else {
    // Usuń reakcję
    message.reactions[emoji].splice(userIndex, 1);
    // Usuń emoji jeśli nikt nie ma tej reakcji
    if (message.reactions[emoji].length === 0) {
      delete message.reactions[emoji];
    }
  }

  return message.reactions;
}

/**
 * Opcjonalnie: zapisz wiadomości do pliku JSON (backup)
 * Odkomentuj, jeśli chcesz mieć prostą trwałość między restartami
 */
/*
const fs = require('fs');
const path = require('path');
const MESSAGES_FILE = path.join(__dirname, '../data/messages.json');

function saveToFile() {
  try {
    fs.mkdirSync(path.dirname(MESSAGES_FILE), { recursive: true });
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  } catch (err) {
    console.error('Błąd zapisu wiadomości do pliku:', err);
  }
}

function loadFromFile() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      messages = JSON.parse(data);
      console.log(`Wczytano ${messages.length} wiadomości z pliku`);
    }
  } catch (err) {
    console.error('Błąd odczytu wiadomości z pliku:', err);
  }
}

// Automatyczne wczytanie przy starcie
loadFromFile();

// Modyfikuj addMessage, aby zapisywał do pliku
const originalAddMessage = addMessage;
addMessage = function(message) {
  const result = originalAddMessage(message);
  saveToFile();
  return result;
};
*/

module.exports = {
  getAllMessages,
  addMessage,
  clearAllMessages,
  addReaction
};
