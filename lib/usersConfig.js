/**
 * KONFIGURACJA UŻYTKOWNIKÓW
 *
 * Tutaj definiujesz wszystkich użytkowników aplikacji czatu.
 * Aby dodać/usunąć/zmienić użytkownika lub hasło, edytuj obiekt USERS poniżej.
 *
 * Struktura:
 * - id: unikalny identyfikator (używany wewnętrznie)
 * - name: nazwa wyświetlana w aplikacji
 * - password: proste hasło (w produkcji używaj haszowania!)
 * - color: kolor dymka w czacie (opcjonalnie)
 */

const USERS = {
  mama: {
    id: 'mama',
    name: 'Mama',
    password: 'mama123',
    color: '#E3F2FD' // jasny niebieski
  },
  tata: {
    id: 'tata',
    name: 'Tata',
    password: 'tata123',
    color: '#F3E5F5' // jasny fiolet
  },
  michal: {
    id: 'michal',
    name: 'Michał',
    password: 'michal123',
    color: '#E8F5E9' // jasny zielony
  },
  salon: {
    id: 'salon',
    name: 'Salon',
    password: 'salon123',
    color: '#FFF3E0' // jasny pomarańcz
  }
};

/**
 * Pobiera wszystkich użytkowników (bez haseł)
 */
function getAllUsers() {
  return Object.values(USERS).map(({ id, name, color }) => ({
    id,
    name,
    color
  }));
}

/**
 * Sprawdza, czy podane hasło jest poprawne dla danego użytkownika
 */
function validateUser(userId, password) {
  const user = USERS[userId];
  if (!user) return null;

  if (user.password === password) {
    return { id: user.id, name: user.name, color: user.color };
  }

  return null;
}

/**
 * Pobiera dane użytkownika po ID (bez hasła)
 */
function getUserById(userId) {
  const user = USERS[userId];
  if (!user) return null;

  return { id: user.id, name: user.name, color: user.color };
}

module.exports = {
  USERS,
  getAllUsers,
  validateUser,
  getUserById
};
