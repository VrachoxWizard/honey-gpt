import { describe, it, expect, vi } from 'vitest';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

import { parseFileContent } from './fileParser';

describe('fileParser', () => {
  it('parses plain text files', async () => {
    const file = new File(['Sadržaj dokumenta'], 'test.txt', { type: 'text/plain' });
    const content = await parseFileContent(file);
    expect(content).toBe('Sadržaj dokumenta');
  });

  it('rejects unsupported file extensions', async () => {
    const file = new File(['data'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    await expect(parseFileContent(file)).rejects.toThrow('Nepodržan format datoteke');
  });
});
