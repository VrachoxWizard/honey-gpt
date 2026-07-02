import type { Plugin } from 'vite';
import { handleChatRequest } from '../server/handler.js';
import { checkEnv, getEnv, isRedisConfigured } from '../server/env.js';
import { isConfiguredOpenRouterKey } from '../server/openrouter.js';

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

export function localApiPlugin(): Plugin {
  return {
    name: 'hanicar-local-api',
    configureServer(server) {
      server.middlewares.use('/api/health', async (request, response) => {
        const env = getEnv();
        response.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
        response.setHeader('Content-Type', 'application/json; charset=utf-8');

        if (request.method === 'OPTIONS') {
          response.statusCode = 204;
          response.end();
          return;
        }

        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: 'Health endpoint podržava samo GET.' }));
          return;
        }

        let openRouterKeyConfigured = false;
        try {
          checkEnv();
          openRouterKeyConfigured = isConfiguredOpenRouterKey(env.openRouterApiKey);
        } catch {
          openRouterKeyConfigured = false;
        }

        response.statusCode = 200;
        response.end(
          JSON.stringify({
            ok: openRouterKeyConfigured,
            redis: isRedisConfigured(),
            openrouterKeyConfigured: openRouterKeyConfigured,
            version: '2.0.0',
          })
        );
      });

      server.middlewares.use('/api/chat', async (request, response) => {
        let body: unknown = {};
        if (request.method === 'POST') {
          try {
            body = await readRequestBody(request);
          } catch (error) {
            response.statusCode = 400;
            response.setHeader('Content-Type', 'application/json; charset=utf-8');
            response.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : 'Neispravan zahtjev.',
              })
            );
            return;
          }
        }

        const result = await handleChatRequest(
          {
            method: request.method,
            body,
            headers: request.headers as Record<string, string | string[] | undefined>,
            socketRemoteAddress: request.socket.remoteAddress,
          },
          {
            write: (chunk) => response.write(chunk),
            setHeader: (name, value) => {
              response.setHeader(name, value);
            },
            writeHead: (statusCode, headers) => {
              response.writeHead(statusCode, headers);
            },
            end: () => response.end(),
          }
        );

        if (!result.streamed) {
          response.writeHead(result.statusCode, result.headers);
          response.end(result.body);
        }
      });
    },
  };
}
