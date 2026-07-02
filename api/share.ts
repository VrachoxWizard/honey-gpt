import { getEnv } from '../server/env.js';
import { CONSTANTS } from '../server/constants.js';
import { checkShareEndpointRateLimit, getClientIp } from '../server/limiter.js';

type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

type VercelResponse = {
  setHeader(name: string, value: string): VercelResponse;
  status(statusCode: number): VercelResponse;
  send(payload: string): void;
  end(): void;
};

const MAX_SHARE_PARAM_LENGTH = CONSTANTS.MAX_SHARE_PARAM_LENGTH;

export function buildShareRedirectScript(share: string): string {
  const safeShare = JSON.stringify(share).replace(/</g, '\\u003c');
  return `window.location.href = "/?share=" + encodeURIComponent(${safeShare});`;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const clientIp = getClientIp(request.headers, request.socket?.remoteAddress);
  const rateLimit = await checkShareEndpointRateLimit(clientIp);
  if (!rateLimit.allowed) {
    response.setHeader('Retry-After', String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)));
    response.status(429).send('Previše zahtjeva. Pokušaj ponovno za minutu.');
    return;
  }

  const share = request.query.share;
  if (!share || typeof share !== 'string') {
    response.setHeader('Location', '/');
    response.status(307).end();
    return;
  }

  if (share.length > MAX_SHARE_PARAM_LENGTH) {
    response.setHeader('Location', '/');
    response.status(307).end();
    return;
  }

  let title = 'Satirični razgovor';
  let description = 'Pogledaj satirični razgovor s Haničarom na Haničar GPT.';

  try {
    const padded = share.replace(/-/g, '+').replace(/_/g, '/');
    const decodedText = Buffer.from(padded, 'base64').toString('utf8');
    const payload = JSON.parse(decodedText);
    if (payload.title) {
      title = payload.title;
    }
    if (payload.messages && Array.isArray(payload.messages) && payload.messages.length > 0) {
      // Find the first user message, otherwise first assistant message
      const firstUserMsg = payload.messages.find(
        (m: { role: string; content?: string }) => m.role === 'user'
      );
      const firstMsg = firstUserMsg || payload.messages[0];
      if (firstMsg && firstMsg.content) {
        description = firstMsg.content.substring(0, 150);
        if (firstMsg.content.length > 150) {
          description += '...';
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse share payload', e);
  }

  // Construct absolute URL for the OG image
  const host = (request.headers['x-forwarded-host'] ||
    request.headers.host ||
    'honey-gpt.vercel.app') as string;
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const ogImageUrl = `${protocol}://${host}/api/og?share=${encodeURIComponent(share)}`;

  const env = getEnv();
  response.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  response.setHeader('Content-Type', 'text/html; charset=utf-8');

  response.status(200).send(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Haničar GPT - ${escapeHtml(title)}</title>
    <meta property="og:title" content="Haničar GPT - ${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Haničar GPT">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Haničar GPT - ${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${ogImageUrl}">
    <script>
      ${buildShareRedirectScript(share)}
    </script>
    <noscript>
      <meta http-equiv="refresh" content="0;url=/?share=${encodeURIComponent(share)}">
    </noscript>
  </head>
  <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #ece0c4; color: #362b1c; margin: 0;">
    <div style="text-align: center; padding: 20px;">
      <h2 style="font-weight: 600; color: #9d2c1b; margin-bottom: 10px;">Preusmjeravanje u Haničar GPT...</h2>
      <p style="opacity: 0.8; font-style: italic;">"Zapisano ostaje, a ti bivaš preusmjeren..."</p>
    </div>
  </body>
</html>`);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
