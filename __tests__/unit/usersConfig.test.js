/**
 * Testy jednostkowe dla lib/usersConfig.js
 *
 * Sprawdzamy:
 * - Pobieranie wszystkich użytkowników
 * - Walidację użytkownika (poprawne i niepoprawne hasło)
 * - Pobieranie użytkownika po ID
 */

const {
  getAllUsers,
  validateUser,
  getUserById
} = require('../../lib/usersConfig');

describe('usersConfig', () => {
  describe('getAllUsers', () => {
    it('powinno zwrócić listę wszystkich użytkowników bez haseł', () => {
      const users = getAllUsers();

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      // Sprawdź, czy każdy użytkownik ma wymagane pola
      users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('color');
        expect(user).not.toHaveProperty('password'); // Hasła nie powinny być zwracane
      });
    });

    it('powinno zwrócić domyślnych użytkowników', () => {
      const users = getAllUsers();
      const userIds = users.map(u => u.id);

      expect(userIds).toContain('mama');
      expect(userIds).toContain('tata');
      expect(userIds).toContain('michal');
      expect(userIds).toContain('salon');
    });
  });

  describe('validateUser', () => {
    it('powinno zwrócić dane użytkownika przy poprawnym haśle', () => {
      const user = validateUser('mama', 'mama123');

      expect(user).toBeDefined();
      expect(user).toHaveProperty('id', 'mama');
      expect(user).toHaveProperty('name', 'Mama');
      expect(user).toHaveProperty('color');
      expect(user).not.toHaveProperty('password'); // Hasło nie powinno być zwrócone
    });

    it('powinno zwrócić null przy niepoprawnym haśle', () => {
      const user = validateUser('mama', 'zlehasto');

      expect(user).toBeNull();
    });

    it('powinno zwrócić null dla nieistniejącego użytkownika', () => {
      const user = validateUser('nieistniejacy', 'haslo');

      expect(user).toBeNull();
    });

    it('powinno zwrócić null przy pustym haśle', () => {
      const user = validateUser('mama', '');

      expect(user).toBeNull();
    });

    it('powinno sprawdzić wszystkich domyślnych użytkowników', () => {
      const testCases = [
        { userId: 'mama', password: 'mama123', name: 'Mama' },
        { userId: 'tata', password: 'tata123', name: 'Tata' },
        { userId: 'michal', password: 'michal123', name: 'Michał' },
        { userId: 'salon', password: 'salon123', name: 'Salon' },
      ];

      testCases.forEach(({ userId, password, name }) => {
        const user = validateUser(userId, password);
        expect(user).toBeDefined();
        expect(user.id).toBe(userId);
        expect(user.name).toBe(name);
      });
    });
  });

  describe('getUserById', () => {
    it('powinno zwrócić użytkownika po ID', () => {
      const user = getUserById('mama');

      expect(user).toBeDefined();
      expect(user).toHaveProperty('id', 'mama');
      expect(user).toHaveProperty('name', 'Mama');
      expect(user).not.toHaveProperty('password');
    });

    it('powinno zwrócić null dla nieistniejącego ID', () => {
      const user = getUserById('nieistniejacy');

      expect(user).toBeNull();
    });

    it('powinno zwrócić null dla pustego ID', () => {
      const user = getUserById('');

      expect(user).toBeNull();
    });

    it('powinno zwrócić null dla undefined', () => {
      const user = getUserById(undefined);

      expect(user).toBeNull();
    });
  });
});
