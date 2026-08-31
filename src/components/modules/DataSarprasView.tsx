import React, { useState } from 'react';
import { SarprasItem, UserSession, Teacher } from '../../types';
import { exportToCSV } from '../../services/storage';
import { Package, Plus, Search, Download, Edit3, Trash2, X, CheckCircle, AlertTriangle, Building2, ShieldCheck, UserCheck, RefreshCw, Sparkles } from 'lucide-react';

interface DataSarprasViewProps {
  sarpras: SarprasItem[];
  onSaveSarpras: (sarpras: SarprasItem[]) => void;
  session?: UserSession;
  teachers?: Teacher[];
}

/**
 * Fungsi logika IF untuk menentukan kode prefix inventaris berdasarkan kategori
 */
export const getPrefixByKategori = (kategori: string): string => {
  if (kategori === 'Ruang / Gedung') {
    return 'R';
  } else if (kategori === 'Keagamaan') {
    return 'AG';
  } else if (kategori === 'Peralatan Lab') {
    return 'LAB';
  } else if (kategori === 'Elektronik') {
    return 'EL';
  } else if (kategori === 'Mebelair') {
    return 'M';
  } else if (kategori === 'Olahraga & Seni') {
    return 'OR';
  } else {
    return 'SRP';
  }
};

/**
 * Fungsi logika IF untuk menentukan default satuan berdasarkan kategori
 */
export const getDefaultSatuanByKategori = (kategori: string): string => {
  if (kategori === 'Ruang / Gedung') {
    return 'Ruang';
  } else if (kategori === 'Keagamaan') {
    return 'Ruang';
  } else if (kategori === 'Peralatan Lab') {
    return 'Unit / Pcs';
  } else if (kategori === 'Elektronik') {
    return 'Unit / Pcs';
  } else if (kategori === 'Mebelair') {
    return 'Set';
  } else if (kategori === 'Olahraga & Seni') {
    return 'Set';
  } else {
    return 'Unit / Pcs';
  }
};

/**
 * Fungsi kalkulasi nomor urut berikutnya berdasarkan kode prefix kategori
 */
export const generateNextKode = (kategori: string, existingList: SarprasItem[]): string => {
  const prefix = getPrefixByKategori(kategori);
  let maxNumber = 0;

  existingList.forEach((item) => {
    if (item.kode) {
      const upper = item.kode.toUpperCase().trim();
      if (upper.startsWith(`${prefix}-`)) {
        const parts = upper.split('-');
        if (parts.length >= 2) {
          const num = parseInt(parts[1], 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
  });

  const nextNumber = maxNumber + 1;
  const formattedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}-${formattedNumber}`;
};

const SATUAN_OPTIONS = [
  'Ruang',
  'Unit / Pcs',
  'Set',
  'Pack',
  'Buah',
  'Lusin',
  'Kardus / Dus',
  'Lembar',
  'Meter',
  'Lainnya (Tulis Sendiri)'
];

export const DataSarprasView: React.FC<DataSarprasViewProps> = ({
  sarpras,
  onSaveSarpras,
  session,
  teachers = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SarprasItem | null>(null);
  const [isCustomSatuan, setIsCustomSatuan] = useState(false);

  const loggedTeacher = teachers.find(
    t => (session?.teacherId && t.id === session.teacherId) || t.nama === session?.name
  );

  const isWakaSarpras = !!(
    loggedTeacher &&
    (loggedTeacher.jabatan?.toLowerCase().includes('sarpras') ||
      loggedTeacher.jabatan?.toLowerCase().includes('sarana'))
  );

  const isAdmin = session?.role === 'admin';
  const canEdit = isAdmin || isWakaSarpras;

  const [form, setForm] = useState<Partial<SarprasItem>>({
    kode: '',
    namaBarangRuang: '',
    kategori: 'Ruang / Gedung',
    jumlah: 1,
    satuan: 'Ruang',
    kondisiBaik: 1,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    lokasi: 'Lantai 1 Gedung Utama',
    keterangan: ''
  });

  const categories = [
    'Semua',
    'Ruang / Gedung',
    'Peralatan Lab',
    'Elektronik',
    'Mebelair',
    'Olahraga & Seni',
    'Keagamaan'
  ];

  const filteredSarpras = sarpras.filter((s) => {
    const matchSearch =
      s.namaBarangRuang.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = kategoriFilter === 'Semua' || s.kategori === kategoriFilter;
    return matchSearch && matchCat;
  });

  const totalJumlah = sarpras.reduce((acc, curr) => acc + curr.jumlah, 0);
  const totalBaik = sarpras.reduce((acc, curr) => acc + curr.kondisiBaik, 0);
  const totalRusak = sarpras.reduce((acc, curr) => acc + curr.kondisiRusakRingan + curr.kondisiRusakBerat, 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    const initialKategori = 'Ruang / Gedung';
    const autoKode = generateNextKode(initialKategori, sarpras);
    const autoSatuan = getDefaultSatuanByKategori(initialKategori);

    setIsCustomSatuan(false);
    setForm({
      id: `SRP${Date.now().toString().slice(-4)}`,
      kode: autoKode,
      namaBarangRuang: '',
      kategori: initialKategori,
      jumlah: 1,
      satuan: autoSatuan,
      kondisiBaik: 1,
      kondisiRusakRingan: 0,
      kondisiRusakBerat: 0,
      lokasi: 'Lantai 1 Gedung Utama',
      keterangan: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SarprasItem) => {
    setEditingItem(item);
    const isStandardSatuan = SATUAN_OPTIONS.filter(o => !o.startsWith('Lainnya')).includes(item.satuan);
    setIsCustomSatuan(!isStandardSatuan);
    setForm({ ...item });
    setIsModalOpen(true);
  };

  // Handler saat Kategori diubah pada Form Modal
  const handleKategoriChange = (newKategori: any) => {
    const autoKode = generateNextKode(newKategori, sarpras);
    const autoSatuan = getDefaultSatuanByKategori(newKategori);

    setIsCustomSatuan(false);
    setForm(prev => ({
      ...prev,
      kategori: newKategori,
      kode: autoKode,
      satuan: autoSatuan
    }));
  };

  // Handler saat tombol refresh kode diklik
  const handleRefreshKode = () => {
    if (form.kategori) {
      const autoKode = generateNextKode(form.kategori, sarpras);
      setForm(prev => ({ ...prev, kode: autoKode }));
    }
  };

  // Handler saat Satuan diubah
  const handleSatuanSelectChange = (selectedVal: string) => {
    if (selectedVal === 'Lainnya (Tulis Sendiri)') {
      setIsCustomSatuan(true);
      setForm(prev => ({ ...prev, satuan: '' }));
    } else {
      setIsCustomSatuan(false);
      setForm(prev => ({ ...prev, satuan: selectedVal }));
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data sarpras/fasilitas ini?')) {
      const updated = sarpras.filter(s => s.id !== id);
      onSaveSarpras(updated);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.namaBarangRuang || !form.kode) return;

    const finalSatuan = (form.satuan && form.satuan.trim()) ? form.satuan.trim() : 'Unit / Pcs';

    if (editingItem) {
      const updated = sarpras.map(s => (s.id === editingItem.id ? ({ ...form, satuan: finalSatuan } as SarprasItem) : s));
      onSaveSarpras(updated);
    } else {
      const newItem: SarprasItem = {
        id: form.id || `SRP${Date.now().toString().slice(-4)}`,
        kode: form.kode!,
        namaBarangRuang: form.namaBarangRuang!,
        kategori: (form.kategori as any) || 'Ruang / Gedung',
        jumlah: Number(form.jumlah) || 1,
        satuan: finalSatuan,
        kondisiBaik: Number(form.kondisiBaik) || 0,
        kondisiRusakRingan: Number(form.kondisiRusakRingan) || 0,
        kondisiRusakBerat: Number(form.kondisiRusakBerat) || 0,
        lokasi: form.lokasi || 'Gedung Utama',
        keterangan: form.keterangan || ''
      };
      onSaveSarpras([...sarpras, newItem]);
    }

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const csvData = sarpras.map(s => ({
      ID: s.id,
      Kode: s.kode,
      Nama_Barang_Ruang: s.namaBarangRuang,
      Kategori: s.kategori,
      Jumlah: s.jumlah,
      Satuan: s.satuan,
      Kondisi_Baik: s.kondisiBaik,
      Kondisi_Rusak_Ringan: s.kondisiRusakRingan,
      Kondisi_Rusak_Berat: s.kondisiRusakBerat,
      Lokasi: s.lokasi,
      Keterangan: s.keterangan
    }));
    exportToCSV('Data_Sarpras_SMP_Islam_Al_Qomar.csv', csvData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Package className="w-3.5 h-3.5 text-emerald-700" />
              <span>Master Sarana & Prasarana</span>
            </div>

            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Akses: Admin DAPODIK</span>
              </span>
            )}

            {isWakaSarpras && !isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-400 text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Akses Khusus: Waka Sarpras ({loggedTeacher?.nama})</span>
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold font-serif text-slate-900">
            Inventaris Aset & Fasilitas SMP Islam Al Qomar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gedung, laboratorium, ruang kelas, sarana ibadah, dan fasilitas sekolah yang terhubung dengan jadwal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sarpras</span>
            </button>
          )}
        </div>
      </div>

      {/* Role Access Banner for Waka Sarpras */}
      {isWakaSarpras && (
        <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">
                Otorisasi Aktif: Waka Sarpras & Pengelola Fasilitas
              </p>
              <p className="text-emerald-800 text-[11px]">
                Anda memiliki hak penuh untuk menambah, mengedit, dan memperbarui seluruh data inventaris sarana dan ruangan sekolah.
              </p>
            </div>
          </div>
          <span className="bg-emerald-200/80 text-emerald-950 px-2.5 py-1 rounded-lg font-bold text-[11px] border border-emerald-300 shrink-0">
            Akses Penuh
          </span>
        </div>
      )}

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold font-serif text-slate-900">{totalJumlah}</span>
            <span className="block text-xs text-slate-500 font-medium">Total Unit Aset & Ruangan</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-bold font-serif text-emerald-800">{totalBaik}</span>
            <span className="block text-xs text-slate-500 font-medium">Unit Dalam Kondisi Baik</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 font-bold">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-2xl font-bold font-serif text-amber-800">{totalRusak}</span>
            <span className="block text-xs text-slate-500 font-medium">Perlu Maintenance / Perbaikan</span>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode, nama barang, atau lokasi..."
            className="w-full px-3 py-2 pl-9 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-700 font-bold">Kategori:</span>
          <select
            value={kategoriFilter}
            onChange={(e) => setKategoriFilter(e.target.value)}
            className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {categories.map(c => <option key={c} value={c} className="bg-white text-slate-900">{c}</option>)}
          </select>
        </div>
      </div>

      {/* Sarpras Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">Kode & Nama Aset/Ruang</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Jumlah</th>
                <th className="p-3.5">Rincian Kondisi</th>
                <th className="p-3.5">Lokasi</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSarpras.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 font-serif text-sm">{item.namaBarangRuang}</div>
                    <div className="text-[11px] font-mono text-emerald-800 font-bold">Kode: {item.kode}</div>
                    {item.keterangan && (
                      <p className="text-[11px] text-slate-500 mt-0.5 italic">{item.keterangan}</p>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="bg-slate-100 text-slate-800 font-semibold text-xs px-2.5 py-1 rounded-md border border-slate-200">
                      {item.kategori}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-800">
                    {item.jumlah} {item.satuan}
                  </td>
                  <td className="p-3.5 space-y-1 text-[11px]">
                    <div className="text-emerald-700 font-semibold">Baik: {item.kondisiBaik}</div>
                    {item.kondisiRusakRingan > 0 && (
                      <div className="text-amber-700">Rusak Ringan: {item.kondisiRusakRingan}</div>
                    )}
                    {item.kondisiRusakBerat > 0 && (
                      <div className="text-rose-700 font-bold">Rusak Berat: {item.kondisiRusakBerat}</div>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-700 font-medium">
                    {item.lokasi}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Sarpras"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold font-serif text-lg text-slate-900">
                {editingItem ? 'Edit Data Sarpras / Aset' : 'Tambah Sarpras / Aset Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang / Ruangan</label>
                <input
                  type="text"
                  value={form.namaBarangRuang}
                  onChange={(e) => setForm({ ...form, namaBarangRuang: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Sarpras / Aset
                  </label>
                  <select
                    value={form.kategori}
                    onChange={(e) => handleKategoriChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {categories.filter(c => c !== 'Semua').map(c => (
                      <option key={c} value={c} className="bg-white text-slate-900">{c}</option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <span className="font-semibold text-emerald-700 font-mono">Prefix: {getPrefixByKategori(form.kategori || '')}-</span>
                    <span>(Otomatis menyesuaikan kode)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Kode Inventaris</label>
                    <button
                      type="button"
                      onClick={handleRefreshKode}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 hover:underline"
                      title="Hitung ulang nomor urut otomatis"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.kode}
                      onChange={(e) => setForm({ ...form, kode: e.target.value })}
                      required
                      placeholder="Contoh: R-001, AG-001..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono font-bold text-emerald-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Dihitung otomatis berurutan dengan logika IF kategori</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Total</label>
                  <input
                    type="number"
                    min="1"
                    value={form.jumlah}
                    onChange={(e) => setForm({ ...form, jumlah: Number(e.target.value) })}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilihan Satuan</label>
                  <select
                    value={isCustomSatuan ? 'Lainnya (Tulis Sendiri)' : (form.satuan || 'Unit / Pcs')}
                    onChange={(e) => handleSatuanSelectChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {SATUAN_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-white text-slate-900">
                        {opt}
                      </option>
                    ))}
                  </select>

                  {isCustomSatuan && (
                    <input
                      type="text"
                      value={form.satuan}
                      onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                      placeholder="Ketik satuan kustom (misal: Rim, Botol)..."
                      required
                      className="mt-2 w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-800 mb-1">Kondisi Baik</label>
                  <input
                    type="number"
                    min="0"
                    value={form.kondisiBaik}
                    onChange={(e) => setForm({ ...form, kondisiBaik: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-800 mb-1">Rusak Ringan</label>
                  <input
                    type="number"
                    min="0"
                    value={form.kondisiRusakRingan}
                    onChange={(e) => setForm({ ...form, kondisiRusakRingan: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">Rusak Berat</label>
                  <input
                    type="number"
                    min="0"
                    value={form.kondisiRusakBerat}
                    onChange={(e) => setForm({ ...form, kondisiRusakBerat: Number(e.target.value) })}
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Aset/Ruang</label>
                <input
                  type="text"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  placeholder="Lantai 1 Gedung Utama..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan Spesifikasi</label>
                <textarea
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Simpan Sarpras
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
