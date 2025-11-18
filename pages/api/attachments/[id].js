/**
 * API ENDPOINT - POBIERANIE ZAŁĄCZNIKÓW
 *
 * GET /api/attachments/[id]
 * Serwuje plik obrazka po ID załącznika
 */

import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = 'uploads';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metoda niedozwolona' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, error: 'Brak ID załącznika' });
  }

  try {
    // Dynamiczny import
    const { getAttachment } = require('../../../lib/messageRepository');

    // Pobierz metadane załącznika z bazy
    const attachment = getAttachment(id);

    if (!attachment) {
      return res.status(404).json({ success: false, error: 'Załącznik nie znaleziony' });
    }

    // Ścieżka do pliku
    const filepath = path.join(process.cwd(), UPLOADS_DIR, attachment.filename);

    // Sprawdź czy plik istnieje
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'Plik nie znaleziony na dysku' });
    }

    // Ustaw nagłówki
    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader('Content-Length', attachment.size);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.originalName}"`);

    // Cache na 7 dni
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');

    // Streamuj plik
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Błąd pobierania załącznika:', error);
    return res.status(500).json({
      success: false,
      error: 'Błąd podczas pobierania załącznika'
    });
  }
}
