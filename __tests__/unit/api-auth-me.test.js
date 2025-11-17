/**
 * Testy jednostkowe dla pages/api/auth/me.js
 *
 * Sprawdzamy:
 * - Zwracanie danych zalogowanego użytkownika
 * - Obsługę braku sesji
 * - Obsługę nieprawidłowej sesji
 */

const { createMocks } = require('node-mocks-http');
const handler = require('../../pages/api/auth/me').default;

describe('/api/auth/me', () => {
  it('powinno zwrócić dane użytkownika przy poprawnej sesji', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        cookie: 'auth-token=mama'
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

  it('powinno zwrócić błąd przy braku cookie', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {}
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(false);
    expect(jsonData.error).toBe('Brak sesji');
  });

  it('powinno zwrócić błąd przy nieprawidłowym userId w cookie', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        cookie: 'auth-token=nieistniejacy'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(false);
    expect(jsonData.error).toBe('Nieprawidłowa sesja');
  });

  it('powinno zwrócić błąd przy pustym cookie', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        cookie: 'auth-token='
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);

    const jsonData = JSON.parse(res._getData());
    expect(jsonData.success).toBe(false);
  });

  it('powinno zweryfikować wszystkich domyślnych użytkowników', async () => {
    const testCases = ['mama', 'tata', 'michal', 'salon'];

    for (const userId of testCases) {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          cookie: `auth-token=${userId}`
        }
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const jsonData = JSON.parse(res._getData());
      expect(jsonData.success).toBe(true);
      expect(jsonData.user.id).toBe(userId);
    }
  });
});
