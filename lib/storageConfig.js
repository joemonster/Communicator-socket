/**
 * KONFIGURACJA PRZECHOWYWANIA DANYCH
 *
 * Ustawienia retencji danych i limitów dla czatu.
 */

module.exports = {
  // Ile dni przechowywać dane na serwerze (potem automatyczne kasowanie)
  // Domyślnie 90 dni (ok. 3 miesiące)
  SERVER_RETENTION_DAYS: 90,

  // Ile dni danych pobierać domyślnie na klienta
  // Domyślnie 7 dni (reszta dostępna po kliknięciu "Załaduj więcej")
  CLIENT_DEFAULT_DAYS: 7,

  // Maksymalny rozmiar obrazka w bajtach (25 MB)
  MAX_IMAGE_SIZE: 25 * 1024 * 1024,

  // Dozwolone typy plików obrazów
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],

  // Rozszerzenia plików
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],

  // Ścieżka do folderu z uploadami
  UPLOADS_DIR: 'uploads',

  // Ścieżka do bazy SQLite
  DATABASE_PATH: 'data/chat.db',

  // Interwał czyszczenia starych danych (w milisekundach)
  // Domyślnie co 24 godziny
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000
};
