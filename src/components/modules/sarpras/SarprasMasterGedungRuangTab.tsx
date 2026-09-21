import React, { useState, useId } from 'react';
import { SarprasGedung, SarprasRuang, SarprasItem, Teacher } from '../../../types';
import {
  Building2,
  DoorOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Users,
  Maximize2,
  Layers,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Boxes,
  Info,
  ExternalLink
} from 'lucide-react';
import { compressImageFile } from './sarprasImageUtils';

interface SarprasMasterGedungRuangTabProps {
  gedungList: SarprasGedung[];
  ruangList: SarprasRuang[];
  sarprasItems?: SarprasItem[];
  sarpras?: SarprasItem[];
  teachers?: Teacher[];
  canEdit: boolean;
  onSaveGedung: (newList: SarprasGedung[], logMsg?: string) => void;
  onSaveRuang: (newList: SarprasRuang[], logMsg?: string) => void;
  onSelectRoomForAssets?: (roomName: string) => void;
  onAddAuditLog?: (action: any, detail: any) => void;
}

export const SarprasMasterGedungRuangTab: React.FC<SarprasMasterGedungRuangTabProps> = ({
  gedungList = [],
  ruangList = [],
  sarprasItems,
  sarpras = [],
  teachers = [],
  canEdit,
  onSaveGedung,
  onSaveRuang,
  onSelectRoomForAssets,
  onAddAuditLog
}) => {
  const allSarprasItems = sarprasItems || sarpras || [];
  const [activeSubTab, setActiveSubTab] = useState<'gedung' | 'ruang'>('gedung');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGedungId, setFilterGedungId] = useState<string>('ALL');
  const [filterJenisRuang, setFilterJenisRuang] = useState<string>('ALL');
  const [filterKondisi, setFilterKondisi] = useState<string>('ALL');

  // Modal Gedung State
  const [isGedungModalOpen, setIsGedungModalOpen] = useState(false);
  const [editingGedung, setEditingGedung] = useState<SarprasGedung | null>(null);
  const [gedungForm, setGedungForm] = useState<Partial<SarprasGedung>>({
    kodeGedung: '',
    namaGedung: '',
    jumlahLantai: 1,
    tahunDibangun: new Date().getFullYear(),
    luasBangunanM2: 0,
    kondisi: 'Baik',
    penanggungJawab: '',
    fotoGedung: '',
    keterangan: ''
  });

  // Modal Ruang State
  const [isRuangModalOpen, setIsRuangModalOpen] = useState(false);
  const [editingRuang, setEditingRuang] = useState<SarprasRuang | null>(null);
  const [ruangForm, setRuangForm] = useState<Partial<SarprasRuang>>({
    kodeRuang: '',
    namaRuang: '',
    gedungId: gedungList[0]?.id || '',
    lantai: 1,
    jenisRuang: 'Ruang Kelas / Teori',
    panjangMeter: 8,
    lebarMeter: 7,
    luasM2: 56,
    kapasitasOrang: 32,
    penanggungJawabRuang: '',
    kondisiRuang: 'Baik',
    keterangan: '',
    fotoRuang: ''
  });

  // Photo upload states
  const [uploadLoading, setUploadLoading] = useState(false);

  // Generate unique IDs for form labels
  const kodeGedungInputId = useId();
  const namaGedungInputId = useId();
  const jumlahLantaiInputId = useId();
  const tahunDibangunInputId = useId();
  const luasGedungInputId = useId();
  const kondisiGedungInputId = useId();
  const picGedungInputId = useId();
  const keteranganGedungInputId = useId();

  const kodeRuangInputId = useId();
  const namaRuangInputId = useId();
  const gedungSelectInputId = useId();
  const lantaiRuangInputId = useId();
  const jenisRuangInputId = useId();
  const panjangRuangInputId = useId();
  const lebarRuangInputId = useId();
  const luasRuangInputId = useId();
  const kapasitasRuangInputId = useId();
  const picRuangInputId = useId();
  const kondisiRuangInputId = useId();
  const keteranganRuangInputId = useId();

  // Summary Metrics
  const totalGedung = gedungList.length;
  const totalLuasGedung = gedungList.reduce((acc, g) => acc + (Number(g?.luasBangunanM2) || 0), 0);
  const totalRuang = ruangList.length;
  const totalKapasitasSiswa = ruangList.reduce((acc, r) => acc + (Number(r?.kapasitasOrang) || 0), 0);
  const totalRuangBaik = ruangList.filter(r => r && r.kondisiRuang === 'Baik').length;

  // Filtered Gedung
  const filteredGedung = gedungList.filter(g => {
    if (!g) return false;
    const matchSearch =
      (g.namaGedung || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.kodeGedung || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.penanggungJawab || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchKondisi = filterKondisi === 'ALL' || g.kondisi === filterKondisi;
    return matchSearch && matchKondisi;
  });

  // Filtered Ruang
  const filteredRuang = ruangList.filter(r => {
    if (!r) return false;
    const matchSearch =
      (r.namaRuang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.kodeRuang || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.penanggungJawabRuang || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchGedung = filterGedungId === 'ALL' || r.gedungId === filterGedungId;
    const matchJenis = filterJenisRuang === 'ALL' || r.jenisRuang === filterJenisRuang;
    const matchKondisi = filterKondisi === 'ALL' || r.kondisiRuang === filterKondisi;
    return matchSearch && matchGedung && matchJenis && matchKondisi;
  });

  // Gedung Handlers
  const handleOpenAddGedung = () => {
    setEditingGedung(null);
    setGedungForm({
      kodeGedung: `GD-${String(gedungList.length + 1).padStart(2, '0')}`,
      namaGedung: '',
      jumlahLantai: 1,
      tahunDibangun: new Date().getFullYear(),
      luasBangunanM2: 120,
      kondisi: 'Baik',
      penanggungJawab: teachers[0]?.nama || '',
      fotoGedung: '',
      keterangan: ''
    });
    setIsGedungModalOpen(true);
  };

  const handleOpenEditGedung = (g: SarprasGedung) => {
    setEditingGedung(g);
    setGedungForm({ ...g });
    setIsGedungModalOpen(true);
  };

  const handleDeleteGedung = (id: string, nama: string) => {
    const linkedRooms = ruangList.filter(r => r.gedungId === id);
    if (linkedRooms.length > 0) {
      alert(`Tidak dapat menghapus gedung "${nama}" karena masih terdapat ${linkedRooms.length} ruang yang terhubung.`);
      return;
    }
    if (window.confirm(`Hapus master gedung "${nama}"?`)) {
      const updated = gedungList.filter(g => g.id !== id);
      onSaveGedung(updated, `Menghapus master gedung: ${nama}`);
    }
  };

  const handleSaveGedungSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gedungForm.namaGedung || !gedungForm.kodeGedung) {
      alert('Mohon isi kode dan nama gedung.');
      return;
    }

    if (editingGedung) {
      const updated = gedungList.map(g => (g.id === editingGedung.id ? { ...g, ...gedungForm } as SarprasGedung : g));
      onSaveGedung(updated, `Mengubah data gedung: ${gedungForm.namaGedung}`);
    } else {
      const newGedung: SarprasGedung = {
        id: `GDG-${Date.now()}`,
        kodeGedung: gedungForm.kodeGedung || `GD-${gedungList.length + 1}`,
        namaGedung: gedungForm.namaGedung || 'Gedung Baru',
        jumlahLantai: Number(gedungForm.jumlahLantai) || 1,
        tahunDibangun: gedungForm.tahunDibangun,
        luasBangunanM2: Number(gedungForm.luasBangunanM2) || 0,
        kondisi: (gedungForm.kondisi as SarprasGedung['kondisi']) || 'Baik',
        penanggungJawab: gedungForm.penanggungJawab,
        fotoGedung: gedungForm.fotoGedung,
        keterangan: gedungForm.keterangan
      };
      onSaveGedung([...gedungList, newGedung], `Menambahkan master gedung baru: ${newGedung.namaGedung}`);
    }
    setIsGedungModalOpen(false);
  };

  // Ruang Handlers
  const handleOpenAddRuang = () => {
    setEditingRuang(null);
    const defaultGedung = gedungList[0];
    setRuangForm({
      kodeRuang: `R-${String(ruangList.length + 1).padStart(2, '0')}`,
      namaRuang: '',
      gedungId: defaultGedung?.id || '',
      namaGedung: defaultGedung?.namaGedung || '',
      lantai: 1,
      jenisRuang: 'Ruang Kelas / Teori',
      panjangMeter: 8,
      lebarMeter: 7,
      luasM2: 56,
      kapasitasOrang: 32,
      penanggungJawabRuang: teachers[0]?.nama || '',
      kondisiRuang: 'Baik',
      keterangan: '',
      fotoRuang: ''
    });
    setIsRuangModalOpen(true);
  };

  const handleOpenEditRuang = (r: SarprasRuang) => {
    setEditingRuang(r);
    setRuangForm({ ...r });
    setIsRuangModalOpen(true);
  };

  const handleDeleteRuang = (id: string, nama: string) => {
    if (window.confirm(`Hapus master ruang "${nama}"?`)) {
      const updated = ruangList.filter(r => r.id !== id);
      onSaveRuang(updated, `Menghapus master ruang: ${nama}`);
    }
  };

  const handleSaveRuangSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruangForm.namaRuang || !ruangForm.kodeRuang || !ruangForm.gedungId) {
      alert('Mohon isi kode ruang, nama ruang, dan pilih gedung.');
      return;
    }

    const linkedGedung = gedungList.find(g => g.id === ruangForm.gedungId);
    const luasCalculated = (Number(ruangForm.panjangMeter) || 0) * (Number(ruangForm.lebarMeter) || 0);

    if (editingRuang) {
      const updated = ruangList.map(r =>
        r.id === editingRuang.id
          ? ({
              ...r,
              ...ruangForm,
              namaGedung: linkedGedung?.namaGedung || r.namaGedung,
              luasM2: luasCalculated > 0 ? luasCalculated : ruangForm.luasM2
            } as SarprasRuang)
          : r
      );
      onSaveRuang(updated, `Mengubah data master ruang: ${ruangForm.namaRuang}`);
    } else {
      const newRuang: SarprasRuang = {
        id: `RNG-${Date.now()}`,
        kodeRuang: ruangForm.kodeRuang || `R-${ruangList.length + 1}`,
        namaRuang: ruangForm.namaRuang || 'Ruang Baru',
        gedungId: ruangForm.gedungId || '',
        namaGedung: linkedGedung?.namaGedung || '',
        lantai: Number(ruangForm.lantai) || 1,
        jenisRuang: (ruangForm.jenisRuang as SarprasRuang['jenisRuang']) || 'Ruang Kelas / Teori',
        panjangMeter: Number(ruangForm.panjangMeter) || 0,
        lebarMeter: Number(ruangForm.lebarMeter) || 0,
        luasM2: luasCalculated > 0 ? luasCalculated : Number(ruangForm.luasM2) || 0,
        kapasitasOrang: Number(ruangForm.kapasitasOrang) || 0,
        penanggungJawabRuang: ruangForm.penanggungJawabRuang,
        kondisiRuang: (ruangForm.kondisiRuang as SarprasRuang['kondisiRuang']) || 'Baik',
        keterangan: ruangForm.keterangan,
        fotoRuang: ruangForm.fotoRuang
      };
      onSaveRuang([...ruangList, newRuang], `Menambahkan master ruang baru: ${newRuang.namaRuang}`);
    }
    setIsRuangModalOpen(false);
  };

  // Photo handlers with canvas compression
  const handlePhotoUpload = async (file: File, type: 'gedung' | 'ruang') => {
    try {
      setUploadLoading(true);
      const compressedData = await compressImageFile(file, 960, 0.78);
      if (type === 'gedung') {
        setGedungForm(prev => ({ ...prev, fotoGedung: compressedData }));
      } else {
        setRuangForm(prev => ({ ...prev, fotoRuang: compressedData }));
      }
    } catch (err) {
      console.error('Error compressing photo:', err);
      alert('Gagal memproses file foto. Pastikan format JPG/PNG/WEBP.');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/20 shadow-lg">
          <div className="flex items-center gap-2.5 mb-1.5 text-indigo-400">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Gedung</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{totalGedung}</span>
            <span className="text-xs text-slate-400">Bangunan</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Total Luas: <span className="text-indigo-300 font-semibold">{totalLuasGedung.toLocaleString('id-ID')} m²</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/20 shadow-lg">
          <div className="flex items-center gap-2.5 mb-1.5 text-emerald-400">
            <DoorOpen className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Total Ruang</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{totalRuang}</span>
            <span className="text-xs text-slate-400">Ruangan</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Kondisi Baik: <span className="text-emerald-300 font-semibold">{totalRuangBaik} ruang</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/20 shadow-lg">
          <div className="flex items-center gap-2.5 mb-1.5 text-cyan-400">
            <Users className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Daya Tampung</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{totalKapasitasSiswa}</span>
            <span className="text-xs text-slate-400">Orang/Santri</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Seluruh ruang kelas & lab
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/20 shadow-lg">
          <div className="flex items-center gap-2.5 mb-1.5 text-amber-400">
            <Boxes className="w-5 h-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Aset Terhubung</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{allSarprasItems.length}</span>
            <span className="text-xs text-slate-400">Item Inventaris</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Terkatalog di ruang resmi
          </div>
        </div>
      </div>

      {/* Sub Tab Switcher & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('gedung')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'gedung'
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Master Gedung ({gedungList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ruang')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'ruang'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/40'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Master Ruang ({ruangList.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeSubTab === 'gedung' ? 'Cari gedung...' : 'Cari ruang, kode, PJ...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeSubTab === 'ruang' && (
            <select
              value={filterGedungId}
              onChange={e => setFilterGedungId(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-800/80 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="ALL">Semua Gedung</option>
              {gedungList.map(g => (
                <option key={g.id} value={g.id}>
                  {g.namaGedung}
                </option>
              ))}
            </select>
          )}

          {canEdit && (
            <button
              onClick={activeSubTab === 'gedung' ? handleOpenAddGedung : handleOpenAddRuang}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer ${
                activeSubTab === 'gedung'
                  ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{activeSubTab === 'gedung' ? 'Tambah Gedung' : 'Tambah Ruang'}</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-VIEW 1: MASTER GEDUNG */}
      {activeSubTab === 'gedung' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGedung.map(gedung => {
            const linkedRooms = ruangList.filter(r => r.gedungId === gedung.id);
            const totalLuasRuang = linkedRooms.reduce((acc, r) => acc + (Number(r.luasM2) || 0), 0);

            return (
              <div
                key={gedung.id}
                className="group relative flex flex-col rounded-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 transition-all shadow-xl overflow-hidden"
              >
                {/* Photo header or stylized banner */}
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  {gedung.fotoGedung ? (
                    <img
                      src={gedung.fotoGedung}
                      alt={gedung.namaGedung}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/60 p-4 text-center">
                      <Building2 className="w-12 h-12 text-indigo-400/40 mb-2" />
                      <span className="text-xs text-slate-500 font-mono">Foto Bangunan Belum Tersedia</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/90 text-white font-mono font-bold text-xs shadow-md">
                      {gedung.kodeGedung}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-200 border border-white/10 text-[11px] font-semibold">
                      {gedung.jumlahLantai} Lantai
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-md border ${
                        gedung.kondisi === 'Sangat Baik'
                          ? 'bg-emerald-500/90 text-white border-emerald-400/40'
                          : gedung.kondisi === 'Baik'
                          ? 'bg-teal-500/90 text-white border-teal-400/40'
                          : 'bg-amber-500/90 text-slate-950 border-amber-400/40'
                      }`}
                    >
                      {gedung.kondisi}
                    </span>
                  </div>

                  {/* Building Title Bottom Left */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight drop-shadow-md">
                      {gedung.namaGedung}
                    </h3>
                  </div>
                </div>

                {/* Building Details Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {gedung.keterangan && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {gedung.keterangan}
                      </p>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] uppercase text-slate-400 font-semibold block mb-0.5">
                          Luas Bangunan
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-white font-mono">
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{gedung.luasBangunanM2 || '-'} m²</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] uppercase text-slate-400 font-semibold block mb-0.5">
                          Tahun Dibangun
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-white font-mono">
                          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{gedung.tahunDibangun || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* PIC & Linked Rooms */}
                    <div className="text-xs space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Penanggung Jawab:</span>
                        </span>
                        <span className="font-semibold text-slate-200">
                          {gedung.penanggungJawab || 'Belum Ditentukan'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-blue-400" />
                          <span>Ruangan Terdaftar:</span>
                        </span>
                        <span className="font-bold text-indigo-300 font-mono">
                          {linkedRooms.length} Ruang ({totalLuasRuang} m²)
                        </span>
                      </div>
                    </div>

                    {/* Linked Room Chips */}
                    {linkedRooms.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                          Daftar Ruang di Gedung Ini:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {linkedRooms.slice(0, 5).map(r => (
                            <span
                              key={r.id}
                              className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 text-[10px] font-medium"
                            >
                              {r.namaRuang}
                            </span>
                          ))}
                          {linkedRooms.length > 5 && (
                            <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 text-[10px]">
                              +{linkedRooms.length - 5} lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setActiveSubTab('ruang');
                        setFilterGedungId(gedung.id);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <DoorOpen className="w-3.5 h-3.5" />
                      <span>Lihat Ruang ({linkedRooms.length})</span>
                    </button>

                    {canEdit && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditGedung(gedung)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                          title="Edit Gedung"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGedung(gedung.id, gedung.namaGedung)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Hapus Gedung"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredGedung.length === 0 && (
            <div className="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center text-slate-400">
              <Building2 className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-white">Tidak ada data master gedung yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau tambah gedung baru.</p>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: MASTER RUANG */}
      {activeSubTab === 'ruang' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRuang.map(ruang => {
            const linkedGedung = (gedungList || []).find(g => g && g.id === ruang.gedungId);
            // Count inventory assets linked to this room
            const assetsInRoom = (allSarprasItems || []).filter(
              s => s && (s.ruangId === ruang.id || s.lokasi === ruang.namaRuang)
            );

            return (
              <div
                key={ruang.id}
                className="group relative flex flex-col rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 transition-all shadow-xl overflow-hidden"
              >
                {/* Photo or Banner */}
                <div className="relative h-36 w-full bg-slate-950 overflow-hidden">
                  {ruang.fotoRuang ? (
                    <img
                      src={ruang.fotoRuang}
                      alt={ruang.namaRuang}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 p-3 text-center">
                      <DoorOpen className="w-10 h-10 text-emerald-400/30 mb-1" />
                      <span className="text-[10px] text-slate-500 font-mono">Belum ada foto ruang</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-slate-950 font-mono font-bold text-xs shadow-md">
                      {ruang.kodeRuang}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-md text-slate-200 border border-white/10 text-[10px] font-semibold">
                      Lantai {ruang.lantai}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-md border ${
                        ruang.kondisiRuang === 'Baik'
                          ? 'bg-emerald-500/90 text-white border-emerald-400/40'
                          : 'bg-amber-500/90 text-slate-950 border-amber-400/40'
                      }`}
                    >
                      {ruang.kondisiRuang}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight drop-shadow-md">
                      {ruang.namaRuang}
                    </h3>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2.5 text-xs">
                    {/* Building & Type */}
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1 text-slate-400 truncate">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{linkedGedung?.namaGedung || ruang.namaGedung || 'Gedung Sekolah'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-300 shrink-0">
                        {ruang.jenisRuang}
                      </span>
                    </div>

                    {/* Dimensions & Capacity */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                          Ukuran / Luas
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          {ruang.panjangMeter && ruang.lebarMeter
                            ? `${ruang.panjangMeter}m × ${ruang.lebarMeter}m`
                            : ''} ({ruang.luasM2 || 0} m²)
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                          Kapasitas
                        </span>
                        <span className="text-xs font-bold text-white font-mono">
                          {ruang.kapasitasOrang || 0} Santri/Orang
                        </span>
                      </div>
                    </div>

                    {/* Responsible Teacher */}
                    <div className="flex items-center justify-between text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Penanggung Jawab:</span>
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[130px]">
                        {ruang.penanggungJawabRuang || 'Belum Ditentukan'}
                      </span>
                    </div>

                    {/* Asset badge */}
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
                        <Boxes className="w-3.5 h-3.5" />
                        <span>Inventaris di Ruang Ini:</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono text-xs">
                        {assetsInRoom.length} Item
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                    {onSelectRoomForAssets ? (
                      <button
                        onClick={() => onSelectRoomForAssets(ruang.namaRuang)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Aset Ruang</span>
                      </button>
                    ) : (
                      <span />
                    )}

                    {canEdit && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditRuang(ruang)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                          title="Edit Ruang"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRuang(ruang.id, ruang.namaRuang)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Hapus Ruang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRuang.length === 0 && (
            <div className="col-span-full p-8 rounded-2xl bg-slate-900/60 border border-white/10 text-center text-slate-400">
              <DoorOpen className="w-12 h-12 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-white">Tidak ada data master ruang yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">Coba sesuaikan filter atau tambah ruang baru.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL TAMBAH/EDIT GEDUNG ================= */}
      {isGedungModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-indigo-400">
                <Building2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  {editingGedung ? 'Edit Master Gedung' : 'Tambah Master Gedung Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsGedungModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGedungSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={kodeGedungInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Kode Gedung *
                  </label>
                  <input
                    id={kodeGedungInputId}
                    type="text"
                    required
                    placeholder="Contoh: GD-UTM"
                    value={gedungForm.kodeGedung || ''}
                    onChange={e => setGedungForm({ ...gedungForm, kodeGedung: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor={namaGedungInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Gedung *
                  </label>
                  <input
                    id={namaGedungInputId}
                    type="text"
                    required
                    placeholder="Contoh: Gedung Utama Abu Bakar"
                    value={gedungForm.namaGedung || ''}
                    onChange={e => setGedungForm({ ...gedungForm, namaGedung: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor={jumlahLantaiInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Jumlah Lantai
                  </label>
                  <input
                    id={jumlahLantaiInputId}
                    type="number"
                    min="1"
                    value={gedungForm.jumlahLantai || 1}
                    onChange={e => setGedungForm({ ...gedungForm, jumlahLantai: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor={tahunDibangunInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Tahun Dibangun
                  </label>
                  <input
                    id={tahunDibangunInputId}
                    type="number"
                    value={gedungForm.tahunDibangun || ''}
                    onChange={e => setGedungForm({ ...gedungForm, tahunDibangun: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor={luasGedungInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Luas Total (m²)
                  </label>
                  <input
                    id={luasGedungInputId}
                    type="number"
                    value={gedungForm.luasBangunanM2 || ''}
                    onChange={e => setGedungForm({ ...gedungForm, luasBangunanM2: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={kondisiGedungInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Kondisi Gedung
                  </label>
                  <select
                    id={kondisiGedungInputId}
                    value={gedungForm.kondisi || 'Baik'}
                    onChange={e => setGedungForm({ ...gedungForm, kondisi: e.target.value as SarprasGedung['kondisi'] })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Sedang">Rusak Sedang</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>

                <div>
                  <label htmlFor={picGedungInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Penanggung Jawab (PJ)
                  </label>
                  <select
                    id={picGedungInputId}
                    value={gedungForm.penanggungJawab || ''}
                    onChange={e => setGedungForm({ ...gedungForm, penanggungJawab: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Pilih Guru / PJ --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.nama}>
                        {t.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Foto Gedung */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-1">
                  Foto Bangunan Gedung
                </span>
                <div className="flex items-center gap-3">
                  {gedungForm.fotoGedung ? (
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-white/20">
                      <img
                        src={gedungForm.fotoGedung}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setGedungForm({ ...gedungForm, fotoGedung: '' })}
                        className="absolute top-1 right-1 p-0.5 rounded-md bg-black/70 text-rose-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-xl border border-dashed border-white/20 bg-slate-800/60 flex items-center justify-center text-slate-500">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}

                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-semibold hover:bg-indigo-500/30 transition-all cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>{uploadLoading ? 'Memproses...' : 'Unggah / Ambil Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file, 'gedung');
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor={keteranganGedungInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                  Keterangan / Fungsi
                </label>
                <textarea
                  id={keteranganGedungInputId}
                  rows={2}
                  placeholder="Catatan fungsi fasilitas gedung..."
                  value={gedungForm.keterangan || ''}
                  onChange={e => setGedungForm({ ...gedungForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsGedungModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/25 transition-all"
                >
                  Simpan Data Gedung
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TAMBAH/EDIT RUANG ================= */}
      {isRuangModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl p-6 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-emerald-400">
                <DoorOpen className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  {editingRuang ? 'Edit Master Ruang' : 'Tambah Master Ruang Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsRuangModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRuangSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={kodeRuangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Kode Ruang *
                  </label>
                  <input
                    id={kodeRuangInputId}
                    type="text"
                    required
                    placeholder="Contoh: R-7, R-LAB"
                    value={ruangForm.kodeRuang || ''}
                    onChange={e => setRuangForm({ ...ruangForm, kodeRuang: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor={namaRuangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Ruang *
                  </label>
                  <input
                    id={namaRuangInputId}
                    type="text"
                    required
                    placeholder="Contoh: Ruang Kelas 7 Multimedia"
                    value={ruangForm.namaRuang || ''}
                    onChange={e => setRuangForm({ ...ruangForm, namaRuang: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={gedungSelectInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Lokasi Gedung *
                  </label>
                  <select
                    id={gedungSelectInputId}
                    required
                    value={ruangForm.gedungId || ''}
                    onChange={e => setRuangForm({ ...ruangForm, gedungId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Gedung --</option>
                    {gedungList.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.namaGedung}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor={lantaiRuangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                      Lantai Ke-
                    </label>
                    <input
                      id={lantaiRuangInputId}
                      type="number"
                      min="1"
                      value={ruangForm.lantai || 1}
                      onChange={e => setRuangForm({ ...ruangForm, lantai: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label htmlFor={jenisRuangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                      Jenis Ruang
                    </label>
                    <select
                      id={jenisRuangInputId}
                      value={ruangForm.jenisRuang || 'Ruang Kelas / Teori'}
                      onChange={e => setRuangForm({ ...ruangForm, jenisRuang: e.target.value as SarprasRuang['jenisRuang'] })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Ruang Kelas / Teori">Kelas Teori</option>
                      <option value="Laboratorium / Praktik">Laboratorium</option>
                      <option value="Perpustakaan">Perpustakaan</option>
                      <option value="Ruang Guru & TU">Guru & TU</option>
                      <option value="Ruang Pimpinan">Pimpinan</option>
                      <option value="Tempat Ibadah / Musholla">Ibadah / Musholla</option>
                      <option value="Ruang UKS">UKS</option>
                      <option value="Gudang / Servis">Gudang / Servis</option>
                      <option value="Lapangan / Terbuka">Lapangan</option>
                      <option value="Sanitasi / Toilet">Sanitasi / Toilet</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ukuran & Kapasitas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label htmlFor={panjangRuangInputId} className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Panjang (m)
                  </label>
                  <input
                    id={panjangRuangInputId}
                    type="number"
                    step="0.5"
                    value={ruangForm.panjangMeter || ''}
                    onChange={e => {
                      const p = Number(e.target.value);
                      const l = Number(ruangForm.lebarMeter) || 0;
                      setRuangForm({
                        ...ruangForm,
                        panjangMeter: p,
                        luasM2: p * l > 0 ? p * l : ruangForm.luasM2
                      });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor={lebarRuangInputId} className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Lebar (m)
                  </label>
                  <input
                    id={lebarRuangInputId}
                    type="number"
                    step="0.5"
                    value={ruangForm.lebarMeter || ''}
                    onChange={e => {
                      const l = Number(e.target.value);
                      const p = Number(ruangForm.panjangMeter) || 0;
                      setRuangForm({
                        ...ruangForm,
                        lebarMeter: l,
                        luasM2: p * l > 0 ? p * l : ruangForm.luasM2
                      });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor={luasRuangInputId} className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Luas (m²)
                  </label>
                  <input
                    id={luasRuangInputId}
                    type="number"
                    value={ruangForm.luasM2 || ''}
                    onChange={e => setRuangForm({ ...ruangForm, luasM2: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500 font-bold font-mono text-emerald-400"
                  />
                </div>

                <div>
                  <label htmlFor={kapasitasRuangInputId} className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Kapasitas (Org)
                  </label>
                  <input
                    id={kapasitasRuangInputId}
                    type="number"
                    value={ruangForm.kapasitasOrang || ''}
                    onChange={e => setRuangForm({ ...ruangForm, kapasitasOrang: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={picRuangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Penanggung Jawab Ruang
                  </label>
                  <select
                    id={picRuangInputId}
                    value={ruangForm.penanggungJawabRuang || ''}
                    onChange={e => setRuangForm({ ...ruangForm, penanggungJawabRuang: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Guru / Tendik --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.nama}>
                        {t.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={kondisiRuangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                    Kondisi Ruangan
                  </label>
                  <select
                    id={kondisiRuangInputId}
                    value={ruangForm.kondisiRuang || 'Baik'}
                    onChange={e => setRuangForm({ ...ruangForm, kondisiRuang: e.target.value as SarprasRuang['kondisiRuang'] })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Sedang">Rusak Sedang</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
              </div>

              {/* Foto Ruang */}
              <div>
                <span className="block text-xs font-semibold text-slate-300 mb-1">
                  Foto Ruangan
                </span>
                <div className="flex items-center gap-3">
                  {ruangForm.fotoRuang ? (
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-white/20">
                      <img
                        src={ruangForm.fotoRuang}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setRuangForm({ ...ruangForm, fotoRuang: '' })}
                        className="absolute top-1 right-1 p-0.5 rounded-md bg-black/70 text-rose-400 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-16 rounded-xl border border-dashed border-white/20 bg-slate-800/60 flex items-center justify-center text-slate-500">
                      <DoorOpen className="w-6 h-6" />
                    </div>
                  )}

                  <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold hover:bg-emerald-500/30 transition-all cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <span>{uploadLoading ? 'Memproses...' : 'Unggah / Ambil Foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file, 'ruang');
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor={keteranganRuangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan / Fasilitas Khusus
                </label>
                <textarea
                  id={keteranganRuangInputId}
                  rows={2}
                  placeholder="Contoh: Dilengkapi 32 PC, AC 2 unit, proyektor..."
                  value={ruangForm.keterangan || ''}
                  onChange={e => setRuangForm({ ...ruangForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRuangModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Simpan Data Ruang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
