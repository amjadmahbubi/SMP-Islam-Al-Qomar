import React, { useState } from 'react';
import { SarprasItem, SarprasPerencanaan, Teacher, UserSession } from '../../../types';
import { formatRupiah, KATEGORI_OPTIONS, SATUAN_OPTIONS, SUMBER_DANA_OPTIONS, generateNomorInventaris, LOKASI_PRESETS } from './sarprasUtils';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  DollarSign,
  AlertCircle,
  Check,
  X,
  Trash2,
  Edit3,
  Calendar,
  Layers
} from 'lucide-react';

interface SarprasPerencanaanTabProps {
  perencanaanList: SarprasPerencanaan[];
  onSavePerencanaan: (list: SarprasPerencanaan[]) => void;
  onAddSarprasItem: (item: SarprasItem) => void;
  sarpras: SarprasItem[];
  teachers?: Teacher[];
  session?: UserSession;
  canEdit: boolean;
  onAddAuditLog: (action: 'PERENCANAAN', detail: string) => void;
}

export const SarprasPerencanaanTab: React.FC<SarprasPerencanaanTabProps> = ({
  perencanaanList,
  onSavePerencanaan,
  onAddSarprasItem,
  sarpras,
  teachers = [],
  session,
  canEdit,
  onAddAuditLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [prioritasFilter, setPrioritasFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SarprasPerencanaan | null>(null);

  // Form State
  const [tahunAnggaran, setTahunAnggaran] = useState('2026/2027');
  const [namaBarang, setNamaBarang] = useState('');
  const [kategori, setKategori] = useState('Elektronik');
  const [spesifikasi, setSpesifikasi] = useState('');
  const [jumlah, setJumlah] = useState(1);
  const [satuan, setSatuan] = useState('Unit');
  const [estimasiHargaSatuan, setEstimasiHargaSatuan] = useState(0);
  const [sumberDanaUsulan, setSumberDanaUsulan] = useState('BOS Kinerja');
  const [alasanKebutuhan, setAlasanKebutuhan] = useState('');
  const [prioritas, setPrioritas] = useState<SarprasPerencanaan['prioritas']>('Tinggi (Mendesak)');
  const [targetBulan, setTargetBulan] = useState('Juli 2026');
  const [status, setStatus] = useState<SarprasPerencanaan['status']>('Diajukan');
  const [pengusul, setPengusul] = useState(session?.name || teachers[0]?.nama || '');
  const [catatanPersetujuan, setCatatanPersetujuan] = useState('');

  // Aggregates
  const totalUsulan = perencanaanList.length;
  const totalAnggaran = perencanaanList.reduce((acc, curr) => acc + (Number(curr.estimasiTotal) || 0), 0);
  const disetujuiCount = perencanaanList.filter(p => p.status === 'Disetujui' || p.status === 'Terealisasi').length;

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTahunAnggaran('2026/2027');
    setNamaBarang('');
    setKategori('Elektronik');
    setSpesifikasi('');
    setJumlah(1);
    setSatuan('Unit');
    setEstimasiHargaSatuan(0);
    setSumberDanaUsulan('BOS Kinerja');
    setAlasanKebutuhan('');
    setPrioritas('Tinggi (Mendesak)');
    setTargetBulan('Juli 2026');
    setStatus('Diajukan');
    setPengusul(session?.name || teachers[0]?.nama || '');
    setCatatanPersetujuan('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: SarprasPerencanaan) => {
    setEditingItem(p);
    setTahunAnggaran(p.tahunAnggaran);
    setNamaBarang(p.namaBarang);
    setKategori(p.kategori);
    setSpesifikasi(p.spesifikasi || '');
    setJumlah(p.jumlah);
    setSatuan(p.satuan);
    setEstimasiHargaSatuan(p.estimasiHargaSatuan);
    setSumberDanaUsulan(p.sumberDanaUsulan);
    setAlasanKebutuhan(p.alasanKebutuhan);
    setPrioritas(p.prioritas);
    setTargetBulan(p.targetBulan);
    setStatus(p.status);
    setPengusul(p.pengusul);
    setCatatanPersetujuan(p.catatanPersetujuan || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) {
      alert('Nama barang / aset wajib diisi');
      return;
    }

    const totalEst = (Number(jumlah) || 1) * (Number(estimasiHargaSatuan) || 0);

    if (editingItem) {
      const updated = perencanaanList.map(p => {
        if (p.id === editingItem.id) {
          return {
            ...p,
            tahunAnggaran,
            namaBarang,
            kategori,
            spesifikasi,
            jumlah: Number(jumlah) || 1,
            satuan,
            estimasiHargaSatuan: Number(estimasiHargaSatuan) || 0,
            estimasiTotal: totalEst,
            sumberDanaUsulan,
            alasanKebutuhan,
            prioritas,
            targetBulan,
            status,
            pengusul,
            catatanPersetujuan
          };
        }
        return p;
      });
      onSavePerencanaan(updated);
      onAddAuditLog('PERENCANAAN', `Update usulan rencana kebutuhan: ${namaBarang} (${status})`);
    } else {
      const newPlan: SarprasPerencanaan = {
        id: `RCN-${Date.now()}`,
        tahunAnggaran,
        namaBarang,
        kategori,
        spesifikasi,
        jumlah: Number(jumlah) || 1,
        satuan,
        estimasiHargaSatuan: Number(estimasiHargaSatuan) || 0,
        estimasiTotal: totalEst,
        sumberDanaUsulan,
        alasanKebutuhan,
        prioritas,
        targetBulan,
        status,
        pengusul,
        tanggalUsul: new Date().toISOString().split('T')[0],
        catatanPersetujuan
      };
      onSavePerencanaan([newPlan, ...perencanaanList]);
      onAddAuditLog('PERENCANAAN', `Pengajuan rencana sarpras baru: ${namaBarang} - Estimasi ${formatRupiah(totalEst)}`);
    }

    setIsModalOpen(false);
  };

  // Convert approved plan directly into registered active asset!
  const handleRealisasiToAsset = (p: SarprasPerencanaan) => {
    if (confirm(`Konversi usulan "${p.namaBarang}" langsung menjadi ASET TERDAFTAR di SIM Sarpras?`)) {
      const autoNomor = generateNomorInventaris(p.kategori, new Date().getFullYear(), sarpras);
      const autoKode = autoNomor.split('/').pop() ? `AST-${autoNomor.split('/').pop()}` : 'AST-001';

      const newAsset: SarprasItem = {
        id: `SRP_REALISASI_${Date.now()}`,
        kode: autoKode,
        nomorInventarisResmi: autoNomor,
        namaBarangRuang: p.namaBarang,
        kategori: p.kategori,
        merkModel: p.spesifikasi || '',
        sumberDana: p.sumberDanaUsulan,
        tanggalPengadaan: new Date().toISOString().split('T')[0],
        hargaPerolehan: p.estimasiHargaSatuan,
        masaManfaatTahun: p.kategori === 'Ruang / Gedung' ? 20 : 5,
        nilaiResidu: Math.round(p.estimasiHargaSatuan * 0.1),
        penanggungJawab: p.pengusul,
        statusAset: 'Aktif Digunakan',
        jumlah: p.jumlah,
        satuan: p.satuan,
        kondisiBaik: p.jumlah,
        kondisiRusakRingan: 0,
        kondisiRusakBerat: 0,
        lokasi: LOKASI_PRESETS[0],
        keterangan: `Realisasi dari usulan RKSP No. ${p.id} (${p.tahunAnggaran})`
      };

      onAddSarprasItem(newAsset);

      // Update plan status to 'Terealisasi'
      const updatedList = perencanaanList.map(item => {
        if (item.id === p.id) {
          return {
            ...item,
            status: 'Terealisasi' as const,
            catatanPersetujuan: `Telah direalisasikan ke aset resmi ${autoNomor} pada ${new Date().toISOString().split('T')[0]}`
          };
        }
        return item;
      });
      onSavePerencanaan(updatedList);

      onAddAuditLog(
        'PERENCANAAN',
        `Realisasi usulan ${p.namaBarang} menjadi Aset Terdaftar Resmi: ${autoNomor}`
      );
      alert(`Berhasil! Aset "${p.namaBarang}" telah otomatis terdaftar dengan Nomor Inventaris: ${autoNomor}`);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus usulan perencanaan ini?')) {
      onSavePerencanaan(perencanaanList.filter(p => p.id !== id));
    }
  };

  const filtered = perencanaanList.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.namaBarang.toLowerCase().includes(q) ||
      p.pengusul.toLowerCase().includes(q) ||
      (p.spesifikasi && p.spesifikasi.toLowerCase().includes(q)) ||
      p.alasanKebutuhan.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'Semua' || p.status === statusFilter;
    const matchPrioritas = prioritasFilter === 'Semua' || p.prioritas === prioritasFilter;
    return matchSearch && matchStatus && matchPrioritas;
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Usulan Pengadaan</span>
            <ClipboardList className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {totalUsulan} <span className="text-xs text-slate-400 font-normal">item usulan</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Rencana Kebutuhan Sarpras (RKSP)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Estimasi Kebutuhan Dana</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-white font-mono truncate" title={formatRupiah(totalAnggaran)}>
            {formatRupiah(totalAnggaran)}
          </p>
          <p className="text-[11px] text-sky-400/80 mt-1">
            Dari usulan BOS & Yayasan
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Usulan Disetujui / Terealisasi</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {disetujuiCount} <span className="text-xs text-slate-400 font-normal">usulan</span>
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">
            Siap pengadaan / realisasi
          </p>
        </div>
      </div>

      {/* Filter & Add Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari usulan (nama barang, pengusul, spesifikasi, alasan)..."
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
            <option value="Diajukan">Diajukan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Terealisasi">Terealisasi</option>
            <option value="Ditolak">Ditolak</option>
          </select>

          <select
            value={prioritasFilter}
            onChange={e => setPrioritasFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="Semua">Semua Prioritas</option>
            <option value="Tinggi (Mendesak)">Tinggi (Mendesak)</option>
            <option value="Sedang (Prioritas)">Sedang (Prioritas)</option>
            <option value="Rendah">Rendah</option>
          </select>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Usulkan Sarpras Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* List Perencanaan */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-white/10 text-center text-slate-400">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm">Belum ada usulan perencanaan sarpras yang sesuai.</p>
          </div>
        ) : (
          filtered.map(plan => (
            <div
              key={plan.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-md hover:border-emerald-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    plan.status === 'Terealisasi'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : plan.status === 'Disetujui'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                      : plan.status === 'Ditolak'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                  }`}>
                    {plan.status}
                  </span>

                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                    plan.prioritas.includes('Tinggi')
                      ? 'bg-rose-500/10 text-rose-300 border border-rose-400/20'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {plan.prioritas}
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    TA {plan.tahunAnggaran} &bull; Target: {plan.targetBulan}
                  </span>
                </div>

                <h4 className="font-bold text-white text-base">
                  {plan.namaBarang}
                  <span className="text-xs text-slate-400 font-mono ml-2">
                    ({plan.jumlah} {plan.satuan})
                  </span>
                </h4>

                {plan.spesifikasi && (
                  <p className="text-xs text-slate-400">
                    <strong>Spesifikasi:</strong> {plan.spesifikasi}
                  </p>
                )}

                <p className="text-xs text-slate-300 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                  <strong className="text-slate-400">Alasan Kebutuhan:</strong> "{plan.alasanKebutuhan}"
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>Estimasi Satuan: <strong className="text-slate-200 font-mono">{formatRupiah(plan.estimasiHargaSatuan)}</strong></span>
                  <span>Total Anggaran: <strong className="text-emerald-400 font-mono font-bold">{formatRupiah(plan.estimasiTotal)}</strong> ({plan.sumberDanaUsulan})</span>
                  <span>Pengusul: <strong className="text-slate-200">{plan.pengusul}</strong></span>
                </div>

                {plan.catatanPersetujuan && (
                  <p className="text-xs text-sky-400/90 italic pt-1">
                    Catatan: {plan.catatanPersetujuan}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {canEdit && plan.status !== 'Terealisasi' && plan.status !== 'Ditolak' && (
                  <button
                    onClick={() => handleRealisasiToAsset(plan)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow transition-all cursor-pointer"
                    title="Konversi langsung usulan ini menjadi aset terdaftar resmi"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Realisasikan ke Aset</span>
                  </button>
                )}

                {canEdit && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="Edit Usulan"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Hapus Usulan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM USULAN PERENCANAAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingItem ? 'Edit Usulan Rencana Kebutuhan' : 'Pengajuan Kebutuhan Sarpras Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">Rencana Kebutuhan Sarana & Prasarana Sekolah (RKSP)</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tahun Anggaran</label>
                  <input
                    type="text"
                    required
                    value={tahunAnggaran}
                    onChange={e => setTahunAnggaran(e.target.value)}
                    placeholder="Contoh: 2026/2027"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Pengadaan (Bulan)</label>
                  <input
                    type="text"
                    value={targetBulan}
                    onChange={e => setTargetBulan(e.target.value)}
                    placeholder="Contoh: Juli 2026"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Nama Barang / Fasilitas yang Diusulkan *</label>
                  <input
                    type="text"
                    required
                    value={namaBarang}
                    onChange={e => setNamaBarang(e.target.value)}
                    placeholder="Contoh: Smart TV Interaktif 75 Inch"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori</label>
                  <select
                    value={kategori}
                    onChange={e => setKategori(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    {KATEGORI_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Spesifikasi Detail</label>
                <textarea
                  rows={2}
                  value={spesifikasi}
                  onChange={e => setSpesifikasi(e.target.value)}
                  placeholder="Merk, resolusi, RAM, kelengkapan aksesoris, dll..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/50 border border-white/5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jumlah</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={jumlah}
                    onChange={e => setJumlah(Number(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Satuan</label>
                  <select
                    value={satuan}
                    onChange={e => setSatuan(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white"
                  >
                    {SATUAN_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Estimasi Harga Satuan (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    value={estimasiHargaSatuan}
                    onChange={e => setEstimasiHargaSatuan(Number(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sumber Dana Usulan</label>
                  <select
                    value={sumberDanaUsulan}
                    onChange={e => setSumberDanaUsulan(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    {SUMBER_DANA_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tingkat Prioritas</label>
                  <select
                    value={prioritas}
                    onChange={e => setPrioritas(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Tinggi (Mendesak)">Tinggi (Mendesak)</option>
                    <option value="Sedang (Prioritas)">Sedang (Prioritas)</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Usulan</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Diajukan">Diajukan</option>
                    <option value="Disetujui">Disetujui</option>
                    <option value="Terealisasi">Terealisasi</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alasan Kebutuhan & Manfaat *</label>
                <textarea
                  rows={2}
                  required
                  value={alasanKebutuhan}
                  onChange={e => setAlasanKebutuhan(e.target.value)}
                  placeholder="Mengapa sarana ini penting dan bagaimana dampaknya terhadap santri / guru..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nama Pengusul</label>
                  <input
                    type="text"
                    value={pengusul}
                    onChange={e => setPengusul(e.target.value)}
                    placeholder="Nama guru / kepala lab / panitia"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Catatan Persetujuan</label>
                  <input
                    type="text"
                    value={catatanPersetujuan}
                    onChange={e => setCatatanPersetujuan(e.target.value)}
                    placeholder="Catatan dari Kepala Sekolah / Yayasan..."
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all"
                >
                  Simpan Usulan Sarpras
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
