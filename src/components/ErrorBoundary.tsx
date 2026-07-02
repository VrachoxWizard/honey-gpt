import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, ShieldAlert } from 'lucide-react';
import { Sentry } from '@lib/monitoring';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Neprevučen pad aplikacije:', error, errorInfo);
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  private handleReset = () => {
    localStorage.removeItem('hanicar_gpt_sessions_v2');
    localStorage.removeItem('hanicar_gpt_active_session_id_v2');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-zinc-950 p-6 font-sans text-center">
          <div className="max-w-[480px] p-8 rounded-2xl bg-zinc-900 border border-red-900/20 shadow-2xl flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-500 mb-6">
              <ShieldAlert size={32} />
            </div>

            <h1 className="text-xl font-black text-zinc-100 tracking-tight mb-2">
              Haničar se privremeno srušio
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest text-crimson-500 mb-4">
              Greška u sustavu
            </p>

            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              Došlo je do neočekivanog pada aplikacije. Haničar moli krunicu za oprost grijeha u
              kodu. Možete pokušati osvježiti stranicu ili resetirati podatke o razgovorima ako je
              došlo do korupcije povijesti.
            </p>

            {this.state.error && (
              <pre className="w-full text-left p-3 rounded-lg bg-black border border-white/5 text-[10px] font-mono text-zinc-500 overflow-x-auto max-h-[100px] mb-6">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer"
              >
                <RefreshCcw size={16} />
                Pokušaj ponovno
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 py-3 px-4 rounded-xl font-medium text-sm border border-white/5 transition-all cursor-pointer"
              >
                Resetiraj povijest
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
