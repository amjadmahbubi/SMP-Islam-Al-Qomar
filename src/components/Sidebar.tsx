import React from 'react';
import { UserSession } from '../types';
import {
  BarChart3,
  Calendar,
  Clock,
  CalendarDays,
  School,
  Users,
  GraduationCap,
  Package,
  FolderKanban,
  CheckSquare,
  Award,
  FileSpreadsheet,
  Search,
  BookOpen,
  Trophy,
  X,
  UserPlus,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  session: UserSession;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  session,
  onCloseMobile
}) => {
  const isGuru = session.role === 'guru' || session.role === 'admin';
  const isAdmin = session.role === 'admin';

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const publicNav = [
    { id: 'statistik', label: 'Statistik Sekolah', icon: BarChart3 },
    { id: 'ppdb', label: 'Pendaftaran Siswa Baru (PPDB)', icon: UserPlus },
    { id: 'galeri', label: 'Galeri Sekolah', icon: ImageIcon },
    { id: 'prestasi', label: 'Prestasi Murid', icon: Trophy },
    { id: 'jadwal', label: 'Jadwal Pelajaran', icon: Clock },
    { id: 'agenda', label: 'Agenda Kegiatan', icon: Calendar },
    { id: 'kalender', label: 'Kalender Akademik', icon: CalendarDays },
    { id: 'portal-rapor', label: 'Cek Nilai & Rapor', icon: Search }
  ];

  const guruNav = [
    { id: 'administrasi-guru', label: 'Administrasi Guru', icon: FolderKanban },
    { id: 'absensi-siswa', label: 'Absensi Siswa (WA)', icon: CheckSquare },
    { id: 'input-nilai', label: 'Input Nilai Asesmen', icon: BookOpen },
    { id: 'laporan-rapor', label: 'Laporan Rapor Digital', icon: Award },
    { id: 'wa-gateway', label: 'WhatsApp Gateway & Log', icon: MessageSquare }
  ];

  const adminNav = [
    { id: 'data-sekolah', label: 'Data Profil Sekolah', icon: School },
    { id: 'data-guru', label: 'Data Guru & Tendik', icon: GraduationCap },
    { id: 'data-siswa', label: 'Data Siswa Master', icon: Users },
    { id: 'data-sarpras', label: 'Data Sarpras Sekolah', icon: Package },
    { id: 'ppdb', label: 'Kelola PPDB / Pendaftaran Baru', icon: UserPlus },
    { id: 'galeri', label: 'Kelola Galeri Foto Sekolah', icon: ImageIcon },
    { id: 'kelola-jadwal', label: 'Kelola Jadwal Kelas', icon: Clock },
    { id: 'kelola-kalender', label: 'Kelola Kalender & Agenda', icon: CalendarDays },
    { id: 'google-sheets', label: 'Integrasi Google Sheets', icon: FileSpreadsheet },
    { id: 'wa-gateway', label: 'WhatsApp Gateway & Log', icon: MessageSquare }
  ];

  return (
    <aside className="w-full glass backdrop-blur-xl border border-white/10 rounded-2xl shrink-0 p-4 space-y-6 shadow-2xl relative">
      
      {/* Mobile Close Button Header */}
      {onCloseMobile && (
        <div className="flex items-center justify-between pb-3 border-b border-white/10 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold font-serif text-white uppercase tracking-wider">
              Menu Navigasi
            </span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* SECTION 1: PUBLIC VIEWS */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-3">
          Tampilan Publik & Portal
        </div>
        <nav className="space-y-1">
          {publicNav
            .filter((item) => {
              if (session.role === 'admin' || session.role === 'guru') {
                return item.id === 'prestasi';
              }
              return true;
            })
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-lg font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
        </nav>
      </div>

      {/* SECTION 2: GURU / AKADEMIK (Available to Guru & Admin) */}
      {isGuru && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-2 px-3 flex items-center justify-between">
            <span>Pembelajaran & Guru</span>
            <span className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
              {session.role === 'guru' ? 'GURU' : 'ADMIN'}
            </span>
          </div>
          <nav className="space-y-1">
            {guruNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-lg font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-emerald-400/70'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* SECTION 3: ADMIN MASTER DATA & INTEGRASI (Admin Only) */}
      {isAdmin && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 px-3 flex items-center justify-between">
            <span>Master Data & Admin</span>
            <span className="bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">ADMIN</span>
          </div>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (activeTab === 'sheets' && item.id === 'google-sheets');
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-lg font-semibold'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-amber-400/70'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

    </aside>
  );
};
