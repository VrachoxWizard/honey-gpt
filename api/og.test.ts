import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from './og';
import { resetLimiterForTests } from '../server/limiter';

vi.mock('../server/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../server/env.js')>();
  return {
    ...actual,
    getEnv: () => ({
      ...actual.getEnv(),
      corsOrigin: 'https://honey-gpt.vercel.app',
    }),
  };
});

type VercelResponse = {
  setHeader(name: string, value: string): VercelResponse;
  status(statusCode: number): VercelResponse;
  send(payload: string | Buffer): void;
  end(): void;
};

type MockResponse = VercelResponse & {
  statusCode: number;
  headers: Record<string, string>;
  body: string | Buffer;
};

function createMockResponse(): MockResponse {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '' as string | Buffer,
    setHeader(name: string, value: string) {
      response.headers[name] = value;
      return response;
    },
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    send(payload: string | Buffer) {
      response.body = payload;
    },
    end: vi.fn(),
  };

  return response;
}

describe('api/og', () => {
  beforeEach(() => {
    resetLimiterForTests();
  });

  it('returns SVG image for valid share payload', async () => {
    const payload = Buffer.from(
      JSON.stringify({
        messages: [
          { role: 'user', content: 'Kako si danas?' },
          { role: 'assistant', content: 'Mir tebi, sine.' },
        ],
      })
    ).toString('base64');

    const response = createMockResponse();
    await handler(
      {
        query: { share: payload },
        headers: { host: 'localhost:5173' },
      },
      response
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toBe('image/svg+xml');
    expect(response.body.toString()).toContain('Kako si danas?');
    expect(response.body.toString()).toContain('Mir tebi, sine.');
  });

  it('rejects oversized share parameter', async () => {
    const response = createMockResponse();
    await handler(
      {
        query: { share: 'a'.repeat(9000) },
        headers: { host: 'localhost:5173' },
      },
      response
    );

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe('Share parametar je predugačak.');
  });
});
