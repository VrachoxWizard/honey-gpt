import { describe, it, expect } from 'vitest';
import {
  buildMessageWithDocument,
  truncateDocumentContent,
  MAX_DOCUMENT_ATTACHMENT_CHARS,
} from './documentAttachment';

describe('documentAttachment', () => {
  it('truncates long document content', () => {
    const long = 'a'.repeat(MAX_DOCUMENT_ATTACHMENT_CHARS + 100);
    const truncated = truncateDocumentContent(long);
    expect(truncated.length).toBeLessThan(long.length);
    expect(truncated).toMatch(/skraćen/i);
  });

  it('builds message with attached document', () => {
    const message = buildMessageWithDocument('Molba', {
      name: 'test.txt',
      content: 'Sadržaj dokumenta',
    });

    expect(message).toContain('Molba');
    expect(message).toContain('test.txt');
    expect(message).toContain('Sadržaj dokumenta');
  });
});
