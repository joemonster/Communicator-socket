/**
 * Jest Setup
 * Plik konfiguracyjny uruchamiany przed testami
 */

import '@testing-library/jest-dom'

// Mock dla uuid (moduł ESM)
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
}))

// Mock dla Audio API (używany w powiadomieniach)
global.Audio = jest.fn().mockImplementation(() => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  currentTime: 0,
}))

// Mock dla matchMedia (używany przez niektóre komponenty responsive)
// Tylko w środowisku jsdom (testy komponentów)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock dla localStorage (jeśli będzie używany)
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  }
  global.localStorage = localStorageMock
}
