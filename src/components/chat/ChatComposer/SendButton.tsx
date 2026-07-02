import { motion } from 'framer-motion';
import { Loader2, Feather } from 'lucide-react';

interface SendButtonProps {
  isDisabled: boolean;
  isSending: boolean;
}

export function SendButton({ isDisabled, isSending }: SendButtonProps) {
  return (
    <motion.button
      whileTap={!isSending ? { scale: 0.94 } : {}}
      type="submit"
      disabled={isDisabled}
      aria-label="Zapečati i pošalji"
      className="wax-seal shrink-0 w-11 h-11 flex items-center justify-center rounded-full mb-0.5 cursor-pointer disabled:cursor-not-allowed"
    >
      {isSending ? <Loader2 size={18} className="animate-spin" /> : <Feather size={16} />}
    </motion.button>
  );
}
