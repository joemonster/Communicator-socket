/**
 * MODUŁ BAZY DANYCH SQLite
 *
 * Inicjalizacja i zarządzanie bazą danych SQLite dla czatu.
 * Przechowuje wiadomości i załączniki (metadane obrazków).
 *
 * Tabele:
 * - messages: wiadomości czatu
 * - attachments: metadane załączników (obrazki)
 * - reactions: reakcje na wiadomości
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('./storageConfig');

let db = null;

/**
 * Inicjalizuje bazę danych SQLite
 * Tworzy tabele jeśli nie istnieją
 */
function initDatabase() {
  if (db) {
    return db;
  }

  // Utwórz folder data/ jeśli nie istnieje
  const dbDir = path.dirname(config.DATABASE_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Utwórz folder uploads/ jeśli nie istnieje
  if (!fs.existsSync(config.UPLOADS_DIR)) {
    fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
  }

  // Połącz z bazą danych
  db = new Database(config.DATABASE_PATH);

  // Włącz foreign keys
  db.pragma('foreign_keys = ON');

  // Utwórz tabele
  createTables();

  console.log('📦 Baza danych SQLite zainicjalizowana:', config.DATABASE_PATH);

  return db;
}

/**
 * Tworzy tabele w bazie danych
 */
function createTables() {
  // Tabela wiadomości
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      text TEXT,
      type TEXT DEFAULT 'text',
      attachment_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (attachment_id) REFERENCES attachments(id)
    )
  `);

  // Tabela załączników (obrazki)
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      width INTEGER,
      height INTEGER,
      created_at TEXT NOT NULL
    )
  `);

  // Tabela reakcji
  db.exec(`
    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
      UNIQUE(message_id, user_id, emoji)
    )
  `);

  // Indeksy dla szybszego wyszukiwania
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions(message_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON attachments(created_at);
  `);
}

/**
 * Pobiera instancję bazy danych
 */
function getDatabase() {
  if (!db) {
    initDatabase();
  }
  return db;
}

/**
 * Zamyka połączenie z bazą danych
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('📦 Baza danych zamknięta');
  }
}

/**
 * Czyści stare dane zgodnie z konfiguracją retencji
 */
function cleanupOldData() {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.SERVER_RETENTION_DAYS);
  const cutoffISO = cutoffDate.toISOString();

  // Pobierz załączniki do usunięcia
  const attachmentsToDelete = db.prepare(`
    SELECT a.id, a.filename
    FROM attachments a
    INNER JOIN messages m ON m.attachment_id = a.id
    WHERE m.created_at < ?
  `).all(cutoffISO);

  // Usuń pliki z dysku
  for (const attachment of attachmentsToDelete) {
    const filePath = path.join(config.UPLOADS_DIR, attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Usuń stare wiadomości (kaskadowo usuwa reakcje)
  const deleteMessages = db.prepare('DELETE FROM messages WHERE created_at < ?');
  const result = deleteMessages.run(cutoffISO);

  // Usuń osierocone załączniki
  db.exec(`
    DELETE FROM attachments
    WHERE id NOT IN (SELECT attachment_id FROM messages WHERE attachment_id IS NOT NULL)
  `);

  if (result.changes > 0) {
    console.log(`🧹 Usunięto ${result.changes} starych wiadomości (starszych niż ${config.SERVER_RETENTION_DAYS} dni)`);
  }

  return result.changes;
}

/**
 * Uruchamia periodyczne czyszczenie starych danych
 */
function startCleanupScheduler() {
  // Uruchom czyszczenie przy starcie
  cleanupOldData();

  // Ustaw interwał
  setInterval(() => {
    cleanupOldData();
  }, config.CLEANUP_INTERVAL);

  console.log(`🕐 Zaplanowano czyszczenie danych co ${config.CLEANUP_INTERVAL / 1000 / 60 / 60} godzin`);
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  cleanupOldData,
  startCleanupScheduler
};
