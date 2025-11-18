/**
 * API ENDPOINT: /api/auth/logout
 *
 * Wylogowuje użytkownika poprzez usunięcie cookie.
 */

import { serialize } from 'cookie';

export default function handler(req, res) {
  // Usuń cookie
  const cookie = serialize('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Natychmiastowe wygaśnięcie
    path: '/'
  });

  res.setHeader('Set-Cookie', cookie);

  return res.status(200).json({
    success: true,
    message: 'Wylogowano'
  });
}
