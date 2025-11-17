/**
 * API ENDPOINT: /api/auth/me
 *
 * Zwraca dane aktualnie zalogowanego użytkownika na podstawie cookie.
 * Używane do weryfikacji sesji po odświeżeniu strony.
 */

import { parse } from 'cookie';
const { getUserById } = require('../../../lib/usersConfig');

export default function handler(req, res) {
  // Odczytaj cookie
  const cookies = parse(req.headers.cookie || '');
  const userId = cookies['auth-token'];

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Brak sesji'
    });
  }

  // Pobierz dane użytkownika
  const user = getUserById(userId);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Nieprawidłowa sesja'
    });
  }

  return res.status(200).json({
    success: true,
    user
  });
}
