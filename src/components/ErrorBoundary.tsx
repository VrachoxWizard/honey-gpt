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
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: 'var(--parchment)' }}>
          <div className="parchment-grain fixed inset-0 pointer-events-none z-[5]" />
          <div className="max-w-[480px] p-8 rounded-2xl codex-modal flex flex-col items-center relative z-10">
            <div className="w-16 h-16 rounded-full bg-oxblood/15 border border-oxblood/30 flex items-center justify-center text-oxblood mb-6">
              <ShieldAlert size={32} />
            </div>

            <h1 className="text-xl font-incipit text-ink-strong tracking-wide mb-2">
              Haničar se privremeno srušio
            </h1>
            <p className="rubric text-[9px] mb-4">
              Greška u sustavu
            </p>

            <p className="text-sm text-ink-soft leading-relaxed mb-6 font-display">
              Došlo je do neočekivanog pada aplikacije. Haničar moli krunicu za oprost grijeha u
              kodu. Možete pokušati osvježiti stranicu ili resetirati podatke o razgovorima ako je
              došlo do korupcije povijesti.
            </p>

            {this.state.error && (
              <pre className="w-full text-left p-3 rounded-lg bg-parchment-3 border border-line text-[10px] font-mono text-ink-soft overflow-x-auto max-h-[100px] mb-6">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 bg-oxblood hover:brightness-110 text-seal py-3 px-4 rounded-xl font-ui font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-[0_3px_10px_rgba(60,12,8,0.25)]"
              >
                <RefreshCcw size={16} />
                Pokušaj ponovno
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center bg-vellum hover:bg-parchment-3 text-ink-soft hover:text-ink py-3 px-4 rounded-xl font-ui font-medium text-sm border border-line transition-all cursor-pointer"
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
