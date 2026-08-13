import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { StorageService, exportToCSV } from '../../services/storage';
import { ShieldCheck, History, Search, Download, X, Lock, Unlock, Edit3, Filter, Clock, User } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass?: string;
  currentMapel?: string;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  currentMapel
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('ALL');
  const [filterCurrentOnly, setFilterCurrentOnly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLogs(StorageService.getAuditLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.mapel && log.mapel.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.kelas && log.kelas.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAction =
      selectedActionFilter === 'ALL' || log.action === selectedActionFilter;

    const matchesScope = !filterCurrentOnly || (
      (!currentClass || log.kelas === currentClass) &&
      (!currentMapel || log.mapel === currentMapel)
    );

    return matchesSearch && matchesAction && matchesScope;
  });

  const handleExportCSV = () => {
    const exportRows = filteredLogs.map(l => ({
      ID: l.id,
      Waktu: l.timestamp,
      User: l.userName,
      Peran_Jabatan: l.userRole,
      Aksi: l.action,
      Modul: l.module,
      Kelas: l.kelas || '-',
      Mata_Pelajaran: l.mapel || '-',
      Semester: l.semester || '-',
      Rincian_Perubahan: l.details
    }));
    exportToCSV(`Audit_Log_Nilai_${new Date().toISOString().slice(0, 10)}.csv`, exportRows);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOCK_DRAFT_NILAI':
        return (
          <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3 text-red-600" />
            <span>Lock Draft</span>
          </span>
        );
      case 'UNLOCK_DRAFT_NILAI':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Unlock className="w-3 h-3 text-amber-600" />
            <span>Unlock Draft</span>
          </span>
        );
      case 'UPDATE_NILAI':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Edit3 className="w-3 h-3 text-emerald-600" />
            <span>Edit Nilai</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
            <span>{action}</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-base text-white flex items-center gap-2">
                <span>Audit Log &amp; Riwayat Aktivitas Perubahan Data</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  VERIFIED
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Catatan akuntabilitas: Siapa yang mengubah data, kapan dilakukan, serta rincian nilai sebelum/sesudah diubah
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama guru, mapel, atau kata kunci..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <select
              value={selectedActionFilter}
              onChange={(e) => setSelectedActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">Semua Jenis Aksi (All Actions)</option>
              <option value="UPDATE_NILAI">Perubahan Nilai (UPDATE_NILAI)</option>
              <option value="LOCK_DRAFT_NILAI">Penguncian Draft (LOCK_DRAFT)</option>
              <option value="UNLOCK_DRAFT_NILAI">Pembukaan Kunci (UNLOCK_DRAFT)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            {currentClass && currentMapel && (
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={filterCurrentOnly}
                  onChange={(e) => setFilterCurrentOnly(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span>Hanya {currentMapel} ({currentClass})</span>
              </label>
            )}

            <button
              onClick={handleExportCSV}
              className="ml-auto bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {filteredLogs.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                    <th className="p-3 w-36">Waktu &amp; ID</th>
                    <th className="p-3 w-48">Pengubah (User)</th>
                    <th className="p-3 w-28 text-center">Jenis Aksi</th>
                    <th className="p-3 w-32">Kelas &amp; Mapel</th>
                    <th className="p-3">Rincian Perubahan &amp; Akuntabilitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 align-top font-mono text-[11px] text-slate-600">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-700" />
                          <span>{log.timestamp}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.id}</div>
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-bold text-slate-900 font-serif flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{log.userName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-semibold">{log.userRole}</div>
                      </td>

                      <td className="p-3 align-top text-center">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="p-3 align-top">
                        <div className="font-bold text-emerald-950 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] inline-block mb-1">
                          Kelas {log.kelas || '-'}
                        </div>
                        <div className="font-semibold text-slate-800 text-[11px]">{log.mapel || '-'}</div>
                      </td>

                      <td className="p-3 align-top">
                        <p className="text-xs text-slate-800 font-sans leading-relaxed">
                          {log.details}
                        </p>
                        {(log.previousDataSummary || log.newDataSummary) && (
                          <div className="mt-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] grid grid-cols-2 gap-2 font-mono">
                            {log.previousDataSummary && (
                              <div className="text-red-700">
                                <span className="font-bold text-slate-500 block text-[9px] uppercase">Sebelum:</span>
                                {log.previousDataSummary}
                              </div>
                            )}
                            {log.newDataSummary && (
                              <div className="text-emerald-800">
                                <span className="font-bold text-slate-500 block text-[9px] uppercase">Sesudah:</span>
                                {log.newDataSummary}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 italic bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              Belum ada data Audit Log yang sesuai dengan kriteria pencarian.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Sistem Audit Trail Aktif: Setiap perubahan nilai &amp; status penguncian tercatat otomatis secara permanen.</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
