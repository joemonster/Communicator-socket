/**
 * REPOZYTORIUM WIADOMOŚCI - SQLite
 *
 * Zarządza wiadomościami czatu w bazie SQLite.
 * Obsługuje wiadomości tekstowe i z załącznikami (obrazki).
 *
 * Struktura wiadomości (Message):
 * {
 *   id: string,          // unikalny identyfikator
 *   userId: string,      // id użytkownika
 *   userName: string,    // nazwa wyświetlana
 *   text: string,        // treść wiadomości (może być null dla obrazków)
 *   type: string,        // 'text' lub 'image'
 *   attachmentId: string, // id załącznika (dla obrazków)
 *   attachment: object,  // dane załącznika (przy pobieraniu)
 *   createdAt: string,   // timestamp w formacie ISO
 *   reactions: object    // reakcje: { "❤️": ["userId1"], "👍": ["userId2"] }
 * }
 */

const crypto = require('crypto');
const { getDatabase } = require('./database');
const config = require('./storageConfig');

// Funkcja generująca UUID
const uuidv4 = () => crypto.randomUUID();

/**
 * Pobiera wiadomości z określonego zakresu czasowego
 * @param {number} days - liczba dni wstecz (domyślnie z konfiguracji)
 * @param {number} offset - offset dla paginacji
 * @param {number} limit - limit wiadomości
 * @returns {Array} tablica wiadomości
 */
function getMessages(days = config.CLIENT_DEFAULT_DAYS, offset = 0, limit = 1000) {
  const db = getDatabase();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffISO = cutoffDate.toISOString();

  const messages = db.prepare(`
    SELECT
      m.id,
      m.user_id as userId,
      m.user_name as userName,
      m.text,
      m.type,
      m.attachment_id as attachmentId,
      m.created_at as createdAt,
      a.filename as attachmentFilename,
      a.original_name as attachmentOriginalName,
      a.mime_type as attachmentMimeType,
      a.size as attachmentSize,
      a.width as attachmentWidth,
      a.height as attachmentHeight
    FROM messages m
    LEFT JOIN attachments a ON m.attachment_id = a.id
    WHERE m.created_at >= ?
    ORDER BY m.created_at ASC
    LIMIT ? OFFSET ?
  `).all(cutoffISO, limit, offset);

  // Pobierz reakcje dla wszystkich wiadomości
  const messageIds = messages.map(m => m.id);
  const reactionsMap = getReactionsForMessages(messageIds);

  // Formatuj wynik
  return messages.map(msg => {
    const result = {
      id: msg.id,
      userId: msg.userId,
      userName: msg.userName,
      text: msg.text,
      type: msg.type || 'text',
      createdAt: msg.createdAt,
      reactions: reactionsMap[msg.id] || {}
    };

    // Dodaj dane załącznika jeśli istnieje
    if (msg.attachmentId) {
      result.attachmentId = msg.attachmentId;
      result.attachment = {
        id: msg.attachmentId,
        filename: msg.attachmentFilename,
        originalName: msg.attachmentOriginalName,
        mimeType: msg.attachmentMimeType,
        size: msg.attachmentSize,
        width: msg.attachmentWidth,
        height: msg.attachmentHeight
      };
    }

    return result;
  });
}

/**
 * Pobiera wszystkie wiadomości (dla kompatybilności wstecznej)
 * @returns {Array} tablica wiadomości
 */
function getAllMessages() {
  return getMessages(config.CLIENT_DEFAULT_DAYS);
}

/**
 * Pobiera starsze wiadomości (przed określoną datą)
 * @param {string} beforeDate - data ISO przed którą pobierać
 * @param {number} limit - limit wiadomości
 * @returns {Array} tablica wiadomości
 */
function getOlderMessages(beforeDate, limit = 50) {
  const db = getDatabase();

  const messages = db.prepare(`
    SELECT
      m.id,
      m.user_id as userId,
      m.user_name as userName,
      m.text,
      m.type,
      m.attachment_id as attachmentId,
      m.created_at as createdAt,
      a.filename as attachmentFilename,
      a.original_name as attachmentOriginalName,
      a.mime_type as attachmentMimeType,
      a.size as attachmentSize,
      a.width as attachmentWidth,
      a.height as attachmentHeight
    FROM messages m
    LEFT JOIN attachments a ON m.attachment_id = a.id
    WHERE m.created_at < ?
    ORDER BY m.created_at DESC
    LIMIT ?
  `).all(beforeDate, limit);

  const messageIds = messages.map(m => m.id);
  const reactionsMap = getReactionsForMessages(messageIds);

  return messages.reverse().map(msg => {
    const result = {
      id: msg.id,
      userId: msg.userId,
      userName: msg.userName,
      text: msg.text,
      type: msg.type || 'text',
      createdAt: msg.createdAt,
      reactions: reactionsMap[msg.id] || {}
    };

    if (msg.attachmentId) {
      result.attachmentId = msg.attachmentId;
      result.attachment = {
        id: msg.attachmentId,
        filename: msg.attachmentFilename,
        originalName: msg.attachmentOriginalName,
        mimeType: msg.attachmentMimeType,
        size: msg.attachmentSize,
        width: msg.attachmentWidth,
        height: msg.attachmentHeight
      };
    }

    return result;
  });
}

/**
 * Pobiera reakcje dla wielu wiadomości
 * @param {Array} messageIds - tablica ID wiadomości
 * @returns {Object} mapa reakcji { messageId: { emoji: [userIds] } }
 */
function getReactionsForMessages(messageIds) {
  if (!messageIds.length) return {};

  const db = getDatabase();
  const placeholders = messageIds.map(() => '?').join(',');

  const reactions = db.prepare(`
    SELECT message_id, user_id, emoji
    FROM reactions
    WHERE message_id IN (${placeholders})
  `).all(...messageIds);

  const result = {};
  for (const reaction of reactions) {
    if (!result[reaction.message_id]) {
      result[reaction.message_id] = {};
    }
    if (!result[reaction.message_id][reaction.emoji]) {
      result[reaction.message_id][reaction.emoji] = [];
    }
    result[reaction.message_id][reaction.emoji].push(reaction.user_id);
  }

  return result;
}

/**
 * Dodaje nową wiadomość tekstową
 * @param {Object} message - obiekt wiadomości
 * @returns {Object} dodana wiadomość
 */
function addMessage(message) {
  if (!message.userId || !message.userName) {
    throw new Error('Nieprawidłowa struktura wiadomości');
  }

  // Dla wiadomości tekstowych wymagamy tekstu
  if (!message.attachmentId && !message.text) {
    throw new Error('Wiadomość musi zawierać tekst lub załącznik');
  }

  const db = getDatabase();
  const id = `msg_${Date.now()}_${uuidv4().slice(0, 8)}`;
  const createdAt = new Date().toISOString();
  const type = message.attachmentId ? 'image' : 'text';

  db.prepare(`
    INSERT INTO messages (id, user_id, user_name, text, type, attachment_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    message.userId,
    message.userName,
    message.text ? message.text.trim() : null,
    type,
    message.attachmentId || null,
    createdAt
  );

  const result = {
    id,
    userId: message.userId,
    userName: message.userName,
    text: message.text ? message.text.trim() : null,
    type,
    createdAt,
    reactions: {}
  };

  // Jeśli jest załącznik, pobierz jego dane
  if (message.attachmentId) {
    const attachment = getAttachment(message.attachmentId);
    if (attachment) {
      result.attachmentId = message.attachmentId;
      result.attachment = attachment;
    }
  }

  return result;
}

/**
 * Dodaje załącznik (metadane obrazka)
 * @param {Object} attachmentData - dane załącznika
 * @returns {Object} zapisany załącznik
 */
function addAttachment(attachmentData) {
  const db = getDatabase();
  const id = `att_${Date.now()}_${uuidv4().slice(0, 8)}`;
  const createdAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO attachments (id, filename, original_name, mime_type, size, width, height, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    attachmentData.filename,
    attachmentData.originalName,
    attachmentData.mimeType,
    attachmentData.size,
    attachmentData.width || null,
    attachmentData.height || null,
    createdAt
  );

  return {
    id,
    filename: attachmentData.filename,
    originalName: attachmentData.originalName,
    mimeType: attachmentData.mimeType,
    size: attachmentData.size,
    width: attachmentData.width,
    height: attachmentData.height,
    createdAt
  };
}

/**
 * Pobiera załącznik po ID
 * @param {string} attachmentId - ID załącznika
 * @returns {Object|null} dane załącznika
 */
function getAttachment(attachmentId) {
  const db = getDatabase();

  const attachment = db.prepare(`
    SELECT id, filename, original_name as originalName, mime_type as mimeType,
           size, width, height, created_at as createdAt
    FROM attachments
    WHERE id = ?
  `).get(attachmentId);

  return attachment || null;
}

/**
 * Dodaje lub usuwa reakcję na wiadomość (toggle)
 * @param {string} messageId - ID wiadomości
 * @param {string} emoji - emoji reakcji
 * @param {string} userId - ID użytkownika
 * @returns {object|null} zaktualizowane reakcje
 */
function addReaction(messageId, emoji, userId) {
  const db = getDatabase();

  // Sprawdź czy wiadomość istnieje
  const message = db.prepare('SELECT id FROM messages WHERE id = ?').get(messageId);
  if (!message) {
    return null;
  }

  // Sprawdź czy reakcja już istnieje
  const existingReaction = db.prepare(`
    SELECT id FROM reactions WHERE message_id = ? AND user_id = ? AND emoji = ?
  `).get(messageId, userId, emoji);

  if (existingReaction) {
    // Usuń reakcję
    db.prepare('DELETE FROM reactions WHERE id = ?').run(existingReaction.id);
  } else {
    // Dodaj reakcję
    db.prepare(`
      INSERT INTO reactions (message_id, user_id, emoji, created_at)
      VALUES (?, ?, ?, ?)
    `).run(messageId, userId, emoji, new Date().toISOString());
  }

  // Pobierz zaktualizowane reakcje dla tej wiadomości
  const reactions = db.prepare(`
    SELECT user_id, emoji FROM reactions WHERE message_id = ?
  `).all(messageId);

  const result = {};
  for (const reaction of reactions) {
    if (!result[reaction.emoji]) {
      result[reaction.emoji] = [];
    }
    result[reaction.emoji].push(reaction.user_id);
  }

  return result;
}

/**
 * Czyści całą historię (użyteczne do testów)
 */
function clearAllMessages() {
  const db = getDatabase();
  db.exec('DELETE FROM reactions');
  db.exec('DELETE FROM messages');
  db.exec('DELETE FROM attachments');
}

/**
 * Pobiera liczbę wiadomości
 * @returns {number} liczba wiadomości
 */
function getMessageCount() {
  const db = getDatabase();
  const result = db.prepare('SELECT COUNT(*) as count FROM messages').get();
  return result.count;
}

/**
 * Sprawdza czy są starsze wiadomości
 * @param {string} beforeDate - data ISO
 * @returns {boolean}
 */
function hasOlderMessages(beforeDate) {
  const db = getDatabase();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM messages WHERE created_at < ?
  `).get(beforeDate);
  return result.count > 0;
}

module.exports = {
  getMessages,
  getAllMessages,
  getOlderMessages,
  addMessage,
  addAttachment,
  getAttachment,
  addReaction,
  clearAllMessages,
  getMessageCount,
  hasOlderMessages
};
