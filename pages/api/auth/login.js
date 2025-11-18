/**
 * API ENDPOINT: /api/auth/login
 *
 * Obsługuje logowanie użytkownika.
 * Przyjmuje: { userId, password }
 * Zwraca: { success: true, user: {...} } lub { success: false, error: '...' }
 *
 * Po poprawnym logowaniu ustawia cookie 'auth-token' z ID użytkownika.
 */

import { serialize } from 'cookie';
const { validateUser } = require('../../../lib/usersConfig');

export default function handler(req, res) {
  // Tylko metoda POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metoda niedozwolona' });
  }

  const { userId, password } = req.body;

  // Walidacja danych
  if (!userId || !password) {
    return res.status(400).json({
      success: false,
      error: 'Brak wymaganych danych'
    });
  }

  // Sprawdź hasło
  const user = validateUser(userId, password);

  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'Nieprawidłowe hasło'
    });
  }

  // Ustaw cookie z sesją (proste rozwiązanie dla sieci domowej)
  // W produkcji użyj JWT lub bezpieczniejszego mechanizmu
  const cookie = serialize('auth-token', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // HTTPS tylko w produkcji
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 dni
    path: '/'
  });

  res.setHeader('Set-Cookie', cookie);

  return res.status(200).json({
    success: true,
    user
  });
}
