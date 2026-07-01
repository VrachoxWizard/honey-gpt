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
    <div className="grid gap-2 mt-auto shrink-0 pt-3 border-t border-white/5 select-none">
      {/* Real controls: tone + model, side by side to stay compact */}
      <div className="grid grid-cols-2 gap-2">
        {/* Satira / Tone selector */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-zinc-900/30 border border-white/5 relative">
          <Sparkles size={14} className="text-zinc-400 shrink-0" />
          <div className="flex flex-col flex-1 min-w-0 pr-4 relative">
            <label
              htmlFor="tone-select"
              className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider block"
            >
              Stil satire
            </label>
            <select
              id="tone-select"
              value={toneMode}
              onChange={(e) => onChangeToneMode(e.target.value as any)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none w-full cursor-pointer appearance-none font-medium mt-0.5 truncate"
            >
              <option value="sanctus" className="bg-zinc-950 text-zinc-300 text-xs py-1">
                Sveti mod
              </option>
              <option value="clericus" className="bg-zinc-950 text-zinc-300 text-xs py-1">
                Birokratski mod
              </option>
              <option value="humilis" className="bg-zinc-950 text-zinc-300 text-xs py-1">
                Ponizni mod
              </option>
            </select>
            <div className="absolute right-0 bottom-1 pointer-events-none text-zinc-500">
              <ChevronDown size={12} />
            </div>
          </div>
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-zinc-900/30 border border-white/5 relative">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <div className="flex flex-col flex-1 min-w-0 pr-4 relative">
            <label
              htmlFor="model-select"
              className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider block"
            >
              Model
            </label>
            <select
              id="model-select"
              value={AVAILABLE_MODELS.some((m) => m.id === activeModel) ? activeModel : ''}
              onChange={(e) => onChangeModel(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none w-full cursor-pointer appearance-none font-medium mt-0.5 truncate"
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
      </div>

      {/* Flavor status line — decorative, clearly not an interactive control */}
      <div className="flex items-center justify-center gap-4 text-[10px] font-medium text-zinc-600 pt-1">
        <span className="flex items-center gap-1.5">
          <Flame size={11} className="text-crimson-700" />
          Vjera u Boga: 100%
        </span>
        <span className="flex items-center gap-1.5">
          <KeyRound size={11} className="text-zinc-600" />
          API ključ aktivan
        </span>
      </div>
    </div>
  );
}
