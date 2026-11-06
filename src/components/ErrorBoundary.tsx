import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    componentStack: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, componentStack: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Domino PRO Error Boundary Caught:', error, errorInfo);
    this.setState({
      componentStack: errorInfo.componentStack || null
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetGame = () => {
    try {
      localStorage.removeItem('az_domino_telefon365_v1');
      localStorage.removeItem('domino_az_current_game');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-6 select-none font-sans">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-4 text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-black text-amber-300 mb-2">
              Oyunda Xəta Baş Verdi
            </h2>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Narahat olmayın, qızıllarınız və statistikanız təhlükəsizdir. Aşağıdakı düymə ilə oyunu bərpa edə bilərsiniz.
            </p>

            {this.state.error && (
              <div className="w-full text-left bg-black/50 border border-rose-500/40 rounded-lg p-2.5 mb-4 text-[11px] text-rose-300 font-mono break-all max-h-36 overflow-y-auto">
                <div className="font-bold mb-1">{this.state.error.toString()}</div>
                {this.state.componentStack && (
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap font-mono mt-1 opacity-80 border-t border-rose-500/20 pt-1">
                    {this.state.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="w-full space-y-2.5">
              <button
                onClick={this.handleReload}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Oyunu Bərpa Et (Yenilə)</span>
              </button>

              <button
                onClick={this.handleResetGame}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
              >
                Yeni Oyuna Başla
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
