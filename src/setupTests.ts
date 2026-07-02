import '@testing-library/jest-dom';
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

import { vi } from 'vitest';

vi.mock('idb-keyval', () => {
  let store: Record<string, unknown> = {};
  return {
    get: vi.fn((key) => Promise.resolve(store[key])),
    set: vi.fn((key, val) => {
      store[key] = val;
      return Promise.resolve();
    }),
    del: vi.fn((key) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      store = {};
      return Promise.resolve();
    }),
  };
});
