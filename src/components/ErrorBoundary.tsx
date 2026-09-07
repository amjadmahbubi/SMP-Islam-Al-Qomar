import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCacheAndReload = () => {
    try {
      localStorage.removeItem('alqomar_user_session');
      localStorage.removeItem('alqomar_classes');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  private handleFullReset = () => {
    if (window.confirm('Bersihkan seluruh penyimpanan lokal dan pulihkan ke data bawaan resmi?')) {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Terjadi Kendala Tampilan</h1>
                <p className="text-xs text-slate-400">Sistem mendeteksi galat saat memuat komponen</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-36">
              <span className="text-red-400 font-bold block mb-1">
                {this.state.error?.name || 'Error'}: {this.state.error?.message || 'Galat tidak diketahui'}
              </span>
              {this.state.error?.stack && (
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap line-clamp-4">
                  {this.state.error.stack}
                </pre>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Jangan khawatir, data sekolah Anda tetap aman. Silakan klik tombol di bawah untuk memulihkan tampilan aplikasi.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCacheAndReload}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all"
              >
                <Trash2 className="w-4 h-4 text-amber-400" />
                <span>Pulihkan Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
