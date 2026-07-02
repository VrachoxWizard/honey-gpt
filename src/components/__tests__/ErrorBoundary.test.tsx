import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

function BrokenChild(): never {
  throw new Error('Test crash');
}

describe('ErrorBoundary', () => {
  it('renders fallback UI when child throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenChild />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Haničar se privremeno srušio/i)).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
