import React, { useState } from 'react';
import { SarprasAuditLog } from '../../../types';
import {
  ShieldAlert,
  Search,
  Download,
  Calendar,
  User,
  Tag,
  Clock,
  Trash2,
  Filter
} from 'lucide-react';

interface SarprasAuditTabProps {
  logs: SarprasAuditLog[];
  onClearLogs?: () => void;
  canEdit: boolean;
}

export const SarprasAuditTab: React.FC<SarprasAuditTabProps> = ({
  logs,
  onClearLogs,
  canEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('Semua');

  const filteredLogs = logs.filter(log => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      log.rincian.toLowerCase().includes(q) ||
      log.pelaku.toLowerCase().includes(q) ||
      (log.kodeBarang && log.kodeBarang.toLowerCase().includes(q)) ||
      (log.namaBarang && log.namaBarang.toLowerCase().includes(q));
    const matchAction = actionFilter === 'Semua' || log.aksi === actionFilter;
    return matchSearch && matchAction;
  });

  const getActionBadge = (aksi: SarprasAuditLog['aksi']) => {
    switch (aksi) {
      case 'TAMBAH_ASET':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
      case 'UBAH_ASET':
        return 'bg-sky-500/20 text-sky-300 border-sky-400/30';
      case 'HAPUS_ASET':
        return 'bg-rose-500/20 text-rose-300 border-rose-400/30';
      case 'MUTASI':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'PERAWATAN':
        return 'bg-amber-500/20 text-amber-300 border-amber-400/30';
      case 'PERENCANAAN':
        return 'bg-teal-500/20 text-teal-300 border-teal-400/30';
      default:
        return 'bg-slate-800 text-slate-300 border-white/10';
    }
  };

  const handleExportCSV = () => {
    const headers = ['Waktu', 'Aksi', 'Kode Aset', 'Nama Aset', 'Rincian Perubahan', 'Pelaku', 'Role'];
    const rows = filteredLogs.map(l => [
      `"${new Date(l.timestamp).toLocaleString('id-ID')}"`,
      `"${l.aksi}"`,
      `"${l.kodeBarang || ''}"`,
      `"${l.namaBarang || ''}"`,
      `"${l.rincian.replace(/"/g, '""')}"`,
      `"${l.pelaku}"`,
      `"${l.role || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_Sarpras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari log audit (pelaku, aktivitas, nomor inventaris)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="Semua">Semua Jenis Aksi</option>
            <option value="TAMBAH_ASET">Tambah Aset</option>
            <option value="UBAH_ASET">Ubah Aset</option>
            <option value="HAPUS_ASET">Hapus Aset</option>
            <option value="MUTASI">Mutasi Aset</option>
            <option value="PERAWATAN">Perawatan / Servis</option>
            <option value="PERENCANAAN">Perencanaan</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 cursor-pointer shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ekspor Log</span>
          </button>

          {canEdit && onClearLogs && (
            <button
              onClick={() => {
                if (confirm('Bersihkan seluruh log audit trail sarpras?')) {
                  onClearLogs();
                }
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-white/10 cursor-pointer"
              title="Bersihkan log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Log List */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-white/10 text-center text-slate-400">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm">Belum ada riwayat audit trail yang tercatat.</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-sm hover:border-emerald-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getActionBadge(log.aksi)}`}>
                    {log.aksi}
                  </span>
                  {log.kodeBarang && (
                    <span className="font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-400/20">
                      {log.kodeBarang}
                    </span>
                  )}
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.timestamp).toLocaleString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <p className="text-slate-200 text-xs sm:text-sm font-medium">
                  {log.rincian}
                </p>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5 shrink-0 self-start sm:self-center">
                <User className="w-3 h-3 text-emerald-400" />
                <span className="font-semibold text-slate-200">{log.pelaku}</span>
                {log.role && <span className="text-slate-500">({log.role})</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
