import { ChevronDown, Flame, KeyRound, Search, Sparkles } from 'lucide-react';

const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
];

interface ModelSelectorProps {
  activeModel: string;
  onChangeModel: (model: string) => void;
  toneMode: 'humilis' | 'clericus' | 'sanctus';
  onChangeToneMode: (tone: 'humilis' | 'clericus' | 'sanctus') => void;
}

export function ModelSelector({
  activeModel,
  onChangeModel,
  toneMode,
  onChangeToneMode,
}: ModelSelectorProps) {
  return (
    <div className="grid gap-2 mt-auto shrink-0 pt-4 border-t border-white/5 select-none">
      {/* Satira / Tone selector */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 relative">
        <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
          <Sparkles size={16} />
        </div>
        <div className="flex flex-col flex-1 min-w-0 pr-6 relative">
          <label
            htmlFor="tone-select"
            className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block"
          >
            Stil satire
          </label>
          <select
            id="tone-select"
            value={toneMode}
            onChange={(e) => onChangeToneMode(e.target.value as any)}
            className="bg-transparent text-xs text-zinc-200 focus:outline-none w-full cursor-pointer appearance-none font-medium mt-0.5 pr-2"
          >
            <option value="sanctus" className="bg-zinc-950 text-zinc-300 text-xs py-1">
              † Sveti mod
            </option>
            <option value="clericus" className="bg-zinc-950 text-zinc-300 text-xs py-1">
              † Birokratski mod
            </option>
            <option value="humilis" className="bg-zinc-950 text-zinc-300 text-xs py-1">
              † Ponizni mod
            </option>
          </select>
          <div className="absolute right-0 bottom-1 pointer-events-none text-zinc-500">
            <ChevronDown size={12} />
          </div>
        </div>
      </div>

      {/* Model selector */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 relative">
        <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
          <Search size={16} />
        </div>
        <div className="flex flex-col flex-1 min-w-0 pr-6 relative">
          <label
            htmlFor="model-select"
            className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block"
          >
            Aktivni model
          </label>
          <select
            id="model-select"
            value={AVAILABLE_MODELS.some((m) => m.id === activeModel) ? activeModel : ''}
            onChange={(e) => onChangeModel(e.target.value)}
            className="bg-transparent text-xs text-zinc-200 focus:outline-none w-full cursor-pointer appearance-none font-medium mt-0.5 pr-2 truncate"
          >
            {!AVAILABLE_MODELS.some((m) => m.id === activeModel) && activeModel && (
              <option value={activeModel} className="bg-zinc-950 text-zinc-300 text-xs py-1">
                {
                  activeModel
                    .replace(/^(google\/|qwen\/|meta-llama\/|deepseek\/|mistralai\/)/, '')
                    .split(':')[0]
                }
              </option>
            )}
            {AVAILABLE_MODELS.map((m) => (
              <option
                key={m.id}
                value={m.id}
                className="bg-zinc-950 text-zinc-300 text-xs py-1"
              >
                {m.name}
              </option>
            ))}
          </select>
          <div className="absolute right-0 bottom-1 pointer-events-none text-zinc-500">
            <ChevronDown size={12} />
          </div>
        </div>
      </div>

      {/* Static Status Items: Vjera, API ključ */}
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5">
        <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
          <Flame size={16} />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Vjera u Boga
          </span>
          <span className="text-xs font-medium text-zinc-200">100%</span>
        </div>
      </div>

      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5">
        <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
          <KeyRound size={16} />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            API ključ
          </span>
          <span className="text-xs font-medium text-zinc-200">Aktivan</span>
        </div>
      </div>
    </div>
  );
}
