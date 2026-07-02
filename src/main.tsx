import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@styles/styles.css';
import { initClientMonitoring } from '@lib/monitoring';
import { registerSW } from 'virtual:pwa-register';

initClientMonitoring();

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
