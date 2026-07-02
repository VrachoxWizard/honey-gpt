import { encodeSharedChat, decodeSharedChat, buildShareUrl, clearShareFromLocation } from './shareChat';

describe('shareChat', () => {
  it('round-trips shared chat payloads', () => {
    const payload = {
      version: 1 as const,
      title: 'Test',
      exportedAt: 1,
      messages: [{ id: '1', role: 'user' as const, content: 'Bok', timestamp: 1 }],
    };

    const encoded = encodeSharedChat(payload);
    expect(decodeSharedChat(encoded)).toEqual(payload);
  });

  it('buildShareUrl generates url with /share pathname', () => {
    const payload = {
      version: 1 as const,
      title: 'Test',
      exportedAt: 1,
      messages: [],
    };
    const url = buildShareUrl(payload);
    expect(url).toContain('/share?share=');
  });

  it('clearShareFromLocation removes share parameter and resets /share to /', () => {
    window.history.pushState({}, '', '/share?share=abc');
    expect(window.location.pathname).toBe('/share');
    expect(window.location.search).toBe('?share=abc');

    clearShareFromLocation();

    expect(window.location.pathname).toBe('/');
    expect(window.location.search).toBe('');
  });
});
