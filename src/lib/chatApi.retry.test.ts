import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendConversation } from './chatApi';

describe('chatApi retry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  it('retries retryable HTTP errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        headers: new Headers(),
        json: async () => ({ error: 'Pad servera' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: new Headers({
          'Content-Type': 'text/event-stream',
          'X-Request-Id': 'req-1',
        }),
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('data: {"token":"OK"}\n\n'));
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          },
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    const onRetryMock = vi.fn();

    const promise = sendConversation({
      messages: [{ role: 'user', content: 'Pozdrav' }],
      model: 'google/gemini-2.5-flash',
      toneMode: 'sanctus',
      signal: new AbortController().signal,
      onToken: () => {},
      onModel: () => {},
      onRetry: onRetryMock,
    });

    await vi.runAllTimersAsync();
    await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
