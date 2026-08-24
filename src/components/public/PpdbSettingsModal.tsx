import React, { useState } from 'react';
import { PpdbSettings, PpdbGelombang, PpdbProgramUnggulan, PpdbContactPerson } from '../../types';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles,
  PhoneCall,
  FileCheck,
  AlertCircle,
  Clock,
  Layers,
  Award
} from 'lucide-react';

interface PpdbSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PpdbSettings;
  onSaveSettings: (updated: PpdbSettings) => void;
  tahunAjaranSekolah: string;
}

export const PpdbSettingsModal: React.FC<PpdbSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  tahunAjaranSekolah
}) => {
  const [activeTab, setActiveTab] = useState<'gelombang' | 'program' | 'contact' | 'syarat'>('gelombang');
  const [localSettings, setLocalSettings] = useState<PpdbSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Gelombang Form State
  const [editingGelombangId, setEditingGelombangId] = useState<string | null>(null);
  const [gelombangForm, setGelombangForm] = useState<PpdbGelombang>({
    id: '',
    nama: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    beasiswaInfo: '',
    status: 'Dibuka'
  });

  // Program Form State
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programForm, setProgramForm] = useState<PpdbProgramUnggulan>({
    id: '',
    nama: '',
    kategori: '',
    deskripsi: '',
    target: '',
    icon: 'quran'
  });

  // Contact Form State
  const [editingContactIdx, setEditingContactIdx] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<PpdbContactPerson>({
    nama: '',
    jabatan: '',
    noHp: '',
    jamLayanan: '',
    keteranganTambahan: ''
  });

  // Syarat Input State
  const [newSyaratText, setNewSyaratText] = useState('');

  if (!isOpen) return null;

  // Save changes to parent state and storage
  const handleSaveAll = () => {
    onSaveSettings(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  // --- GELOMBANG HANDLERS ---
  const handleOpenAddGelombang = () => {
    const nextNum = localSettings.gelombangList.length + 1;
    setEditingGelombangId('NEW');
    setGelombangForm({
      id: `GEL-${Date.now()}`,
      nama: `Gelombang ${nextNum}`,
      tanggalMulai: '1 Maret',
      tanggalSelesai: '30 April',
      beasiswaInfo: 'Beasiswa Khusus Pendaftar Baru',
      status: 'Dibuka'
    });
  };

  const handleEditGelombang = (g: PpdbGelombang) => {
    setEditingGelombangId(g.id);
    setGelombangForm({ ...g });
  };

  const handleSaveGelombangForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gelombangForm.nama.trim()) return;

    let updatedList: PpdbGelombang[];
    const currentList = localSettings.gelombangList || [];
    if (editingGelombangId === 'NEW') {
      updatedList = [...currentList, gelombangForm];
    } else {
      updatedList = currentList.map(g => (g.id === editingGelombangId ? gelombangForm : g));
    }
    setLocalSettings({ ...localSettings, gelombangList: updatedList });
    setEditingGelombangId(null);
  };

  const handleDeleteGelombang = (id: string) => {
    if (window.confirm('Hapus gelombang pendaftaran ini?')) {
      const updated = (localSettings.gelombangList || []).filter(g => g.id !== id);
      setLocalSettings({ ...localSettings, gelombangList: updated });
    }
  };

  // --- PROGRAM HANDLERS ---
  const handleOpenAddProgram = () => {
    setEditingProgramId('NEW');
    setProgramForm({
      id: `PROG-${Date.now()}`,
      nama: 'Kelas Unggulan Baru',
      kategori: 'Kelas Unggulan Baru',
      deskripsi: 'Deskripsi program keunggulan santri',
      target: 'Target capaian kompetensi',
      icon: 'star'
    });
  };

  const handleEditProgram = (p: PpdbProgramUnggulan) => {
    setEditingProgramId(p.id);
    setProgramForm({ ...p });
  };

  const handleSaveProgramForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.nama.trim()) return;

    const payload: PpdbProgramUnggulan = {
      ...programForm,
      kategori: programForm.kategori || programForm.nama
    };

    let updatedList: PpdbProgramUnggulan[];
    const currentList = localSettings.programList || [];
    if (editingProgramId === 'NEW') {
      updatedList = [...currentList, payload];
    } else {
      updatedList = currentList.map(p => (p.id === editingProgramId ? payload : p));
    }
    setLocalSettings({ ...localSettings, programList: updatedList });
    setEditingProgramId(null);
  };

  const handleDeleteProgram = (id: string) => {
    if (window.confirm('Hapus program unggulan ini?')) {
      const updated = (localSettings.programList || []).filter(p => p.id !== id);
      setLocalSettings({ ...localSettings, programList: updated });
    }
  };

  // --- CONTACT PERSON HANDLERS ---
  const handleOpenAddContact = () => {
    setEditingContactIdx(-1);
    setContactForm({
      nama: '',
      jabatan: 'Humas PPDB',
      noHp: '',
      jamLayanan: '08.00 - 15.00 WIB',
      keteranganTambahan: 'Layanan informasi pendaftaran'
    });
  };

  const handleEditContact = (c: PpdbContactPerson, idx: number) => {
    setEditingContactIdx(idx);
    setContactForm({ ...c });
  };

  const handleSaveContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.nama.trim() || !contactForm.noHp.trim()) return;

    let updatedList: PpdbContactPerson[];
    const currentList = localSettings.contactList || [];
    if (editingContactIdx === -1) {
      updatedList = [...currentList, contactForm];
    } else {
      updatedList = currentList.map((c, idx) => (idx === editingContactIdx ? contactForm : c));
    }
    setLocalSettings({ ...localSettings, contactList: updatedList });
    setEditingContactIdx(null);
  };

  const handleDeleteContact = (idx: number) => {
    if (window.confirm('Hapus kontak person ini?')) {
      const updated = localSettings.contactList.filter((_, i) => i !== idx);
      setLocalSettings({ ...localSettings, contactList: updated });
    }
  };

  // --- SYARAT HANDLERS ---
  const handleAddSyarat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSyaratText.trim()) return;
    const currentList = localSettings.syaratPendaftaran || [];
    setLocalSettings({
      ...localSettings,
      syaratPendaftaran: [...currentList, newSyaratText.trim()]
    });
    setNewSyaratText('');
  };

  const handleDeleteSyarat = (index: number) => {
    const currentList = localSettings.syaratPendaftaran || [];
    setLocalSettings({
      ...localSettings,
      syaratPendaftaran: currentList.filter((_, idx) => idx !== index)
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-3xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                Kelola Informasi & Pengaturan PPDB
              </h3>
              <p className="text-xs text-slate-400">
                Tahun Ajaran Tersinkronisasi: <span className="text-emerald-300 font-semibold font-mono">{tahunAjaranSekolah}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950/40 px-4 sm:px-6 pt-3 gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('gelombang')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'gelombang'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Gelombang Pendaftaran ({localSettings.gelombangList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('program')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'program'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Program Unggulan ({localSettings.programList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Person ({localSettings.contactList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('syarat')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'syarat'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Syarat Berkas ({localSettings.syaratPendaftaran?.length || 0})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: GELOMBANG */}
          {activeTab === 'gelombang' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Daftar Gelombang PPDB</h4>
                  <p className="text-xs text-slate-400">Atur periode tanggal pendaftaran, info beasiswa, dan status buka/tutup.</p>
                </div>
                {!editingGelombangId && (
                  <button
                    type="button"
                    onClick={handleOpenAddGelombang}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Gelombang</span>
                  </button>
                )}
              </div>

              {/* Form Add / Edit Gelombang */}
              {editingGelombangId && (
                <form onSubmit={handleSaveGelombangForm} className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-emerald-300">
                      {editingGelombangId === 'NEW' ? '➕ Tambah Gelombang Baru' : '✏️ Edit Gelombang'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingGelombangId(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">Nama Gelombang *</label>
                      <input
                        type="text"
                        value={gelombangForm.nama}
                        onChange={(e) => setGelombangForm({ ...gelombangForm, nama: e.target.value })}
                        required
                        placeholder="Contoh: Gelombang 1 (Inden & Beasiswa)"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Tanggal Mulai *</label>
                      <input
                        type="text"
                        value={gelombangForm.tanggalMulai}
                        onChange={(e) => setGelombangForm({ ...gelombangForm, tanggalMulai: e.target.value })}
                        required
                        placeholder="Contoh: 1 Nopember"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Tanggal Selesai *</label>
                      <input
                        type="text"
                        value={gelombangForm.tanggalSelesai}
                        onChange={(e) => setGelombangForm({ ...gelombangForm, tanggalSelesai: e.target.value })}
                        required
                        placeholder="Contoh: 28 Februari"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">Info Beasiswa / Potongan Biaya</label>
                      <input
                        type="text"
                        value={gelombangForm.beasiswaInfo}
                        onChange={(e) => setGelombangForm({ ...gelombangForm, beasiswaInfo: e.target.value })}
                        placeholder="Contoh: Beasiswa Potongan Infaq Rp 1.500.000"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Status Gelombang</label>
                      <select
                        value={gelombangForm.status}
                        onChange={(e) => setGelombangForm({ ...gelombangForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Dibuka">Dibuka (Aktif)</option>
                        <option value="Segera">Segera (Coming Soon)</option>
                        <option value="Ditutup">Ditutup</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingGelombangId(null)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold shadow"
                    >
                      Simpan Gelombang
                    </button>
                  </div>
                </form>
              )}

              {/* List Gelombang Cards */}
              <div className="grid grid-cols-1 gap-3">
                {(localSettings?.gelombangList || []).map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-white text-sm">{g.nama}</h5>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            g.status === 'Dibuka'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                              : g.status === 'Segera'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                          }`}
                        >
                          {g.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Periode: <strong className="text-white">{g.tanggalMulai} - {g.tanggalSelesai}</strong>
                      </p>
                      {g.beasiswaInfo && (
                        <p className="text-xs text-emerald-400 font-medium">
                          🎁 {g.beasiswaInfo}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditGelombang(g)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-xl border border-white/10"
                        title="Edit Gelombang"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGelombang(g.id)}
                        className="p-2 bg-slate-800 hover:bg-rose-900/50 text-rose-300 rounded-xl border border-white/10"
                        title="Hapus Gelombang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PROGRAM UNGGULAN */}
          {activeTab === 'program' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Program & Pilihan Kelas</h4>
                  <p className="text-xs text-slate-400">Program yang didaftarkan di sini otomatis menjadi opsi pilihan pada formulir PPDB.</p>
                </div>
                {!editingProgramId && (
                  <button
                    type="button"
                    onClick={handleOpenAddProgram}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Program</span>
                  </button>
                )}
              </div>

              {/* Form Add / Edit Program */}
              {editingProgramId && (
                <form onSubmit={handleSaveProgramForm} className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-emerald-300">
                      {editingProgramId === 'NEW' ? '➕ Tambah Program Unggulan' : '✏️ Edit Program'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingProgramId(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Nama Program *</label>
                      <input
                        type="text"
                        value={programForm.nama}
                        onChange={(e) => setProgramForm({ ...programForm, nama: e.target.value })}
                        required
                        placeholder="Contoh: Program Tahfidz Unggulan"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Label Opsi Formulir (Kategori) *</label>
                      <input
                        type="text"
                        value={programForm.kategori}
                        onChange={(e) => setProgramForm({ ...programForm, kategori: e.target.value })}
                        required
                        placeholder="Contoh: Tahfidz Al-Qur'an"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi Singkat Keunggulan *</label>
                      <textarea
                        value={programForm.deskripsi}
                        onChange={(e) => setProgramForm({ ...programForm, deskripsi: e.target.value })}
                        required
                        rows={2}
                        placeholder="Target hafalan, kurikulum bahasa, atau laboratorium..."
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Target Capaian Santri</label>
                      <input
                        type="text"
                        value={programForm.target || ''}
                        onChange={(e) => setProgramForm({ ...programForm, target: e.target.value })}
                        placeholder="Contoh: 3-5 Juz & Sanad Matan"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Icon Representasi</label>
                      <select
                        value={programForm.icon || 'quran'}
                        onChange={(e) => setProgramForm({ ...programForm, icon: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="quran">☪ Quran / Keagamaan</option>
                        <option value="globe">🌐 Globe / Bahasa Internasional</option>
                        <option value="star">★ Star / Prestasi & Sains</option>
                        <option value="trophy">🏆 Trophy / Kejuaraan</option>
                        <option value="building">🏢 Gedung / Fasilitas Modern</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProgramId(null)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold shadow"
                    >
                      Simpan Program
                    </button>
                  </div>
                </form>
              )}

              {/* List Program Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(localSettings?.programList || []).map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col justify-between gap-3 hover:border-white/20 transition-all"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300 font-mono">
                          {p.kategori}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditProgram(p)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg"
                            title="Edit Program"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProgram(p.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-300 rounded-lg"
                            title="Hapus Program"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h5 className="font-bold text-white text-sm font-serif">{p.nama}</h5>
                      <p className="text-xs text-slate-300 leading-relaxed">{p.deskripsi}</p>
                      {p.target && (
                        <p className="text-[11px] text-amber-300 font-medium">🎯 Target: {p.target}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT PERSON */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Narahubung & Panitia PPDB</h4>
                  <p className="text-xs text-slate-400">Kontak yang tampil pada brosur website dan link konfirmasi WhatsApp pendaftar.</p>
                </div>
                {editingContactIdx === null && (
                  <button
                    type="button"
                    onClick={handleOpenAddContact}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Kontak</span>
                  </button>
                )}
              </div>

              {/* Form Add / Edit Contact */}
              {editingContactIdx !== null && (
                <form onSubmit={handleSaveContactForm} className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-emerald-300">
                      {editingContactIdx === -1 ? '➕ Tambah Kontak Panitia' : '✏️ Edit Kontak Panitia'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingContactIdx(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Nama Petugas / Panitia *</label>
                      <input
                        type="text"
                        value={contactForm.nama}
                        onChange={(e) => setContactForm({ ...contactForm, nama: e.target.value })}
                        required
                        placeholder="Contoh: Ustadz Faisal Rahman"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Jabatan / Peran *</label>
                      <input
                        type="text"
                        value={contactForm.jabatan}
                        onChange={(e) => setContactForm({ ...contactForm, jabatan: e.target.value })}
                        required
                        placeholder="Contoh: Humas PPDB / Sekretariat"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Nomor WhatsApp / HP *</label>
                      <input
                        type="tel"
                        value={contactForm.noHp}
                        onChange={(e) => setContactForm({ ...contactForm, noHp: e.target.value })}
                        required
                        placeholder="Contoh: 0812-3456-7807"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Jam Layanan</label>
                      <input
                        type="text"
                        value={contactForm.jamLayanan}
                        onChange={(e) => setContactForm({ ...contactForm, jamLayanan: e.target.value })}
                        placeholder="Contoh: 07.30 - 15.00 WIB (Senin - Sabtu)"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1">Keterangan Layanan</label>
                      <input
                        type="text"
                        value={contactForm.keteranganTambahan || ''}
                        onChange={(e) => setContactForm({ ...contactForm, keteranganTambahan: e.target.value })}
                        placeholder="Contoh: Layanan konsultasi program, infaq, dan asrama santri"
                        className="w-full px-3 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingContactIdx(null)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold shadow"
                    >
                      Simpan Kontak
                    </button>
                  </div>
                </form>
              )}

              {/* List Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(localSettings?.contactList || []).map((c, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-col justify-between gap-3 hover:border-white/20 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">{c.jabatan}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditContact(c, idx)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg"
                            title="Edit Kontak"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContact(idx)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-300 rounded-lg"
                            title="Hapus Kontak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h5 className="font-bold text-white text-sm font-serif">{c.nama}</h5>
                      <p className="text-xs font-mono font-bold text-emerald-400">{c.noHp}</p>
                      <p className="text-[11px] text-slate-400">⏰ {c.jamLayanan}</p>
                      {c.keteranganTambahan && (
                        <p className="text-[11px] text-slate-300 italic">{c.keteranganTambahan}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SYARAT PENDAFTARAN */}
          {activeTab === 'syarat' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Syarat Dokumen Pendaftaran</h4>
                <p className="text-xs text-slate-400">Daftar dokumen fisik/digital yang harus disiapkan oleh calon wali santri.</p>
              </div>

              <form onSubmit={handleAddSyarat} className="flex gap-2">
                <input
                  type="text"
                  value={newSyaratText}
                  onChange={(e) => setNewSyaratText(e.target.value)}
                  placeholder="Tambahkan syarat berkas baru..."
                  className="flex-1 px-3.5 py-2 bg-white text-slate-900 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </form>

              <div className="space-y-2">
                {(localSettings.syaratPendaftaran || []).map((syarat, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-200">{syarat}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSyarat(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Pengaturan PPDB Berhasil Disimpan!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 border border-emerald-300/50"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan PPDB</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
