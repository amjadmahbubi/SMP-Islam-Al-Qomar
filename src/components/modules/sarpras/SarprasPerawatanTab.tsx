import React, { useState } from 'react';
import { SarprasItem, SarprasPerawatan, Teacher, UserSession } from '../../../types';
import { formatRupiah, SUMBER_DANA_OPTIONS } from './sarprasUtils';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  X,
  Trash2,
  Edit3,
  Check
} from 'lucide-react';

interface SarprasPerawatanTabProps {
  sarpras: SarprasItem[];
  perawatanList: SarprasPerawatan[];
  onSavePerawatan: (list: SarprasPerawatan[]) => void;
  onUpdateSarprasItem: (updatedItem: SarprasItem) => void;
  teachers?: Teacher[];
  session?: UserSession;
  canEdit: boolean;
  onAddAuditLog: (action: 'PERAWATAN', detail: string) => void;
  preselectedItem?: SarprasItem | null;
  onClearPreselected?: () => void;
}

export const SarprasPerawatanTab: React.FC<SarprasPerawatanTabProps> = ({
  sarpras,
  perawatanList,
  onSavePerawatan,
  onUpdateSarprasItem,
  teachers = [],
  session,
  canEdit,
  onAddAuditLog,
  preselectedItem,
  onClearPreselected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerawatan, setEditingPerawatan] = useState<SarprasPerawatan | null>(null);

  // Form state
  const [selectedSarprasId, setSelectedSarprasId] = useState(preselectedItem?.id || '');
  const [jenisPerawatan, setJenisPerawatan] = useState<SarprasPerawatan['jenisPerawatan']>('Perbaikan Ringan');
  const [deskripsiKerusakan, setDeskripsiKerusakan] = useState('');
  const [tindakan, setTindakan] = useState('');
  const [biaya, setBiaya] = useState(0);
  const [sumberBiaya, setSumberBiaya] = useState('BOS Reguler');
  const [teknisiVendor, setTeknisiVendor] = useState('');
  const [status, setStatus] = useState<SarprasPerawatan['status']>('Sedang Dikerjakan');
  const [tanggalPengajuan, setTanggalPengajuan] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [pelapor, setPelapor] = useState(session?.name || teachers[0]?.nama || '');
  const [catatanPetugas, setCatatanPetugas] = useState('');

  // Handle preselected item
  React.useEffect(() => {
    if (preselectedItem) {
      setSelectedSarprasId(preselectedItem.id);
      setIsModalOpen(true);
    }
  }, [preselectedItem]);

  const selectedItem = sarpras.find(s => s.id === selectedSarprasId);

  // Aggregates
  const totalBiayaPerawatan = perawatanList.reduce((acc, curr) => acc + (Number(curr.biaya) || 0), 0);
  const activeCount = perawatanList.filter(p => p.status === 'Sedang Dikerjakan' || p.status === 'Menunggu Jadwal').length;
  const selesaiCount = perawatanList.filter(p => p.status === 'Selesai').length;

  const handleOpenAdd = () => {
    const defaultItem = sarpras[0];
    setEditingPerawatan(null);
    setSelectedSarprasId(defaultItem ? defaultItem.id : '');
    setJenisPerawatan('Perbaikan Ringan');
    setDeskripsiKerusakan('');
    setTindakan('');
    setBiaya(0);
    setSumberBiaya('BOS Reguler');
    setTeknisiVendor('Teknisi Internal Sekolah');
    setStatus('Sedang Dikerjakan');
    setTanggalPengajuan(new Date().toISOString().split('T')[0]);
    setTanggalSelesai('');
    setPelapor(session?.name || teachers[0]?.nama || '');
    setCatatanPetugas('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('Pilih aset yang perlu dirawat / diservis');
      return;
    }

    if (editingPerawatan) {
      const updated = perawatanList.map(p => {
        if (p.id === editingPerawatan.id) {
          return {
            ...p,
            jenisPerawatan,
            deskripsiKerusakan,
            tindakan,
            biaya: Number(biaya) || 0,
            sumberBiaya,
            teknisiVendor,
            status,
            tanggalPengajuan,
            tanggalSelesai: status === 'Selesai' && !tanggalSelesai ? new Date().toISOString().split('T')[0] : tanggalSelesai,
            pelapor,
            catatanPetugas
          };
        }
        return p;
      });
      onSavePerawatan(updated);
      onAddAuditLog('PERAWATAN', `Update data perawatan ${selectedItem.namaBarangRuang} - Status: ${status}`);
    } else {
      const newEntry: SarprasPerawatan = {
        id: `PRW-${Date.now()}`,
        sarprasId: selectedItem.id,
        kodeBarang: selectedItem.nomorInventarisResmi || selectedItem.kode,
        namaBarang: selectedItem.namaBarangRuang,
        tanggalPengajuan,
        tanggalSelesai: status === 'Selesai' ? (tanggalSelesai || new Date().toISOString().split('T')[0]) : undefined,
        jenisPerawatan,
        deskripsiKerusakan,
        tindakan,
        biaya: Number(biaya) || 0,
        sumberBiaya,
        teknisiVendor,
        status,
        pelapor,
        catatanPetugas
      };

      // Set asset status to 'Dalam Perawatan' if active
      if (status === 'Sedang Dikerjakan' || status === 'Menunggu Jadwal') {
        onUpdateSarprasItem({
          ...selectedItem,
          statusAset: 'Dalam Perawatan'
        });
      }

      onSavePerawatan([newEntry, ...perawatanList]);
      onAddAuditLog(
        'PERAWATAN',
        `Pencatatan perawatan ${selectedItem.namaBarangRuang} (${jenisPerawatan}) biaya ${formatRupiah(biaya)}`
      );
    }

    setIsModalOpen(false);
    if (onClearPreselected) onClearPreselected();
  };

  // Quick action to mark as Completed
  const handleCompletePerawatan = (prw: SarprasPerawatan) => {
    const asset = sarpras.find(s => s.id === prw.sarprasId);
    if (confirm(`Tandai perawatan "${prw.namaBarang}" telah SELESAI dan kembalikan kondisi aset menjadi Baik?`)) {
      const updatedList = perawatanList.map(p => {
        if (p.id === prw.id) {
          return {
            ...p,
            status: 'Selesai' as const,
            tanggalSelesai: new Date().toISOString().split('T')[0]
          };
        }
        return p;
      });
      onSavePerawatan(updatedList);

      // Restore asset condition to good
      if (asset) {
        onUpdateSarprasItem({
          ...asset,
          kondisiBaik: Number(asset.jumlah) || 1,
          kondisiRusakRingan: 0,
          kondisiRusakBerat: 0,
          statusAset: 'Aktif Digunakan'
        });
      }

      onAddAuditLog('PERAWATAN', `Perawatan selesai: ${prw.namaBarang} - Kondisi aset dipulihkan ke BAIK`);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus riwayat perawatan ini?')) {
      onSavePerawatan(perawatanList.filter(p => p.id !== id));
    }
  };

  const filtered = perawatanList.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.namaBarang.toLowerCase().includes(q) ||
      p.kodeBarang.toLowerCase().includes(q) ||
      p.deskripsiKerusakan.toLowerCase().includes(q) ||
      p.teknisiVendor.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'Semua' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Dalam Pengerjaan</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 font-mono">
            {activeCount} <span className="text-xs text-slate-400 font-normal">unit aktif servis</span>
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">
            Menunggu selesai uji operasional
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Servis Selesai</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {selesaiCount} <span className="text-xs text-slate-400 font-normal">telah diperbaiki</span>
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">
            Kembali berfungsi optimal
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Biaya Pemeliharaan</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-white font-mono truncate" title={formatRupiah(totalBiayaPerawatan)}>
            {formatRupiah(totalBiayaPerawatan)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            BOS & Dana Sarpras Sekolah
          </p>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari perawatan (nama aset, kode, keluhan, teknisi)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Jadwal">Menunggu Jadwal</option>
            <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
            <option value="Selesai">Selesai</option>
          </select>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Servis Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* List Perawatan */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-white/10 text-center text-slate-400">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm">Tidak ada riwayat perawatan atau servis yang cocok.</p>
          </div>
        ) : (
          filtered.map(prw => (
            <div
              key={prw.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-md hover:border-emerald-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    prw.status === 'Selesai'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : prw.status === 'Sedang Dikerjakan'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/30 animate-pulse'
                      : 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                  }`}>
                    {prw.status}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                    {prw.jenisPerawatan}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Diajukan: {prw.tanggalPengajuan}
                    {prw.tanggalSelesai && ` | Selesai: ${prw.tanggalSelesai}`}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm sm:text-base">
                  {prw.namaBarang}
                  <span className="text-xs font-normal text-slate-400 font-mono ml-2">
                    ({prw.kodeBarang})
                  </span>
                </h4>

                <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <strong className="text-slate-400">Kerusakan:</strong> {prw.deskripsiKerusakan}
                  {prw.tindakan && (
                    <span className="block mt-1">
                      <strong className="text-emerald-400">Tindakan:</strong> {prw.tindakan}
                    </span>
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>Teknisi / Vendor: <strong className="text-slate-200">{prw.teknisiVendor}</strong></span>
                  <span>Biaya: <strong className="text-emerald-400 font-mono font-bold">{formatRupiah(prw.biaya)}</strong> ({prw.sumberBiaya})</span>
                  <span>Pelapor: <strong className="text-slate-200">{prw.pelapor}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {canEdit && prw.status !== 'Selesai' && (
                  <button
                    onClick={() => handleCompletePerawatan(prw)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow transition-all cursor-pointer"
                    title="Tandai perbaikan selesai dan kembalikan kondisi aset ke Baik"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Selesai Servis</span>
                  </button>
                )}

                {canEdit && (
                  <button
                    onClick={() => handleDelete(prw.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Hapus riwayat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL CATAT PERAWATAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Pencatatan Servis & Pemeliharaan</h3>
                  <p className="text-xs text-slate-400">Pencatatan kerusakan, pengerjaan teknisi, dan realisasi biaya</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onClearPreselected) onClearPreselected();
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Pilih Aset yang Dirawat / Rusak *</label>
                <select
                  required
                  value={selectedSarprasId}
                  onChange={e => setSelectedSarprasId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {sarpras.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nomorInventarisResmi || s.kode} - {s.namaBarangRuang} ({s.lokasi})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jenis Perawatan</label>
                  <select
                    value={jenisPerawatan}
                    onChange={e => setJenisPerawatan(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Pemeliharaan Rutin">Pemeliharaan Rutin</option>
                    <option value="Perbaikan Ringan">Perbaikan Ringan</option>
                    <option value="Perbaikan Sedang">Perbaikan Sedang</option>
                    <option value="Perbaikan Berat">Perbaikan Berat</option>
                    <option value="Penggantian Komponen">Penggantian Komponen / Sparepart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Pengerjaan</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Menunggu Jadwal">Menunggu Jadwal</option>
                    <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Keluhan / Deskripsi Kerusakan *</label>
                <textarea
                  rows={2}
                  required
                  value={deskripsiKerusakan}
                  onChange={e => setDeskripsiKerusakan(e.target.value)}
                  placeholder="Contoh: Kipas pendingin bising dan proyektor sering mati mendadak..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tindakan / Solusi Teknisi</label>
                <textarea
                  rows={2}
                  value={tindakan}
                  onChange={e => setTindakan(e.target.value)}
                  placeholder="Contoh: Pembersihan debu filter dan penggantian thermal pasta..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Biaya Servis (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={biaya}
                    onChange={e => setBiaya(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sumber Biaya</label>
                  <select
                    value={sumberBiaya}
                    onChange={e => setSumberBiaya(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SUMBER_DANA_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Teknisi / Vendor</label>
                  <input
                    type="text"
                    value={teknisiVendor}
                    onChange={e => setTeknisiVendor(e.target.value)}
                    placeholder="Contoh: CV Banyuwangi IT"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Diajukan</label>
                  <input
                    type="date"
                    value={tanggalPengajuan}
                    onChange={e => setTanggalPengajuan(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pelapor / Penanggung Jawab</label>
                  <input
                    type="text"
                    value={pelapor}
                    onChange={e => setPelapor(e.target.value)}
                    placeholder="Nama guru / petugas pelapor"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onClearPreselected) onClearPreselected();
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all"
                >
                  Simpan Riwayat Perawatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
