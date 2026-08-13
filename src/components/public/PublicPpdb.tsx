import React, { useState } from 'react';
import { PpdbRegistration, SchoolInfo, UserSession, Student } from '../../types';
import {
  UserPlus,
  CheckCircle,
  Search,
  Clock,
  Check,
  X,
  FileText,
  AlertCircle,
  Download,
  PhoneCall,
  UserCheck,
  GraduationCap,
  Sparkles,
  BookOpen,
  Send,
  Calendar,
  Building,
  ChevronRight,
  Filter,
  Trash2,
  ShieldAlert,
  MessageSquare
} from 'lucide-react';
import { exportToCSV } from '../../services/storage';
import { WAService } from '../../services/whatsappService';

interface PublicPpdbProps {
  registrations: PpdbRegistration[];
  schoolInfo: SchoolInfo;
  session: UserSession;
  onSaveRegistrations: (data: PpdbRegistration[]) => void;
  onAddStudentFromPpdb?: (newStudent: Omit<Student, 'id' | 'nis'>) => void;
}

export const PublicPpdb: React.FC<PublicPpdbProps> = ({
  registrations,
  schoolInfo,
  session,
  onSaveRegistrations,
  onAddStudentFromPpdb
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'form' | 'cek' | 'admin'>(
    session.role === 'admin' || session.role === 'guru' ? 'admin' : 'form'
  );

  // Form State
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nisn: '',
    jenisKelamin: 'L' as 'L' | 'P',
    tempatLahir: '',
    tanggalLahir: '',
    asalSekolah: '',
    namaOrangTua: '',
    noHpOrtu: '',
    alamat: '',
    pilihanKelas: 'Tahfidz Al-Qur\'an' as 'Tahfidz Al-Qur\'an' | 'Bilingual / Bahasa' | 'Reguler & Sains'
  });

  const [submittedReceipt, setSubmittedReceipt] = useState<PpdbRegistration | null>(null);

  // Search State for Cek Status
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PpdbRegistration[] | null>(null);

  // Admin Filter & Note Edit State
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('Semua');
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedRegForAction, setSelectedRegForAction] = useState<PpdbRegistration | null>(null);
  const [editNote, setEditNote] = useState('');

  // Handle Form Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Submit PPDB Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const count = registrations.length + 1;
    const newId = `PPDB-2025-${String(count).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newRegistration: PpdbRegistration = {
      id: newId,
      namaLengkap: formData.namaLengkap,
      nisn: formData.nisn || undefined,
      jenisKelamin: formData.jenisKelamin,
      tempatLahir: formData.tempatLahir,
      tanggalLahir: formData.tanggalLahir,
      asalSekolah: formData.asalSekolah,
      namaOrangTua: formData.namaOrangTua,
      noHpOrtu: formData.noHpOrtu,
      alamat: formData.alamat,
      pilihanKelas: formData.pilihanKelas,
      tanggalDaftar: today,
      status: 'Menunggu Verifikasi',
      catatan: 'Formulir berhasil terdaftar di sistem. Silakan konfirmasi berkas melalui Panitia PPDB.'
    };

    const updated = [newRegistration, ...registrations];
    onSaveRegistrations(updated);
    setSubmittedReceipt(newRegistration);

    // Reset Form
    setFormData({
      namaLengkap: '',
      nisn: '',
      jenisKelamin: 'L',
      tempatLahir: '',
      tanggalLahir: '',
      asalSekolah: '',
      namaOrangTua: '',
      noHpOrtu: '',
      alamat: '',
      pilihanKelas: 'Tahfidz Al-Qur\'an'
    });
  };

  // Search for Cek Status
  const handleSearchStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const res = registrations.filter(
      r =>
        r.id.toLowerCase().includes(q) ||
        r.namaLengkap.toLowerCase().includes(q) ||
        r.noHpOrtu.includes(q) ||
        (r.nisn && r.nisn.includes(q))
    );

    setSearchResult(res);
  };

  // Admin Update Status
  const handleUpdateStatus = (id: string, newStatus: PpdbRegistration['status'], customNote?: string) => {
    const updated = registrations.map(r => {
      if (r.id === id) {
        return {
          ...r,
          status: newStatus,
          catatan: customNote !== undefined ? customNote : r.catatan
        };
      }
      return r;
    });
    onSaveRegistrations(updated);
    if (selectedRegForAction && selectedRegForAction.id === id) {
      setSelectedRegForAction({
        ...selectedRegForAction,
        status: newStatus,
        catatan: customNote !== undefined ? customNote : selectedRegForAction.catatan
      });
    }
  };

  // Delete registration
  const handleDeleteRegistration = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data pendaftaran ini?')) {
      const updated = registrations.filter(r => r.id !== id);
      onSaveRegistrations(updated);
      setSelectedRegForAction(null);
    }
  };

  // Convert to Master Student
  const handleConvertToStudent = (reg: PpdbRegistration) => {
    if (!onAddStudentFromPpdb) return;

    if (window.confirm(`Konfirmasi masukkan ${reg.namaLengkap} ke Data Siswa Master (Kelas 7)?`)) {
      onAddStudentFromPpdb({
        nisn: reg.nisn || `009${Math.floor(1000000 + Math.random() * 9000000)}`,
        nama: reg.namaLengkap,
        gender: reg.jenisKelamin,
        kelas: '7A',
        tempatLahir: reg.tempatLahir,
        tanggalLahir: reg.tanggalLahir,
        namaOrangTua: reg.namaOrangTua,
        noHpOrangTua: reg.noHpOrtu,
        alamat: reg.alamat,
        status: 'Aktif'
      });

      handleUpdateStatus(reg.id, 'Diterima', 'Siswa telah resmi terdaftar di Data Siswa Master Kelas 7A.');
      alert(`${reg.namaLengkap} berhasil dimasukkan ke Master Data Siswa!`);
    }
  };

  // Admin filtered list
  const adminFilteredList = registrations.filter(r => {
    const matchesStatus = adminStatusFilter === 'Semua' || r.status === adminStatusFilter;
    const matchesSearch =
      r.namaLengkap.toLowerCase().includes(adminSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(adminSearch.toLowerCase()) ||
      r.asalSekolah.toLowerCase().includes(adminSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: PpdbRegistration['status']) => {
    switch (status) {
      case 'Diterima':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-1 rounded-full text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Diterima</span>
          </span>
        );
      case 'Lulus Berkas':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 border border-blue-400/40 px-2.5 py-1 rounded-full text-xs font-bold">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Lulus Berkas</span>
          </span>
        );
      case 'Ditolak':
        return (
          <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2.5 py-1 rounded-full text-xs font-bold">
            <X className="w-3.5 h-3.5 text-rose-400" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Menunggu Verifikasi</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner & Information Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-3xl p-6 md:p-8 border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        
        {/* Background Accent Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Penerimaan Peserta Didik Baru (PPDB) TA 2025/2026</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-serif text-white tracking-tight">
              Pendaftaran Siswa Baru {schoolInfo.nama}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Membuka pendaftaran peserta didik baru berkarakter Qur'ani, berakhlak mulia, dan berwawasan sains & teknologi. Daftar secara online dengan cepat dan praktis.
            </p>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 shrink-0 text-center sm:text-right space-y-1">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Gelombang 1 (Inden)</div>
            <div className="text-sm font-extrabold text-white font-serif">1 Nopember - 28 Februari</div>
            <div className="text-[10px] text-emerald-400 font-semibold">Beasiswa Potongan Infaq Rp 1.500.000</div>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0 overflow-hidden">
              {schoolInfo.logoUrl ? (
                <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-cover" />
              ) : (
                "☪"
              )}
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Program Tahfidz Unggulan</h4>
              <p className="text-[11px] text-slate-400">Target Hafalan 3-5 Juz & Sanad</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Kelas Bilingual & Sains</h4>
              <p className="text-[11px] text-slate-400">Bahasa Arab, Inggris, & Coding</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold shrink-0">
              <GraduationCap className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Gedung & Lab Modern</h4>
              <p className="text-[11px] text-slate-400">AC, Smart TV, Lab Komp & IPA</p>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveSubTab('form')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'form'
              ? 'bg-emerald-500 text-slate-950 shadow-lg border border-emerald-400'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Formulir Pendaftaran Online</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cek')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeSubTab === 'cek'
              ? 'bg-emerald-500 text-slate-950 shadow-lg border border-emerald-400'
              : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Cek Status Pendaftaran</span>
        </button>

        {(session.role === 'admin' || session.role === 'guru') && (
          <button
            onClick={() => setActiveSubTab('admin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'admin'
                ? 'bg-amber-400 text-slate-950 shadow-lg border border-amber-300'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Panel Admin PPDB ({registrations.length})</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: FORMULIR PENDAFTARAN ONLINE */}
      {activeSubTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Registration Form */}
          <div className="lg:col-span-8 glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-serif text-white">
                  Formulir Pendaftaran Murid Baru
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Isi data calon murid secara benar dan teliti sesuai ijazah/akta kelahiran
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-400/30">
                TA 2025/2026
              </span>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              {/* Program Pilihan Kelas */}
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-1.5">
                  Pilihan Program / Kelas Unggulan *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Tahfidz Al-Qur\'an', desc: 'Fokus Hafalan Qur\'an & Bahasa Arab' },
                    { id: 'Bilingual / Bahasa', desc: 'Penguasaan B. Inggris & B. Arab' },
                    { id: 'Reguler & Sains', desc: 'Kurikulum Merdeka & Sains Terpadu' }
                  ].map(prog => (
                    <label
                      key={prog.id}
                      className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                        formData.pilihanKelas === prog.id
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md'
                          : 'bg-slate-950/50 border-white/10 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pilihanKelas"
                        value={prog.id}
                        checked={formData.pilihanKelas === prog.id}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="text-xs font-bold block text-emerald-300">{prog.id}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{prog.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Calon Siswa */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-white/5 pb-1">
                  1. Data Diri Calon Siswa
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap Calon Siswa *</label>
                    <input
                      type="text"
                      name="namaLengkap"
                      value={formData.namaLengkap}
                      onChange={handleInputChange}
                      required
                      placeholder="Sesuai Akta Birth / Ijazah SD"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">NISN (Nomor Induk Siswa Nasional)</label>
                    <input
                      type="text"
                      name="nisn"
                      value={formData.nisn}
                      onChange={handleInputChange}
                      placeholder="10 digit angka NISN (opsional)"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Jenis Kelamin *</label>
                    <select
                      name="jenisKelamin"
                      value={formData.jenisKelamin}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="L">Laki-laki (Putra)</option>
                      <option value="P">Perempuan (Putri)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Tempat Lahir *</label>
                    <input
                      type="text"
                      name="tempatLahir"
                      value={formData.tempatLahir}
                      onChange={handleInputChange}
                      required
                      placeholder="Kota Lahir"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Tanggal Lahir *</label>
                    <input
                      type="date"
                      name="tanggalLahir"
                      value={formData.tanggalLahir}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Asal SD / MI *</label>
                    <input
                      type="text"
                      name="asalSekolah"
                      value={formData.asalSekolah}
                      onChange={handleInputChange}
                      required
                      placeholder="Contoh: SD Islam Terpadu Al-Uswah / SDN Gayungan 1"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b border-white/5 pb-1">
                  2. Data Orang Tua / Wali & Kontak
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nama Orang Tua / Wali *</label>
                    <input
                      type="text"
                      name="namaOrangTua"
                      value={formData.namaOrangTua}
                      onChange={handleInputChange}
                      required
                      placeholder="Nama Ayah / Ibu"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nomor WhatsApp / HP *</label>
                    <input
                      type="tel"
                      name="noHpOrtu"
                      value={formData.noHpOrtu}
                      onChange={handleInputChange}
                      required
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Alamat Lengkap *</label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      placeholder="Jalan, RT/RW, Kelurahan, Kecamatan, Kota"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-8 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-300/50"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Formulir Pendaftaran PPDB</span>
                </button>
              </div>

            </form>
          </div>

          {/* Side Info Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Alur Pendaftaran */}
            <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
              <h3 className="text-sm font-bold font-serif text-white border-b border-white/10 pb-2">
                Alur Pendaftaran PPDB
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Isi Formulir Online</h5>
                    <p className="text-slate-400 text-[11px]">Lengkapi data diri calon santri dan kontak orang tua pada form online ini.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Dapatkan Nomor PPDB</h5>
                    <p className="text-slate-400 text-[11px]">Simpan Nomor Pendaftaran (contoh: PPDB-2025-001) sebagai bukti resmi.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Tes Pemetaan & Wawancara</h5>
                    <p className="text-slate-400 text-[11px]">Tes membaca Al-Qur'an, potensi akademik, dan wawancara komitmen wali murid.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Pengumuman & Daftar Ulang</h5>
                    <p className="text-slate-400 text-[11px]">Cek status kelulusan di menu "Cek Status Pendaftaran" dan lakukan daftar ulang.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kontak Panitia PPDB */}
            <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-emerald-500/30 shadow-xl space-y-3">
              <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Layanan Informasi Panitia PPDB</span>
              </h3>
              <p className="text-xs text-slate-300">
                Membutuhkan informasi lebih lanjut mengenai rincian biaya infaq, beasiswa, atau asrama?
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-white/10 text-xs space-y-1">
                <p className="text-slate-200"><strong>Ustadz Faisal Rahman (Humas PPDB):</strong></p>
                <p className="text-emerald-400 font-mono font-bold">0812-3456-7807 (WhatsApp/Telp)</p>
                <p className="text-slate-400 text-[11px]">Jam Kerja: 07.30 - 15.00 WIB (Senin - Sabtu)</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUB-TAB 2: CEK STATUS PENDAFTARAN */}
      {activeSubTab === 'cek' && (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="max-w-xl mx-auto text-center space-y-2">
            <h3 className="text-xl font-bold font-serif text-white">
              Cek Status Hasil Seleksi PPDB
            </h3>
            <p className="text-xs text-slate-300">
              Masukkan Nomor Pendaftaran (misal: PPDB-2025-001), Nama Calon Siswa, atau Nomor WhatsApp Orang Tua
            </p>

            <form onSubmit={handleSearchStatus} className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No Pendaftaran / Nama / No HP..."
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl shadow transition-all flex items-center gap-2 shrink-0 border border-emerald-300/50"
              >
                <Search className="w-4 h-4" />
                <span>Cari Status</span>
              </button>
            </form>
          </div>

          {/* Search Results Display */}
          {searchResult && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Hasil Pencarian ({searchResult.length} Data Ditemukan)
              </h4>

              {searchResult.length === 0 ? (
                <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/10 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-white">Data Pendaftaran Tidak Ditemukan</p>
                  <p className="text-xs text-slate-400">Pastikan nomor pendaftaran atau nama yang Anda ketikkan sudah benar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResult.map(r => (
                    <div key={r.id} className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 shadow-lg space-y-3">
                      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-emerald-400">{r.id}</span>
                          <h4 className="text-base font-bold text-white font-serif mt-0.5">{r.namaLengkap}</h4>
                          <p className="text-xs text-slate-300">Asal SD/MI: {r.asalSekolah}</p>
                        </div>
                        <div>{getStatusBadge(r.status)}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                        <div><strong>Program:</strong> {r.pilihanKelas}</div>
                        <div><strong>Wali:</strong> {r.namaOrangTua}</div>
                        <div><strong>Tgl Daftar:</strong> {r.tanggalDaftar}</div>
                        <div><strong>Kontak:</strong> {r.noHpOrtu}</div>
                      </div>

                      {r.catatan && (
                        <div className="bg-slate-900 p-3 rounded-xl border border-white/5 text-xs text-slate-200">
                          <strong className="text-emerald-300 block mb-0.5">Catatan Panitia PPDB:</strong>
                          <span>{r.catatan}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: PANEL ADMIN PPDB (Admin/Guru) */}
      {activeSubTab === 'admin' && (session.role === 'admin' || session.role === 'guru') && (
        <div className="space-y-6">
          
          {/* Admin Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-white/10">
              <span className="text-2xl font-black text-white font-serif">{registrations.length}</span>
              <span className="block text-xs text-slate-400 mt-1 font-semibold">Total Pendaftar PPDB</span>
            </div>
            <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/30">
              <span className="text-2xl font-black text-emerald-300 font-serif">
                {registrations.filter(r => r.status === 'Diterima').length}
              </span>
              <span className="block text-xs text-emerald-400 mt-1 font-semibold">Siswa Diterima</span>
            </div>
            <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-blue-500/30">
              <span className="text-2xl font-black text-blue-300 font-serif">
                {registrations.filter(r => r.status === 'Lulus Berkas').length}
              </span>
              <span className="block text-xs text-blue-400 mt-1 font-semibold">Lulus Berkas</span>
            </div>
            <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-amber-500/30">
              <span className="text-2xl font-black text-amber-300 font-serif">
                {registrations.filter(r => r.status === 'Menunggu Verifikasi').length}
              </span>
              <span className="block text-xs text-amber-400 mt-1 font-semibold">Menunggu Verifikasi</span>
            </div>
          </div>

          {/* Admin Table Controls */}
          <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Cari nama, No PPDB, atau sekolah asal..."
                  className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
                />

                <select
                  value={adminStatusFilter}
                  onChange={(e) => setAdminStatusFilter(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Lulus Berkas">Lulus Berkas</option>
                  <option value="Diterima">Diterima</option>
                  <option value="Ditolak">Ditolak</option>
                </select>
              </div>

              <button
                onClick={() => exportToCSV('Data_Pendaftar_PPDB_AlQomar.csv', registrations)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-2 shrink-0 border border-emerald-300/50"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Data PPDB</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-300 font-bold border-b border-white/10">
                    <th className="p-3">No. PPDB</th>
                    <th className="p-3">Nama Calon Siswa</th>
                    <th className="p-3">L/P</th>
                    <th className="p-3">Asal SD/MI</th>
                    <th className="p-3">Program</th>
                    <th className="p-3">Orang Tua / HP</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {adminFilteredList.map(reg => (
                    <tr key={reg.id} className="hover:bg-white/5 transition-colors text-slate-200">
                      <td className="p-3 font-mono font-bold text-emerald-400">{reg.id}</td>
                      <td className="p-3 font-bold text-white">{reg.namaLengkap}</td>
                      <td className="p-3">{reg.jenisKelamin}</td>
                      <td className="p-3 text-slate-300">{reg.asalSekolah}</td>
                      <td className="p-3 font-semibold text-emerald-300">{reg.pilihanKelas}</td>
                      <td className="p-3">
                        <div>{reg.namaOrangTua}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{reg.noHpOrtu}</div>
                      </td>
                      <td className="p-3">{getStatusBadge(reg.status)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedRegForAction(reg);
                            setEditNote(reg.catatan || '');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg border border-white/10 font-bold text-[11px]"
                        >
                          Kelola & Verifikasi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL 1: BUKTI FORMULIR SUBMITTED RECEIPT */}
      {submittedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-300 space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-black">
                ✓
              </div>
              <h3 className="text-xl font-bold font-serif text-slate-900">
                Pendaftaran PPDB Berhasil!
              </h3>
              <p className="text-xs text-slate-600">
                Simpan bukti pendaftaran berikut untuk pengecekan status dan verifikasi fisik berkas.
              </p>
            </div>

            {/* Printable Receipt Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 text-xs space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase">Nomor Pendaftaran</span>
                <span className="font-mono font-black text-emerald-700 text-base">{submittedReceipt.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div><strong>Nama Siswa:</strong> {submittedReceipt.namaLengkap}</div>
                <div><strong>Jenis Kelamin:</strong> {submittedReceipt.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                <div><strong>Asal Sekolah:</strong> {submittedReceipt.asalSekolah}</div>
                <div><strong>Program:</strong> {submittedReceipt.pilihanKelas}</div>
                <div><strong>Orang Tua:</strong> {submittedReceipt.namaOrangTua}</div>
                <div><strong>No. HP/WA:</strong> {submittedReceipt.noHpOrtu}</div>
              </div>

              <div className="border-t pt-2 mt-2 text-[11px] text-slate-500 text-center font-mono">
                SMP Islam Al Qomar • Pendaftaran Tanggal {submittedReceipt.tanggalDaftar}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/6281234567807?text=Assalamu'alaikum%20Panitia%20PPDB%20SMP%20Islam%20Al%20Qomar,%20saya%20sudah%20mendaftar%20online%20dengan%20No%20Pendaftaran:%20${submittedReceipt.id}%20atas%20nama%20${encodeURIComponent(submittedReceipt.namaLengkap)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl text-center shadow flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Konfirmasi via WhatsApp</span>
              </a>

              <button
                onClick={() => setSubmittedReceipt(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs py-3 px-5 rounded-xl"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ADMIN KELOLA REGISTRASI */}
      {selectedRegForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass backdrop-blur-xl bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">{selectedRegForAction.id}</span>
                <h3 className="text-base font-bold font-serif text-white">{selectedRegForAction.namaLengkap}</h3>
              </div>
              <button
                onClick={() => setSelectedRegForAction(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Details */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
              <p><strong>Asal Sekolah:</strong> {selectedRegForAction.asalSekolah}</p>
              <p><strong>Program Pilihan:</strong> {selectedRegForAction.pilihanKelas}</p>
              <p><strong>Orang Tua:</strong> {selectedRegForAction.namaOrangTua} ({selectedRegForAction.noHpOrtu})</p>
              <p><strong>Alamat:</strong> {selectedRegForAction.alamat}</p>
            </div>

            {/* Change Status Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Ubah Status Kelulusan PPDB:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedRegForAction.id, 'Lulus Berkas', editNote)}
                  className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs py-2 px-3 rounded-xl border border-blue-400/30"
                >
                  ✓ Set Lulus Berkas
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedRegForAction.id, 'Diterima', editNote)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs py-2 px-3 rounded-xl border border-emerald-400/30"
                >
                  ★ Set Diterima
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedRegForAction.id, 'Menunggu Verifikasi', editNote)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs py-2 px-3 rounded-xl border border-amber-400/30"
                >
                  ⏳ Set Menunggu
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedRegForAction.id, 'Ditolak', editNote)}
                  className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs py-2 px-3 rounded-xl border border-rose-400/30"
                >
                  ✕ Set Ditolak
                </button>
              </div>
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Catatan Panitia PPDB:</label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={2}
                placeholder="Catatan untuk pendaftar..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center justify-between mt-1">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedRegForAction.id, selectedRegForAction.status, editNote)}
                  className="text-xs text-emerald-400 font-bold hover:underline"
                >
                  Simpan Catatan
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const msg = WAService.createPpdbStatusUpdateMessage({
                      namaLengkap: selectedRegForAction.namaLengkap,
                      idPendaftaran: selectedRegForAction.id,
                      status: selectedRegForAction.status,
                      catatan: editNote || selectedRegForAction.catatan,
                      schoolName: schoolInfo.nama
                    });
                    WAService.sendWA(selectedRegForAction.noHpOrtu, msg, selectedRegForAction.namaOrangTua, 'PPDB_STATUS');
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim WA Notifikasi Status ke Ortu</span>
                </button>
              </div>
            </div>

            {/* Import to Master Data Siswa */}
            {onAddStudentFromPpdb && (
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleConvertToStudent(selectedRegForAction)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Masukkan ke Data Siswa Master</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteRegistration(selectedRegForAction.id)}
                  className="text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
