import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { handleChatPayload, handleChatPayloadStream, toClientError } from './server/api.js';

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

        try {
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

import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const index = trimmed.indexOf('=');
          if (index !== -1) {
            const key = trimmed.slice(0, index).trim();
            const value = trimmed.slice(index + 1).trim();
            result[key] = value;
          }
        }
      }
    }
  } catch {}
  return result;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  
  // Explicitly overwrite process.env with local .env file variables to override system environment settings
  const envFileVars = parseEnvFile(path.resolve(process.cwd(), '.env'));
  Object.assign(process.env, envFileVars);

  return {
    plugins: [react(), tailwindcss(), localApiPlugin()],
    server: {
      host: '127.0.0.1',
      port: 5173,
    },
  };
});
