/**
 * Testy jednostkowe dla pages/index.js (LoginPage)
 *
 * Sprawdzamy:
 * - Renderowanie kafelków użytkowników
 * - Wybór użytkownika
 * - Formularz logowania
 * - Obsługę błędów
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../pages/index';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/',
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('LoginPage', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('powinno renderować tytuł aplikacji', async () => {
    // Mock API /api/users
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        users: [
          { id: 'mama', name: 'Mama', color: '#E3F2FD' },
          { id: 'tata', name: 'Tata', color: '#F3E5F5' },
        ]
      })
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText(/Domowy Czat/i)).toBeInTheDocument();
    });
  });

  it('powinno wyświetlić kafelki użytkowników po załadowaniu', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        users: [
          { id: 'mama', name: 'Mama', color: '#E3F2FD' },
          { id: 'tata', name: 'Tata', color: '#F3E5F5' },
        ]
      })
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Mama')).toBeInTheDocument();
      expect(screen.getByText('Tata')).toBeInTheDocument();
    });
  });

  it('powinno pokazać formularz hasła po kliknięciu użytkownika', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        users: [
          { id: 'mama', name: 'Mama', color: '#E3F2FD' },
        ]
      })
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Mama')).toBeInTheDocument();
    });

    // Kliknij kafelek użytkownika
    const userTile = screen.getByText('Mama').closest('button');
    fireEvent.click(userTile);

    // Sprawdź, czy pojawił się formularz hasła
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Wpisz hasło/i)).toBeInTheDocument();
      expect(screen.getByText('Zaloguj')).toBeInTheDocument();
    });
  });

  it('powinno pozwolić anulować wybór użytkownika', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        users: [
          { id: 'mama', name: 'Mama', color: '#E3F2FD' },
        ]
      })
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Mama')).toBeInTheDocument();
    });

    // Kliknij użytkownika
    const userTile = screen.getByText('Mama').closest('button');
    fireEvent.click(userTile);

    await waitFor(() => {
      expect(screen.getByText('Anuluj')).toBeInTheDocument();
    });

    // Kliknij Anuluj
    fireEvent.click(screen.getByText('Anuluj'));

    // Formularz hasła powinien zniknąć, kafelki powinny wrócić
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Wpisz hasło/i)).not.toBeInTheDocument();
      expect(screen.getByText('Mama')).toBeInTheDocument();
    });
  });

  it('powinno wyświetlić błąd przy niepoprawnym haśle', async () => {
    const { useRouter } = require('next/router');
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });

    // Mock API /api/users
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        users: [
          { id: 'mama', name: 'Mama', color: '#E3F2FD' },
        ]
      })
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Mama')).toBeInTheDocument();
    });

    // Kliknij użytkownika
    await user.click(screen.getByText('Mama').closest('button'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Wpisz hasło/i)).toBeInTheDocument();
    });

    // Wpisz hasło
    const passwordInput = screen.getByPlaceholderText(/Wpisz hasło/i);
    await user.type(passwordInput, 'zle-haslo');

    // Mock API /api/auth/login - błędne hasło
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Nieprawidłowe hasło'
      })
    });

    // Kliknij Zaloguj
    await user.click(screen.getByText('Zaloguj'));

    // Sprawdź, czy pojawił się komunikat błędu
    await waitFor(() => {
      expect(screen.getByText(/Nieprawidłowe hasło/i)).toBeInTheDocument();
    });

    // Sprawdź, że NIE było przekierowania
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('powinno przekierować do czatu przy poprawnym haśle', async () => {
    const { useRouter } = require('next/router');
    const mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });

    // Mock API /api/users
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        users: [
          { id: 'mama', name: 'Mama', color: '#E3F2FD' },
        ]
      })
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Mama')).toBeInTheDocument();
    });

    // Kliknij użytkownika
    await user.click(screen.getByText('Mama').closest('button'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Wpisz hasło/i)).toBeInTheDocument();
    });

    // Wpisz hasło
    const passwordInput = screen.getByPlaceholderText(/Wpisz hasło/i);
    await user.type(passwordInput, 'mama123');

    // Mock API /api/auth/login - sukces
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { id: 'mama', name: 'Mama' }
      })
    });

    // Kliknij Zaloguj
    await user.click(screen.getByText('Zaloguj'));

    // Sprawdź przekierowanie do /chat
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chat');
    });
  });

  it('powinno wyłączyć przycisk logowania gdy pole hasła jest puste', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        users: [
          { id: 'mama', name: 'Mama', color: '#E3F2FD' },
        ]
      })
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(screen.getByText('Mama')).toBeInTheDocument();
    });

    // Kliknij użytkownika
    fireEvent.click(screen.getByText('Mama').closest('button'));

    await waitFor(() => {
      const loginButton = screen.getByText('Zaloguj');
      expect(loginButton).toBeDisabled();
    });
  });
});
