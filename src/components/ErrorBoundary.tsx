import React, { ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Artisan Panel Runtime Exception caught by Boundary:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div id="error-boundary-view" className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] flex flex-col items-center justify-center p-6 sm:p-12 text-center antialiased">
          <div className="max-w-md w-full space-y-8 p-8 sm:p-10 bg-white border border-yellow-600/20 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Elegant luxury background decorations */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-600/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-rose-600/5 rounded-full blur-2xl pointer-events-none" />

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[#721c24] animate-pulse">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-3">
              <span className="text-[9px] uppercase tracking-[0.4em] text-yellow-600 font-bold block">
                Artisan Lab Recovery Mode
              </span>
              <h1 className="text-3.5xl font-serif text-[#721c24] font-black uppercase leading-tight">
                Anshi Collection
              </h1>
              <div className="h-[1px] w-16 bg-[#721c24]/20 mx-auto my-2" />
              <p className="text-xs text-slate-600 uppercase tracking-widest font-bold">
                Boutique Gateway Offline
              </p>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed max-w-xs font-semibold">
              The boutique encountered a secure session exception. Your curated boutique collection is fully preserved.
            </p>

            <div className="w-full pt-4 space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#721c24] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-lg hover:opacity-95 active:scale-95 transition-all text-center cursor-pointer"
              >
                <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
                <span>Reconnect Gallery</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-4 text-[10px] text-slate-500 hover:text-[#721c24] uppercase tracking-widest font-bold transition-colors cursor-pointer block border border-slate-200 rounded-xl"
              >
                Clear Cache & Restart
              </button>
            </div>

            <div className="text-[9px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1.5 pt-4 border-t border-slate-100 w-full justify-center">
              <Sparkles size={10} className="text-yellow-600" fill="currentColor" />
              <span>Richa Verma Curator</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
