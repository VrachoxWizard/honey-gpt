import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatComposer } from '../ChatComposer';
import { ToastProvider } from '../Toast';

describe('ChatComposer', () => {
  it('disables the submit button if draft is empty and no image is attached', () => {
    render(
      <ToastProvider>
        <ChatComposer
          draft=""
          setDraft={vi.fn()}
          isSending={false}
          error=""
          onSubmit={vi.fn()}
          onAbort={vi.fn()}
        />
      </ToastProvider>
    );

    const button = screen.getByRole('button', { name: 'Zapečati i pošalji' });
    expect(button).toBeDisabled();
  });

  it('enables the submit button if draft is not empty and not sending', () => {
    render(
      <ToastProvider>
        <ChatComposer
          draft="Dobar dan"
          setDraft={vi.fn()}
          isSending={false}
          error=""
          onSubmit={vi.fn()}
          onAbort={vi.fn()}
        />
      </ToastProvider>
    );

    const button = screen.getByRole('button', { name: 'Zapečati i pošalji' });
    expect(button).not.toBeDisabled();
  });

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn();
    render(
      <ToastProvider>
        <ChatComposer
          draft="Dobar dan"
          setDraft={vi.fn()}
          isSending={false}
          error=""
          onSubmit={onSubmit}
          onAbort={vi.fn()}
        />
      </ToastProvider>
    );

    const button = screen.getByRole('button', { name: 'Zapečati i pošalji' });
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith('Dobar dan', undefined);
  });

  it('renders Stop button when isSending is true', () => {
    const onAbort = vi.fn();
    render(
      <ToastProvider>
        <ChatComposer
          draft="Dobar dan"
          setDraft={vi.fn()}
          isSending={true}
          error=""
          onSubmit={vi.fn()}
          onAbort={onAbort}
        />
      </ToastProvider>
    );

    // Original button should be disabled because isSending = true
    const submitBtn = screen.getByRole('button', { name: 'Zapečati i pošalji' });
    expect(submitBtn).toBeDisabled();

    // The new "Zaustavi" button should be in the document
    const abortBtn = screen.getByText('Spusti pero');
    expect(abortBtn).toBeInTheDocument();

    fireEvent.click(abortBtn);
    expect(onAbort).toHaveBeenCalled();
  });

  it('renders paperclip icon and input file element for image upload', () => {
    render(
      <ToastProvider>
        <ChatComposer
          draft=""
          setDraft={vi.fn()}
          isSending={false}
          error=""
          onSubmit={vi.fn()}
          onAbort={vi.fn()}
        />
      </ToastProvider>
    );

    const paperclipBtn = screen.getByLabelText('Priloži datoteku');
    expect(paperclipBtn).toBeInTheDocument();
  });
});
