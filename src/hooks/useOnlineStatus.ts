import { useEffect, useState } from 'react';

function getInitialOnlineState(): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') return true;
  return navigator.onLine;
}

/**
 * Tracks browser connectivity via the `online`/`offline` window events.
 * Povijest razgovora ostaje dostupna offline (IndexedDB); samo slanje ovisi o mreži.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(getInitialOnlineState);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
