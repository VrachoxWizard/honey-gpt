import { useEffect } from 'react';

interface ShortcutConfig {
  onSearch: () => void;
  onNewChat: () => void;
  onExport: () => void;
  onClose: () => void;
}

export function useKeyboardShortcuts({ onSearch, onNewChat, onExport, onClose }: ShortcutConfig) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearch, onNewChat, onExport, onClose]);
}
