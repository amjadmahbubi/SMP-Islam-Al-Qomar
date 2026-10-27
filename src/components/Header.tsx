import React, { useState } from 'react';
import { UserSession, SchoolInfo, GoogleSheetsConfig, Teacher } from '../types';
import { 
  School, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Eye, 
  FileSpreadsheet, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  AlertTriangle, 
  RefreshCw, 
  Database,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  schoolInfo: SchoolInfo;
  session: UserSession;
  teachers?: Teacher[];
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
  autoSyncStatus?: {
    status: 'idle' | 'checking' | 'synced' | 'offline';
    lastSyncTime?: string;
    message?: string;
  };
  onTriggerAutoSync?: () => Promise<void> | void;
}

export const Header: React.FC<HeaderProps> = ({
  schoolInfo,
  session,
  teachers = [],
  onOpenLoginModal,
  onLogout,
  activeTab,
  setActiveTab,
  onToggleSidebar,
  isSidebarOpen,
  theme,
  onToggleTheme,
  sheetsConfig,
  hasSheetsMismatch = false,
  autoSyncStatus,
  onTriggerAutoSync
}) => {
  const [isSyncPopoverOpen, setIsSyncPopoverOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSyncClick = async () => {
    if (onTriggerAutoSync && !isManualSyncing) {
      setIsManualSyncing(true);
      try {
        await onTriggerAutoSync();
      } finally {
        setTimeout(() => setIsManualSyncing(false), 800);
      }
    }
  };

  const loggedTeacher = teachers.find(
    t => (session.teacherId && t.id === session.teacherId) || t.nama === session.name
  );
  const isKepalaSekolah = !!(
    loggedTeacher &&
    (loggedTeacher.jabatan?.toLowerCase().includes('kepala sekolah') ||
      loggedTeacher.jabatan?.toLowerCase().includes('kepsek'))
  );
  return (
    <header className="bg-slate-900/95 backdrop-blur-xl text-white shadow-xl sticky top-0 z-40 border-b border-white/10 transition-all w-full">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-1.5 sm:gap-4">
          
          {/* Left: Hamburger Menu Button + Logo & School Name (min-w-0 flex-1 ensures it shrinks & truncates on small phones) */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
            {/* Hamburger Toggle Button */}
            <button
              onClick={onToggleSidebar}
              className="p-2 sm:p-2.5 bg-slate-800/80 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 rounded-xl border border-white/15 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shrink-0"
              title={isSidebarOpen ? "Sembunyikan Menu" : "Tampilkan Menu Navigation"}
              aria-label="Toggle Navigation Menu"
            >
              {isSidebarOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5 text-rose-300" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Logo & School Title */}
            <div 
              onClick={() => setActiveTab('statistik')}
              className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group select-none min-w-0 flex-1"
            >
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white text-emerald-950 flex items-center justify-center font-bold text-sm sm:text-xl shadow-lg border border-emerald-400/40 backdrop-blur-md group-hover:scale-105 transition-transform overflow-hidden shrink-0 p-0.5">
                {schoolInfo.logoUrl ? (
                  <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-contain" />
                ) : (
                  "☪"
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-base md:text-xl font-bold tracking-tight text-white font-serif truncate leading-tight">
                    {schoolInfo.nama}
                  </h1>
                  <span className="hidden lg:inline-block bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold border border-emerald-400/30 shrink-0">
                    AKREDITASI {schoolInfo.akreditasi}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300/90 font-light hidden md:block truncate">
                  Sistem Informasi &amp; Data Pokok Pendidikan (DAPODIK) • TA {schoolInfo.tahunAjaran} ({schoolInfo.semesterAktif})
                </p>
                <p className="text-[9px] text-emerald-400/90 font-medium md:hidden truncate leading-none mt-0.5">
                  SIM DAPODIK • TA {schoolInfo.tahunAjaran}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Bar (shrink-0 prevents right buttons from getting squeezed or hidden) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* KETIKA SUDAH LOGIN (GURU / ADMIN): TAMPILAN SEDERHANA & BERSIH */}
            {session.role !== 'public' ? (
              <>
                {/* Info Pengguna & Role (Hanya tampil pada layar laptop/desktop) */}
                <div className="hidden lg:flex items-center gap-2 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/10 text-xs backdrop-blur-md">
                  {session.role === 'admin' && (
                    <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {isKepalaSekolah
                          ? `Kepala Sekolah • ${session.name.split(',')[0]}`
                          : session.teacherId
                          ? `Admin • ${session.name.split(',')[0]}`
                          : 'Admin DAPODIK'}
                      </span>
                    </div>
                  )}
                  {session.role === 'guru' && (
                    <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                      <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[180px]">
                        {session.name.split(',')[0]}
                        {loggedTeacher?.jabatan && loggedTeacher.jabatan !== 'Guru Mata Pelajaran'
                          ? ` (${loggedTeacher.jabatan.split('&')[0].trim()})`
                          : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* VISUAL STATUS SINKRONISASI (Responsif di HP & Komputer) */}
                <div className="relative">
                  {hasSheetsMismatch && session.role === 'admin' ? (
                    <button
                      onClick={() => setActiveTab('google-sheets')}
                      className="flex items-center gap-1 sm:gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md animate-pulse cursor-pointer shrink-0"
                      title="Peringatan: URL Web App Google Sheets belum disimpan."
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="hidden sm:inline">URL Berubah</span>
                      <span className="sm:hidden text-[10px]">Perlu Simpan</span>
                    </button>
                  ) : autoSyncStatus?.status === 'offline' ? (
                    <button
                      type="button"
                      onClick={() => setIsSyncPopoverOpen(!isSyncPopoverOpen)}
                      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-md cursor-pointer bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/50 animate-pulse active:scale-95 shrink-0"
                      title="Koneksi terputus / Gagal sinkron dengan Google Sheets. Klik untuk detail."
                      aria-label="Status Sinkronisasi Gagal"
                    >
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <WifiOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="hidden sm:inline">Gagal Sinkron</span>
                      <span className="sm:hidden text-[10px] font-bold">Terputus</span>
                    </button>
                  ) : autoSyncStatus?.status === 'checking' || isManualSyncing ? (
                    <button
                      type="button"
                      onClick={() => setIsSyncPopoverOpen(!isSyncPopoverOpen)}
                      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer bg-amber-500/20 text-amber-300 border-amber-400/40 hover:bg-amber-500/30 shrink-0"
                      title="Sedang menyinkronkan data dengan Google Sheets..."
                      aria-label="Sedang Menyinkronkan"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                      <span className="hidden sm:inline">Menyinkronkan...</span>
                      <span className="sm:hidden text-[10px]">Sync</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSyncPopoverOpen(!isSyncPopoverOpen)}
                      className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-sm bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-400/30 shrink-0"
                      title={autoSyncStatus?.lastSyncTime ? `Tersinkron normal (${autoSyncStatus.lastSyncTime}). Klik untuk detail.` : 'Tersinkron ke Google Sheets'}
                      aria-label="Status Sinkronisasi Normal"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shrink-0"></span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 hidden sm:inline" />
                      <span className="hidden md:inline font-mono text-[11px]">
                        {autoSyncStatus?.lastSyncTime ? `Sinkron ${autoSyncStatus.lastSyncTime}` : 'Sinkron'}
                      </span>
                      <span className="md:hidden text-[10px] font-bold">Sinkron</span>
                    </button>
                  )}

                  {/* POPOVER DETAIL SINKRONISASI (Mobile & Desktop) */}
                  {isSyncPopoverOpen && (
                    <>
                      <div
                        onClick={() => setIsSyncPopoverOpen(false)}
                        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px]"
                      />
                      <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] max-w-xs sm:max-w-sm rounded-2xl bg-slate-900 border border-white/15 p-4 shadow-2xl z-50 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-2">
                            {autoSyncStatus?.status === 'offline' ? (
                              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                                <WifiOff className="w-4 h-4" />
                              </div>
                            ) : autoSyncStatus?.status === 'checking' || isManualSyncing ? (
                              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/40">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-bold text-white font-serif">
                                {autoSyncStatus?.status === 'offline'
                                  ? 'Koneksi Terputus / Gagal'
                                  : autoSyncStatus?.status === 'checking' || isManualSyncing
                                  ? 'Sedang Memeriksa Data...'
                                  : 'Tersinkronisasi Normal'}
                              </h4>
                              <p className="text-[10px] text-slate-400">
                                {autoSyncStatus?.lastSyncTime ? `Terakhir: ${autoSyncStatus.lastSyncTime}` : 'Data Lokal Tersimpan'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsSyncPopoverOpen(false)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/70 border border-white/5 text-[11px] text-slate-300 space-y-1">
                          <p className="font-semibold text-slate-200">Keterangan Sistem:</p>
                          <p className="text-slate-400 leading-relaxed text-[11px]">
                            {autoSyncStatus?.message || (autoSyncStatus?.status === 'offline'
                              ? 'Tidak dapat menjangkau Google Sheets. Periksa sambungan WiFi/data seluler di HP atau laptop Anda.'
                              : 'Sinkronisasi latar belakang berjalan hening saat membuka tab atau setiap 3 menit.')}
                          </p>
                        </div>

                        <div className="pt-1 flex flex-col gap-2">
                          {onTriggerAutoSync && (
                            <button
                              type="button"
                              onClick={handleManualSyncClick}
                              disabled={autoSyncStatus?.status === 'checking' || isManualSyncing}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 shadow-md transition-all cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${autoSyncStatus?.status === 'checking' || isManualSyncing ? 'animate-spin' : ''}`} />
                              <span>{autoSyncStatus?.status === 'checking' || isManualSyncing ? 'Sedang Menyinkronkan...' : 'Coba Sinkronkan Sekarang'}</span>
                            </button>
                          )}

                          {session.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsSyncPopoverOpen(false);
                                setActiveTab('google-sheets');
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Buka Integrasi Database &amp; Sheets</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Dark/Light Mode Toggle (Tablet/Desktop) */}
                <button
                  onClick={onToggleTheme}
                  className={`hidden sm:flex items-center p-2 rounded-xl text-xs font-semibold transition-all border shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                  }`}
                  title={theme === 'dark' ? "Mode Terang" : "Mode Gelap"}
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                </button>

                {/* HANYA TOMBOL KELUAR (Pas & Tampak Sempurna di HP) */}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 sm:gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 active:bg-rose-600/40 text-rose-200 hover:text-white border border-rose-500/40 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all backdrop-blur-md shadow-md cursor-pointer active:scale-95 shrink-0"
                  title="Keluar dari akun (Logout)"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
                  <span>Keluar</span>
                </button>
              </>
            ) : (
              /* KETIKA BELUM LOGIN (PUBLIK): TAMPILAN RINGKAS TANPA OVERFLOW DI HP */
              <>
                {/* Dark/Light Mode Toggle */}
                <button
                  onClick={onToggleTheme}
                  className={`flex items-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm cursor-pointer shrink-0 ${
                    theme === 'dark'
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-400/30'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                  }`}
                  title={theme === 'dark' ? "Mode Terang" : "Mode Gelap"}
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
                  )}
                </button>

                {/* Tombol Masuk Petugas (Ukuran Pas & Ringkas, Tidak Terpotong di Layar HP) */}
                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1 sm:gap-1.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl shadow-lg transition-all border border-emerald-300/50 cursor-pointer shrink-0 active:scale-95"
                  title="Masuk ke SIM Sekolah (Guru & Admin)"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Masuk</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
