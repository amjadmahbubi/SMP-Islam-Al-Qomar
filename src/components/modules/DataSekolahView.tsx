import React, { useState, useEffect } from 'react';
import { SchoolInfo, Teacher, UserSession, AuditLog } from '../../types';
import { initialSchoolInfo } from '../../data/initialData';
import { StorageService, exportToCSV } from '../../services/storage';
import { pushToGoogleSheets } from '../../services/sheetsSyncService';
import { 
  Save, 
  School, 
  Check, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  FileText, 
  UserCheck, 
  ShieldCheck, 
  Crown, 
  ArrowRight, 
  Lock,
  Unlock,
  History,
  Search,
  Download,
  Plus,
  RefreshCw,
  Sparkles,
  Filter,
  X,
  Clock,
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  CalendarDays
} from 'lucide-react';

interface DataSekolahViewProps {
  schoolInfo: SchoolInfo;
  teachers?: Teacher[];
  session?: UserSession | null;
  onSave: (info: SchoolInfo) => void;
  onNavigateToTeachers?: () => void;
}

export const DataSekolahView: React.FC<DataSekolahViewProps> = ({ 
  schoolInfo, 
  teachers = [], 
  session,
  onSave,
  onNavigateToTeachers 
}) => {
  // Tetapkan guru Kepala Sekolah resmi langsung dari Master Data Guru
  const officialKepsekTeacher = teachers.find(
    t => t.jabatan === 'Kepala Sekolah' || t.jabatan?.toLowerCase().trim() === 'kepala sekolah'
  ) || teachers.find(
    t => t.nama.trim().toLowerCase() === (schoolInfo.kepalaSekolah || '').trim().toLowerCase()
  );

  const officialKepsekNama = officialKepsekTeacher ? officialKepsekTeacher.nama : schoolInfo.kepalaSekolah;
  const officialKepsekNigy = officialKepsekTeacher 
    ? (officialKepsekTeacher.nigy || officialKepsekTeacher.nip || schoolInfo.nigyKepalaSekolah) 
    : schoolInfo.nigyKepalaSekolah;
  const officialKepsekNuptk = officialKepsekTeacher?.nuptk;

  const [activeSubTab, setActiveSubTab] = useState<'profil' | 'logo-kop' | 'visi-misi' | 'audit'>('profil');

  const [formData, setFormData] = useState<SchoolInfo>(() => ({
    ...schoolInfo,
    misi: Array.isArray(schoolInfo?.misi) && schoolInfo.misi.length > 0 ? schoolInfo.misi : (initialSchoolInfo.misi || []),
    kepalaSekolah: officialKepsekNama,
    nigyKepalaSekolah: officialKepsekNigy,
    nipKepalaSekolah: officialKepsekNigy,
    logoUrl: schoolInfo.logoUrl || '/assets/aistudio/LOGO_SMP_c07d666e.PNG',
    kopSuratUrl: (schoolInfo.kopSuratUrl && !schoolInfo.kopSuratUrl.includes('image_ffaabd05')) ? schoolInfo.kopSuratUrl : '/assets/aistudio/Surat_Aktif_Nada_001_415335d4.png',
    isLogoLocked: schoolInfo.isLogoLocked !== undefined ? schoolInfo.isLogoLocked : true
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncingLogoToSheets, setSyncingLogoToSheets] = useState(false);
  const [lockLogoMessage, setLockLogoMessage] = useState<string | null>(null);

  // Activity Log State
  const [logs, setLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());
  const [logFilter, setLogFilter] = useState<'ALL' | 'SYNC_TAHUN_AJARAN' | 'PERUBAHAN_KEPALA_SEKOLAH' | 'UPDATE_PROFIL_SEKOLAH'>('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualLogData, setManualLogData] = useState({
    action: 'SYNC_TAHUN_AJARAN' as 'SYNC_TAHUN_AJARAN' | 'PERUBAHAN_KEPALA_SEKOLAH' | 'UPDATE_PROFIL_SEKOLAH' | 'LAINNYA',
    details: '',
    previousDataSummary: '',
    newDataSummary: ''
  });

  // Otomatis sinkronkan formData jika data guru Kepala Sekolah mengalami perubahan
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      misi: Array.isArray(prev.misi) && prev.misi.length > 0 ? prev.misi : (initialSchoolInfo.misi || []),
      kepalaSekolah: officialKepsekNama,
      nigyKepalaSekolah: officialKepsekNigy,
      nipKepalaSekolah: officialKepsekNigy
    }));
  }, [officialKepsekNama, officialKepsekNigy]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleKopFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file gambar kop surat maksimal 10MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, kopSuratUrl: reader.result as string }));
        setLockLogoMessage('Berkas Kop Surat baru berhasil dipilih! Klik "Simpan Data Sekolah" di atas untuk mengunci dan menyimpan ke sistem.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveKop = () => {
    setFormData(prev => ({ ...prev, kopSuratUrl: undefined }));
  };

  const handleToggleLockLogoKop = async () => {
    const nextLocked = !formData.isLogoLocked;
    const finalizedInfo: SchoolInfo = {
      ...formData,
      isLogoLocked: nextLocked,
      kepalaSekolah: officialKepsekNama,
      nigyKepalaSekolah: officialKepsekNigy,
      nipKepalaSekolah: officialKepsekNigy
    };

    setFormData(prev => ({ ...prev, isLogoLocked: nextLocked }));
    onSave(finalizedInfo);
    StorageService.setSchoolInfo(finalizedInfo);

    if (nextLocked) {
      // Sync to Google Sheets so other devices automatically receive this logo & kop surat
      const sheetsConfig = StorageService.getSheetsConfig();
      if (sheetsConfig.webAppUrl) {
        setSyncingLogoToSheets(true);
        try {
          await pushToGoogleSheets(sheetsConfig.webAppUrl, { schoolInfo: finalizedInfo });
          setLockLogoMessage('Logo & Kop Surat Resmi Berhasil Dikunci & Disinkronkan ke Google Sheets!');
        } catch {
          setLockLogoMessage('Logo & Kop Surat Resmi Berhasil Dikunci di database lokal!');
        } finally {
          setSyncingLogoToSheets(false);
        }
      } else {
        setLockLogoMessage('Logo & Kop Surat Resmi Berhasil Dikunci!');
      }

      // Record in audit log
      StorageService.addAuditLog({
        userName: session?.name || 'Administrator',
        userRole: session?.role === 'admin' ? 'Administrator' : (session?.role || 'Admin'),
        action: 'UPDATE_PROFIL_SEKOLAH',
        module: 'Data Sekolah & Profil',
        details: `Mengunci & menetapkan Logo dan Kop Surat Resmi Sekolah secara permanen (Sinkron Lintas Perangkat).`,
        previousDataSummary: 'Status: Terbuka',
        newDataSummary: 'Status: Terkunci Permanen'
      });
      setLogs(StorageService.getAuditLogs());
    } else {
      setLockLogoMessage('Kunci dibuka. Anda sekarang dapat mengubah atau mengunggah gambar baru.');
    }

    setTimeout(() => setLockLogoMessage(null), 6000);
  };

  const handleMisiChange = (index: number, val: string) => {
    const currentMisi = Array.isArray(formData.misi) ? formData.misi : (initialSchoolInfo.misi || []);
    const updated = [...currentMisi];
    updated[index] = val;
    setFormData(prev => ({ ...prev, misi: updated }));
  };

  const addMisi = () => {
    const currentMisi = Array.isArray(formData.misi) ? formData.misi : (initialSchoolInfo.misi || []);
    setFormData(prev => ({ ...prev, misi: [...currentMisi, ''] }));
  };

  const removeMisi = (index: number) => {
    const currentMisi = Array.isArray(formData.misi) ? formData.misi : (initialSchoolInfo.misi || []);
    setFormData(prev => ({ ...prev, misi: currentMisi.filter((_, i) => i !== index) }));
  };

  const triggerSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalizedInfo: SchoolInfo = {
      ...formData,
      kepalaSekolah: officialKepsekNama,
      nigyKepalaSekolah: officialKepsekNigy,
      nipKepalaSekolah: officialKepsekNigy
    };

    const currentUserName = session?.name || 'Administrator';
    const currentUserRole = session?.role === 'admin' ? 'Administrator' : (session?.role || 'Admin');

    // 1. Audit Log: Sinkronisasi Tahun Ajaran / Semester
    const isTaChanged = finalizedInfo.tahunAjaran !== schoolInfo.tahunAjaran;
    const isSemChanged = finalizedInfo.semesterAktif !== schoolInfo.semesterAktif;
    if (isTaChanged || isSemChanged) {
      StorageService.addAuditLog({
        userName: currentUserName,
        userRole: currentUserRole,
        action: 'SYNC_TAHUN_AJARAN',
        module: 'Data Sekolah & Profil',
        semester: finalizedInfo.semesterAktif,
        details: `Sinkronisasi Tahun Ajaran & Semester: ${schoolInfo.tahunAjaran || '-'} (${schoolInfo.semesterAktif || '-'}) ➔ ${finalizedInfo.tahunAjaran} (${finalizedInfo.semesterAktif}). Otomatis tersinkronisasi ke PPDB, Rapor, Nilai, dan Jadwal.`,
        previousDataSummary: `Tahun Ajaran: ${schoolInfo.tahunAjaran || '-'} (Semester ${schoolInfo.semesterAktif || '-'})`,
        newDataSummary: `Tahun Ajaran: ${finalizedInfo.tahunAjaran} (Semester ${finalizedInfo.semesterAktif}) - Aktif`
      });
    }

    // 2. Audit Log: Perubahan / Pengukuhan Jabatan Kepala Sekolah
    const isKepsekChanged = finalizedInfo.kepalaSekolah !== schoolInfo.kepalaSekolah;
    const isNigyChanged = finalizedInfo.nigyKepalaSekolah !== schoolInfo.nigyKepalaSekolah;
    if (isKepsekChanged || isNigyChanged) {
      StorageService.addAuditLog({
        userName: currentUserName,
        userRole: currentUserRole,
        action: 'PERUBAHAN_KEPALA_SEKOLAH',
        module: 'Data Sekolah & Profil',
        details: `Pengukuhan / Perubahan Jabatan Kepala Sekolah: ${finalizedInfo.kepalaSekolah || '-'} (NIGY: ${finalizedInfo.nigyKepalaSekolah || '-'}), tersinkronisasi ke Rapor & Administrasi Resmi.`,
        previousDataSummary: `Kepala Sekolah: ${schoolInfo.kepalaSekolah || '-'} (NIGY: ${schoolInfo.nigyKepalaSekolah || '-'})`,
        newDataSummary: `Kepala Sekolah: ${finalizedInfo.kepalaSekolah || '-'} (NIGY: ${finalizedInfo.nigyKepalaSekolah || '-'})`
      });
    }

    // 3. Audit Log: Pembaruan Profil Sekolah
    const isProfileChanged =
      finalizedInfo.nama !== schoolInfo.nama ||
      finalizedInfo.npsn !== schoolInfo.npsn ||
      finalizedInfo.akreditasi !== schoolInfo.akreditasi ||
      finalizedInfo.logoUrl !== schoolInfo.logoUrl ||
      finalizedInfo.kopSuratUrl !== schoolInfo.kopSuratUrl ||
      finalizedInfo.alamat !== schoolInfo.alamat ||
      finalizedInfo.telepon !== schoolInfo.telepon ||
      finalizedInfo.email !== schoolInfo.email ||
      finalizedInfo.website !== schoolInfo.website ||
      finalizedInfo.visi !== schoolInfo.visi;

    if (isProfileChanged && !isTaChanged && !isKepsekChanged) {
      StorageService.addAuditLog({
        userName: currentUserName,
        userRole: currentUserRole,
        action: 'UPDATE_PROFIL_SEKOLAH',
        module: 'Data Sekolah & Profil',
        details: `Pembaruan data profil sekolah: ${finalizedInfo.nama} (NPSN: ${finalizedInfo.npsn}, Akreditasi: ${finalizedInfo.akreditasi}).`,
        previousDataSummary: `NPSN: ${schoolInfo.npsn} • Akred: ${schoolInfo.akreditasi}`,
        newDataSummary: `NPSN: ${finalizedInfo.npsn} • Akred: ${finalizedInfo.akreditasi}`
      });
    }

    setLogs(StorageService.getAuditLogs());
    onSave(finalizedInfo);
    StorageService.setSchoolInfo(finalizedInfo);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  // Filter logs relevant to Data Sekolah
  const schoolRelatedLogs = logs.filter(l => 
    l.module === 'Data Sekolah & Profil' || 
    ['SYNC_TAHUN_AJARAN', 'PERUBAHAN_KEPALA_SEKOLAH', 'UPDATE_PROFIL_SEKOLAH'].includes(l.action) ||
    (!l.module && ['SYNC_TAHUN_AJARAN', 'PERUBAHAN_KEPALA_SEKOLAH'].includes(l.action))
  );

  const filteredLogs = schoolRelatedLogs.filter(log => {
    const matchesFilter = logFilter === 'ALL' || log.action === logFilter;
    const q = logSearch.toLowerCase().trim();
    const matchesSearch = !q || 
      log.details.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      (log.previousDataSummary && log.previousDataSummary.toLowerCase().includes(q)) ||
      (log.newDataSummary && log.newDataSummary.toLowerCase().includes(q)) ||
      log.timestamp.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const handleExportLogsCSV = () => {
    const exportRows = filteredLogs.map((l, index) => ({
      No: index + 1,
      ID: l.id,
      Waktu_Audit: l.timestamp,
      Petugas_Admin: l.userName,
      Peran_Jabatan: l.userRole,
      Kategori_Aksi: l.action,
      Modul_Terkait: l.module,
      Semester: l.semester || '-',
      Rincian_Perubahan: l.details,
      Kondisi_Sebelum: l.previousDataSummary || '-',
      Kondisi_Sesudah: l.newDataSummary || '-'
    }));
    exportToCSV(`Log_Aktivitas_Data_Sekolah_${new Date().toISOString().slice(0, 10)}.csv`, exportRows);
  };

  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLogData.details.trim()) {
      alert('Silakan isi rincian catatan aktivitas.');
      return;
    }

    StorageService.addAuditLog({
      userName: session?.name || 'Administrator',
      userRole: session?.role === 'admin' ? 'Administrator' : (session?.role || 'Admin'),
      action: manualLogData.action,
      module: 'Data Sekolah & Profil',
      details: manualLogData.details.trim(),
      previousDataSummary: manualLogData.previousDataSummary.trim() || undefined,
      newDataSummary: manualLogData.newDataSummary.trim() || undefined
    });

    setLogs(StorageService.getAuditLogs());
    setIsManualModalOpen(false);
    setManualLogData({
      action: 'SYNC_TAHUN_AJARAN',
      details: '',
      previousDataSummary: '',
      newDataSummary: ''
    });
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SYNC_TAHUN_AJARAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[11px] font-bold">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sinkronisasi Tahun Ajaran</span>
          </span>
        );
      case 'PERUBAHAN_KEPALA_SEKOLAH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/40 text-[11px] font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Jabatan Kepala Sekolah</span>
          </span>
        );
      case 'UPDATE_PROFIL_SEKOLAH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-bold">
            <School className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pembaruan Profil Sekolah</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/10 text-[11px] font-bold">
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>{action}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* HEADER UTAMA TERPADU: IDENTITAS & AKSI CEPAT */}
      <div className="glass backdrop-blur-xl bg-slate-900/70 rounded-2xl p-6 border border-white/10 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <School className="w-3.5 h-3.5 text-emerald-400" />
                Master Data Profil
              </span>
              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded border border-white/10">
                NPSN: {formData.npsn || schoolInfo.npsn}
              </span>
              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/20">
                Akreditasi {formData.akreditasi || schoolInfo.akreditasi}
              </span>
              <span className="text-xs font-bold bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                TA {formData.tahunAjaran} ({formData.semesterAktif})
              </span>
            </div>
            
            <h2 className="text-2xl font-bold font-serif text-white tracking-tight">
              {formData.nama || schoolInfo.nama || 'SMP PLUS DAARUL MUTTAQIEN'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pusat konfigurasi profil resmi, legalitas kependidikan, banner kop rapor, visi misi, serta audit riwayat perubahan institusi.
            </p>
          </div>

          {/* Quick Action Button & Status */}
          <div className="flex items-center gap-3 shrink-0">
            {savedSuccess ? (
              <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-4 py-2.5 rounded-xl text-xs font-bold animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Data Berhasil Disimpan!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => triggerSave()}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-300/50 cursor-pointer hover:scale-[1.02]"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Data Sekolah</span>
              </button>
            )}
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveSubTab('profil')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'profil'
                ? 'bg-emerald-500 text-slate-950 shadow-md border border-emerald-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Profil &amp; Legalitas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('logo-kop')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'logo-kop'
                ? 'bg-emerald-500 text-slate-950 shadow-md border border-emerald-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Logo &amp; Kop Rapor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('visi-misi')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'visi-misi'
                ? 'bg-emerald-500 text-slate-950 shadow-md border border-emerald-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Visi &amp; Misi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('audit')}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'audit'
                ? 'bg-cyan-500 text-slate-950 shadow-md border border-cyan-400'
                : 'bg-slate-950/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Log &amp; Riwayat ({schoolRelatedLogs.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PROFIL & LEGALITAS */}
      {activeSubTab === 'profil' && (
        <form onSubmit={triggerSave} className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          
          {/* Identitas Legalitas */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <School className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-serif text-white uppercase tracking-wider">
                1. Legalitas &amp; Pengaturan Tahun Ajaran
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama Resmi Sekolah</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">NPSN (Nomor Pokok Sekolah Nasional)</label>
                <input
                  type="text"
                  name="npsn"
                  value={formData.npsn}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Status Akreditasi</label>
                <input
                  type="text"
                  name="akreditasi"
                  value={formData.akreditasi}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-300">
                    Tahun Ajaran Aktif (Master TA)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    ⚡ Auto-Sync
                  </span>
                </div>
                <input
                  type="text"
                  name="tahunAjaran"
                  value={formData.tahunAjaran}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: 2026/2027"
                  className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm font-mono"
                />
                <p className="text-[11px] text-emerald-200/90 leading-tight">
                  Tersinkronisasi otomatis ke PPDB, Nilai &amp; Rapor, Presensi, dan Jadwal Pelajaran.
                </p>
              </div>

              <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-300">
                    Semester Aktif
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    ⚡ Auto-Sync
                  </span>
                </div>
                <select
                  name="semesterAktif"
                  value={formData.semesterAktif}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                >
                  <option value="Ganjil" className="bg-white text-slate-900">Semester Ganjil</option>
                  <option value="Genap" className="bg-white text-slate-900">Semester Genap</option>
                </select>
                <p className="text-[11px] text-emerald-200/90 leading-tight">
                  Semester aktif yang digunakan di seluruh laporan dan kalkulasi asesmen.
                </p>
              </div>
            </div>

            {/* Sync Indicators */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-slate-200">
                  Sinkronisasi Terpadu dengan Master TA <span className="text-amber-300 font-mono">[{formData.tahunAjaran}]</span>:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                  ✓ PPDB Online
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                  ✓ Nilai &amp; Rapor (Sem. {formData.semesterAktif})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                  ✓ Presensi Siswa
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                  ✓ Jadwal KBM
                </span>
              </div>
            </div>
          </div>

          {/* Pimpinan Sekolah (Kepala Sekolah) */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold font-serif text-white uppercase tracking-wider">
                  2. Pimpinan Sekolah (Kepala Sekolah)
                </h3>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terkunci dari Data Guru</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 p-5 rounded-2xl border border-emerald-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                    <Crown className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold font-serif text-white">
                      {officialKepsekNama || 'Belum Ditentukan di Data Guru'}
                    </h4>
                    <p className="text-xs text-emerald-200/80">
                      Penanggung jawab resmi akademik, legalitas, tanda tangan rapor, dan administrasi sekolah
                    </p>
                  </div>
                </div>

                {onNavigateToTeachers && (
                  <button
                    type="button"
                    onClick={onNavigateToTeachers}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-bold transition-all shrink-0 hover:scale-[1.02] shadow-sm cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span>Ubah di Data Guru</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
                  <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Nama Lengkap &amp; Gelar</span>
                  <span className="text-sm font-bold text-white block truncate">{officialKepsekNama}</span>
                </div>
                <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
                  <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">NIGY / NIP (Tanda Tangan Rapor)</span>
                  <span className="text-sm font-bold font-mono text-emerald-300 block">{officialKepsekNigy || '-'}</span>
                </div>
                <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
                  <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">NUPTK Nasional</span>
                  <span className="text-sm font-bold font-mono text-slate-200 block">{officialKepsekNuptk || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Kontak & Lokasi */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-serif text-white uppercase tracking-wider">
                3. Kontak &amp; Lokasi Sekolah
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Email Resmi
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  Website Resmi
                </label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Alamat Lengkap Sekolah
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-300/50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil &amp; Legalitas</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 2: LOGO & KOP SURAT RESMI */}
      {activeSubTab === 'logo-kop' && (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
                  <span>Logo Resmi &amp; Banner Kop Surat Rapor</span>
                  {formData.isLogoLocked ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      Terkunci Resmi
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Unlock className="w-3 h-3 text-amber-400" />
                      Mode Edit
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300">
                  Logo sistem digunakan pada navbar web. Banner Kop Surat resmi digunakan khusus untuk mencetak Rapor &amp; Berkas Arsip Sekolah.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleLockLogoKop}
                disabled={syncingLogoToSheets}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow cursor-pointer ${
                  formData.isLogoLocked
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50 hover:bg-emerald-500/30'
                    : 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 border-amber-300'
                }`}
                title={formData.isLogoLocked ? 'Buka kunci untuk mengedit atau mengunggah ulang logo/kop surat' : 'Kunci proteksi agar logo dan kop surat permanen di semua perangkat'}
              >
                {formData.isLogoLocked ? <Lock className="w-4 h-4 text-emerald-300" /> : <Unlock className="w-4 h-4 text-slate-950" />}
                <span>{formData.isLogoLocked ? 'Kunci Proteksi Aktif' : 'Kunci & Amankan Sekarang'}</span>
              </button>
            </div>
          </div>

          {lockLogoMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-400/50 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-semibold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{lockLogoMessage}</span>
            </div>
          )}

          {/* DUA KARTU VISUAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* KARTU 1: LOGO RESMI SEKOLAH */}
            <div className="lg:col-span-5 bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold font-serif text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    1. Logo Resmi Sekolah (Web &amp; Profil)
                  </span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-400/20">
                    Bawaan Permanen
                  </span>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/90 p-4 rounded-xl border border-white/10">
                  <div className="w-20 h-20 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 border-2 border-emerald-500/40 shadow-lg overflow-hidden">
                    <img 
                      src={formData.logoUrl || '/assets/aistudio/LOGO_SMP_c07d666e.PNG'} 
                      alt="Logo Resmi SMP PLUS DAARUL MUTTAQIEN" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-white font-serif truncate">{formData.nama || 'SMP PLUS DAARUL MUTTAQIEN'}</p>
                    <p className="text-[11px] text-emerald-300 font-medium">Sistem Informasi Manajemen Sekolah</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30 font-mono">
                        LOGO_SMP.PNG
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Lokasi Berkas Logo:
                  </label>
                  <input
                    type="text"
                    name="logoUrl"
                    value={formData.logoUrl || '/assets/aistudio/LOGO_SMP_c07d666e.PNG'}
                    readOnly={formData.isLogoLocked}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                      formData.isLogoLocked
                        ? 'bg-slate-900 text-emerald-300 border border-emerald-500/30 cursor-default'
                        : 'bg-white text-slate-900 border border-slate-300 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Logo resmi telah tersimpan permanen di direktori aset web dan otomatis tampil di seluruh halaman.
                  </p>
                </div>
              </div>

              {!formData.isLogoLocked && (
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '/assets/aistudio/LOGO_SMP_c07d666e.PNG' }))}
                    className="text-xs text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    Pulihkan Logo Asli Bawaan
                  </button>
                </div>
              )}
            </div>

            {/* KARTU 2: BANNER KOP SURAT RESMI (CETAK RAPOR) */}
            <div className="lg:col-span-7 bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold font-serif text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    2. Banner Kop Surat Resmi (Cetak Rapor)
                  </span>
                  <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    Format Asli Arsip Fisik
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Gambar Kop Surat resmi ini langsung dicetak pada lembar Rapor Siswa di menu <strong>Laporan Rapor</strong> sesuai arsip fisik sekolah Anda tanpa merubah detail bentuk maupun warna.
                </p>

                {/* Upload & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer flex items-center gap-2 font-bold text-xs px-3.5 py-2 rounded-xl shadow transition-all bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300/50">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Berkas Kop Baru...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleKopFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, kopSuratUrl: '/assets/aistudio/Surat_Aktif_Nada_001_415335d4.png' }));
                      setLockLogoMessage('Kop Surat Resmi Asli (Surat Aktif Nada) berhasil dimuat!');
                    }}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold px-3 py-2 rounded-xl border border-cyan-400/30 transition-all cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Muat Kop Surat Resmi Asli</span>
                  </button>

                  {formData.kopSuratUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveKop}
                      className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold px-3 py-2 rounded-xl border border-rose-500/30 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>

                {/* Live Preview Banner Kop Surat */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Pratinjau Hasil Cetak Rapor dengan Kop Surat Ini:
                  </span>
                  <div className="bg-white rounded-xl p-3 border-2 border-slate-300 text-slate-900 shadow-inner">
                    {formData.kopSuratUrl ? (
                      <div className="w-full">
                        <img 
                          src={formData.kopSuratUrl} 
                          alt="Pratinjau Kop Surat Resmi SMP PLUS DAARUL MUTTAQIEN" 
                          className="w-full max-h-24 object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="text-center py-3 text-xs text-slate-400">
                        Belum ada gambar kop surat khusus. Menggunakan kop teks bawaan.
                      </div>
                    )}
                    <div className="border-t border-slate-200 mt-2 pt-2 text-center">
                      <p className="text-[11px] font-bold text-slate-800 font-serif">LAPORAN HASIL BELAJAR SISWA (RAPOR)</p>
                      <p className="text-[9px] text-slate-500">Tahun Ajaran {formData.tahunAjaran} • Semester {formData.semesterAktif || 'Ganjil'}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => triggerSave()}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-300/50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Logo &amp; Kop</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: VISI & MISI */}
      {activeSubTab === 'visi-misi' && (
        <form onSubmit={triggerSave} className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold font-serif text-white uppercase tracking-wider">
              Visi &amp; Misi Pendidikan
            </h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Visi Utama Sekolah</label>
              <textarea
                name="visi"
                value={formData.visi}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-serif font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300">Butir-butir Misi Sekolah</label>
                <button
                  type="button"
                  onClick={addMisi}
                  className="text-xs font-bold text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Butir Misi</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {(formData.misi || []).map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 w-6 text-center">{idx + 1}.</span>
                    <input
                      type="text"
                      value={m}
                      onChange={(e) => handleMisiChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    {(formData.misi || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMisi(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 font-bold cursor-pointer"
                        title="Hapus butir misi"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-300/50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Visi &amp; Misi</span>
            </button>
          </div>
        </form>
      )}

      {/* SUB-TAB 4: LOG & AUDIT RIWAYAT */}
      {activeSubTab === 'audit' && (
        <div className="glass backdrop-blur-xl bg-slate-900/70 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
          
          {/* Header & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-inner">
                <History className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                  Log Aktivitas &amp; Riwayat Perubahan
                </h3>
                <p className="text-xs text-slate-300">
                  Pencatatan riwayat perubahan administratif secara transparan (sinkronisasi TA, Kepala Sekolah, profil, dan berkas kop).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLogs(StorageService.getAuditLogs())}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-white/10 transition-colors cursor-pointer"
                title="Segarkan riwayat log"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Segarkan</span>
              </button>

              <button
                type="button"
                onClick={handleExportLogsCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-400/30 transition-colors cursor-pointer shadow-sm"
                title="Unduh laporan log format CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ekspor CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer border border-cyan-400/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Catatan Manual</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-white/10">
              <span className="text-[11px] text-slate-400 block font-medium">Total Riwayat Sekolah</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">{schoolRelatedLogs.length}</span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-cyan-500/30">
              <span className="text-[11px] text-cyan-300 block font-medium">Sinkronisasi TA / Sem</span>
              <span className="text-xl font-bold font-mono text-cyan-300 mt-1 block">
                {schoolRelatedLogs.filter(l => l.action === 'SYNC_TAHUN_AJARAN').length}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-purple-500/30">
              <span className="text-[11px] text-purple-300 block font-medium">Kepala Sekolah</span>
              <span className="text-xl font-bold font-mono text-purple-300 mt-1 block">
                {schoolRelatedLogs.filter(l => l.action === 'PERUBAHAN_KEPALA_SEKOLAH').length}
              </span>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-emerald-500/30">
              <span className="text-[11px] text-emerald-300 block font-medium">Profil &amp; Legalitas</span>
              <span className="text-xl font-bold font-mono text-emerald-300 mt-1 block">
                {schoolRelatedLogs.filter(l => l.action === 'UPDATE_PROFIL_SEKOLAH').length}
              </span>
            </div>
          </div>

          {/* Filter & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-white/10">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setLogFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  logFilter === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                Semua ({schoolRelatedLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('SYNC_TAHUN_AJARAN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  logFilter === 'SYNC_TAHUN_AJARAN'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                ⚡ TA / Sem ({schoolRelatedLogs.filter(l => l.action === 'SYNC_TAHUN_AJARAN').length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('PERUBAHAN_KEPALA_SEKOLAH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  logFilter === 'PERUBAHAN_KEPALA_SEKOLAH'
                    ? 'bg-purple-500 text-white shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                👑 Kepsek ({schoolRelatedLogs.filter(l => l.action === 'PERUBAHAN_KEPALA_SEKOLAH').length})
              </button>
              <button
                type="button"
                onClick={() => setLogFilter('UPDATE_PROFIL_SEKOLAH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  logFilter === 'UPDATE_PROFIL_SEKOLAH'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }`}
              >
                🏫 Profil ({schoolRelatedLogs.filter(l => l.action === 'UPDATE_PROFIL_SEKOLAH').length})
              </button>
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Cari rincian, admin, tanggal..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 text-white placeholder-slate-400 text-xs rounded-lg border border-white/10 focus:outline-none focus:border-cyan-400"
              />
              {logSearch && (
                <button
                  type="button"
                  onClick={() => setLogSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Timeline Cards */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                <History className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Tidak ada riwayat aktivitas yang cocok</p>
                <p className="text-xs text-slate-400">
                  Riwayat akan tercatat otomatis setiap kali terjadi sinkronisasi tahun ajaran atau pembaruan data profil.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div 
                  key={log.id}
                  className="bg-slate-950/70 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {getActionBadge(log.action)}
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-white/10">
                        {log.module || 'Data Sekolah & Profil'}
                      </span>
                      {log.semester && (
                        <span className="text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                          Semester {log.semester}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="w-3 h-3 text-slate-400" />
                        <strong className="text-slate-200">{log.userName}</strong>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-white/5">
                          {log.userRole}
                        </span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                    {log.details}
                  </p>

                  {(log.previousDataSummary || log.newDataSummary) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
                      {log.previousDataSummary && (
                        <div className="p-2.5 bg-rose-950/30 rounded-lg border border-rose-500/20 text-rose-200">
                          <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">
                            Kondisi Sebelumnya:
                          </span>
                          <span className="font-mono">{log.previousDataSummary}</span>
                        </div>
                      )}
                      {log.newDataSummary && (
                        <div className="p-2.5 bg-emerald-950/30 rounded-lg border border-emerald-500/20 text-emerald-200">
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                            Kondisi Baru (Hasil Perubahan):
                          </span>
                          <span className="font-mono">{log.newDataSummary}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* MODAL: TAMBAH CATATAN RIWAYAT MANUAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold font-serif text-white">
                  Tambah Catatan Log Aktivitas Manual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Kategori Perubahan</label>
                <select
                  value={manualLogData.action}
                  onChange={(e) => setManualLogData(prev => ({ ...prev, action: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="SYNC_TAHUN_AJARAN">⚡ Sinkronisasi Tahun Ajaran / Semester</option>
                  <option value="PERUBAHAN_KEPALA_SEKOLAH">👑 Perubahan / Penetapan Kepala Sekolah</option>
                  <option value="UPDATE_PROFIL_SEKOLAH">🏫 Pembaruan Profil &amp; Legalitas Sekolah</option>
                  <option value="LAINNYA">📋 Catatan Administratif Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Rincian Perubahan / Catatan Transparansi</label>
                <textarea
                  required
                  rows={3}
                  value={manualLogData.details}
                  onChange={(e) => setManualLogData(prev => ({ ...prev, details: e.target.value }))}
                  placeholder="Contoh: Berdasarkan SK Yayasan No. 05/2026 tanggal 15 Juli 2026, telah disepakati penetapan..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Ringkasan Sebelum (Opsional)</label>
                  <input
                    type="text"
                    value={manualLogData.previousDataSummary}
                    onChange={(e) => setManualLogData(prev => ({ ...prev, previousDataSummary: e.target.value }))}
                    placeholder="Contoh: TA 2024/2025"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-white/15 rounded-lg text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Ringkasan Sesudah (Opsional)</label>
                  <input
                    type="text"
                    value={manualLogData.newDataSummary}
                    onChange={(e) => setManualLogData(prev => ({ ...prev, newDataSummary: e.target.value }))}
                    placeholder="Contoh: TA 2026/2027 Aktif"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-white/15 rounded-lg text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  Simpan Catatan Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
