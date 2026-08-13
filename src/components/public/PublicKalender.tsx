import React, { useState } from 'react';
import { CalendarEvent } from '../../types';
import { CalendarDays, Filter, BookOpen, Clock, Tag, Flag } from 'lucide-react';

interface PublicKalenderProps {
  events: CalendarEvent[];
}

export const PublicKalender: React.FC<PublicKalenderProps> = ({ events }) => {
  const [selectedSemester, setSelectedSemester] = useState<'Semua' | 'Ganjil' | 'Genap'>('Semua');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');

  const categories = [
    'Semua',
    'KBM',
    'Ujian (PTS/PAS)',
    'Hari Besar Islam (PHBI)',
    'Kegiatan Ekstrakurikuler',
    'Pembagian Rapor',
    'Libur Sekolah'
  ];

  const filteredEvents = events.filter((e) => {
    const matchSemester = selectedSemester === 'Semua' || e.semester === selectedSemester;
    const matchKategori = selectedKategori === 'Semua' || e.kategori === selectedKategori;
    return matchSemester && matchKategori;
  });

  const getCategoryColor = (kategori: string) => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kalender Akademik TA 2024/2025</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            Kalender Akademik & Agenda Efektif SMP Islam Al Qomar
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Penetapan hari efektif KBM, pekan ujian, libur nasional, dan pembagian rapor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedSemester('Ganjil')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedSemester === 'Ganjil'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow'
                : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            Semester Ganjil
          </button>
          <button
            onClick={() => setSelectedSemester('Genap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedSemester === 'Genap'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow'
                : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            Semester Genap
          </button>
          <button
            onClick={() => setSelectedSemester('Semua')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedSemester === 'Semua'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-extrabold shadow'
                : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Filter Categories */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
          Filter Berdasarkan Jenis Kegiatan
        </label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedKategori(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedKategori === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold shadow'
                  : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Event List */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
        <h3 className="text-base font-bold font-serif text-white border-b border-white/10 pb-3">
          Timeline Agenda Akademik ({filteredEvents.length} Item)
        </h3>

        <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/20">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="relative pl-10 group">
              
              {/* Timeline Bullet */}
              <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 ring-2 ring-emerald-500/40 group-hover:scale-125 transition-transform" />

              <div className="bg-slate-950/60 rounded-xl p-4 border border-white/10 hover:border-emerald-400/40 transition-colors space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${getCategoryColor(evt.kategori)}`}>
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

                <h4 className="font-bold text-sm text-white font-serif">
                  {evt.kegiatan}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {evt.deskripsi}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
