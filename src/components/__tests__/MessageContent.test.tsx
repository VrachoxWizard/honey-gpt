import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageContent } from '../chat/MessageContent';

describe('MessageContent', () => {
  it('renders markdown text', () => {
    render(<MessageContent content="**Blagoslov** iz Splita" />);
    expect(screen.getByText('Blagoslov')).toBeInTheDocument();
    expect(screen.getByText(/iz Splita/)).toBeInTheDocument();
  });
});
