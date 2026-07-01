import { useContext } from 'react';
import { ToastContext } from '../components/ToastContext';

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast mora se koristiti unutar ToastProvidera');
  }
  return context;
}
