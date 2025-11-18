/**
 * KLIENT - STORAGE (IndexedDB)
 *
 * Cache dla wiadomości i obrazków po stronie klienta.
 * Używa IndexedDB przez bibliotekę idb.
 *
 * Stores:
 * - messages: cache wiadomości
 * - attachments: cache obrazków (blob)
 */

import { openDB } from 'idb';

const DB_NAME = 'domowy-czat';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Inicjalizuje bazę IndexedDB
 */
export async function initClientDB() {
  if (dbPromise) return dbPromise;

  dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store dla wiadomości
      if (!db.objectStoreNames.contains('messages')) {
        const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
        messagesStore.createIndex('createdAt', 'createdAt');
      }

      // Store dla załączników (obrazków)
      if (!db.objectStoreNames.contains('attachments')) {
        db.createObjectStore('attachments', { keyPath: 'id' });
      }

      // Store dla metadanych
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    }
  });

  return dbPromise;
}

/**
 * Zapisuje wiadomości do cache
 * @param {Array} messages - tablica wiadomości
 */
export async function cacheMessages(messages) {
  const db = await initClientDB();
  const tx = db.transaction('messages', 'readwrite');

  for (const message of messages) {
    await tx.store.put(message);
  }

  await tx.done;
}

/**
 * Pobiera wiadomości z cache
 * @param {number} limit - maksymalna liczba wiadomości
 * @returns {Array} tablica wiadomości
 */
export async function getCachedMessages(limit = 100) {
  const db = await initClientDB();
  const tx = db.transaction('messages', 'readonly');
  const index = tx.store.index('createdAt');

  const messages = [];
  let cursor = await index.openCursor(null, 'prev');

  while (cursor && messages.length < limit) {
    messages.unshift(cursor.value);
    cursor = await cursor.continue();
  }

  return messages;
}

/**
 * Dodaje pojedynczą wiadomość do cache
 * @param {Object} message - wiadomość
 */
export async function addMessageToCache(message) {
  const db = await initClientDB();
  await db.put('messages', message);
}

/**
 * Aktualizuje wiadomość w cache (np. reakcje)
 * @param {string} messageId - ID wiadomości
 * @param {Object} updates - pola do zaktualizowania
 */
export async function updateMessageInCache(messageId, updates) {
  const db = await initClientDB();
  const message = await db.get('messages', messageId);

  if (message) {
    const updated = { ...message, ...updates };
    await db.put('messages', updated);
  }
}

/**
 * Zapisuje obrazek do cache
 * @param {string} attachmentId - ID załącznika
 * @param {Blob} blob - dane obrazka
 */
export async function cacheAttachment(attachmentId, blob) {
  const db = await initClientDB();
  await db.put('attachments', { id: attachmentId, blob, cachedAt: new Date().toISOString() });
}

/**
 * Pobiera obrazek z cache
 * @param {string} attachmentId - ID załącznika
 * @returns {Blob|null} dane obrazka lub null
 */
export async function getCachedAttachment(attachmentId) {
  const db = await initClientDB();
  const record = await db.get('attachments', attachmentId);
  return record ? record.blob : null;
}

/**
 * Sprawdza czy obrazek jest w cache
 * @param {string} attachmentId - ID załącznika
 * @returns {boolean}
 */
export async function isAttachmentCached(attachmentId) {
  const db = await initClientDB();
  const record = await db.get('attachments', attachmentId);
  return !!record;
}

/**
 * Zapisuje metadane
 * @param {string} key - klucz
 * @param {any} value - wartość
 */
export async function setMeta(key, value) {
  const db = await initClientDB();
  await db.put('meta', { key, value });
}

/**
 * Pobiera metadane
 * @param {string} key - klucz
 * @returns {any} wartość lub undefined
 */
export async function getMeta(key) {
  const db = await initClientDB();
  const record = await db.get('meta', key);
  return record ? record.value : undefined;
}

/**
 * Czyści cały cache
 */
export async function clearCache() {
  const db = await initClientDB();
  await db.clear('messages');
  await db.clear('attachments');
  await db.clear('meta');
}

/**
 * Usuwa stare wiadomości z cache (starsze niż X dni)
 * @param {number} days - liczba dni
 */
export async function cleanOldCachedMessages(days = 30) {
  const db = await initClientDB();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffISO = cutoffDate.toISOString();

  const tx = db.transaction('messages', 'readwrite');
  const index = tx.store.index('createdAt');

  let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoffISO));

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}
