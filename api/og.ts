import { getEnv } from '../server/env.js';

type VercelRequest = {
  method?: string;
  query: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  setHeader(name: string, value: string): VercelResponse;
  status(statusCode: number): VercelResponse;
  send(payload: string | Buffer): void;
  end(): void;
};

function cleanMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/[*_#~>]/g, '') // Remove symbols
    .replace(/\s+/g, ' ')
    .trim();
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (lines.length + 1 >= maxLines) {
        lines.push(currentLine + '...');
        currentLine = '';
        break;
      }
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const share = request.query.share;
  let userText = 'Što me čeka danas u župi?';
  let assistantText =
    'Mir tebi sinu/kćeri... Tvoja pitanja su velika, a crnilo sveto. Moli krunicu i ne pitaj previše.';

  if (share && typeof share === 'string') {
    try {
      const padded = share.replace(/-/g, '+').replace(/_/g, '/');
      const decodedText = Buffer.from(padded, 'base64').toString('utf8');
      const payload = JSON.parse(decodedText);
      if (payload.messages && Array.isArray(payload.messages)) {
        const userMsg = payload.messages.find(
          (m: { role: string; content?: string }) => m.role === 'user'
        );
        const assistantMsg = payload.messages.find(
          (m: { role: string; content?: string }) => m.role === 'assistant' && m.content
        );
        if (userMsg && userMsg.content) {
          userText = cleanMarkdown(userMsg.content);
        }
        if (assistantMsg && assistantMsg.content) {
          assistantText = cleanMarkdown(assistantMsg.content);
        }
      }
    } catch (e) {
      console.error('Failed to decode share payload for OG image', e);
    }
  }

  // Wrap text
  const userLines = wrapText(userText, 70, 3);
  const assistantLines = wrapText(assistantText, 62, 4);

  const userSvgLines = userLines
    .map(
      (line, idx) => `<text x="0" y="${35 + idx * 36}" class="text-user">${escapeXml(line)}</text>`
    )
    .join('\n');

  const assistantSvgLines = assistantLines
    .map(
      (line, idx) =>
        `<text x="0" y="${40 + idx * 42}" class="text-assistant">${escapeXml(line)}</text>`
    )
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&amp;family=Outfit:wght@400;600&amp;display=swap');
      .bg { fill: #ece0c4; }
      .border-outer { fill: none; stroke: #977c2f; stroke-width: 4; }
      .border-inner { fill: none; stroke: #977c2f; stroke-width: 1; stroke-dasharray: 6 4; }
      .title { font-family: 'Outfit', sans-serif; font-size: 24px; fill: #9d2c1b; letter-spacing: 4px; text-anchor: middle; text-transform: uppercase; font-weight: 600; }
      .rubric { font-family: 'Outfit', sans-serif; font-size: 16px; fill: #9d2c1b; letter-spacing: 2px; text-transform: uppercase; font-weight: 600; }
      .text-user { font-family: 'Cormorant Garamond', serif; font-size: 28px; fill: #6d5d45; font-style: italic; }
      .text-assistant { font-family: 'Cormorant Garamond', serif; font-size: 32px; fill: #362b1c; font-weight: 400; }
      .watermark { font-family: 'Outfit', sans-serif; font-size: 14px; fill: #ab9670; letter-spacing: 2px; text-anchor: middle; }
      .seal { fill: #7c1c14; }
    </style>
  </defs>
  
  <rect width="1200" height="630" class="bg" />
  <rect x="25" y="25" width="1150" height="580" class="border-outer" />
  <rect x="35" y="35" width="1130" height="560" class="border-inner" />
  
  <text x="600" y="80" class="title">Haničar GPT — Svitak</text>
  <path d="M 570,105 L 600,100 L 630,105 L 600,110 Z" fill="#977c2f" />
  <line x1="100" y1="105" x2="550" y2="105" stroke="#977c2f" stroke-width="1" opacity="0.5" />
  <line x1="650" y1="105" x2="1100" y2="105" stroke="#977c2f" stroke-width="1" opacity="0.5" />

  <g transform="translate(100, 140)">
    <text x="0" y="0" class="rubric">Molba vjernika:</text>
    ${userSvgLines}
  </g>

  <line x1="100" y1="295" x2="1100" y2="295" stroke="#977c2f" stroke-width="1" stroke-dasharray="4 4" opacity="0.4" />

  <g transform="translate(100, 340)">
    <text x="0" y="0" class="rubric" style="fill: #7c1c14;">Odgovor Haničara:</text>
    ${assistantSvgLines}
  </g>

  <g transform="translate(1090, 520) scale(0.8)">
    <circle cx="0" cy="0" r="45" class="seal" fill="url(#seal-grad)" />
    <circle cx="0" cy="0" r="35" fill="none" stroke="#f2e2bf" stroke-width="2" opacity="0.7" />
    <path d="M -10,-15 L 10,-15 L 0,15 Z" fill="#f2e2bf" opacity="0.8" />
  </g>

  <defs>
    <radialGradient id="seal-grad" cx="34%" cy="28%" r="60%">
      <stop offset="0%" stop-color="#a8402c" />
      <stop offset="46%" stop-color="#7c1c14" />
      <stop offset="100%" stop-color="#56110b" />
    </radialGradient>
  </defs>
  
  <text x="600" y="580" class="watermark">HONEY-GPT.VERCEL.APP</text>
</svg>`;

  const env = getEnv();
  response.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  response.setHeader('Content-Type', 'image/svg+xml');
  response.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  response.status(200).send(Buffer.from(svg, 'utf-8'));
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
