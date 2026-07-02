import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { useFocusTrap } from '../useFocusTrap';

function TrapHarness({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(active, ref);

  return (
    <div ref={ref}>
      <button type="button">Prvi</button>
      <button type="button">Drugi</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('renders focusable controls while active', () => {
    render(<TrapHarness active />);
    expect(screen.getByText('Prvi')).toBeInTheDocument();
    expect(screen.getByText('Drugi')).toBeInTheDocument();
  });
});
