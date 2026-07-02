import { handleChatRequest, type ChatHandlerRequest } from '../server/handler.js';

type VercelRequest = ChatHandlerRequest;

type VercelResponse = {
  statusCode?: number;
  setHeader(name: string, value: string): VercelResponse;
  end(body?: string): void;
  write(chunk: string): void;
  writeHead(statusCode: number, headers: Record<string, string>): void;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const result = await handleChatRequest(request, {
    write: (chunk) => response.write(chunk),
    setHeader: (name, value) => {
      response.setHeader(name, value);
    },
    writeHead: (statusCode, headers) => {
      response.writeHead(statusCode, headers);
    },
    end: () => response.end(),
  });

  if (!result.streamed) {
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
  }
}
