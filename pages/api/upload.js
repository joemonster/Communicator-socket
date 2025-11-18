/**
 * API ENDPOINT - UPLOAD OBRAZKÓW
 *
 * POST /api/upload
 * Przyjmuje pliki obrazków (multipart/form-data)
 * Zwraca ID załącznika do użycia w wiadomości
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Konfiguracja - importujemy bezpośrednio wartości
const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const UPLOADS_DIR = 'uploads';

// Upewnij się, że folder uploads istnieje
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Konfiguracja multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${Date.now()}_${uuidv4().slice(0, 8)}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Niedozwolony typ pliku: ${file.mimetype}. Dozwolone: ${ALLOWED_IMAGE_TYPES.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE
  }
});

// Wyłącz domyślny body parser Next.js dla tego endpointu
export const config = {
  api: {
    bodyParser: false
  }
};

// Helper do uruchomienia multer jako Promise
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Pobierz wymiary obrazka (prosty sposób bez dodatkowych bibliotek)
async function getImageDimensions(filepath, mimetype) {
  // Dla uproszczenia zwracamy null - w produkcji można użyć sharp lub image-size
  return { width: null, height: null };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }

  try {
    // Uruchom multer
    await runMiddleware(req, res, upload.single('image'));

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nie przesłano pliku' });
    }

    // Dynamiczny import dla modułów Node.js
    const { addAttachment } = require('../../lib/messageRepository');

    // Pobierz wymiary obrazka
    const dimensions = await getImageDimensions(req.file.path, req.file.mimetype);

    // Zapisz metadane załącznika w bazie
    const attachment = addAttachment({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      width: dimensions.width,
      height: dimensions.height
    });

    console.log(`📷 Upload: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    return res.status(200).json({
      success: true,
      attachment
    });

  } catch (error) {
    console.error('Błąd uploadu:', error);

    // Obsługa błędów multer
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: `Plik jest za duży. Maksymalny rozmiar: ${MAX_IMAGE_SIZE / 1024 / 1024} MB`
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Błąd podczas uploadu pliku'
    });
  }
}
