import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatSearch } from '../sidebar/ChatSearch';

describe('ChatSearch', () => {
  it('updates filter value', async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    render(<ChatSearch filter="" onFilterChange={onFilterChange} />);
    await user.type(screen.getByPlaceholderText(/Prolistaj/i), 'test');
    expect(onFilterChange).toHaveBeenCalled();
  });
});
