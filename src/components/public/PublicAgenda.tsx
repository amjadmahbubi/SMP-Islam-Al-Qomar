import React, { useState } from 'react';
import { AgendaItem } from '../../types';
import { Calendar, MapPin, Clock, UserCheck, Tag, Search, CheckCircle2, Sparkles } from 'lucide-react';

interface PublicAgendaProps {
  agendas: AgendaItem[];
}

export const PublicAgenda: React.FC<PublicAgendaProps> = ({ agendas }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = ['Semua', 'Keagamaan', 'Akademik', 'Lomba / Prestasi', 'Parenting / Kemitraan', 'Rapat Guru'];

  const filteredAgendas = agendas.filter((item) => {
    const matchCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    const matchSearch = searchTerm === '' ||
      item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Agenda & Kegiatan SMP Islam Al Qomar</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            Jadwal Agenda Kegiatan Santri & Sekolah
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Kegiatan keagamaan, lomba, parenting wali murid, dan program unggulan kesiswaan
          </p>
        </div>

        <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-400/30 self-start md:self-auto">
          {filteredAgendas.length} Agenda Terdaftar
        </span>
      </div>

      {/* Filter Bar */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold shadow'
                    : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari agenda kegiatan..."
              className="w-full px-3 py-2 pl-9 bg-slate-950/60 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

        </div>
      </div>

      {/* Agenda Grid Cards */}
      {filteredAgendas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAgendas.map((item) => (
            <div
              key={item.id}
              className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl border border-white/10 shadow-xl hover:border-emerald-400/30 transition-all overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                
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

                <h3 className="text-lg font-bold font-serif text-white leading-snug">
                  {item.judul}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.deskripsi}
                </p>

                <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong className="text-slate-300">Tanggal:</strong> {item.tanggal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong className="text-slate-300">Waktu:</strong> {item.waktu}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong className="text-slate-300">Lokasi:</strong> {item.lokasi}</span>
                  </div>
                </div>

              </div>

              <div className="bg-slate-950/40 px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  PJ: <strong className="text-slate-200">{item.penanggungJawab}</strong>
                </span>
                <span className="text-emerald-400 font-semibold">SMP Islam Al Qomar</span>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-10 border border-white/10 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">
            Tidak ditemukan agenda kegiatan
          </h3>
          <p className="text-xs text-slate-300">
            Coba pilih kategori lain atau kata kunci pencarian yang berbeda.
          </p>
        </div>
      )}

    </div>
  );
};
