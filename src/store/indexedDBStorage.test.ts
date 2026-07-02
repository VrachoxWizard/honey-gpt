import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get, set, del } from 'idb-keyval';
import { indexedDBStorage } from './indexedDBStorage';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

describe('indexedDBStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads stored values', async () => {
    vi.mocked(get).mockResolvedValue('{"sessions":[]}');
    await expect(indexedDBStorage.getItem('hanicar-chat-storage')).resolves.toBe('{"sessions":[]}');
  });

  it('returns null when value is missing', async () => {
    vi.mocked(get).mockResolvedValue(undefined);
    await expect(indexedDBStorage.getItem('missing')).resolves.toBeNull();
  });

  it('writes and deletes values', async () => {
    await indexedDBStorage.setItem('key', 'value');
    await indexedDBStorage.removeItem('key');
    expect(set).toHaveBeenCalledWith('key', 'value');
    expect(del).toHaveBeenCalledWith('key');
  });
});
