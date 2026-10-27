import React, { useState } from 'react';
import { CalendarEvent, AgendaItem, SchoolInfo } from '../../types';
import {
  CalendarDays,
  Calendar,
  Filter,
  Search,
  Sparkles,
  Clock,
  MapPin,
  UserCheck,
  CheckCircle2,
  Tag,
  BookOpen,
  Layers,
  ChevronRight,
  Printer
} from 'lucide-react';

interface PublicKalenderAgendaProps {
  events?: CalendarEvent[];
  agendas?: AgendaItem[];
  schoolInfo?: SchoolInfo;
  defaultView?: 'kalender' | 'agenda' | 'terpadu';
}

export const PublicKalenderAgenda: React.FC<PublicKalenderAgendaProps> = ({
  events = [],
  agendas = [],
  schoolInfo,
  defaultView = 'kalender'
}) => {
  const [activeView, setActiveView] = useState<'kalender' | 'agenda' | 'terpadu'>(defaultView);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<'Semua' | 'Ganjil' | 'Genap'>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  const safeEvents = Array.isArray(events) ? events : [];
  const safeAgendas = Array.isArray(agendas) ? agendas : [];

  // Categories for Kalender
  const kalenderCategories = [
    'Semua',
    'KBM',
    'Ujian (PTS/PAS)',
    'Hari Besar Islam (PHBI)',
    'Kegiatan Ekstrakurikuler',
    'Pembagian Rapor',
    'Libur Sekolah'
  ];

  // Categories for Agenda
  const agendaCategories = [
    'Semua',
    'Keagamaan',
    'Akademik',
    'Lomba / Prestasi',
    'Parenting / Kemitraan',
    'Rapat Guru',
    'Tahfidz & Metode Ummi',
    'Kesiswaan & Ekstrakurikuler'
  ];

  const currentCategories = activeView === 'kalender' ? kalenderCategories : agendaCategories;

  const getKalenderBadgeColor = (kategori: string) => {
    switch (kategori) {
      case 'KBM':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      case 'Ujian (PTS/PAS)':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      case 'Hari Besar Islam (PHBI)':
        return 'bg-teal-500/20 text-teal-300 border-teal-400/30';
      case 'Kegiatan Ekstrakurikuler':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'Pembagian Rapor':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30';
      case 'Libur Sekolah':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      default:
        return 'bg-slate-800 text-slate-300 border-white/10';
    }
  };

  const filteredEvents = safeEvents.filter((item) => {
    if (!item) return false;
    const matchSemester = selectedSemester === 'Semua' || item.semester === selectedSemester;
    const matchCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    const matchSearch =
      searchTerm === '' ||
      (item.kegiatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tanggalMulai || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSemester && matchCategory && matchSearch;
  });

  const filteredAgendas = safeAgendas.filter((item) => {
    if (!item) return false;
    const matchCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    const matchSearch =
      searchTerm === '' ||
      (item.judul || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.lokasi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.deskripsi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.penanggungJawab || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Unified items for "Terpadu" view
  type UnifiedItem = {
    type: 'kalender' | 'agenda';
    id: string;
    title: string;
    date: string;
    category: string;
    description: string;
    time?: string;
    location?: string;
    pj?: string;
    status?: string;
    semester?: string;
  };

  const rawUnifiedList: UnifiedItem[] = [
    ...safeEvents.map((e) => ({
      type: 'kalender' as const,
      id: `cal-${e.id}`,
      title: e.kegiatan,
      date: e.tanggalMulai + (e.tanggalSelesai !== e.tanggalMulai ? ` s.d. ${e.tanggalSelesai}` : ''),
      category: e.kategori,
      description: e.deskripsi,
      semester: e.semester
    })),
    ...safeAgendas.map((a) => ({
      type: 'agenda' as const,
      id: `ag-${a.id}`,
      title: a.judul,
      date: a.tanggal,
      category: a.kategori,
      description: a.deskripsi,
      time: a.waktu,
      location: a.lokasi,
      pj: a.penanggungJawab,
      status: a.status
    }))
  ];

  const unifiedList = rawUnifiedList.filter((item: UnifiedItem) => {
    const matchSearch =
      searchTerm === '' ||
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location ? item.location.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (item.pj ? item.pj.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const upcomingCount = safeAgendas.filter((a) => a.status === 'Akan Datang' || a.status === 'Berlangsung').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header Card */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pusat Jadwal & Kalender Resmi • {schoolInfo?.nama || 'SMP Darul Ulum 2'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight">
            Kalender Akademik & Agenda Kegiatan Sekolah
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Informasi lengkap hari efektif KBM, jadwal asesmen & ujian, hari libur nasional, serta kegiatan keagamaan, lomba santri, dan parenting.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
          <div className="bg-slate-950/60 border border-white/10 px-3.5 py-2 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tahun Ajaran</div>
            <div className="text-xs font-bold text-amber-300 font-mono">
              {schoolInfo?.tahunAjaran || '2024/2025'} ({schoolInfo?.semesterAktif || 'Ganjil'})
            </div>
          </div>
          <div className="bg-slate-950/60 border border-white/10 px-3.5 py-2 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Milestone</div>
            <div className="text-xs font-bold text-emerald-300 font-mono">
              {safeEvents.length} Jadwal
            </div>
          </div>
          <div className="bg-slate-950/60 border border-white/10 px-3.5 py-2 rounded-xl text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Agenda Aktif</div>
            <div className="text-xs font-bold text-teal-300 font-mono">
              {upcomingCount} Mendatang
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl border border-white/10 transition-all shadow cursor-pointer"
            title="Cetak Jadwal & Agenda"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Tab Switcher Navigation */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-2 border border-white/10 shadow-lg flex flex-wrap sm:flex-nowrap items-center gap-1.5">
        <button
          onClick={() => {
            setActiveView('kalender');
            setSelectedCategory('Semua');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeView === 'kalender'
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <CalendarDays className={`w-4 h-4 ${activeView === 'kalender' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Kalender Akademik</span>
          <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-slate-950/50 text-slate-300 border border-white/10">
            {safeEvents.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveView('agenda');
            setSelectedCategory('Semua');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeView === 'agenda'
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Calendar className={`w-4 h-4 ${activeView === 'agenda' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Agenda & Kegiatan Santri</span>
          <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-slate-950/50 text-slate-300 border border-white/10">
            {safeAgendas.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveView('terpadu');
            setSelectedCategory('Semua');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeView === 'terpadu'
              ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
        >
          <Layers className={`w-4 h-4 ${activeView === 'terpadu' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Ikhtisar Terpadu</span>
          <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-slate-950/50 text-slate-300 border border-white/10">
            Semua
          </span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Sub-Filters: Semester Buttons if in Kalender */}
          {activeView === 'kalender' && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-semibold mr-1">Semester:</span>
              {(['Semua', 'Ganjil', 'Genap'] as const).map((sem) => (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedSemester === sem
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow'
                      : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {sem === 'Semua' ? 'Semua Semester' : `Semester ${sem}`}
                </button>
              ))}
            </div>
          )}

          {activeView !== 'kalender' && (
            <div className="text-xs text-slate-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saring berdasarkan kategori & kata kunci:</span>
            </div>
          )}

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari agenda, kegiatan, lokasi..."
              className="w-full px-3 py-2 pl-9 bg-slate-950/60 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Pills (for kalender and agenda) */}
        {activeView !== 'terpadu' && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
            {currentCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold shadow'
                    : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: KALENDER AKADEMIK */}
      {activeView === 'kalender' && (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Timeline Kalender Akademik ({filteredEvents.length} Item)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Pola KBM & Hari Libur Resmi
            </span>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/20">
              {filteredEvents.map((evt) => (
                <div key={evt.id} className="relative pl-10 group">
                  
                  {/* Timeline Bullet */}
                  <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 ring-2 ring-emerald-500/40 group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-950/60 rounded-xl p-4 sm:p-5 border border-white/10 hover:border-emerald-400/40 transition-colors space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getKalenderBadgeColor(evt.kategori)}`}>
                          {evt.kategori}
                        </span>
                        <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-white/10">
                          Semester {evt.semester}
                        </span>
                      </div>

                      <div className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-400/30">
                        📅 {evt.tanggalMulai} {evt.tanggalSelesai !== evt.tanggalMulai ? `s.d. ${evt.tanggalSelesai}` : ''}
                      </div>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-white font-serif">
                      {evt.kegiatan}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {evt.deskripsi}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center space-y-3">
              <CalendarDays className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Tidak ada data kalender akademik yang cocok</h4>
              <p className="text-xs text-slate-400">Silakan ubah filter kategori atau semester di atas.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: AGENDA & KEGIATAN SANTRI */}
      {activeView === 'agenda' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Daftar Agenda Kegiatan Terdaftar ({filteredAgendas.length} Item)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Kegiatan santri, rapat guru, & parenting
            </span>
          </div>

          {filteredAgendas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredAgendas.map((item) => (
                <div
                  key={item.id}
                  className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl border border-white/10 shadow-xl hover:border-emerald-400/30 transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    
                    <div className="flex items-start justify-between gap-2">
                      <span className="bg-amber-500/20 text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-400/30">
                        {item.kategori}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                        item.status === 'Akan Datang'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                          : item.status === 'Berlangsung'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-400/30 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-white/10'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold font-serif text-white leading-snug">
                      {item.judul}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.deskripsi}
                    </p>

                    <div className="space-y-2 pt-3 border-t border-white/10 text-xs text-slate-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong className="text-slate-400">Tanggal:</strong> {item.tanggal}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong className="text-slate-400">Waktu:</strong> {item.waktu}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong className="text-slate-400">Lokasi:</strong> {item.lokasi}</span>
                      </div>
                    </div>

                  </div>

                  <div className="bg-slate-950/50 px-5 sm:px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">PJ: <strong className="text-slate-200">{item.penanggungJawab}</strong></span>
                    </span>
                    <span className="text-emerald-400 font-semibold text-[11px] shrink-0">
                      {schoolInfo?.nama || 'SMP Darul Ulum 2'}
                    </span>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-10 border border-white/10 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Tidak ditemukan agenda kegiatan</h4>
              <p className="text-xs text-slate-400">Coba pilih kategori lain atau kata kunci pencarian yang berbeda.</p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: IKHTISAR TERPADU (COMBINED STREAM) */}
      {activeView === 'terpadu' && (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Alur Waktu Terpadu ({unifiedList.length} Kegiatan & Milestone)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Gabungan utuh antara kalender akademik resmi dan agenda santri/sekolah
              </p>
            </div>
          </div>

          {unifiedList.length > 0 ? (
            <div className="space-y-4">
              {unifiedList.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all ${
                    item.type === 'kalender'
                      ? 'bg-slate-950/70 border-emerald-500/25 hover:border-emerald-400/50'
                      : 'bg-slate-950/70 border-amber-500/25 hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded tracking-wide uppercase ${
                        item.type === 'kalender'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}>
                        {item.type === 'kalender' ? 'Kalender Akademik' : 'Agenda Santri'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-900 border border-white/10">
                        {item.category}
                      </span>
                      {item.status && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          item.status === 'Akan Datang'
                            ? 'bg-teal-500/20 text-teal-300'
                            : item.status === 'Berlangsung'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.status}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{item.date}</span>
                      {item.time && <span className="text-slate-400">({item.time})</span>}
                    </div>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white font-serif mb-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {(item.location || item.pj) && (
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-white/5">
                      {item.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.location}</span>
                        </span>
                      )}
                      {item.pj && (
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>PJ: {item.pj}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center space-y-3">
              <Layers className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Tidak ada jadwal yang sesuai pencarian</h4>
              <p className="text-xs text-slate-400">Silakan gunakan kata kunci pencarian yang lain.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
