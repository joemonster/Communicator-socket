/**
 * Testy jednostkowe dla pages/api/auth/login.js
 *
 * Sprawdzamy:
 * - Poprawne logowanie
 * - Niepoprawne hasło
 * - Brak wymaganych danych
 * - Niepoprawną metodę HTTP
 * - Ustawianie cookie
 */

const { createMocks } = require('node-mocks-http');
const handler = require('../../pages/api/auth/login').default;

describe('/api/auth/login', () => {
  it('powinno zwrócić sukces przy poprawnych danych logowania', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'mama',
        password: 'mama123'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(true);
    expect(jsonData.user).toBeDefined();
    expect(jsonData.user.id).toBe('mama');
    expect(jsonData.user.name).toBe('Mama');
    expect(jsonData.user).not.toHaveProperty('password');
  });

  it('powinno ustawić cookie przy poprawnym logowaniu', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'mama',
        password: 'mama123'
      }
    });

    await handler(req, res);

    const cookies = res._getHeaders()['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('auth-token=mama');
  });

  it('powinno zwrócić błąd przy niepoprawnym haśle', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'mama',
        password: 'zle-haslo'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(false);
    expect(jsonData.error).toBe('Nieprawidłowe hasło');
  });

  it('powinno zwrócić błąd przy braku userId', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        password: 'mama123'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(false);
    expect(jsonData.error).toBe('Brak wymaganych danych');
  });

  it('powinno zwrócić błąd przy braku password', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'mama'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(false);
  });

  it('powinno zwrócić błąd przy metodzie GET', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.error).toBe('Metoda niedozwolona');
  });

  it('powinno zwrócić błąd dla nieistniejącego użytkownika', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'nieistniejacy',
        password: 'jakiekolwiek'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(false);
    expect(jsonData.error).toBe('Nieprawidłowe hasło');
  });

  it('powinno zalogować wszystkich domyślnych użytkowników', async () => {
    const testCases = [
      { userId: 'mama', password: 'mama123', name: 'Mama' },
      { userId: 'tata', password: 'tata123', name: 'Tata' },
      { userId: 'michal', password: 'michal123', name: 'Michał' },
      { userId: 'salon', password: 'salon123', name: 'Salon' },
    ];

    for (const testCase of testCases) {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          userId: testCase.userId,
          password: testCase.password
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const jsonData = JSON.parse(res._getData());
      expect(jsonData.success).toBe(true);
      expect(jsonData.user.name).toBe(testCase.name);
    }
  });
});
