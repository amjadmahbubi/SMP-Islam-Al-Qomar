import React from 'react';
import { UserSession, SchoolInfo, GoogleSheetsConfig } from '../types';
import { School, LogIn, LogOut, ShieldCheck, UserCheck, Eye, FileSpreadsheet, Menu, X, Sun, Moon, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  schoolInfo: SchoolInfo;
  session: UserSession;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  sheetsConfig?: GoogleSheetsConfig;
  hasSheetsMismatch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  schoolInfo,
  session,
  onOpenLoginModal,
  onLogout,
  activeTab,
  setActiveTab,
  onToggleSidebar,
  isSidebarOpen,
  theme,
  onToggleTheme,
  sheetsConfig,
  hasSheetsMismatch = false
}) => {
  return (
    <header className="bg-slate-900/70 backdrop-blur-xl text-white shadow-2xl sticky top-0 z-30 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Left: Hamburger Menu Button + Logo & School Name */}
          <div className="flex items-center gap-3">
            {/* Hamburger Toggle Button */}
            <button
              onClick={onToggleSidebar}
              className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 hover:text-emerald-200 rounded-xl border border-white/15 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              title={isSidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu Navigation"}
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-rose-300" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo & School Title */}
            <div 
              onClick={() => setActiveTab('statistik')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg border border-emerald-400/30 backdrop-blur-md group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                {schoolInfo.logoUrl ? (
                  <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-cover" />
                ) : (
                  "☪"
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight text-white font-serif truncate max-w-[190px] sm:max-w-none">
                    {schoolInfo.nama}
                  </h1>
                  <span className="hidden sm:inline-block bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-400/30 shrink-0">
                    AKREDITASI {schoolInfo.akreditasi}
                  </span>
                </div>
                <p className="text-xs text-slate-300/90 font-light hidden md:block">
                  Sistem Informasi & Data Pokok Pendidikan (DAPODIK) • TA {schoolInfo.tahunAjaran} ({schoolInfo.semesterAktif})
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/10 text-xs backdrop-blur-md">
              {session.role === 'admin' && (
                <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Admin DAPODIK</span>
                </div>
              )}
              {session.role === 'guru' && (
                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span className="truncate max-w-[130px]">{session.name}</span>
                </div>
              )}
              {session.role === 'public' && (
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>Publik / Wali Murid</span>
                </div>
              )}
            </div>

            {/* Google Sheets Status / Warning Indicator for Admin */}
            {session.role === 'admin' && (
              <>
                {hasSheetsMismatch ? (
                  <button
                    onClick={() => setActiveTab('google-sheets')}
                    className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md animate-pulse cursor-pointer"
                    title="Peringatan: URL Web App Google Sheets yang aktif berbeda dengan database konfigurasi tersimpan. Klik untuk meninjau dan menyimpan."
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="hidden md:inline">URL Sheets Berubah (Belum Simpan)</span>
                    <span className="md:hidden">⚠️ Sheets</span>
                  </button>
                ) : sheetsConfig?.webAppUrl ? (
                  <button
                    onClick={() => setActiveTab('google-sheets')}
                    className="hidden xl:flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    title={`Google Sheets Terkunci & Siap: ${sheetsConfig.webAppUrl}`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Sheets Terhubung</span>
                  </button>
                ) : null}
              </>
            )}

            {/* Light/Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                theme === 'dark'
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-400/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
              }`}
              title={theme === 'dark' ? "Beralih ke Mode Terang (Light Mode)" : "Beralih ke Mode Gelap (Dark Mode)"}
              aria-label="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden md:inline font-bold">Mode Terang</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="hidden md:inline font-bold text-indigo-900">Mode Gelap</span>
                </>
              )}
            </button>

            {/* Login / Logout Button */}
            {session.role === 'public' ? (
              <button
                onClick={onOpenLoginModal}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl shadow-lg transition-all border border-emerald-300/50"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Petugas</span>
              </button>
            ) : (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-xs sm:text-sm px-3 py-2 rounded-xl border border-rose-500/40 transition-all backdrop-blur-md"
                title="Keluar akun"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
