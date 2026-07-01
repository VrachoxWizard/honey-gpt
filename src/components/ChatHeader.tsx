import { motion } from 'framer-motion';
import { Menu, Sun, Moon, Bot } from 'lucide-react';

interface ChatHeaderProps {
  onMenuClick: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  sessionTitle?: string;
  modelName?: string;
}

export function ChatHeader({
  onMenuClick,
  theme,
  onToggleTheme,
  sessionTitle,
  modelName,
}: ChatHeaderProps) {
  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 z-40 sticky top-0 col-span-1">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            aria-label="Otvori izbornik"
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/hanicar-the-genie.jpeg"
              alt=""
              className="w-8 h-8 rounded-full border border-crimson-700/50 object-cover"
            />
            <span className="font-bold text-sm tracking-wide text-zinc-100">HANIČAR GPT</span>
          </div>
        </div>

        {/* Mobile Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleTheme}
          aria-label="Promijeni temu"
          className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
      </header>

      {/* Header Desktop */}
      <header className="hidden md:flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-widest text-crimson-500 uppercase mb-1">
            Satirični AI na hrvatskom
          </p>
          <h2
            key={sessionTitle}
            className="text-2xl font-bold tracking-tight text-zinc-100 animate-fade-in truncate max-w-[52ch]"
          >
            {sessionTitle || 'Što danas rješavamo, uz Božju pomoć?'}
          </h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleTheme}
            aria-label="Promijeni temu"
            className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>

          <div
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-xs font-semibold text-zinc-300 shadow-sm max-w-[200px]"
            title={modelName ? `Aktivni model: ${modelName}` : 'OpenRouter'}
          >
            <Bot size={14} className="text-crimson-500 shrink-0" />
            <span className="truncate">{modelName || 'OpenRouter'}</span>
          </div>
        </div>
      </header>
    </>
  );
}
