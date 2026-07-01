import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4 md:gap-6 w-full max-w-[900px] mx-auto mt-4"
    >
      <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-crimson-950 border border-crimson-900/50 select-none">
        <img
          src="/hanicar-the-genie.jpeg"
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500 mb-2 flex items-center gap-1.5 select-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-crimson-500"></span>
          </span>
          † Haničar GPT †
        </span>
        
        <div className="pl-4 border-l-2 border-crimson-900/40 w-full max-w-md">
          {/* Premium typing dots */}
          <div className="flex items-center gap-1.5 mb-3 h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-crimson-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase ml-1.5 select-none animate-pulse">Haničar moli krunicu...</span>
          </div>
          {/* Shimmer skeleton lines */}
          <div className="space-y-2.5 w-full">
            <div className="h-3 w-11/12 rounded bg-zinc-900 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
            <div className="h-3 w-5/6 rounded bg-zinc-900 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
            <div className="h-3 w-2/3 rounded bg-zinc-900 animate-pulse relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
