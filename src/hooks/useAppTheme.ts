import { useEffect, useState } from 'react';

export type AppTheme = 'day' | 'night';

export const THEME_STORAGE_KEY = 'hanicar_codex_theme';

export function useAppTheme() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof localStorage === 'undefined') return 'night';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'day' ? 'day' : 'night';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('day', theme === 'day');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'day' ? 'night' : 'day'));

  return { theme, setTheme, toggleTheme };
}
