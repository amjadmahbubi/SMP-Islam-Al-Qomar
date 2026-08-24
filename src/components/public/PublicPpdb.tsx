import React, { useState } from 'react';
import { PpdbRegistration, SchoolInfo, UserSession, Student, PpdbSettings } from '../../types';
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
  MessageSquare,
  Settings,
  Printer,
  Users,
  Award,
  Globe,
  Home,
  CheckCircle2
} from 'lucide-react';
import { exportToCSV, StorageService } from '../../services/storage';
import { WAService } from '../../services/whatsappService';
import { PpdbSettingsModal } from './PpdbSettingsModal';

interface PublicPpdbProps {
  registrations: PpdbRegistration[];
  schoolInfo: SchoolInfo;
  session: UserSession;
  onSaveRegistrations: (data: PpdbRegistration[]) => void;
  onAddStudentFromPpdb?: (newStudent: Omit<Student, 'id' | 'nis'>) => void;
  settings?: PpdbSettings;
  onSaveSettings?: (settings: PpdbSettings) => void;
}

const PEKERJAAN_OPTIONS = [
  'PNS / TNI / POLRI',
  'Karyawan Swasta',
  'Wiraswasta / Pengusaha',
  'Pedagang / Bisnis',
  'Petani / Peternak / Nelayan',
  'Guru / Dosen / Tenaga Pendidik',
  'Tenaga Medis / Dokter / Bidan / Perawat',
  'Buruh / Pekerja Lepas',
  'Ibu Rumah Tangga',
  'Pensiunan',
  'Lainnya'
];

const PENDAPATAN_OPTIONS = [
  '< Rp 1.000.000',
  'Rp 1.000.000 - Rp 3.000.000',
  'Rp 3.000.000 - Rp 5.000.000',
  'Rp 5.000.000 - Rp 10.000.000',
  '> Rp 10.000.000',
  'Tidak Berpenghasilan'
];

export const PublicPpdb: React.FC<PublicPpdbProps> = ({
  registrations,
  schoolInfo,
  session,
  onSaveRegistrations,
  onAddStudentFromPpdb,
  settings: propSettings,
  onSaveSettings: propOnSaveSettings
}) => {
  // Local or propagated settings
  const [settings, setSettings] = useState<PpdbSettings>(
    () => propSettings || StorageService.getPpdbSettings()
  );

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleUpdateSettings = (newSettings: PpdbSettings) => {
    setSettings(newSettings);
    if (propOnSaveSettings) {
      propOnSaveSettings(newSettings);
    } else {
      StorageService.savePpdbSettings(newSettings);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<'form' | 'cek' | 'admin'>(
    session.role === 'admin' || session.role === 'guru' ? 'admin' : 'form'
  );

  // Active School Year (Sync with Profil Sekolah)
  const currentTahunAjaran = schoolInfo.tahunAjaran?.trim() || settings.tahunAjaran?.trim() || (new Date().getMonth() >= 6 ? `${new Date().getFullYear()}/${new Date().getFullYear() + 1}` : `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`);
  const currentRegYear = new Date().getFullYear().toString();
  const taStartYear = currentTahunAjaran.match(/\d{4}/)?.[0] || currentRegYear;

  // Active Gelombang from Settings
  const activeGelombang =
    settings.gelombangList.find(g => g.status === 'Dibuka') ||
    settings.gelombangList[0] || {
      id: 'GEL-1',
      nama: 'Gelombang 1 (Inden)',
      tanggalMulai: '1 Nopember',
      tanggalSelesai: '28 Februari',
      beasiswaInfo: 'Beasiswa Potongan Infaq Rp 1.500.000',
      status: 'Dibuka'
    };

  // Active Contact Person from Settings
  const primaryContact = settings.contactList[0] || {
    nama: 'Ustadz Faisal Rahman',
    jabatan: 'Humas PPDB',
    noHp: '0812-3456-7807',
    jamLayanan: '07.30 - 15.00 WIB (Senin - Sabtu)',
    keteranganTambahan: 'Layanan informasi program & infaq'
  };

  // Form State with complete father and mother details
  const [formData, setFormData] = useState({
    // Calon Siswa
    namaLengkap: '',
    nisn: '',
    jenisKelamin: 'L' as 'L' | 'P',
    tempatLahir: '',
    tanggalLahir: '',
    asalSekolah: '',
    pilihanKelas: settings.programList[0]?.kategori || 'Tahfidz Al-Qur\'an',

    // Ayah
    namaAyah: '',
    statusAyah: 'Masih Hidup' as 'Masih Hidup' | 'Meninggal',
    pekerjaanAyah: 'Wiraswasta / Pengusaha',
    noHpAyah: '',
    pendapatanAyah: 'Rp 3.000.000 - Rp 5.000.000',
    alamatAyah: '',

    // Ibu
    namaIbu: '',
    statusIbu: 'Masih Hidup' as 'Masih Hidup' | 'Meninggal',
    pekerjaanIbu: 'Ibu Rumah Tangga',
    noHpIbu: '',
    pendapatanIbu: 'Tidak Berpenghasilan',
    alamatIbu: '',

    // Wali (Opsional)
    hasWali: false,
    namaWali: '',
    hubunganWali: 'Kakek / Nenek',
    pekerjaanWali: 'Pensiunan',
    noHpWali: '',
    pendapatanWali: '< Rp 1.000.000',

    // Domisili Siswa
    alamat: ''
  });

  const [submittedReceipt, setSubmittedReceipt] = useState<PpdbRegistration | null>(null);

  // Search State for Cek Status
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<PpdbRegistration[] | null>(null);

  // Admin Filter & Note Edit State
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('Semua');
  const [adminProgramFilter, setAdminProgramFilter] = useState<string>('Semua');
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedRegForAction, setSelectedRegForAction] = useState<PpdbRegistration | null>(null);
  const [editNote, setEditNote] = useState('');

  // Handle Form Change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Copy address to father/mother
  const handleSyncAddress = (target: 'ayah' | 'ibu') => {
    if (!formData.alamat) {
      alert('Isi alamat domisili calon siswa terlebih dahulu.');
      return;
    }
    if (target === 'ayah') {
      setFormData(prev => ({ ...prev, alamatAyah: prev.alamat }));
    } else {
      setFormData(prev => ({ ...prev, alamatIbu: prev.alamat }));
    }
  };

  // Submit PPDB Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const today = new Date().toISOString().split('T')[0];
    const regYear = (today.split('-')[0]) || currentRegYear;
    const count = registrations.length + 1;
    const newId = `PPDB-${regYear}-${String(count).padStart(3, '0')}`;

    const mainParentName = formData.namaAyah || formData.namaIbu || formData.namaWali || 'Orang Tua';
    const mainParentPhone = formData.noHpAyah || formData.noHpIbu || formData.noHpWali || '';

    const newRegistration: PpdbRegistration = {
      id: newId,
      tahunAjaran: currentTahunAjaran,
      namaLengkap: formData.namaLengkap.trim(),
      nisn: formData.nisn?.trim() || undefined,
      jenisKelamin: formData.jenisKelamin,
      tempatLahir: formData.tempatLahir.trim(),
      tanggalLahir: formData.tanggalLahir,
      asalSekolah: formData.asalSekolah.trim(),

      // Ayah
      namaAyah: formData.namaAyah.trim(),
      statusAyah: formData.statusAyah,
      pekerjaanAyah: formData.statusAyah === 'Meninggal' ? 'Almarhum' : formData.pekerjaanAyah,
      noHpAyah: formData.statusAyah === 'Meninggal' ? (formData.noHpAyah.trim() || '-') : formData.noHpAyah.trim(),
      pendapatanAyah: formData.statusAyah === 'Meninggal' ? '-' : formData.pendapatanAyah,
      alamatAyah: formData.statusAyah === 'Meninggal' ? '-' : (formData.alamatAyah.trim() || formData.alamat.trim()),

      // Ibu
      namaIbu: formData.namaIbu.trim(),
      statusIbu: formData.statusIbu,
      pekerjaanIbu: formData.statusIbu === 'Meninggal' ? 'Almarhumah' : formData.pekerjaanIbu,
      noHpIbu: formData.statusIbu === 'Meninggal' ? (formData.noHpIbu.trim() || '-') : formData.noHpIbu.trim(),
      pendapatanIbu: formData.statusIbu === 'Meninggal' ? '-' : formData.pendapatanIbu,
      alamatIbu: formData.statusIbu === 'Meninggal' ? '-' : (formData.alamatIbu.trim() || formData.alamat.trim()),

      // Wali (if filled)
      namaWali: formData.hasWali ? formData.namaWali.trim() : undefined,
      hubunganWali: formData.hasWali ? formData.hubunganWali : undefined,
      pekerjaanWali: formData.hasWali ? formData.pekerjaanWali : undefined,
      noHpWali: formData.hasWali ? formData.noHpWali.trim() : undefined,
      pendapatanWali: formData.hasWali ? formData.pendapatanWali : undefined,

      // Summary fallback
      namaOrangTua: mainParentName,
      noHpOrtu: mainParentPhone,
      alamat: formData.alamat.trim(),

      pilihanKelas: formData.pilihanKelas,
      tanggalDaftar: today,
      status: 'Menunggu Verifikasi',
      catatan: 'Formulir berhasil terdaftar di sistem PPDB online. Silakan konfirmasi berkas ke Panitia PPDB.'
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
      pilihanKelas: settings.programList[0]?.kategori || 'Tahfidz Al-Qur\'an',
      namaAyah: '',
      statusAyah: 'Masih Hidup',
      pekerjaanAyah: 'Wiraswasta / Pengusaha',
      noHpAyah: '',
      pendapatanAyah: 'Rp 3.000.000 - Rp 5.000.000',
      alamatAyah: '',
      namaIbu: '',
      statusIbu: 'Masih Hidup',
      pekerjaanIbu: 'Ibu Rumah Tangga',
      noHpIbu: '',
      pendapatanIbu: 'Tidak Berpenghasilan',
      alamatIbu: '',
      hasWali: false,
      namaWali: '',
      hubunganWali: 'Kakek / Nenek',
      pekerjaanWali: 'Pensiunan',
      noHpWali: '',
      pendapatanWali: '< Rp 1.000.000',
      alamat: ''
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
        (r.namaAyah && r.namaAyah.toLowerCase().includes(q)) ||
        (r.namaIbu && r.namaIbu.toLowerCase().includes(q)) ||
        (r.namaOrangTua && r.namaOrangTua.toLowerCase().includes(q)) ||
        (r.noHpAyah && r.noHpAyah.includes(q)) ||
        (r.noHpIbu && r.noHpIbu.includes(q)) ||
        (r.noHpOrtu && r.noHpOrtu.includes(q)) ||
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
      const ayahLabel = reg.namaAyah ? `${reg.namaAyah}${reg.statusAyah === 'Meninggal' ? ' (Alm.)' : ''}` : '';
      const ibuLabel = reg.namaIbu ? `${reg.namaIbu}${reg.statusIbu === 'Meninggal' ? ' (Almh.)' : ''}` : '';
      const parentSummary = ayahLabel && ibuLabel
        ? `${ayahLabel} & ${ibuLabel}`
        : ayahLabel || ibuLabel || reg.namaOrangTua;
      const phoneSummary = reg.noHpAyah && reg.noHpAyah !== '-' ? reg.noHpAyah : (reg.noHpIbu || reg.noHpOrtu);

      onAddStudentFromPpdb({
        nisn: reg.nisn || `009${Math.floor(1000000 + Math.random() * 9000000)}`,
        nama: reg.namaLengkap,
        gender: reg.jenisKelamin,
        kelas: '7A',
        tempatLahir: reg.tempatLahir,
        tanggalLahir: reg.tanggalLahir,
        namaOrangTua: parentSummary,
        noHpOrangTua: phoneSummary,
        alamat: reg.alamat,
        status: 'Aktif',
        namaAyah: reg.namaAyah,
        statusAyah: reg.statusAyah || 'Masih Hidup',
        namaIbu: reg.namaIbu,
        statusIbu: reg.statusIbu || 'Masih Hidup'
      });

      handleUpdateStatus(reg.id, 'Diterima', 'Siswa telah resmi dimasukkan ke Master Data Siswa Kelas 7A.');
      alert(`${reg.namaLengkap} berhasil dimasukkan ke Master Data Siswa!`);
    }
  };

  // Export Comprehensive PPDB CSV
  const handleExportPpdbCSV = () => {
    const exportRows = registrations.map(r => ({
      'No. Pendaftaran': r.id,
      'Tahun Ajaran': r.tahunAjaran || currentTahunAjaran,
      'Nama Lengkap Siswa': r.namaLengkap,
      'NISN': r.nisn || '-',
      'Jenis Kelamin': r.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan',
      'Tempat Lahir': r.tempatLahir,
      'Tanggal Lahir': r.tanggalLahir,
      'Asal SD/MI': r.asalSekolah,
      'Program Pilihan': r.pilihanKelas,
      'Nama Ayah': r.namaAyah || r.namaOrangTua || '-',
      'Status Ayah': r.statusAyah || 'Masih Hidup',
      'Pekerjaan Ayah': r.pekerjaanAyah || '-',
      'No HP/WA Ayah': r.noHpAyah || r.noHpOrtu || '-',
      'Penghasilan Ayah': r.pendapatanAyah || '-',
      'Nama Ibu': r.namaIbu || '-',
      'Status Ibu': r.statusIbu || 'Masih Hidup',
      'Pekerjaan Ibu': r.pekerjaanIbu || '-',
      'No HP/WA Ibu': r.noHpIbu || '-',
      'Penghasilan Ibu': r.pendapatanIbu || '-',
      'Nama Wali': r.namaWali || '-',
      'Hubungan Wali': r.hubunganWali || '-',
      'No HP Wali': r.noHpWali || '-',
      'Alamat Lengkap': r.alamat,
      'Tanggal Daftar': r.tanggalDaftar,
      'Status Seleksi': r.status,
      'Catatan Panitia': r.catatan || ''
    }));

    exportToCSV(`Data_Pendaftar_PPDB_TA_${currentTahunAjaran.replace('/', '-')}.csv`, exportRows);
  };

  // Admin filtered list
  const adminFilteredList = registrations.filter(r => {
    const matchesStatus = adminStatusFilter === 'Semua' || r.status === adminStatusFilter;
    const matchesProgram = adminProgramFilter === 'Semua' || r.pilihanKelas === adminProgramFilter;
    const matchesSearch =
      r.namaLengkap.toLowerCase().includes(adminSearch.toLowerCase()) ||
      r.id.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (r.namaAyah && r.namaAyah.toLowerCase().includes(adminSearch.toLowerCase())) ||
      (r.namaIbu && r.namaIbu.toLowerCase().includes(adminSearch.toLowerCase())) ||
      r.asalSekolah.toLowerCase().includes(adminSearch.toLowerCase());
    return matchesStatus && matchesProgram && matchesSearch;
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

  // Helper for program icon
  const renderProgramIcon = (iconName?: string) => {
    switch (iconName) {
      case 'globe':
        return <Globe className="w-4 h-4 text-blue-400" />;
      case 'star':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'trophy':
        return <Award className="w-4 h-4 text-emerald-400" />;
      case 'building':
        return <Building className="w-4 h-4 text-purple-400" />;
      default:
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>Penerimaan Peserta Didik Baru (PPDB) TA {currentTahunAjaran}</span>
              </div>

              {(session.role === 'admin' || session.role === 'guru') && (
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 text-xs font-bold border border-amber-400/40 transition-colors shadow"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚙️ Kelola Info PPDB</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold font-serif text-white tracking-tight">
              Pendaftaran Siswa Baru {schoolInfo.nama}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Membuka pendaftaran peserta didik baru berkarakter Qur'ani, berakhlak mulia, dan berwawasan sains & teknologi. Daftar secara online dengan cepat dan praktis.
            </p>
          </div>

          {/* Gelombang Active Card */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 shrink-0 text-center sm:text-right space-y-1 shadow-lg">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              {activeGelombang.nama}
            </div>
            <div className="text-sm font-extrabold text-white font-serif">
              {activeGelombang.tanggalMulai} - {activeGelombang.tanggalSelesai}
            </div>
            {activeGelombang.beasiswaInfo && (
              <div className="text-[11px] text-emerald-400 font-semibold">
                🎁 {activeGelombang.beasiswaInfo}
              </div>
            )}
          </div>
        </div>

        {/* Feature Badges from Program List */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
          {(settings?.programList || []).slice(0, 3).map((prog, idx) => (
            <div key={prog.id || idx} className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold shrink-0">
                {renderProgramIcon(prog.icon)}
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-white truncate">{prog.nama}</h4>
                <p className="text-[11px] text-slate-400 truncate">{prog.deskripsi}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
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
              <span>Panel Admin PPDB ({(registrations || []).length})</span>
            </button>
          )}
        </div>

        {(session.role === 'admin' || session.role === 'guru') && (
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 shadow transition-colors"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>Pengaturan PPDB</span>
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
                  Formulir Pendaftaran Calon Siswa Baru
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Isi data calon murid dan data orang tua secara lengkap & valid sesuai dokumen resmi • Tahun Pendaftaran {currentRegYear}
                </p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-400/30 font-mono">
                TA {currentTahunAjaran}
              </span>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-6">
              
              {/* Program Pilihan Kelas (Dynamic from settings) */}
              <div>
                <label className="block text-xs font-bold text-emerald-300 mb-2">
                  Pilihan Program / Kelas Unggulan *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(settings?.programList || []).map(prog => (
                    <label
                      key={prog.id || prog.kategori}
                      className={`cursor-pointer p-3 rounded-xl border text-left transition-all ${
                        formData.pilihanKelas === prog.kategori
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/50'
                          : 'bg-slate-950/50 border-white/10 text-slate-300 hover:border-white/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pilihanKelas"
                        value={prog.kategori}
                        checked={formData.pilihanKelas === prog.kategori}
                        onChange={handleInputChange}
                        className="hidden"
                      />
                      <span className="text-xs font-bold block text-emerald-300">{prog.nama}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 leading-snug">{prog.deskripsi}</span>
                      {prog.target && (
                        <span className="text-[10px] text-amber-300 font-semibold block mt-1">🎯 {prog.target}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* SECTION 1: Data Calon Siswa */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-white/10 pb-1.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">1</div>
                  <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider">
                    Data Diri Calon Siswa
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap Calon Siswa *</label>
                    <input
                      type="text"
                      name="namaLengkap"
                      value={formData.namaLengkap}
                      onChange={handleInputChange}
                      required
                      placeholder="Sesuai Akta Kelahiran / Ijazah SD"
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
                      placeholder="Kota Lahir (contoh: Banyuwangi)"
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
                      placeholder="Contoh: SD Islam Terpadu Al-Uswah / SDN 1 Giri"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">Alamat Domisili Tempat Tinggal Siswa *</label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      placeholder="Jalan, Dusun, RT/RW, Desa/Kelurahan, Kecamatan, Kota/Kabupaten"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Data Ayah Kandung */}
              <div className="space-y-4 pt-2 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-xs">2</div>
                    <h4 className="text-xs font-bold uppercase text-blue-300 tracking-wider">
                      Data Ayah Kandung
                    </h4>
                  </div>
                  {formData.statusAyah === 'Masih Hidup' && (
                    <button
                      type="button"
                      onClick={() => handleSyncAddress('ayah')}
                      className="text-[11px] text-blue-300 hover:text-white underline font-medium text-left sm:text-right"
                    >
                      Salin Alamat Siswa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Keberadaan Ayah */}
                  <div className="md:col-span-2 bg-slate-900/70 p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-200">Status Keberadaan Ayah *</label>
                      <span className="text-[11px] text-slate-400">Pilih status apakah ayah masih hidup atau sudah meninggal / almarhum</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, statusAyah: 'Masih Hidup' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formData.statusAyah === 'Masih Hidup'
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold ring-2 ring-emerald-300/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>Masih Hidup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, statusAyah: 'Meninggal' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formData.statusAyah === 'Meninggal'
                            ? 'bg-rose-500 text-white shadow-md font-extrabold ring-2 ring-rose-300/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                        <span>Meninggal (Almarhum)</span>
                      </button>
                    </div>
                  </div>

                  {formData.statusAyah === 'Meninggal' && (
                    <div className="md:col-span-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
                      <span className="text-base">🕊️</span>
                      <span>Status Ayah tercatat <strong>Meninggal (Almarhum)</strong>. Kolom No. HP dan pekerjaan disesuaikan secara otomatis.</span>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {formData.statusAyah === 'Meninggal' ? 'Nama Lengkap Ayah (Almarhum) *' : 'Nama Lengkap Ayah *'}
                    </label>
                    <input
                      type="text"
                      name="namaAyah"
                      value={formData.namaAyah}
                      onChange={handleInputChange}
                      required
                      placeholder={formData.statusAyah === 'Meninggal' ? 'Nama Lengkap Almarhum Ayah' : 'Nama Lengkap Ayah Kandung beserta Gelar'}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {formData.statusAyah === 'Masih Hidup' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Pekerjaan Ayah *</label>
                        <select
                          name="pekerjaanAyah"
                          value={formData.pekerjaanAyah}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          {PEKERJAAN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Nomor WhatsApp / HP Ayah *</label>
                        <input
                          type="tel"
                          name="noHpAyah"
                          value={formData.noHpAyah}
                          onChange={handleInputChange}
                          required
                          placeholder="Contoh: 081234567890"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Penghasilan Per Bulan Ayah *</label>
                        <select
                          name="pendapatanAyah"
                          value={formData.pendapatanAyah}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          {PENDAPATAN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Alamat Ayah</label>
                        <input
                          type="text"
                          name="alamatAyah"
                          value={formData.alamatAyah}
                          onChange={handleInputChange}
                          placeholder="Kosongkan jika sama dengan alamat siswa"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2 bg-slate-900/40 p-3 rounded-xl border border-white/5 text-xs text-slate-400">
                      Pekerjaan dan kontak Ayah dialihkan karena berstatus Almarhum. Silakan lengkapi kontak pada Data Ibu atau Wali.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Data Ibu Kandung */}
              <div className="space-y-4 pt-2 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 font-bold flex items-center justify-center text-xs">3</div>
                    <h4 className="text-xs font-bold uppercase text-pink-300 tracking-wider">
                      Data Ibu Kandung
                    </h4>
                  </div>
                  {formData.statusIbu === 'Masih Hidup' && (
                    <button
                      type="button"
                      onClick={() => handleSyncAddress('ibu')}
                      className="text-[11px] text-pink-300 hover:text-white underline font-medium text-left sm:text-right"
                    >
                      Salin Alamat Siswa
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status Keberadaan Ibu */}
                  <div className="md:col-span-2 bg-slate-900/70 p-3 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-200">Status Keberadaan Ibu *</label>
                      <span className="text-[11px] text-slate-400">Pilih status apakah ibu masih hidup atau sudah meninggal / almarhumah</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, statusIbu: 'Masih Hidup' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formData.statusIbu === 'Masih Hidup'
                            ? 'bg-pink-500 text-white shadow-md font-extrabold ring-2 ring-pink-300/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-pink-300"></span>
                        <span>Masih Hidup</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, statusIbu: 'Meninggal' }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formData.statusIbu === 'Meninggal'
                            ? 'bg-rose-500 text-white shadow-md font-extrabold ring-2 ring-rose-300/40'
                            : 'bg-slate-800 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                        <span>Meninggal (Almarhumah)</span>
                      </button>
                    </div>
                  </div>

                  {formData.statusIbu === 'Meninggal' && (
                    <div className="md:col-span-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
                      <span className="text-base">🕊️</span>
                      <span>Status Ibu tercatat <strong>Meninggal (Almarhumah)</strong>. Kolom No. HP dan pekerjaan disesuaikan secara otomatis.</span>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {formData.statusIbu === 'Meninggal' ? 'Nama Lengkap Ibu (Almarhumah) *' : 'Nama Lengkap Ibu *'}
                    </label>
                    <input
                      type="text"
                      name="namaIbu"
                      value={formData.namaIbu}
                      onChange={handleInputChange}
                      required
                      placeholder={formData.statusIbu === 'Meninggal' ? 'Nama Lengkap Almarhumah Ibu' : 'Nama Lengkap Ibu Kandung beserta Gelar'}
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {formData.statusIbu === 'Masih Hidup' ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Pekerjaan Ibu *</label>
                        <select
                          name="pekerjaanIbu"
                          value={formData.pekerjaanIbu}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          {PEKERJAAN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Nomor WhatsApp / HP Ibu *</label>
                        <input
                          type="tel"
                          name="noHpIbu"
                          value={formData.noHpIbu}
                          onChange={handleInputChange}
                          required
                          placeholder="Contoh: 081234567899"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Penghasilan Per Bulan Ibu *</label>
                        <select
                          name="pendapatanIbu"
                          value={formData.pendapatanIbu}
                          onChange={handleInputChange}
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        >
                          {PENDAPATAN_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">Alamat Ibu</label>
                        <input
                          type="text"
                          name="alamatIbu"
                          value={formData.alamatIbu}
                          onChange={handleInputChange}
                          placeholder="Kosongkan jika sama dengan alamat siswa"
                          className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-2 bg-slate-900/40 p-3 rounded-xl border border-white/5 text-xs text-slate-400">
                      Pekerjaan dan kontak Ibu dialihkan karena berstatus Almarhumah. Silakan lengkapi kontak pada Data Ayah atau Wali.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: Data Wali (Opsional Toggle) */}
              <div className="space-y-4 pt-2 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">4</div>
                    <h4 className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                      Data Wali Santri (Opsional)
                    </h4>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="hasWali"
                      checked={formData.hasWali || (formData.statusAyah === 'Meninggal' && formData.statusIbu === 'Meninggal')}
                      onChange={handleInputChange}
                      className="rounded border-slate-400 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span>Santri Tinggal Bersama Wali</span>
                  </label>
                </div>

                {formData.statusAyah === 'Meninggal' && formData.statusIbu === 'Meninggal' && (
                  <div className="bg-amber-500/15 border border-amber-500/30 text-amber-200 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <span>Ananda terdata <strong>Yatim Piatu</strong>. Mohon lengkapi data Wali Santri di bawah ini untuk kelancaran pendampingan dan prioritas beasiswa santri.</span>
                  </div>
                )}

                {(formData.hasWali || (formData.statusAyah === 'Meninggal' && formData.statusIbu === 'Meninggal')) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap Wali</label>
                      <input
                        type="text"
                        name="namaWali"
                        value={formData.namaWali}
                        onChange={handleInputChange}
                        placeholder="Nama Wali Murid"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Hubungan Hubungan Wali</label>
                      <select
                        name="hubunganWali"
                        value={formData.hubunganWali}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Kakek / Nenek">Kakek / Nenek</option>
                        <option value="Paman / Bibi">Paman / Bibi</option>
                        <option value="Kakak Kandung">Kakak Kandung</option>
                        <option value="Wali Asuh / Lembaga Yayasan">Wali Asuh / Lembaga Yayasan</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Nomor WhatsApp / HP Wali</label>
                      <input
                        type="tel"
                        name="noHpWali"
                        value={formData.noHpWali}
                        onChange={handleInputChange}
                        placeholder="Contoh: 081234567890"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Pekerjaan Wali</label>
                      <select
                        name="pekerjaanWali"
                        value={formData.pekerjaanWali}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {PEKERJAAN_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
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
              <h3 className="text-sm font-bold font-serif text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Alur Pendaftaran PPDB</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Isi Formulir Online</h5>
                    <p className="text-slate-400 text-[11px]">Lengkapi data calon siswa dan kedua orang tua (Ayah & Ibu) secara online.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Dapatkan Nomor Registrasi</h5>
                    <p className="text-slate-400 text-[11px]">Simpan Bukti Pendaftaran resmi (misal: PPDB-{currentRegYear}-001).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Tes Pemetaan & Wawancara</h5>
                    <p className="text-slate-400 text-[11px]">Tes membaca Al-Qur'an, potensi akademik, dan komitmen orang tua.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-400/30">
                    4
                  </div>
                  <div>
                    <h5 className="font-bold text-white">Pengumuman & Daftar Ulang</h5>
                    <p className="text-slate-400 text-[11px]">Cek status kelulusan di menu "Cek Status" dan lakukan daftar ulang santri.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Syarat Pendaftaran */}
            {settings?.syaratPendaftaran && settings.syaratPendaftaran.length > 0 && (
              <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-3">
                <h3 className="text-sm font-bold font-serif text-white border-b border-white/10 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Persyaratan Dokumen</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {(settings.syaratPendaftaran || []).map((syarat, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>{syarat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Kontak Panitia PPDB (Dynamic from settings) */}
            <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-emerald-500/30 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>Narahubung Panitia PPDB</span>
                </h3>
              </div>
              
              <div className="space-y-3">
                {(settings?.contactList || []).map((c, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-white/10 text-xs space-y-1">
                    <p className="text-slate-200"><strong>{c.nama} ({c.jabatan}):</strong></p>
                    <a
                      href={`https://wa.me/${c.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Assalamu'alaikum%20Panitia%20PPDB%20${encodeURIComponent(schoolInfo?.nama || 'SMP Islam Al Qomar')},%20saya%20ingin%20bertanya%20informasi%20pendaftaran.`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-mono font-bold block"
                    >
                      📞 {c.noHp} (WhatsApp)
                    </a>
                    <p className="text-slate-400 text-[11px]">⏰ {c.jamLayanan}</p>
                    {c.keteranganTambahan && (
                      <p className="text-slate-300 text-[10px] italic">{c.keteranganTambahan}</p>
                    )}
                  </div>
                ))}
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
              Cek Status Hasil Seleksi PPDB TA {currentTahunAjaran}
            </h3>
            <p className="text-xs text-slate-300">
              Masukkan Nomor Pendaftaran (misal: PPDB-{currentRegYear}-001), Nama Calon Siswa, atau Nomor WhatsApp Orang Tua
            </p>

            <form onSubmit={handleSearchStatus} className="flex items-center gap-2 mt-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari No Pendaftaran / Nama Siswa / No HP..."
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
                  {(searchResult || []).map(r => (
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
                        <div><strong>Tgl Daftar:</strong> {r.tanggalDaftar}</div>
                        <div>
                          <strong>Ayah:</strong> {r.namaAyah || r.namaOrangTua}
                          {r.statusAyah === 'Meninggal' && <span className="ml-1 text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">Almarhum</span>}
                        </div>
                        <div>
                          <strong>Ibu:</strong> {r.namaIbu || '-'}
                          {r.statusIbu === 'Meninggal' && <span className="ml-1 text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">Almarhumah</span>}
                        </div>
                        <div className="col-span-2"><strong>Kontak:</strong> {r.noHpAyah || r.noHpIbu || r.noHpOrtu}</div>
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
              <span className="text-2xl font-black text-white font-serif">{(registrations || []).length}</span>
              <span className="block text-xs text-slate-400 mt-1 font-semibold">Total Pendaftar (TA {currentTahunAjaran})</span>
            </div>
            <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-emerald-500/30">
              <span className="text-2xl font-black text-emerald-300 font-serif">
                {(registrations || []).filter(r => r.status === 'Diterima').length}
              </span>
              <span className="block text-xs text-emerald-400 mt-1 font-semibold">Siswa Diterima</span>
            </div>
            <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-blue-500/30">
              <span className="text-2xl font-black text-blue-300 font-serif">
                {(registrations || []).filter(r => r.status === 'Lulus Berkas').length}
              </span>
              <span className="block text-xs text-blue-400 mt-1 font-semibold">Lulus Berkas</span>
            </div>
            <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-amber-500/30">
              <span className="text-2xl font-black text-amber-300 font-serif">
                {(registrations || []).filter(r => r.status === 'Menunggu Verifikasi').length}
              </span>
              <span className="block text-xs text-amber-400 mt-1 font-semibold">Menunggu Verifikasi</span>
            </div>
          </div>

          {/* Admin Table Controls */}
          <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Cari nama siswa, orang tua, no PPDB, asal SD..."
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

                <select
                  value={adminProgramFilter}
                  onChange={(e) => setAdminProgramFilter(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Program</option>
                  {(settings?.programList || []).map(prog => (
                    <option key={prog.id} value={prog.kategori}>{prog.nama}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl shadow flex items-center gap-1.5 border border-white/10"
                >
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <span>Pengaturan Info PPDB</span>
                </button>

                <button
                  onClick={handleExportPpdbCSV}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-2 border border-emerald-300/50"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV Lengkap</span>
                </button>
              </div>
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
                    <th className="p-3">Data Orang Tua (Ayah & Ibu)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Aksi & Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(adminFilteredList || []).map(reg => (
                    <tr key={reg.id} className="hover:bg-white/5 transition-colors text-slate-200">
                      <td className="p-3 font-mono font-bold text-emerald-400">{reg.id}</td>
                      <td className="p-3">
                        <div className="font-bold text-white">{reg.namaLengkap}</div>
                        {reg.nisn && <div className="text-[10px] font-mono text-slate-400">NISN: {reg.nisn}</div>}
                      </td>
                      <td className="p-3">{reg.jenisKelamin}</td>
                      <td className="p-3 text-slate-300">{reg.asalSekolah}</td>
                      <td className="p-3 font-semibold text-emerald-300">{reg.pilihanKelas}</td>
                      <td className="p-3">
                        <div>👨 <strong>{reg.namaAyah || reg.namaOrangTua}</strong> {reg.pekerjaanAyah ? `(${reg.pekerjaanAyah})` : ''}</div>
                        {reg.namaIbu && (
                          <div className="text-[11px] text-pink-300 mt-0.5">👩 {reg.namaIbu} {reg.pekerjaanIbu ? `(${reg.pekerjaanIbu})` : ''}</div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          📞 {reg.noHpAyah || reg.noHpIbu || reg.noHpOrtu}
                        </div>
                      </td>
                      <td className="p-3">{getStatusBadge(reg.status)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedRegForAction(reg);
                            setEditNote(reg.catatan || '');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-white/10 font-bold text-[11px]"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-300 space-y-6 my-auto">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-2xl font-black">
                ✓
              </div>
              <h3 className="text-xl font-bold font-serif text-slate-900">
                Pendaftaran PPDB Berhasil!
              </h3>
              <p className="text-xs text-slate-600">
                Tahun Ajaran <span className="font-bold text-slate-900">{submittedReceipt.tahunAjaran || currentTahunAjaran}</span> • Simpan bukti pendaftaran ini untuk tes & verifikasi berkas.
              </p>
            </div>

            {/* Printable Receipt Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-300 text-xs space-y-2.5" id="printable-ppdb-receipt">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-slate-500 uppercase text-[11px]">Nomor Pendaftaran</span>
                <span className="font-mono font-black text-emerald-700 text-base">{submittedReceipt.id}</span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div><strong>Nama Calon Siswa:</strong> {submittedReceipt.namaLengkap}</div>
                <div><strong>Jenis Kelamin:</strong> {submittedReceipt.jenisKelamin === 'L' ? 'Laki-laki (Putra)' : 'Perempuan (Putri)'}</div>
                <div><strong>Asal SD/MI:</strong> {submittedReceipt.asalSekolah}</div>
                <div><strong>Program Pilihan:</strong> <span className="text-emerald-700 font-bold">{submittedReceipt.pilihanKelas}</span></div>
                
                <div className="border-t pt-1.5 mt-1 space-y-1">
                  <div>
                    <strong>Nama Ayah:</strong> {submittedReceipt.namaAyah || submittedReceipt.namaOrangTua}
                    {submittedReceipt.statusAyah === 'Meninggal' ? (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Meninggal (Almarhum)</span>
                    ) : (
                      <span className="ml-1.5 text-slate-500 font-normal">({submittedReceipt.pekerjaanAyah || '-'})</span>
                    )}
                  </div>
                  {submittedReceipt.statusAyah !== 'Meninggal' && (
                    <div><strong>No. HP/WA Ayah:</strong> {submittedReceipt.noHpAyah || submittedReceipt.noHpOrtu}</div>
                  )}

                  {submittedReceipt.namaIbu && (
                    <div className="mt-1">
                      <strong>Nama Ibu:</strong> {submittedReceipt.namaIbu}
                      {submittedReceipt.statusIbu === 'Meninggal' ? (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Meninggal (Almarhumah)</span>
                      ) : (
                        <span className="ml-1.5 text-slate-500 font-normal">({submittedReceipt.pekerjaanIbu || '-'})</span>
                      )}
                    </div>
                  )}
                  {submittedReceipt.statusIbu !== 'Meninggal' && submittedReceipt.noHpIbu && (
                    <div><strong>No. HP/WA Ibu:</strong> {submittedReceipt.noHpIbu}</div>
                  )}
                </div>

                <div><strong>Alamat Domisili:</strong> {submittedReceipt.alamat}</div>
              </div>

              <div className="border-t pt-2 mt-2 text-[11px] text-slate-500 text-center font-mono">
                {schoolInfo.nama} • Terdaftar pada {submittedReceipt.tanggalDaftar}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <a
                href={`https://wa.me/${primaryContact.noHp.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=Assalamu'alaikum%20Panitia%20PPDB%20${encodeURIComponent(schoolInfo.nama)},%20saya%20sudah%20mendaftar%20online%20dengan%20No%20Pendaftaran:%20${submittedReceipt.id}%20atas%20nama%20${encodeURIComponent(submittedReceipt.namaLengkap)}`}
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

      {/* MODAL 2: ADMIN KELOLA & VERIFIKASI REGISTRASI */}
      {selectedRegForAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="glass backdrop-blur-xl bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl space-y-6 my-auto">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">{selectedRegForAction.id}</span>
                <h3 className="text-base font-bold font-serif text-white">{selectedRegForAction.namaLengkap}</h3>
                <p className="text-xs text-slate-400">Tahun Ajaran: {selectedRegForAction.tahunAjaran || currentTahunAjaran}</p>
              </div>
              <button
                onClick={() => setSelectedRegForAction(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comprehensive Detail Grid */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              
              {/* Data Calon Siswa */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/10 text-xs space-y-1.5">
                <h5 className="font-bold text-emerald-300 border-b border-white/5 pb-1">Data Calon Siswa</h5>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div><strong>NISN:</strong> {selectedRegForAction.nisn || '-'}</div>
                  <div><strong>Gender:</strong> {selectedRegForAction.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                  <div><strong>TTL:</strong> {selectedRegForAction.tempatLahir}, {selectedRegForAction.tanggalLahir}</div>
                  <div><strong>Asal SD/MI:</strong> {selectedRegForAction.asalSekolah}</div>
                  <div className="col-span-2"><strong>Program Pilihan:</strong> <span className="text-emerald-300 font-bold">{selectedRegForAction.pilihanKelas}</span></div>
                </div>
              </div>

              {/* Data Ayah & Ibu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <h5 className="font-bold text-blue-300">👨 Data Ayah Kandung</h5>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedRegForAction.statusAyah === 'Meninggal' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {selectedRegForAction.statusAyah === 'Meninggal' ? '🕊️ Almarhum' : '🟢 Masih Hidup'}
                    </span>
                  </div>
                  <p><strong>Nama:</strong> {selectedRegForAction.namaAyah || selectedRegForAction.namaOrangTua || '-'}</p>
                  <p><strong>Pekerjaan:</strong> {selectedRegForAction.pekerjaanAyah || '-'}</p>
                  <p><strong>No. HP/WA:</strong> {selectedRegForAction.noHpAyah || selectedRegForAction.noHpOrtu || '-'}</p>
                  <p><strong>Penghasilan:</strong> {selectedRegForAction.pendapatanAyah || '-'}</p>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <h5 className="font-bold text-pink-300">👩 Data Ibu Kandung</h5>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedRegForAction.statusIbu === 'Meninggal' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    }`}>
                      {selectedRegForAction.statusIbu === 'Meninggal' ? '🕊️ Almarhumah' : '🟢 Masih Hidup'}
                    </span>
                  </div>
                  <p><strong>Nama:</strong> {selectedRegForAction.namaIbu || '-'}</p>
                  <p><strong>Pekerjaan:</strong> {selectedRegForAction.pekerjaanIbu || '-'}</p>
                  <p><strong>No. HP/WA:</strong> {selectedRegForAction.noHpIbu || '-'}</p>
                  <p><strong>Penghasilan:</strong> {selectedRegForAction.pendapatanIbu || '-'}</p>
                </div>
              </div>

              {/* Data Wali (if any) & Alamat */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/10 text-xs space-y-1">
                {selectedRegForAction.namaWali && (
                  <div className="pb-1 border-b border-white/5 mb-1">
                    <strong>Data Wali:</strong> {selectedRegForAction.namaWali} ({selectedRegForAction.hubunganWali || 'Wali'}) • {selectedRegForAction.noHpWali || '-'}
                  </div>
                )}
                <p><strong>Alamat Domisili:</strong> {selectedRegForAction.alamat}</p>
              </div>

              {/* Status Update Buttons */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-2">Ubah Status Kelulusan PPDB:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRegForAction.id, 'Lulus Berkas', editNote)}
                    className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs py-2 px-2.5 rounded-xl border border-blue-400/30"
                  >
                    ✓ Lulus Berkas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRegForAction.id, 'Diterima', editNote)}
                    className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs py-2 px-2.5 rounded-xl border border-emerald-400/30"
                  >
                    ★ Diterima
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRegForAction.id, 'Menunggu Verifikasi', editNote)}
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs py-2 px-2.5 rounded-xl border border-amber-400/30"
                  >
                    ⏳ Menunggu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRegForAction.id, 'Ditolak', editNote)}
                    className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs py-2 px-2.5 rounded-xl border border-rose-400/30"
                  >
                    ✕ Ditolak
                  </button>
                </div>
              </div>

              {/* Note Input */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Catatan Panitia PPDB:</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={2}
                  placeholder="Catatan untuk pendaftar..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                
                <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRegForAction.id, selectedRegForAction.status, editNote)}
                    className="text-xs text-emerald-400 font-bold hover:underline"
                  >
                    Simpan Catatan
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Kirim WA ke Ayah */}
                    {(selectedRegForAction.noHpAyah || selectedRegForAction.noHpOrtu) && (
                      <button
                        type="button"
                        onClick={() => {
                          const phone = selectedRegForAction.noHpAyah || selectedRegForAction.noHpOrtu;
                          const name = selectedRegForAction.namaAyah || selectedRegForAction.namaOrangTua;
                          const msg = WAService.createPpdbStatusUpdateMessage({
                            namaLengkap: selectedRegForAction.namaLengkap,
                            idPendaftaran: selectedRegForAction.id,
                            status: selectedRegForAction.status,
                            catatan: editNote || selectedRegForAction.catatan,
                            schoolName: schoolInfo.nama
                          });
                          WAService.sendWA(phone, msg, name, 'PPDB_STATUS');
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim WA ke Ayah</span>
                      </button>
                    )}

                    {/* Kirim WA ke Ibu */}
                    {selectedRegForAction.noHpIbu && (
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
                          WAService.sendWA(selectedRegForAction.noHpIbu!, msg, selectedRegForAction.namaIbu, 'PPDB_STATUS');
                        }}
                        className="bg-pink-500 hover:bg-pink-400 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Kirim WA ke Ibu</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Import to Master Data Siswa & Delete */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              {onAddStudentFromPpdb && (
                <button
                  type="button"
                  onClick={() => handleConvertToStudent(selectedRegForAction)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Masukkan ke Data Siswa Master (Kelas 7)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDeleteRegistration(selectedRegForAction.id)}
                className="text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Data</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: PENGATURAN PPDB MODAL */}
      <PpdbSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        tahunAjaranSekolah={currentTahunAjaran}
      />

    </div>
  );
};
