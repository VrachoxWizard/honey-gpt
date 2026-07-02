import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShikiHighlighter } from '../ShikiHighlighter';

describe('ShikiHighlighter', () => {
  it('renders fallback code block before highlight resolves', () => {
    render(<ShikiHighlighter code="const x = 1" language="ts" />);
    expect(screen.getByText('const x = 1')).toBeInTheDocument();
  });
});
