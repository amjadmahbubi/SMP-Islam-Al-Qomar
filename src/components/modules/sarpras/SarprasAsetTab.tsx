import React, { useState } from 'react';
import { SarprasItem, SarprasGedung, SarprasRuang, Teacher, UserSession } from '../../../types';
import {
  KATEGORI_OPTIONS,
  SUMBER_DANA_OPTIONS,
  SATUAN_OPTIONS,
  LOKASI_PRESETS,
  formatRupiah,
  generateNomorInventaris,
  calculateDepresiasi
} from './sarprasUtils';
import {
  Package,
  Plus,
  Search,
  Download,
  Edit3,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  Building2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Barcode,
  ArrowRightLeft,
  Wrench,
  Layers,
  MapPin,
  Calendar,
  UserCheck,
  DollarSign,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { compressImageFile } from './sarprasImageUtils';
import { SarprasFotoUploadModal } from './SarprasFotoUploadModal';

interface SarprasAsetTabProps {
  sarpras: SarprasItem[];
  onSaveSarpras: (sarpras: SarprasItem[]) => void;
  ruangList?: SarprasRuang[];
  gedungList?: SarprasGedung[];
  teachers?: Teacher[];
  session?: UserSession;
  canEdit: boolean;
  onOpenMutasiWithItem?: (item: SarprasItem) => void;
  onOpenPerawatanWithItem?: (item: SarprasItem) => void;
  onAddAuditLog: (action: 'TAMBAH_ASET' | 'UBAH_ASET' | 'HAPUS_ASET', detail: string, item?: SarprasItem) => void;
}

export const SarprasAsetTab: React.FC<SarprasAsetTabProps> = ({
  sarpras,
  onSaveSarpras,
  ruangList = [],
  gedungList = [],
  teachers = [],
  session,
  canEdit,
  onOpenMutasiWithItem,
  onOpenPerawatanWithItem,
  onAddAuditLog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [kondisiFilter, setKondisiFilter] = useState('Semua');
  const [lokasiFilter, setLokasiFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFotoModalOpen, setIsFotoModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SarprasItem | null>(null);
  const [detailItem, setDetailItem] = useState<SarprasItem | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<SarprasItem>>({
    kode: '',
    nomorInventarisResmi: '',
    namaBarangRuang: '',
    kategori: 'Ruang / Gedung',
    merkModel: '',
    sumberDana: 'BOS Reguler',
    tanggalPengadaan: new Date().toISOString().split('T')[0],
    hargaPerolehan: 0,
    masaManfaatTahun: 5,
    nilaiResidu: 0,
    penanggungJawab: '',
    statusAset: 'Aktif Digunakan',
    jumlah: 1,
    satuan: 'Unit',
    kondisiBaik: 1,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    lokasi: LOKASI_PRESETS[0],
    keterangan: ''
  });

  // Calculate unique locations for filter
  const allLocations = Array.from(new Set(sarpras.map(s => s.lokasi).filter(Boolean)));

  // Filtered Sarpras
  const filteredSarpras = sarpras.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      s.namaBarangRuang.toLowerCase().includes(q) ||
      (s.kode && s.kode.toLowerCase().includes(q)) ||
      (s.nomorInventarisResmi && s.nomorInventarisResmi.toLowerCase().includes(q)) ||
      (s.merkModel && s.merkModel.toLowerCase().includes(q)) ||
      (s.lokasi && s.lokasi.toLowerCase().includes(q)) ||
      (s.penanggungJawab && s.penanggungJawab.toLowerCase().includes(q));

    const matchCat = kategoriFilter === 'Semua' || s.kategori === kategoriFilter;
    const matchLokasi = lokasiFilter === 'Semua' || s.lokasi === lokasiFilter;
    const matchStatus = statusFilter === 'Semua' || (s.statusAset || 'Aktif Digunakan') === statusFilter;

    let matchKondisi = true;
    if (kondisiFilter === 'Baik') {
      matchKondisi = s.kondisiBaik > 0 && s.kondisiRusakRingan === 0 && s.kondisiRusakBerat === 0;
    } else if (kondisiFilter === 'Rusak Ringan') {
      matchKondisi = s.kondisiRusakRingan > 0;
    } else if (kondisiFilter === 'Rusak Berat') {
      matchKondisi = s.kondisiRusakBerat > 0;
    }

    return matchSearch && matchCat && matchLokasi && matchStatus && matchKondisi;
  });

  // Quick Stats
  const totalItemCount = sarpras.reduce((acc, curr) => acc + (Number(curr.jumlah) || 1), 0);
  const totalBaik = sarpras.reduce((acc, curr) => acc + (Number(curr.kondisiBaik) || 0), 0);
  const totalRusak = sarpras.reduce((acc, curr) => acc + (Number(curr.kondisiRusakRingan) || 0) + (Number(curr.kondisiRusakBerat) || 0), 0);
  const totalNilaiPerolehan = sarpras.reduce((acc, curr) => {
    const unitPrice = Number(curr.hargaPerolehan) || 0;
    const qty = Number(curr.jumlah) || 1;
    return acc + (unitPrice * qty);
  }, 0);

  // Open Form for Adding
  const handleOpenAdd = () => {
    const defaultKategori = 'Elektronik';
    const autoNomor = generateNomorInventaris(defaultKategori, new Date().getFullYear(), sarpras);
    const autoKode = autoNomor.split('/').pop() ? `EL-${autoNomor.split('/').pop()}` : 'EL-001';
    const firstRuang = ruangList[0];

    setEditingItem(null);
    setForm({
      kode: autoKode,
      nomorInventarisResmi: autoNomor,
      namaBarangRuang: '',
      kategori: defaultKategori,
      merkModel: '',
      sumberDana: 'BOS Reguler',
      tanggalPengadaan: new Date().toISOString().split('T')[0],
      hargaPerolehan: 0,
      masaManfaatTahun: 5,
      nilaiResidu: 0,
      penanggungJawab: firstRuang?.penanggungJawabRuang || teachers[0]?.nama || '',
      statusAset: 'Aktif Digunakan',
      jumlah: 1,
      satuan: 'Unit',
      kondisiBaik: 1,
      kondisiRusakRingan: 0,
      kondisiRusakBerat: 0,
      ruangId: firstRuang?.id,
      gedungId: firstRuang?.gedungId,
      lokasi: firstRuang ? firstRuang.namaRuang : LOKASI_PRESETS[0],
      keterangan: '',
      fotoBarang: undefined
    });
    setIsModalOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (item: SarprasItem) => {
    setEditingItem(item);
    setForm({
      ...item,
      nomorInventarisResmi: item.nomorInventarisResmi || generateNomorInventaris(item.kategori, item.tanggalPengadaan || new Date().getFullYear(), sarpras),
      hargaPerolehan: item.hargaPerolehan || 0,
      masaManfaatTahun: item.masaManfaatTahun || (item.kategori === 'Ruang / Gedung' ? 20 : 5),
      nilaiResidu: item.nilaiResidu || 0,
      tanggalPengadaan: item.tanggalPengadaan || new Date().toISOString().split('T')[0],
      statusAset: item.statusAset || 'Aktif Digunakan',
      penanggungJawab: item.penanggungJawab || '',
      fotoBarang: item.fotoBarang,
      ruangId: item.ruangId,
      gedungId: item.gedungId
    });
    setIsModalOpen(true);
  };

  // Auto Generate Button Trigger
  const handleRegenerateCode = () => {
    const currentCat = form.kategori || 'Elektronik';
    const currentYear = form.tanggalPengadaan ? new Date(form.tanggalPengadaan).getFullYear() : new Date().getFullYear();
    const newNomor = generateNomorInventaris(currentCat, currentYear, sarpras);
    const catCode = newNomor.split('/')[2] || 'SRP';
    const seq = newNomor.split('/').pop() || '001';
    setForm(prev => ({
      ...prev,
      nomorInventarisResmi: newNomor,
      kode: `${catCode}-${seq}`
    }));
  };

  // Save asset from Photo Upload Modal
  const handleSaveAssetFromPhoto = (newAsset: SarprasItem) => {
    const updated = [newAsset, ...sarpras];
    onSaveSarpras(updated);
    onAddAuditLog('TAMBAH_ASET', `Menambahkan aset via foto barang: ${newAsset.namaBarangRuang} (${newAsset.nomorInventarisResmi})`, newAsset);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaBarangRuang?.trim()) {
      alert('Nama barang / ruang wajib diisi');
      return;
    }

    const jumlahTotal = Number(form.jumlah) || 1;
    const kondisiBaik = Number(form.kondisiBaik) || 0;
    const kondisiRusakRingan = Number(form.kondisiRusakRingan) || 0;
    const kondisiRusakBerat = Number(form.kondisiRusakBerat) || 0;

    if (kondisiBaik + kondisiRusakRingan + kondisiRusakBerat !== jumlahTotal) {
      alert(`Jumlah kondisi (${kondisiBaik} baik + ${kondisiRusakRingan} rusak ringan + ${kondisiRusakBerat} rusak berat) harus sama dengan total jumlah unit (${jumlahTotal})!`);
      return;
    }

    const nomorInventaris = form.nomorInventarisResmi || generateNomorInventaris(form.kategori || 'Elektronik', form.tanggalPengadaan || new Date().getFullYear(), sarpras);

    if (editingItem) {
      const updatedList = sarpras.map(s => {
        if (s.id === editingItem.id) {
          return {
            ...s,
            ...form,
            jumlah: jumlahTotal,
            kondisiBaik,
            kondisiRusakRingan,
            kondisiRusakBerat,
            nomorInventarisResmi: nomorInventaris,
            fotoBarang: form.fotoBarang !== undefined ? form.fotoBarang : s.fotoBarang,
            ruangId: form.ruangId !== undefined ? form.ruangId : s.ruangId,
            gedungId: form.gedungId !== undefined ? form.gedungId : s.gedungId
          } as SarprasItem;
        }
        return s;
      });
      onSaveSarpras(updatedList);
      onAddAuditLog('UBAH_ASET', `Memperbarui data aset ${form.namaBarangRuang} (${nomorInventaris})`, editingItem);
    } else {
      const newItem: SarprasItem = {
        id: 'SRP_' + Date.now(),
        kode: form.kode || 'SRP-' + Date.now().toString().slice(-4),
        nomorInventarisResmi: nomorInventaris,
        namaBarangRuang: form.namaBarangRuang,
        kategori: form.kategori || 'Elektronik',
        merkModel: form.merkModel || '',
        sumberDana: form.sumberDana || 'BOS Reguler',
        tanggalPengadaan: form.tanggalPengadaan || new Date().toISOString().split('T')[0],
        hargaPerolehan: Number(form.hargaPerolehan) || 0,
        masaManfaatTahun: Number(form.masaManfaatTahun) || 5,
        nilaiResidu: Number(form.nilaiResidu) || 0,
        penanggungJawab: form.penanggungJawab || '',
        statusAset: form.statusAset || 'Aktif Digunakan',
        jumlah: jumlahTotal,
        satuan: form.satuan || 'Unit',
        kondisiBaik,
        kondisiRusakRingan,
        kondisiRusakBerat,
        lokasi: form.lokasi || (ruangList[0]?.namaRuang || LOKASI_PRESETS[0]),
        ruangId: form.ruangId,
        gedungId: form.gedungId,
        fotoBarang: form.fotoBarang,
        keterangan: form.keterangan || ''
      };
      onSaveSarpras([newItem, ...sarpras]);
      onAddAuditLog('TAMBAH_ASET', `Menambahkan aset baru: ${newItem.namaBarangRuang} (${newItem.nomorInventarisResmi}) dengan perolehan ${formatRupiah(newItem.hargaPerolehan)}`, newItem);
    }

    setIsModalOpen(false);
  };

  // Handle Delete
  const handleDelete = (item: SarprasItem) => {
    if (confirm(`Hapus pencatatan aset "${item.namaBarangRuang}" (${item.nomorInventarisResmi || item.kode}) dari database?`)) {
      const updated = sarpras.filter(s => s.id !== item.id);
      onSaveSarpras(updated);
      onAddAuditLog('HAPUS_ASET', `Menghapus aset ${item.namaBarangRuang} (${item.nomorInventarisResmi || item.kode})`, item);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No Inventaris Resmi',
      'Kode Internal',
      'Nama Barang / Ruang',
      'Kategori',
      'Merk & Spesifikasi',
      'Sumber Dana',
      'Tgl Pengadaan',
      'Harga Perolehan (Rp)',
      'Masa Manfaat (Thn)',
      'Nilai Residu (Rp)',
      'Jumlah',
      'Satuan',
      'Kondisi Baik',
      'Kondisi Rusak Ringan',
      'Kondisi Rusak Berat',
      'Lokasi Penempatan',
      'Penanggung Jawab',
      'Status Aset',
      'Keterangan'
    ];

    const rows = filteredSarpras.map(s => [
      `"${s.nomorInventarisResmi || ''}"`,
      `"${s.kode || ''}"`,
      `"${s.namaBarangRuang || ''}"`,
      `"${s.kategori || ''}"`,
      `"${s.merkModel || ''}"`,
      `"${s.sumberDana || ''}"`,
      `"${s.tanggalPengadaan || ''}"`,
      s.hargaPerolehan || 0,
      s.masaManfaatTahun || 0,
      s.nilaiResidu || 0,
      s.jumlah || 1,
      `"${s.satuan || ''}"`,
      s.kondisiBaik || 0,
      s.kondisiRusakRingan || 0,
      s.kondisiRusakBerat || 0,
      `"${s.lokasi || ''}"`,
      `"${s.penanggungJawab || ''}"`,
      `"${s.statusAset || 'Aktif Digunakan'}"`,
      `"${s.keterangan || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Daftar_Aset_Sarpras_AlQomar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Aset Fisik</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {totalItemCount} <span className="text-xs text-slate-400 font-normal">unit/ruang</span>
          </p>
          <p className="text-[11px] text-emerald-400/90 mt-1">
            {sarpras.length} item terdaftar di SIM
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Kondisi Siap Pakai</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {totalBaik} <span className="text-xs text-slate-400 font-normal">baik</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalItemCount > 0 ? Math.round((totalBaik / totalItemCount) * 100) : 0}% kelayakan operasional
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Perlu Perawatan</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 font-mono">
            {totalRusak} <span className="text-xs text-slate-400 font-normal">unit</span>
          </p>
          <p className="text-[11px] text-amber-400/90 mt-1">
            Rusak ringan / servis berkala
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Nilai Perolehan</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-white font-mono truncate" title={formatRupiah(totalNilaiPerolehan)}>
            {formatRupiah(totalNilaiPerolehan)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Akumulasi harga pengadaan aset
          </p>
        </div>
      </div>

      {/* Control & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aset (nama barang, nomor inventaris resmi, merk, penanggung jawab)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 transition-all cursor-pointer shadow-sm"
              title="Ekspor data aset ke file CSV / Excel"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>

            {canEdit && (
              <>
                <button
                  onClick={() => setIsFotoModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 hover:from-emerald-300 hover:to-teal-200 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer transform active:scale-95 border border-emerald-300/40"
                  title="Tambah aset langsung lewat jepret foto kamera atau upload berkas gambar"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tambah via Foto Barang</span>
                </button>
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all cursor-pointer transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Aset Baru</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Kategori:</label>
            <select
              value={kategoriFilter}
              onChange={e => setKategoriFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Kategori</option>
              {KATEGORI_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Kondisi Fisik:</label>
            <select
              value={kondisiFilter}
              onChange={e => setKondisiFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Kondisi</option>
              <option value="Baik">Kondisi Baik</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Lokasi:</label>
            <select
              value={lokasiFilter}
              onChange={e => setLokasiFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Lokasi</option>
              {allLocations.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Status Aset:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif Digunakan">Aktif Digunakan</option>
              <option value="Dalam Perawatan">Dalam Perawatan</option>
              <option value="Dipinjam">Dipinjam</option>
              <option value="Rusak Total">Rusak Total</option>
              <option value="Dihapuskan / Mutasi Keluar">Dihapuskan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Item List Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-400">
          Menampilkan <span className="text-white font-semibold">{filteredSarpras.length}</span> dari {sarpras.length} aset
        </p>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              viewMode === 'cards'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-semibold'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Kartu
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              viewMode === 'table'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 font-semibold'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            Tabel Rinci
          </button>
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSarpras.map(item => {
            const dep = calculateDepresiasi(item);
            const totalQty = Number(item.jumlah) || 1;
            const baikQty = Number(item.kondisiBaik) || 0;
            const rusakQty = (Number(item.kondisiRusakRingan) || 0) + (Number(item.kondisiRusakBerat) || 0);

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Preview if available */}
                  {item.fotoBarang ? (
                    <div
                      onClick={() => setDetailItem(item)}
                      className="relative w-full h-36 mb-3 rounded-xl overflow-hidden bg-slate-950/80 border border-white/10 group-hover:border-emerald-400/40 transition-all cursor-pointer"
                      title="Klik untuk melihat detail & foto penuh"
                    >
                      <img
                        src={item.fotoBarang}
                        alt={item.namaBarangRuang}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] font-semibold text-emerald-300 flex items-center gap-1 border border-white/10 shadow-sm">
                        <Camera className="w-3 h-3" /> Foto Aset
                      </span>
                      {item.gedungId && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] font-semibold text-slate-300 flex items-center gap-1 border border-white/10 shadow-sm">
                          <Building2 className="w-3 h-3 text-emerald-400" />
                          {gedungList.find(g => g.id === item.gedungId)?.namaGedung || 'Gedung'}
                        </span>
                      )}
                    </div>
                  ) : (
                    item.gedungId && (
                      <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{gedungList.find(g => g.id === item.gedungId)?.namaGedung}</span>
                      </div>
                    )
                  )}

                  {/* Top Meta & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 truncate max-w-[200px]" title={item.nomorInventarisResmi || item.kode}>
                      {item.nomorInventarisResmi || item.kode}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                      (item.statusAset || 'Aktif Digunakan') === 'Aktif Digunakan'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : item.statusAset === 'Dalam Perawatan'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/30 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                    }`}>
                      {item.statusAset || 'Aktif Digunakan'}
                    </span>
                  </div>

                  {/* Title & Brand */}
                  <h4 className="font-bold text-white text-sm sm:text-base group-hover:text-emerald-300 transition-colors line-clamp-1" title={item.namaBarangRuang}>
                    {item.namaBarangRuang}
                  </h4>
                  {item.merkModel && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {item.merkModel}
                    </p>
                  )}

                  {/* Key Info Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Kategori</span>
                      <span className="font-medium truncate block">{item.kategori}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Jumlah & Satuan</span>
                      <span className="font-mono font-semibold text-white">{totalQty} {item.satuan}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Lokasi</span>
                      <span className="truncate block flex items-center gap-1" title={item.lokasi}>
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.lokasi}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Penanggung Jawab</span>
                      <span className="truncate block flex items-center gap-1" title={item.penanggungJawab || 'Belum diatur'}>
                        <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.penanggungJawab ? item.penanggungJawab.split(',')[0] : '-'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Kondisi & Nilai Perolehan */}
                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {baikQty} Baik
                      </span>
                      {rusakQty > 0 && (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          {rusakQty} Rusak
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-slate-300 text-xs font-semibold">
                      {formatRupiah(item.hargaPerolehan)}
                    </span>
                  </div>

                  {/* Depresiasi Progress Bar */}
                  {dep.hargaPerolehan > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Penyusutan Nilai Buku</span>
                        <span className="font-mono font-semibold text-slate-200">
                          {formatRupiah(dep.nilaiBukuSaatIni)} ({100 - dep.persentaseDepresiasi}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            dep.persentaseDepresiasi > 80
                              ? 'bg-rose-500'
                              : dep.persentaseDepresiasi > 50
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${dep.persentaseDepresiasi}%` }}
                          title={`Terdepresiasi ${dep.persentaseDepresiasi}% (Akumulasi: ${formatRupiah(dep.akumulasiDepresiasi)})`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-1">
                  <button
                    onClick={() => setDetailItem(item)}
                    className="text-xs text-slate-300 hover:text-white hover:underline cursor-pointer"
                  >
                    Detail Lengkap
                  </button>

                  <div className="flex items-center gap-1">
                    {onOpenMutasiWithItem && (
                      <button
                        onClick={() => onOpenMutasiWithItem(item)}
                        className="p-1.5 text-slate-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Mutasikan lokasi atau penanggung jawab aset ini"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    )}

                    {onOpenPerawatanWithItem && (
                      <button
                        onClick={() => onOpenPerawatanWithItem(item)}
                        className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Ajukan servis / perbaikan untuk aset ini"
                      >
                        <Wrench className="w-4 h-4" />
                      </button>
                    )}

                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Aset"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Aset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-2 text-center w-12">Foto</th>
                <th className="py-3 px-3">No. Inventaris</th>
                <th className="py-3 px-3">Nama Barang / Spesifikasi</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Jumlah</th>
                <th className="py-3 px-3">Kondisi</th>
                <th className="py-3 px-3">Lokasi & PJ</th>
                <th className="py-3 px-3 text-right">Harga Perolehan</th>
                <th className="py-3 px-3 text-right">Nilai Buku</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSarpras.map(item => {
                const dep = calculateDepresiasi(item);
                return (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2 text-center">
                      {item.fotoBarang ? (
                        <button
                          type="button"
                          onClick={() => setDetailItem(item)}
                          className="w-9 h-9 rounded-lg overflow-hidden border border-emerald-500/30 inline-block hover:scale-110 transition-transform cursor-pointer"
                          title="Lihat Foto"
                        >
                          <img src={item.fotoBarang} alt="" className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-500 mx-auto">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-emerald-300">
                      {item.nomorInventarisResmi || item.kode}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-white truncate max-w-[220px]" title={item.namaBarangRuang}>
                        {item.namaBarangRuang}
                      </p>
                      {item.merkModel && (
                        <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{item.merkModel}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{item.kategori}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {item.jumlah} {item.satuan}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-emerald-400 font-medium">{item.kondisiBaik}B</span>
                      {(item.kondisiRusakRingan > 0 || item.kondisiRusakBerat > 0) && (
                        <span className="text-amber-400 font-medium ml-1">
                          {(item.kondisiRusakRingan || 0) + (item.kondisiRusakBerat || 0)}R
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <p className="truncate max-w-[150px] text-white">{item.lokasi}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                        {item.penanggungJawab ? item.penanggungJawab.split(',')[0] : '-'}
                      </p>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                      {formatRupiah(item.hargaPerolehan)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-semibold">
                      {formatRupiah(dep.nilaiBukuSaatIni)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="p-1 hover:text-white text-slate-400"
                          title="Detail Aset"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 hover:text-emerald-300 text-slate-400"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1 hover:text-rose-400 text-slate-400"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT ASET */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30 text-emerald-400">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Data Aset Inventaris' : 'Pencatatan Aset Inventaris Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Format penomoran terstandar dengan integrasi nilai buku dan depresiasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              {/* Row 1: Nomor Inventaris & Auto Generate */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Barcode className="w-4 h-4" />
                    Nomor Inventaris Resmi:
                  </label>
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 rounded-lg cursor-pointer transition-all active:scale-95"
                    title="Generate otomatis nomor inventaris resmi berikutnya"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Otomatis</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={form.nomorInventarisResmi || ''}
                    onChange={e => setForm(prev => ({ ...prev, nomorInventarisResmi: e.target.value }))}
                    placeholder="Contoh: SMP-IQ/INV/EL/2024/001"
                    className="w-full bg-slate-900 border border-emerald-400/50 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <input
                    type="text"
                    value={form.kode || ''}
                    onChange={e => setForm(prev => ({ ...prev, kode: e.target.value }))}
                    placeholder="Kode Singkat (Contoh: EL-001)"
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-slate-300 font-mono text-sm focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Foto Barang Section in Form */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-slate-200 font-semibold flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Foto Dokumentasi Barang:</span>
                  </label>
                  {form.fotoBarang && (
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, fotoBarang: undefined }))}
                      className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {form.fotoBarang ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-emerald-500/40 shrink-0">
                      <img src={form.fotoBarang} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-900/80 border border-dashed border-white/20 flex flex-col items-center justify-center text-slate-500 shrink-0">
                      <ImageIcon className="w-6 h-6" />
                      <span className="text-[9px] mt-1">Belum Ada</span>
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 cursor-pointer font-bold text-xs transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{form.fotoBarang ? 'Ganti Foto' : 'Unggah Foto Barang'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImageFile(file, 960, 0.78);
                                setForm(prev => ({ ...prev, fotoBarang: compressed }));
                              } catch (err) {
                                alert('Gagal memproses foto.');
                              }
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsFotoModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold cursor-pointer"
                        title="Buka Kamera / Pemindaian Foto Terpadu"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Gunakan Kamera Langsung</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Foto barang akan otomatis dikompresi untuk menghemat ruang penyimpanan SIM Sarpras.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Nama Barang & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Nama Barang / Ruang *</label>
                  <input
                    type="text"
                    required
                    value={form.namaBarangRuang || ''}
                    onChange={e => setForm(prev => ({ ...prev, namaBarangRuang: e.target.value }))}
                    placeholder="Contoh: Proyektor EPSON EB-E500"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Kategori *</label>
                  <select
                    value={form.kategori || 'Elektronik'}
                    onChange={e => {
                      const newCat = e.target.value;
                      setForm(prev => ({ ...prev, kategori: newCat }));
                    }}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {KATEGORI_OPTIONS.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Merk/Model & Spesifikasi */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Merk / Tipe / Spesifikasi Teknis</label>
                <input
                  type="text"
                  value={form.merkModel || ''}
                  onChange={e => setForm(prev => ({ ...prev, merkModel: e.target.value }))}
                  placeholder="Contoh: Lenovo Core i5 16GB / Garansi Resmi 3 Tahun"
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Row 4: Pengadaan & Keuangan */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-950/40 border border-white/5">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tgl Pengadaan</label>
                  <input
                    type="date"
                    value={form.tanggalPengadaan || ''}
                    onChange={e => setForm(prev => ({ ...prev, tanggalPengadaan: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sumber Dana</label>
                  <select
                    value={form.sumberDana || 'BOS Reguler'}
                    onChange={e => setForm(prev => ({ ...prev, sumberDana: e.target.value }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    {SUMBER_DANA_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Harga Beli / Unit (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.hargaPerolehan || 0}
                    onChange={e => setForm(prev => ({ ...prev, hargaPerolehan: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Masa Manfaat (Thn)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.masaManfaatTahun || 5}
                    onChange={e => setForm(prev => ({ ...prev, masaManfaatTahun: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              {/* Row 5: Master Ruang & Gedung, Lokasi Spesifik, Penanggung Jawab, Status */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 text-xs">
                      Master Gedung & Ruang
                    </label>
                    <select
                      value={form.ruangId || ''}
                      onChange={e => {
                        const rId = e.target.value;
                        const targetRuang = ruangList.find(r => r.id === rId);
                        if (targetRuang) {
                          setForm(prev => ({
                            ...prev,
                            ruangId: targetRuang.id,
                            gedungId: targetRuang.gedungId,
                            lokasi: targetRuang.namaRuang,
                            penanggungJawab: targetRuang.penanggungJawabRuang || prev.penanggungJawab
                          }));
                        } else {
                          setForm(prev => ({
                            ...prev,
                            ruangId: undefined,
                            gedungId: undefined
                          }));
                        }
                      }}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    >
                      <option value="">-- Pilih dari Master Ruang --</option>
                      {ruangList.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.namaRuang} ({r.namaGedung || 'Gedung'}) {r.penanggungJawabRuang ? `• PJ: ${r.penanggungJawabRuang}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1 text-xs">Lokasi Tertulis / Titik Spesifik</label>
                    <input
                      type="text"
                      list="lokasi-list"
                      value={form.lokasi || ''}
                      onChange={e => setForm(prev => ({ ...prev, lokasi: e.target.value }))}
                      placeholder="Contoh: Lab Komputer 1 / Rak Server 02"
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                    <datalist id="lokasi-list">
                      {LOKASI_PRESETS.map(l => (
                        <option key={l} value={l} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 text-xs">Penanggung Jawab Aset</label>
                    <select
                      value={form.penanggungJawab || ''}
                      onChange={e => setForm(prev => ({ ...prev, penanggungJawab: e.target.value }))}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    >
                      <option value="">-- Pilih Guru / Tendik --</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.nama}>
                          {t.nama} {t.jabatan ? `(${t.jabatan})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1 text-xs">Status Aset</label>
                    <select
                      value={form.statusAset || 'Aktif Digunakan'}
                      onChange={e => setForm(prev => ({ ...prev, statusAset: e.target.value as any }))}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    >
                      <option value="Aktif Digunakan">Aktif Digunakan</option>
                      <option value="Dalam Perawatan">Dalam Perawatan / Servis</option>
                      <option value="Dipinjam">Dipinjam</option>
                      <option value="Rusak Total">Rusak Total</option>
                      <option value="Dihapuskan / Mutasi Keluar">Dihapuskan / Keluar</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 6: Jumlah & Kondisi */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Kuantitas & Kondisi Fisik</span>
                  <span className="text-[11px] text-slate-400">Total Baik + Rusak harus sama dengan Jumlah Unit</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Total Jumlah *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.jumlah || 1}
                      onChange={e => {
                        const val = Number(e.target.value) || 1;
                        setForm(prev => ({
                          ...prev,
                          jumlah: val,
                          kondisiBaik: val - (Number(prev.kondisiRusakRingan) || 0) - (Number(prev.kondisiRusakBerat) || 0)
                        }));
                      }}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Satuan</label>
                    <select
                      value={form.satuan || 'Unit'}
                      onChange={e => setForm(prev => ({ ...prev, satuan: e.target.value }))}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      {SATUAN_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-emerald-400 block mb-1 font-semibold">Kondisi Baik</label>
                    <input
                      type="number"
                      min="0"
                      value={form.kondisiBaik || 0}
                      onChange={e => setForm(prev => ({ ...prev, kondisiBaik: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-emerald-500/40 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-400 block mb-1 font-semibold">Rusak Ringan</label>
                    <input
                      type="number"
                      min="0"
                      value={form.kondisiRusakRingan || 0}
                      onChange={e => setForm(prev => ({ ...prev, kondisiRusakRingan: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-400 block mb-1 font-semibold">Rusak Berat</label>
                    <input
                      type="number"
                      min="0"
                      value={form.kondisiRusakBerat || 0}
                      onChange={e => setForm(prev => ({ ...prev, kondisiRusakBerat: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-rose-500/40 rounded-lg px-2.5 py-1.5 text-rose-300 font-mono font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Row 7: Keterangan */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Keterangan / Riwayat Tambahan</label>
                <textarea
                  rows={2}
                  value={form.keterangan || ''}
                  onChange={e => setForm(prev => ({ ...prev, keterangan: e.target.value }))}
                  placeholder="Catatan tambahan mengenai aset, nomor seri mesin, atau garansi..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all cursor-pointer transform active:scale-95"
                >
                  Simpan Data Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL ASET LENGKAP */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {detailItem.nomorInventarisResmi || detailItem.kode}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{detailItem.namaBarangRuang}</h3>
                <p className="text-xs text-slate-400">{detailItem.merkModel || 'Tidak ada spesifikasi'}</p>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Foto Barang in Detail Modal */}
            {detailItem.fotoBarang && (
              <div className="relative w-full h-52 rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center group">
                <img
                  src={detailItem.fotoBarang}
                  alt={detailItem.namaBarangRuang}
                  className="w-full h-full object-contain"
                />
                <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] text-emerald-300 font-semibold flex items-center gap-1.5 border border-white/10 shadow-md">
                  <Camera className="w-3.5 h-3.5" /> Foto Fisik Aset
                </span>
                {detailItem.gedungId && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-sm text-[10px] text-slate-200 font-semibold flex items-center gap-1.5 border border-white/10 shadow-md">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    {gedungList.find(g => g.id === detailItem.gedungId)?.namaGedung || 'Gedung'}
                  </span>
                )}
              </div>
            )}

            {/* Calculations */}
            {(() => {
              const dep = calculateDepresiasi(detailItem);
              return (
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Kategori</span>
                      <span className="text-white font-medium">{detailItem.kategori}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Lokasi</span>
                      <span className="text-white font-medium">{detailItem.lokasi}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Penanggung Jawab</span>
                      <span className="text-white font-medium">{detailItem.penanggungJawab || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Sumber Dana</span>
                      <span className="text-white font-medium">{detailItem.sumberDana || 'BOS'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Tgl Pengadaan</span>
                      <span className="text-white font-medium">{detailItem.tanggalPengadaan || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Status Aset</span>
                      <span className="text-emerald-300 font-semibold">{detailItem.statusAset || 'Aktif'}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Harga Perolehan</span>
                      <span className="text-white font-mono font-bold">{formatRupiah(dep.hargaPerolehan)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Akumulasi Depresiasi</span>
                      <span className="text-amber-400 font-mono font-bold">{formatRupiah(dep.akumulasiDepresiasi)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Nilai Buku Saat Ini</span>
                      <span className="text-emerald-400 font-mono font-bold">{formatRupiah(dep.nilaiBukuSaatIni)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Usia Pakai: {dep.tahunBerlalu} thn ({dep.bulanBerlalu} bulan)</span>
                      <span>Masa Manfaat: {dep.masaManfaatTahun} tahun</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${dep.persentaseDepresiasi}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {detailItem.keterangan && (
              <div className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 block mb-1">Keterangan:</span>
                {detailItem.keterangan}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ASET VIA FOTO BARANG */}
      <SarprasFotoUploadModal
        isOpen={isFotoModalOpen}
        onClose={() => setIsFotoModalOpen(false)}
        onSaveAsset={handleSaveAssetFromPhoto}
        ruangList={ruangList}
        gedungList={gedungList}
        teachers={teachers}
        sarpras={sarpras}
      />
    </div>
  );
};
