/**
 * STRONA GŁÓWNA / LOGOWANIE
 *
 * Wyświetla kafelki z użytkownikami do wyboru.
 * Po kliknięciu pojawia się pole na hasło.
 * Po poprawnym zalogowaniu przekierowuje do /chat.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Pobierz listę użytkowników przy załadowaniu strony
  useEffect(() => {
    fetchUsers();
    checkExistingSession();
  }, []);

  // Pobierz użytkowników z API
  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Błąd pobierania użytkowników:', err);
    }
  }

  // Sprawdź, czy użytkownik jest już zalogowany
  async function checkExistingSession() {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (data.success) {
        // Użytkownik jest już zalogowany, przekieruj do czatu
        router.push('/chat');
      }
    } catch (err) {
      // Brak sesji, pozostań na stronie logowania
    }
  }

  // Wybierz użytkownika (pokaż pole hasła)
  function handleSelectUser(user) {
    setSelectedUser(user);
    setPassword('');
    setError('');
  }

  // Anuluj wybór użytkownika
  function handleCancel() {
    setSelectedUser(null);
    setPassword('');
    setError('');
  }

  // Obsługa formularza logowania
  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          password
        })
      });

      const data = await res.json();

      if (data.success) {
        // Logowanie zakończone sukcesem, przekieruj do czatu
        router.push('/chat');
      } else {
        setError(data.error || 'Nieprawidłowe hasło');
      }
    } catch (err) {
      console.error('Błąd logowania:', err);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>🏠 Domowy Czat</h1>
        <p className={styles.subtitle}>
          Wybierz użytkownika i zaloguj się
        </p>

        {!selectedUser ? (
          // Wyświetl kafelki użytkowników
          <div className={styles.usersGrid}>
            {users.map((user) => (
              <button
                key={user.id}
                className={styles.userTile}
                onClick={() => handleSelectUser(user)}
                style={{ backgroundColor: user.color || '#E3F2FD' }}
              >
                <div className={styles.userAvatar}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.userName}>{user.name}</div>
              </button>
            ))}
          </div>
        ) : (
          // Wyświetl formularz hasła
          <div className={styles.passwordForm}>
            <div
              className={styles.selectedUser}
              style={{ backgroundColor: selectedUser.color || '#E3F2FD' }}
            >
              <div className={styles.selectedAvatar}>
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div className={styles.selectedName}>{selectedUser.name}</div>
            </div>

            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="Wpisz hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.passwordInput}
                autoFocus
                disabled={loading}
              />

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className={styles.loginButton}
                  disabled={loading || !password}
                >
                  {loading ? 'Logowanie...' : 'Zaloguj'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={styles.footer}>
          <p>💡 Aplikacja działa tylko w sieci lokalnej (LAN/Wi-Fi)</p>
          <p>🔧 Hasła i użytkowników można zmienić w pliku <code>lib/usersConfig.js</code></p>
        </div>
      </div>
    </div>
  );
}
