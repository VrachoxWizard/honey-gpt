import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { handleChatPayloadStream, toClientError } from './server/api.js';
import { checkRateLimit, getClientIp } from './server/limiter.js';
import { checkEnv } from './server/env.js';

function readRequestBody(request: import('node:http').IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    let rawBody = '';

    request.on('data', (chunk: Buffer) => {
      rawBody += chunk.toString('utf8');

      if (rawBody.length > 1_000_000) {
        reject(new Error('Zahtjev je prevelik za lokalni razvoj.'));
        request.destroy();
      }
    });

    request.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch {
        reject(new Error('Neispravan JSON u zahtjevu.'));
      }
    });

    request.on('error', reject);
  });
}

function localApiPlugin(): Plugin {
  return {
    name: 'hanicar-local-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (request, response) => {
        if (request.method === 'OPTIONS') {
          response.statusCode = 204;
          response.end();
          return;
        }

        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ error: 'Haničar-GPT prima samo POST zahtjeve.' }));
          return;
        }

        const clientIp = getClientIp(request.headers, request.socket.remoteAddress);
        const limiterRes = await checkRateLimit(clientIp);

        response.setHeader('X-RateLimit-Limit', '20');
        response.setHeader('X-RateLimit-Remaining', String(limiterRes.remaining));
        response.setHeader('X-RateLimit-Reset', String(limiterRes.resetTime));

        if (!limiterRes.allowed) {
          response.statusCode = 429;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(
            JSON.stringify({
              error: 'Previše zahtjeva. Molimo pričekajte trenutak prije novih pitanja za Haničara.',
            })
          );
          return;
        }

        try {
          checkEnv();
          const payload = await readRequestBody(request);
          
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
          response.setHeader('Cache-Control', 'no-cache');
          response.setHeader('Connection', 'keep-alive');
          
          await handleChatPayloadStream(payload, (chunk) => {
            response.write(`data: ${JSON.stringify(chunk)}\n\n`);
          });
          
          response.write('data: [DONE]\n\n');
          response.end();
        } catch (error) {
          const clientError = toClientError(error);
          if (response.headersSent) {
            response.write(`data: ${JSON.stringify({ error: clientError.message })}\n\n`);
            response.end();
          } else {
            response.statusCode = clientError.statusCode;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.end(JSON.stringify({ error: clientError.message }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    resolve: {
      alias: {
        '@shared': path.resolve(process.cwd(), './shared'),
        '@': path.resolve(process.cwd(), './src'),
        '@components': path.resolve(process.cwd(), './src/components'),
        '@hooks': path.resolve(process.cwd(), './src/hooks'),
        '@store': path.resolve(process.cwd(), './src/store'),
        '@lib': path.resolve(process.cwd(), './src/lib'),
        '@utils': path.resolve(process.cwd(), './src/utils'),
        '@styles': path.resolve(process.cwd(), './src/styles')
      }
    },
    plugins: [react(), tailwindcss(), localApiPlugin()],
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react/')) {
                return 'vendor-react';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (
                id.includes('react-markdown') ||
                id.includes('remark-gfm') ||
                id.includes('unist') ||
                id.includes('mdast') ||
                id.includes('micromark')
              ) {
                return 'vendor-markdown';
              }
            }
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.ts',
      coverage: {
        provider: 'v8',
        include: ['server/**/*.ts', 'api/**/*.ts', 'shared/**/*.ts'],
        exclude: ['**/*.test.ts', '**/*.d.ts'],
        thresholds: {
          lines: 55,
          functions: 55,
          statements: 55,
          branches: 45,
        },
      },
    }
  } as import('vite').UserConfig & { test: any };
});
