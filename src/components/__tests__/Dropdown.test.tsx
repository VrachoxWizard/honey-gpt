import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from '../Dropdown';

describe('Dropdown', () => {
  it('opens options and calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Dropdown
        value="a"
        options={[
          { id: 'a', label: 'Prva' },
          { id: 'b', label: 'Druga' },
        ]}
        onChange={onChange}
        trigger={<button type="button">Otvori</button>}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Otvori' }));
    await user.click(screen.getByText('Druga'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
