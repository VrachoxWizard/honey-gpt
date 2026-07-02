import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Invocation } from '../Invocation';

describe('Invocation', () => {
  it('shows mobile-friendly rite copy and shortcut hints', () => {
    render(<Invocation onSuggestionSelect={vi.fn()} />);

    expect(screen.getByText(/Obred izaberi u izborniku/i)).toBeInTheDocument();
    expect(screen.getByText(/za kratice/i)).toBeInTheDocument();
    expect(screen.getByText(/za pretragu/i)).toBeInTheDocument();
  });

  it('calls onSuggestionSelect with the suggestion text when clicked', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = vi.fn();
    render(<Invocation onSuggestionSelect={onSuggestionSelect} />);

    const firstSuggestion = screen.getByText(/Objasni mi temu kao da smo na kavi poslije mise\./i);
    await user.click(firstSuggestion);

    expect(onSuggestionSelect).toHaveBeenCalledWith(
      'Objasni mi temu kao da smo na kavi poslije mise.'
    );
  });
});
