import { useEffect } from 'react';

interface ShortcutConfig {
  onSearch: () => void;
  onNewChat: () => void;
  onExport: () => void;
  onClose: () => void;
  onHelp?: () => void;
}

export function useKeyboardShortcuts({
  onSearch,
  onNewChat,
  onExport,
  onClose,
  onHelp,
}: ShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevencija okidanja prečaca dok korisnik piše u tekstualno polje
      const isInput = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;

      // Provjera platforme (Mac koristi Cmd/Meta, ostali Ctrl)
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl + K / Cmd + K -> Otvori pretragu
      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onSearch();
      }

      // Ctrl + N / Cmd + N -> Novi razgovor
      if (modifier && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNewChat();
      }

      // Ctrl + Shift + S / Cmd + Shift + S -> Izvoz razgovora
      if (modifier && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onExport();
      }

      // Escape -> Zatvori
      if (e.key === 'Escape') {
        onClose();
      }

      // ? -> Otvori help modal (samo ako nismo fokusirani na input/textarea)
      if (e.key === '?' && !modifier && !isInput) {
        e.preventDefault();
        onHelp?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onNewChat, onExport, onClose, onHelp]);
}
