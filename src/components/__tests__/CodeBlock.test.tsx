import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CodeBlock } from '../chat/CodeBlock';

vi.mock('../ShikiHighlighter', () => ({
  ShikiHighlighter: ({ code }: { code: string }) => <pre>{code}</pre>,
}));

vi.mock('@hooks/useClipboard', () => ({
  useClipboard: () => ({
    copied: false,
    copy: vi.fn().mockResolvedValue(true),
  }),
}));

describe('CodeBlock', () => {
  it('renders fenced code block with copy button', () => {
    render(<CodeBlock className="language-ts">{`const x = 1`}</CodeBlock>);

    expect(screen.getByText('ts')).toBeInTheDocument();
    expect(screen.getByLabelText(/Prepiši kod/i)).toBeInTheDocument();
    expect(screen.getByText('const x = 1')).toBeInTheDocument();
  });
});
