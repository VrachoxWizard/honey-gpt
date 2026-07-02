import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendConversation } from './chatApi';

describe('chatApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('streams tokens from SSE responses', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"token":"He"}\n\n'));
        controller.enqueue(encoder.encode('data: {"token":"llo"}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'text/event-stream' }),
        body: stream,
      })
    );

    const tokens: string[] = [];
    await sendConversation({
      messages: [{ role: 'user', content: 'Pozdrav' }],
      model: 'google/gemini-2.5-flash',
      toneMode: 'sanctus',
      signal: new AbortController().signal,
      onToken: (token) => tokens.push(token),
      onModel: () => {},
    });

    expect(tokens.join('')).toBe('Hello');
  });

  it('throws SSE inline errors', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"error":"Pad OpenRoutera"}\n\n'));
        controller.close();
      },
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'Content-Type': 'text/event-stream' }),
        body: stream,
      })
    );

    await expect(
      sendConversation({
        messages: [{ role: 'user', content: 'Pozdrav' }],
        model: 'google/gemini-2.5-flash',
        toneMode: 'sanctus',
        signal: new AbortController().signal,
        onToken: () => {},
        onModel: () => {},
      })
    ).rejects.toThrow('Pad OpenRoutera');
  });

  it('sends X-Api-Secret header when configured', async () => {
    vi.stubEnv('VITE_API_SECRET', 'frontend-secret');

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"token":"ok"}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'Content-Type': 'text/event-stream' }),
      body: stream,
    });
    vi.stubGlobal('fetch', fetchMock);

    await sendConversation({
      messages: [{ role: 'user', content: 'Pozdrav' }],
      model: 'google/gemini-2.5-flash',
      toneMode: 'sanctus',
      signal: new AbortController().signal,
      onToken: () => {},
      onModel: () => {},
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Api-Secret': 'frontend-secret',
        }),
      })
    );
  });
});
