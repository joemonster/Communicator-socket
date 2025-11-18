/**
 * API ENDPOINT: /api/users
 *
 * Zwraca listę wszystkich użytkowników (bez haseł).
 * Używane na stronie logowania do wyświetlenia kafelków.
 */

const { getAllUsers } = require('../../lib/usersConfig');

export default function handler(req, res) {
  const users = getAllUsers();

  return res.status(200).json({
    success: true,
    users
  });
}
