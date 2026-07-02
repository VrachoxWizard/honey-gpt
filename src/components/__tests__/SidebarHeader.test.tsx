import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SidebarHeader } from '../sidebar/SidebarHeader';

describe('SidebarHeader', () => {
  it('renders theme toggle and calls onToggleTheme', () => {
    const onToggleTheme = vi.fn();

    render(
      <SidebarHeader
        onNewChat={vi.fn()}
        onSearch={vi.fn()}
        onClose={vi.fn()}
        rite="sanctus"
        onChangeRite={vi.fn()}
        theme="day"
        onToggleTheme={onToggleTheme}
        activeModel="google/gemini-2.5-flash"
        onChangeModel={vi.fn()}
      />
    );

    const themeButton = screen.getByLabelText('Uključi noćnu temu');
    fireEvent.click(themeButton);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
