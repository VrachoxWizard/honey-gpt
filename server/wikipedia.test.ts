import { describe, it, expect, vi } from 'vitest';
import { searchWikipedia } from './wikipedia';

// Mockanje globalnog fetch-a
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Wikipedia Search', () => {
  it('uspješno dohvaća sažetak pojma', async () => {
    // Prvi poziv - dohvat liste
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: { search: [{ title: 'Hrvatska' }] },
      }),
    });

    // Drugi poziv - dohvat sažetka
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        extract: 'Hrvatska je država u Europi.',
      }),
    });

    const result = await searchWikipedia('Hrvatska');
    expect(result).toBe('Hrvatska je država u Europi.');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('vraća null ako pojam nije pronađen', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        query: { search: [] },
      }),
    });

    const result = await searchWikipedia('NepostojeciPojam123');
    expect(result).toBeNull();
  });
});
