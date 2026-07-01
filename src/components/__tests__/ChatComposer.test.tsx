import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatComposer } from '../ChatComposer';

describe('ChatComposer', () => {
  it('disables the submit button if draft is empty and no image is attached', () => {
    render(
      <ChatComposer 
        draft="" 
        setDraft={vi.fn()} 
        isSending={false} 
        error="" 
        onSubmit={vi.fn()} 
        onAbort={vi.fn()} 
      />
    );
    
    const button = screen.getByRole('button', { name: 'Pošalji poruku' });
    expect(button).toBeDisabled();
  });

  it('enables the submit button if draft is not empty and not sending', () => {
    render(
      <ChatComposer 
        draft="Dobar dan" 
        setDraft={vi.fn()} 
        isSending={false} 
        error="" 
        onSubmit={vi.fn()} 
        onAbort={vi.fn()} 
      />
    );
    
    const button = screen.getByRole('button', { name: 'Pošalji poruku' });
    expect(button).not.toBeDisabled();
  });

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = vi.fn();
    render(
      <ChatComposer 
        draft="Dobar dan" 
        setDraft={vi.fn()} 
        isSending={false} 
        error="" 
        onSubmit={onSubmit} 
        onAbort={vi.fn()} 
      />
    );
    
    const button = screen.getByRole('button', { name: 'Pošalji poruku' });
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalledWith('Dobar dan', undefined);
  });

  it('renders Stop button when isSending is true', () => {
    const onAbort = vi.fn();
    render(
      <ChatComposer 
        draft="Dobar dan" 
        setDraft={vi.fn()} 
        isSending={true} 
        error="" 
        onSubmit={vi.fn()} 
        onAbort={onAbort} 
      />
    );
    
    // Original button should be disabled because isSending = true
    const submitBtn = screen.getByRole('button', { name: 'Pošalji poruku' }); 
    expect(submitBtn).toBeDisabled();

    // The new "Zaustavi" button should be in the document
    const abortBtn = screen.getByText('Zaustavi');
    expect(abortBtn).toBeInTheDocument();
    
    fireEvent.click(abortBtn);
    expect(onAbort).toHaveBeenCalled();
  });

  it('renders paperclip icon and input file element for image upload', () => {
    render(
      <ChatComposer 
        draft="" 
        setDraft={vi.fn()} 
        isSending={false} 
        error="" 
        onSubmit={vi.fn()} 
        onAbort={vi.fn()} 
      />
    );

    const paperclipBtn = screen.getByLabelText('Učitaj sliku');
    expect(paperclipBtn).toBeInTheDocument();
  });
});
