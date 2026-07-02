import { useEffect, useState } from 'react';

export type AppTheme = 'day' | 'night';

const THEME_STORAGE_KEY = 'hanicar_codex_theme';

export function useAppTheme() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof localStorage === 'undefined') return 'day';
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'night' ? 'night' : 'day';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('night', theme === 'night');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'day' ? 'night' : 'day'));

  return { theme, setTheme, toggleTheme };
}
