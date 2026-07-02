import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonaSeals } from '../PersonaSeals';

describe('PersonaSeals', () => {
  it('renders rite radios and changes selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<PersonaSeals active="sanctus" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /Dalmatinac obred/i }));
    expect(onChange).toHaveBeenCalledWith('dalmaticus');
  });
});
