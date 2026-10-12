import React, { useState, useMemo } from 'react';
import { Student, SchoolInfo, UserSession } from '../../types';
import { StorageService } from '../../services/storage';
import {
  GraduationCap,
  CheckSquare,
  Square,
  Users,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Printer,
  Search,
  Filter,
  FileCheck,
  ChevronRight,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { SuratKeteranganLulusModal } from './SuratKeteranganLulusModal';

interface KelulusanSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSaveStudents: (students: Student[]) => void;
  schoolInfo: SchoolInfo;
  session?: UserSession;
  classes: string[];
}

export const KelulusanSiswaModal: React.FC<KelulusanSiswaModalProps> = ({
  isOpen,
  onClose,
  students,
  onSaveStudents,
  schoolInfo,
  session,
  classes
}) => {
  const [activeTab, setActiveTab] = useState<'luluskan' | 'alumni'>('luluskan');

  // Detect final grade classes (class names containing '9' or 'IX' or the last class in list)
  const defaultTargetClass = useMemo(() => {
    const class9 = classes.find(c => c.trim() === '9' || c.startsWith('9') || c.toUpperCase().includes('IX'));
    return class9 || classes[classes.length - 1] || '9';
  }, [classes]);

  const [selectedClass, setSelectedClass] = useState<string>(defaultTargetClass);

  // Filter students in the selected class
  const classStudents = useMemo(() => {
    return students.filter(s => s.kelas === selectedClass);
  }, [students, selectedClass]);

  const activeStudentsInClass = useMemo(() => {
    return classStudents.filter(s => s.status === 'Aktif');
  }, [classStudents]);

  const alreadyGraduatedInClass = useMemo(() => {
    return classStudents.filter(s => s.status === 'Lulus');
  }, [classStudents]);

  // Selected student IDs for bulk graduation
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(() => {
    return activeStudentsInClass.map(s => s.id);
  });

  // When selected class changes, select all active students in that class by default
  React.useEffect(() => {
    const active = students.filter(s => s.kelas === selectedClass && s.status === 'Aktif');
    setSelectedStudentIds(active.map(s => s.id));
  }, [selectedClass, students]);

  // Graduation Form settings
  const currentYear = new Date().getFullYear();
  const [tahunLulus, setTahunLulus] = useState<string>(schoolInfo.tahunAjaran || `${currentYear - 1}/${currentYear}`);
  const [tanggalLulus, setTanggalLulus] = useState<string>(new Date().toISOString().split('T')[0]);
  const [nomorSkPrefix, setNomorSkPrefix] = useState<string>(`421.3/088/SMP-AQ/VI/${currentYear}`);
  const [keteranganLulus, setKeteranganLulus] = useState<string>('Lulus Memenuhi Kriteria Kelulusan Satuan Pendidikan (SKSP)');
  const [autoGenerateSklNo, setAutoGenerateSklNo] = useState<boolean>(true);

  // Alumni management search & filter
  const [alumniSearch, setAlumniSearch] = useState<string>('');
  const [selectedAlumniForSkl, setSelectedAlumniForSkl] = useState<Student | null>(null);
  const [isSklModalOpen, setIsSklModalOpen] = useState<boolean>(false);

  // Single edit alumni modal state
  const [editingAlumni, setEditingAlumni] = useState<Student | null>(null);
  const [editAlumniForm, setEditAlumniForm] = useState({
    nomorIjazah: '',
    nomorSkl: '',
    sekolahLanjutan: '',
    tahunLulus: '',
    tanggalLulus: '',
    keteranganLulus: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Toggle single selection
  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.length === activeStudentsInClass.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(activeStudentsInClass.map(s => s.id));
    }
  };

  // Execute Graduation Process
  const handleExecuteGraduation = () => {
    if (selectedStudentIds.length === 0) {
      showNotification('Silakan pilih minimal 1 siswa yang akan diluluskan.', 'error');
      return;
    }

    const confirmMsg = `Konfirmasi Kelulusan:\n\nApakah Anda yakin ingin MELULUSKAN ${selectedStudentIds.length} santri/siswa dari Kelas ${selectedClass}?\n\nSiswa yang diluluskan akan berganti status menjadi 'Lulus' (Alumni) dan diterbitkan riwayat kelulusannya.`;
    if (!window.confirm(confirmMsg)) return;

    const updatedStudents = students.map(student => {
      if (selectedStudentIds.includes(student.id)) {
        const sklNo = autoGenerateSklNo
          ? `421.3/${student.nis || '001'}/SMP-AQ/SKL/${tahunLulus.replace('/', '-')}`
          : student.nomorSkl || nomorSkPrefix;

        return {
          ...student,
          status: 'Lulus' as const,
          tahunLulus: tahunLulus,
          tanggalLulus: tanggalLulus,
          nomorSkl: sklNo,
          keteranganLulus: keteranganLulus
        };
      }
      return student;
    });

    onSaveStudents(updatedStudents);

    // Audit Log Trail
    StorageService.addAuditLog({
      userName: session?.name || 'Admin DAPODIK',
      userRole: session?.role === 'admin' ? 'Admin DAPODIK' : 'Kepala Sekolah / Waka Kesiswaan',
      action: 'KELULUSAN_SISWA',
      module: 'Data Siswa & Alumni',
      details: `Meluluskan ${selectedStudentIds.length} santri dari Kelas ${selectedClass} untuk Tahun Ajaran ${tahunLulus}.`,
      previousDataSummary: `${selectedStudentIds.length} Siswa Aktif di Kelas ${selectedClass}`,
      newDataSummary: `${selectedStudentIds.length} Siswa Berstatus Lulus (Alumni)`
    });

    showNotification(`Alhamdulillah! Berhasil meluluskan ${selectedStudentIds.length} siswa dari Kelas ${selectedClass}. Data telah diperbarui.`, 'success');
    setSelectedStudentIds([]);
    setActiveTab('alumni');
  };

  // Revert Graduation (Batalkan Status Lulus)
  const handleRevertGraduation = (student: Student) => {
    const confirmMsg = `Batalkan Kelulusan:\n\nApakah Anda yakin ingin membatalkan status kelulusan untuk ${student.nama} (NISN: ${student.nisn}) dan mengembalikannya ke status 'Aktif'?`;
    if (!window.confirm(confirmMsg)) return;

    const updatedStudents = students.map(s => {
      if (s.id === student.id) {
        return {
          ...s,
          status: 'Aktif' as const,
          keteranganLulus: undefined
        };
      }
      return s;
    });

    onSaveStudents(updatedStudents);

    StorageService.addAuditLog({
      userName: session?.name || 'Admin DAPODIK',
      userRole: session?.role === 'admin' ? 'Admin DAPODIK' : 'Waka Kesiswaan',
      action: 'BATALKAN_KELULUSAN',
      module: 'Data Siswa & Alumni',
      details: `Membatalkan status kelulusan siswa ${student.nama} (${student.nisn}) kembali menjadi Aktif di Kelas ${student.kelas}.`,
      previousDataSummary: `Status: Lulus (${student.tahunLulus || '-'})`,
      newDataSummary: `Status: Aktif (Kelas ${student.kelas})`
    });

    showNotification(`Status kelulusan ${student.nama} telah dibatalkan dan kembali Aktif di Kelas ${student.kelas}.`, 'info');
  };

  // Open Edit Alumni Data
  const handleOpenEditAlumni = (student: Student) => {
    setEditingAlumni(student);
    setEditAlumniForm({
      nomorIjazah: student.nomorIjazah || '',
      nomorSkl: student.nomorSkl || '',
      sekolahLanjutan: student.sekolahLanjutan || '',
      tahunLulus: student.tahunLulus || tahunLulus,
      tanggalLulus: student.tanggalLulus || tanggalLulus,
      keteranganLulus: student.keteranganLulus || ''
    });
  };

  // Save Edit Alumni Data
  const handleSaveEditAlumni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlumni) return;

    const updated = students.map(s => {
      if (s.id === editingAlumni.id) {
        return {
          ...s,
          nomorIjazah: editAlumniForm.nomorIjazah.trim() || undefined,
          nomorSkl: editAlumniForm.nomorSkl.trim() || undefined,
          sekolahLanjutan: editAlumniForm.sekolahLanjutan.trim() || undefined,
          tahunLulus: editAlumniForm.tahunLulus.trim() || undefined,
          tanggalLulus: editAlumniForm.tanggalLulus.trim() || undefined,
          keteranganLulus: editAlumniForm.keteranganLulus?.trim() || undefined
        };
      }
      return s;
    });

    onSaveStudents(updated);
    showNotification(`Data kelulusan ${editingAlumni.nama} berhasil diperbarui.`, 'success');
    setEditingAlumni(null);
  };

  // Manual Alumni Addition State & Handlers
  const [isAddingManualAlumni, setIsAddingManualAlumni] = useState(false);
  const [manualAlumniForm, setManualAlumniForm] = useState({
    nama: '',
    nisn: '',
    nis: '',
    gender: 'L' as 'L' | 'P',
    kelas: '9',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: `${currentYear - 15}-05-15`,
    namaOrangTua: '',
    alamat: 'Banyuwangi',
    tahunLulus: tahunLulus || `${currentYear - 1}/${currentYear}`,
    tanggalLulus: tanggalLulus || new Date().toISOString().split('T')[0],
    nomorIjazah: '',
    nomorSkl: '',
    sekolahLanjutan: '',
    keteranganLulus: 'Lulus Memenuhi Kriteria Kelulusan Satuan Pendidikan'
  });

  const handleOpenAddManualAlumni = () => {
    const prevYearShort = (currentYear - 1).toString().slice(-2);
    setManualAlumniForm({
      nama: '',
      nisn: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      nis: `${prevYearShort}07${Math.floor(100 + Math.random() * 899)}`,
      gender: 'L',
      kelas: classes.find(c => c === '9' || c.startsWith('9')) || '9',
      tempatLahir: 'Banyuwangi',
      tanggalLahir: `${currentYear - 15}-05-15`,
      namaOrangTua: '',
      alamat: 'Banyuwangi',
      tahunLulus: tahunLulus || `${currentYear - 1}/${currentYear}`,
      tanggalLulus: tanggalLulus || new Date().toISOString().split('T')[0],
      nomorIjazah: `DN-05/D-SMP/K13/${currentYear.toString().slice(-2)}/00${Math.floor(1000 + Math.random() * 9000)}`,
      nomorSkl: `SKL/${schoolInfo?.npsn || '20525621'}/${currentYear}/${Math.floor(100 + Math.random() * 899)}`,
      sekolahLanjutan: '',
      keteranganLulus: 'Lulus Memenuhi Kriteria Kelulusan Satuan Pendidikan'
    });
    setIsAddingManualAlumni(true);
  };

  const handleSaveManualAlumni = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAlumniForm.nama.trim() || !manualAlumniForm.nisn.trim()) {
      showNotification('Nama siswa dan NISN wajib diisi!', 'error');
      return;
    }
    const newStudent: Student = {
      id: `ALM${Date.now().toString().slice(-5)}`,
      nisn: manualAlumniForm.nisn.trim(),
      nis: manualAlumniForm.nis.trim() || `${(currentYear - 3).toString().slice(-2)}07000`,
      nama: manualAlumniForm.nama.trim(),
      gender: manualAlumniForm.gender,
      kelas: manualAlumniForm.kelas || '9',
      tempatLahir: manualAlumniForm.tempatLahir || 'Banyuwangi',
      tanggalLahir: manualAlumniForm.tanggalLahir,
      namaOrangTua: manualAlumniForm.namaOrangTua || 'Wali Santri',
      noHpOrangTua: '',
      alamat: manualAlumniForm.alamat || 'Banyuwangi',
      status: 'Lulus',
      tahunLulus: manualAlumniForm.tahunLulus,
      tanggalLulus: manualAlumniForm.tanggalLulus,
      nomorIjazah: manualAlumniForm.nomorIjazah.trim() || undefined,
      nomorSkl: manualAlumniForm.nomorSkl.trim() || undefined,
      sekolahLanjutan: manualAlumniForm.sekolahLanjutan.trim() || undefined,
      keteranganLulus: manualAlumniForm.keteranganLulus.trim() || 'Lulus Memenuhi Kriteria Kelulusan Satuan Pendidikan'
    };
    onSaveStudents([...students, newStudent]);
    StorageService.addAuditLog({
      userName: session?.name || 'Admin DAPODIK',
      userRole: session?.role === 'admin' ? 'Admin DAPODIK' : 'Kepala Sekolah / Waka Kesiswaan',
      action: 'KELULUSAN_SISWA',
      module: 'Data Siswa & Alumni',
      details: `Menambahkan alumni manual: ${newStudent.nama} (${newStudent.nisn}) Angkatan ${newStudent.tahunLulus}`,
      previousDataSummary: 'Data Baru',
      newDataSummary: `Alumni Terdaftar: ${newStudent.nama}`
    });
    showNotification(`Alumni ${newStudent.nama} berhasil ditambahkan secara manual!`, 'success');
    setIsAddingManualAlumni(false);
  };

  // All graduated alumni across all classes
  const allAlumni = useMemo(() => {
    return students.filter(s => s.status === 'Lulus');
  }, [students]);

  // Filtered alumni for tab 2
  const filteredAlumni = useMemo(() => {
    return allAlumni.filter(s => {
      const matchSearch =
        s.nama.toLowerCase().includes(alumniSearch.toLowerCase()) ||
        s.nisn.includes(alumniSearch) ||
        s.nis.includes(alumniSearch) ||
        (s.nomorIjazah && s.nomorIjazah.toLowerCase().includes(alumniSearch.toLowerCase())) ||
        (s.sekolahLanjutan && s.sekolahLanjutan.toLowerCase().includes(alumniSearch.toLowerCase()));
      return matchSearch;
    });
  }, [allAlumni, alumniSearch]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-900 to-slate-900 text-white gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold font-serif text-lg text-white">
                    Kelulusan Siswa Kelas Akhir (Alumni)
                  </h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Tahun Ajaran {schoolInfo.tahunAjaran}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Proses kelulusan berkas peserta didik tingkat akhir (Kelas 9), penerbitan SKL, dan buku induk alumni
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="self-end sm:self-center p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2">
            <button
              onClick={() => setActiveTab('luluskan')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'luluskan'
                  ? 'border-emerald-700 text-emerald-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>Formulir Kelulusan Kelas Akhir</span>
              {activeStudentsInClass.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                  {activeStudentsInClass.length} Aktif
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('alumni')}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'alumni'
                  ? 'border-emerald-700 text-emerald-900 bg-white shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Daftar Alumni / Siswa Sudah Lulus</span>
              <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px]">
                {allAlumni.length} Santri
              </span>
            </button>
          </div>

          {/* Notification Alert */}
          {notification && (
            <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : notification.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-b border-rose-200'
                : 'bg-blue-50 text-blue-800 border-b border-blue-200'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification.message}</span>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB 1: FORMULIR KELULUSAN */}
            {activeTab === 'luluskan' && (
              <div className="space-y-6">
                
                {/* 1. Class Selector & Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-1 space-y-3">
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Pilih Rombel / Kelas Akhir:
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {classes.map(c => (
                        <option key={c} value={c}>
                          Kelas {c} {c === '9' || c.startsWith('9') ? '⭐ (Tingkat Akhir)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Pilih rombongan belajar tingkat IX yang telah menyelesaikan seluruh program pembelajaran dan ujian satuan pendidikan.
                    </p>
                  </div>

                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 md:col-span-2 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-800" />
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                          Statistik Peserta Didik Kelas {selectedClass}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-900">
                        Total {classStudents.length} Siswa
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 my-2">
                      <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-center">
                        <div className="text-lg font-black text-slate-900">{activeStudentsInClass.length}</div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase">Aktif (Siap Lulus)</div>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-center">
                        <div className="text-lg font-black text-slate-900">{alreadyGraduatedInClass.length}</div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase">Sudah Lulus</div>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-center">
                        <div className="text-lg font-black text-emerald-700">{selectedStudentIds.length}</div>
                        <div className="text-[10px] font-bold text-emerald-900 uppercase">Tercentang</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-emerald-800">
                      💡 <strong>Catatan:</strong> Siswa yang telah diluluskan akan otomatis berstatus <em>Lulus</em> dan tidak lagi muncul di presensi harian atau penilaian rombel reguler.
                    </p>
                  </div>
                </div>

                {/* 2. Metadata Kelulusan */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Konfigurasi Atribut Kelulusan Resmi</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tahun Ajaran Kelulusan / Angkatan
                      </label>
                      <input
                        type="text"
                        value={tahunLulus}
                        onChange={(e) => setTahunLulus(e.target.value)}
                        placeholder="contoh: 2024/2025"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tanggal Resmi Pengumuman / SK Kelulusan
                      </label>
                      <input
                        type="date"
                        value={tanggalLulus}
                        onChange={(e) => setTanggalLulus(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nomor SK Kelulusan Satuan Pendidikan
                      </label>
                      <input
                        type="text"
                        value={nomorSkPrefix}
                        onChange={(e) => setNomorSkPrefix(e.target.value)}
                        placeholder="421.3/088/SMP-AQ/VI/2026"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={autoGenerateSklNo}
                        onChange={(e) => setAutoGenerateSklNo(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                      />
                      <span>Otomatis buatkan Nomor Surat Keterangan Lulus (SKL) unik per siswa (Format: 421.3/[NIS]/SMP-AQ/SKL/[TA])</span>
                    </label>

                    <input
                      type="text"
                      value={keteranganLulus}
                      onChange={(e) => setKeteranganLulus(e.target.value)}
                      placeholder="Catatan Kelulusan..."
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 sm:w-80"
                    />
                  </div>
                </div>

                {/* 3. Interactive Student Checklist Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        disabled={activeStudentsInClass.length === 0}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 hover:text-emerald-700 disabled:opacity-50"
                      >
                        {selectedStudentIds.length === activeStudentsInClass.length && activeStudentsInClass.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span>Pilih Semua Siswa Aktif ({activeStudentsInClass.length})</span>
                      </button>
                    </div>

                    <div className="text-xs font-bold text-slate-700">
                      <span className="text-emerald-800 font-black">{selectedStudentIds.length}</span> dari {activeStudentsInClass.length} santri terpilih
                    </div>
                  </div>

                  {activeStudentsInClass.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">
                        Tidak ada siswa berstatus 'Aktif' di Kelas {selectedClass}.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Seluruh santri di rombel ini mungkin sudah diluluskan atau belum ada data siswa yang didaftarkan.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-72 overflow-y-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                          <tr>
                            <th className="p-3 w-10 text-center">Pilih</th>
                            <th className="p-3">Nama Lengkap & NISN</th>
                            <th className="p-3">NIS</th>
                            <th className="p-3">L/P</th>
                            <th className="p-3">Tempat, Tanggal Lahir</th>
                            <th className="p-3">Orang Tua / Wali</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeStudentsInClass.map(student => {
                            const isChecked = selectedStudentIds.includes(student.id);
                            return (
                              <tr
                                key={student.id}
                                onClick={() => handleToggleSelect(student.id)}
                                className={`cursor-pointer transition-colors ${
                                  isChecked ? 'bg-emerald-50/70 hover:bg-emerald-50' : 'hover:bg-slate-50'
                                }`}
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleSelect(student.id)}
                                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-900 font-serif text-sm">
                                    {student.nama}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500">
                                    NISN: {student.nisn}
                                  </div>
                                </td>
                                <td className="p-3 font-mono font-semibold text-slate-700">
                                  {student.nis}
                                </td>
                                <td className="p-3 font-bold text-slate-700">
                                  {student.gender}
                                </td>
                                <td className="p-3 text-slate-700">
                                  {student.tempatLahir}, {student.tanggalLahir}
                                </td>
                                <td className="p-3 text-slate-700">
                                  {student.namaOrangTua || '-'}
                                </td>
                                <td className="p-3 text-center">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Aktif
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 4. Action Execution Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-emerald-950 text-white rounded-xl shadow-md">
                  <div>
                    <h5 className="text-sm font-bold flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Siap Meluluskan {selectedStudentIds.length} Siswa</span>
                    </h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Status siswa akan beralih menjadi 'Lulus', terdaftar di buku alumni, dan siap cetak SKL resmi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExecuteGraduation}
                    disabled={selectedStudentIds.length === 0}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Luluskan {selectedStudentIds.length} Siswa Terpilih</span>
                  </button>
                </div>

              </div>
            )}

            {/* TAB 2: DAFTAR ALUMNI & CETAK SKL */}
            {activeTab === 'alumni' && (
              <div className="space-y-4">
                
                {/* Search & Stats Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 font-serif">
                      Buku Induk Alumni SMP Islam Al Qomar
                    </h4>
                    <p className="text-xs text-slate-500">
                      Total {allAlumni.length} santri telah berstatus lulus dan tersimpan dalam pangkalan data alumni
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleOpenAddManualAlumni}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm border border-amber-500/40"
                      title="Tambah siswa lulus/alumni secara manual"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-amber-200" />
                      <span>+ Tambah Alumni Manual</span>
                    </button>

                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={alumniSearch}
                        onChange={(e) => setAlumniSearch(e.target.value)}
                        placeholder="Cari nama, NISN, sekolah..."
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Alumni Table */}
                {filteredAlumni.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl">
                    <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">Belum Ada Data Siswa Lulus (Alumni)</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Silakan beralih ke tab <strong>"Formulir Kelulusan Kelas Akhir"</strong> untuk memproses kelulusan santri.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                            <th className="p-3">Nama Santri & NISN</th>
                            <th className="p-3">Kelas Asal</th>
                            <th className="p-3">Tahun & Tgl Lulus</th>
                            <th className="p-3">No. SKL / Ijazah</th>
                            <th className="p-3">Sekolah Lanjutan</th>
                            <th className="p-3 text-center">Aksi Dokumen & Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAlumni.map(student => (
                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-900 font-serif text-sm">
                                  {student.nama}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  NISN: {student.nisn} | NIS: {student.nis}
                                </div>
                              </td>

                              <td className="p-3">
                                <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded border border-slate-200">
                                  Kelas {student.kelas}
                                </span>
                              </td>

                              <td className="p-3 text-slate-700">
                                <div className="font-bold text-emerald-900">
                                  TA {student.tahunLulus || schoolInfo.tahunAjaran}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {student.tanggalLulus || '-'}
                                </div>
                              </td>

                              <td className="p-3 text-slate-700">
                                {student.nomorIjazah ? (
                                  <div className="font-mono font-bold text-slate-900 text-[11px]">
                                    Ijazah: {student.nomorIjazah}
                                  </div>
                                ) : (
                                  <div className="font-mono text-slate-500 text-[10px]">
                                    {student.nomorSkl || 'SKL Diterbitkan'}
                                  </div>
                                )}
                              </td>

                              <td className="p-3 text-slate-700">
                                {student.sekolahLanjutan ? (
                                  <span className="font-medium text-slate-900 bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                                    {student.sekolahLanjutan}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">- Belum Diisi -</span>
                                )}
                              </td>

                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      setSelectedAlumniForSkl(student);
                                      setIsSklModalOpen(true);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-sm"
                                    title="Cetak Surat Keterangan Lulus (SKL)"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Cetak SKL</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenEditAlumni(student)}
                                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                                    title="Edit Nomor Ijazah / Sekolah Lanjutan"
                                  >
                                    <BookOpen className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleRevertGraduation(student)}
                                    className="p-1.5 rounded-lg text-amber-700 hover:text-amber-900 hover:bg-amber-50 transition-colors"
                                    title="Batalkan Kelulusan (Kembalikan ke Aktif)"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>SMP Islam Al Qomar - Tata Kelola Data Pokok Pendidikan & Alumni</span>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>

      {/* Edit Alumni Dialog */}
      {editingAlumni && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold font-serif text-slate-900">
                  Data Kelulusan & Ijazah
                </h4>
                <p className="text-xs text-slate-500">{editingAlumni.nama}</p>
              </div>
              <button onClick={() => setEditingAlumni(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAlumni} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Seri Ijazah (Resmi)</label>
                <input
                  type="text"
                  value={editAlumniForm.nomorIjazah}
                  onChange={(e) => setEditAlumniForm({ ...editAlumniForm, nomorIjazah: e.target.value })}
                  placeholder="contoh: DN-05/DIK/2026/001928"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor SKL</label>
                <input
                  type="text"
                  value={editAlumniForm.nomorSkl}
                  onChange={(e) => setEditAlumniForm({ ...editAlumniForm, nomorSkl: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sekolah / Lembaga Lanjutan</label>
                <input
                  type="text"
                  value={editAlumniForm.sekolahLanjutan}
                  onChange={(e) => setEditAlumniForm({ ...editAlumniForm, sekolahLanjutan: e.target.value })}
                  placeholder="contoh: SMAN 1 Giri, MAN 1 Banyuwangi, Ponpes Al Qomar"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Capaian / Prestasi Khusus Kelulusan</label>
                <input
                  type="text"
                  value={editAlumniForm.keteranganLulus}
                  onChange={(e) => setEditAlumniForm({ ...editAlumniForm, keteranganLulus: e.target.value })}
                  placeholder="contoh: Tahfidz 5 Juz & Mumtaz, Lulusan Terbaik"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {['Tahfidz 5 Juz & Mumtaz', 'Tahfidz 3 Juz', 'Lulusan Terbaik', 'Lulus Memenuhi Kriteria'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditAlumniForm({ ...editAlumniForm, keteranganLulus: c })}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Lulus</label>
                  <input
                    type="text"
                    value={editAlumniForm.tahunLulus}
                    onChange={(e) => setEditAlumniForm({ ...editAlumniForm, tahunLulus: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Kelulusan</label>
                  <input
                    type="date"
                    value={editAlumniForm.tanggalLulus}
                    onChange={(e) => setEditAlumniForm({ ...editAlumniForm, tanggalLulus: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAlumni(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Manual Alumni Modal */}
      {isAddingManualAlumni && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-5 py-3.5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-600/50 rounded-xl">
                  <GraduationCap className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Tambah Data Alumni (Manual)</h4>
                  <p className="text-[11px] text-amber-200">
                    Fokus identitas santri, rekam jejak studi lanjutan &amp; capaian kelulusan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingManualAlumni(false)}
                className="text-amber-200 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAlumni} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* 1. Nama Lengkap (Wajib) */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nama Lengkap Santri <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualAlumniForm.nama}
                  onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Farhan Al-Fatih"
                  autoFocus
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* 2. Baris Ringkas: Tahun Lulus, Kelas Terakhir, Gender */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tahun Lulus <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualAlumniForm.tahunLulus}
                    onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, tahunLulus: e.target.value })}
                    placeholder="contoh: 2023/2024"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Terakhir</label>
                  <select
                    value={manualAlumniForm.kelas}
                    onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, kelas: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {classes.map(c => (
                      <option key={c} value={c}>Kelas {c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={manualAlumniForm.gender}
                    onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* 3. Sekolah Lanjutan */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1.5">
                <label className="block font-bold text-amber-950">
                  Sekolah Lanjutan / Pondok Pesantren
                </label>
                <input
                  type="text"
                  value={manualAlumniForm.sekolahLanjutan}
                  onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, sekolahLanjutan: e.target.value })}
                  placeholder="Ketik atau pilih rekomendasi di bawah..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Pilihan Cepat:</span>
                  {['MAN 1 Banyuwangi', 'SMAN 1 Giri', 'SMKN 1 Banyuwangi', 'Ponpes Darussalam Blokagung', 'Ponpes Gontor'].map(inst => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => setManualAlumniForm({ ...manualAlumniForm, sekolahLanjutan: inst })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        manualAlumniForm.sekolahLanjutan === inst
                          ? 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-100 hover:border-amber-300'
                      }`}
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Capaian / Prestasi Khusus */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-1.5">
                <label className="block font-bold text-amber-950">
                  Capaian / Prestasi Khusus Kelulusan
                </label>
                <input
                  type="text"
                  value={manualAlumniForm.keteranganLulus}
                  onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, keteranganLulus: e.target.value })}
                  placeholder="Ketik capaian atau pilih rekomendasi..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Preset:</span>
                  {['Tahfidz 5 Juz & Mumtaz', 'Tahfidz 3 Juz', 'Lulusan Terbaik Akademik', 'Juara MTQ & Pidato', 'Lulus Memenuhi Kriteria'].map(capaian => (
                    <button
                      key={capaian}
                      type="button"
                      onClick={() => setManualAlumniForm({ ...manualAlumniForm, keteranganLulus: capaian })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        manualAlumniForm.keteranganLulus === capaian
                          ? 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-100 hover:border-amber-300'
                      }`}
                    >
                      {capaian}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Bagian Tambahan (Disembunyikan dalam Accordion) */}
              <details className="group border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs transition-all">
                <summary className="cursor-pointer font-bold text-slate-700 hover:text-amber-800 list-none flex items-center justify-between select-none">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    <span>Data Tambahan: NISN, Ijazah, SKL, Tanggal Lulus (Opsional)</span>
                  </span>
                  <span className="text-[10px] bg-slate-200 group-open:bg-amber-200 text-slate-700 group-open:text-amber-900 px-2 py-0.5 rounded font-bold transition-colors">
                    Klik Buka/Tutup
                  </span>
                </summary>

                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        NISN (10 Digit)
                      </label>
                      <input
                        type="text"
                        value={manualAlumniForm.nisn}
                        onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, nisn: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">NIS Lokal</label>
                      <input
                        type="text"
                        value={manualAlumniForm.nis}
                        onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, nis: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Nomor Seri Ijazah (Opsional)</label>
                      <input
                        type="text"
                        value={manualAlumniForm.nomorIjazah}
                        onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, nomorIjazah: e.target.value })}
                        placeholder="DN-05/D-SMP/K13/..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] text-slate-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Nomor SKL (Opsional)</label>
                      <input
                        type="text"
                        value={manualAlumniForm.nomorSkl}
                        onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, nomorSkl: e.target.value })}
                        placeholder="SKL/20525621/..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-[11px] text-slate-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Tanggal Kelulusan</label>
                      <input
                        type="date"
                        value={manualAlumniForm.tanggalLulus}
                        onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, tanggalLulus: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={manualAlumniForm.tempatLahir}
                        onChange={(e) => setManualAlumniForm({ ...manualAlumniForm, tempatLahir: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </details>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingManualAlumni(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  Simpan Alumni ke Buku Induk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SKL Certificate Print Modal */}
      {selectedAlumniForSkl && (
        <SuratKeteranganLulusModal
          isOpen={isSklModalOpen}
          onClose={() => {
            setIsSklModalOpen(false);
            setSelectedAlumniForSkl(null);
          }}
          student={selectedAlumniForSkl}
          schoolInfo={schoolInfo}
        />
      )}
    </>
  );
};
