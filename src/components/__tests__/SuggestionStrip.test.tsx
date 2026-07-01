import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SuggestionStrip } from '../SuggestionStrip';

describe('SuggestionStrip', () => {
  it('renders all four default suggestions', () => {
    render(<SuggestionStrip onSelect={vi.fn()} />);

    expect(screen.getByText('Objasni mi temu kao da smo na kavi poslije nedjeljne mise.')).toBeInTheDocument();
    expect(screen.getByText('Napiši mi plan za ovaj tjedan uz kršćansku poniznost.')).toBeInTheDocument();
    expect(screen.getByText('Kako preživjeti siječanj u Hrvatskoj bez kredita?')).toBeInTheDocument();
    expect(screen.getByText('Pretvori ovu poruku u diplomatski prigovor za Sabor.')).toBeInTheDocument();
  });

  it('calls onSelect with correct text when a suggestion chip is clicked', () => {
    const onSelectMock = vi.fn();
    render(<SuggestionStrip onSelect={onSelectMock} />);

    const chip = screen.getByText('Kako preživjeti siječanj u Hrvatskoj bez kredita?');
    fireEvent.click(chip);

    expect(onSelectMock).toHaveBeenCalledWith('Kako preživjeti siječanj u Hrvatskoj bez kredita?');
  });
});
