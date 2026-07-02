import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportChatToMarkdown } from './exportChat';
import type { Message } from '@shared/types';

describe('exportChatToMarkdown', () => {
  const messages: Message[] = [
    { id: '1', role: 'user', content: 'Pozdrav', timestamp: Date.now() },
    { id: '2', role: 'assistant', content: 'Mir tebi.', timestamp: Date.now() },
  ];

  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates markdown download link with conversation content', () => {
    const click = vi.fn();
    const link = document.createElement('a');
    link.click = click;
    vi.spyOn(document, 'createElement').mockReturnValue(link);

    exportChatToMarkdown(messages);

    expect(link.download).toMatch(/^hanicar_razgovor_\d+\.md$/);
    expect(link.href).toBe('blob:mock');
    expect(click).toHaveBeenCalled();
  });

  it('includes title, rite and model metadata in the exported markdown when provided', async () => {
    const link = document.createElement('a');
    link.click = vi.fn();
    let capturedBlob: Blob | null = null;
    vi.spyOn(document, 'createElement').mockReturnValue(link);
    vi.spyOn(URL, 'createObjectURL').mockImplementation((obj: Blob | MediaSource) => {
      capturedBlob = obj as Blob;
      return 'blob:mock';
    });

    exportChatToMarkdown(messages, {
      title: 'Porezna uprava',
      rite: 'Sveti',
      model: 'Gemini 2.5 Flash',
    });

    expect(capturedBlob).not.toBeNull();
    const text = await capturedBlob!.text();
    expect(text).toContain('# Porezna uprava');
    expect(text).toContain('**Obred:** Sveti');
    expect(text).toContain('**Model:** Gemini 2.5 Flash');
  });

  it('falls back to the default heading when no title metadata is provided', async () => {
    const link = document.createElement('a');
    link.click = vi.fn();
    let capturedBlob: Blob | null = null;
    vi.spyOn(document, 'createElement').mockReturnValue(link);
    vi.spyOn(URL, 'createObjectURL').mockImplementation((obj: Blob | MediaSource) => {
      capturedBlob = obj as Blob;
      return 'blob:mock';
    });

    exportChatToMarkdown(messages);

    expect(capturedBlob).not.toBeNull();
    const text = await capturedBlob!.text();
    expect(text).toContain('# Razgovor s Haničar GPT-om');
  });
});
