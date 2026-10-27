import React, { useState } from 'react';
import { Student, ScheduleItem, Teacher, SchoolInfo, UserSession } from '../../types';
import { exportToCSV, StorageService } from '../../services/storage';
import {
  Users,
  Plus,
  Search,
  Download,
  Edit3,
  Trash2,
  X,
  Filter,
  Layers,
  Settings,
  GraduationCap,
  Award,
  Printer,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { getAllClasses } from '../../data/constants';
import { KelolaKelasModal } from './KelolaKelasModal';
import { KelulusanSiswaModal } from './KelulusanSiswaModal';
import { SuratKeteranganLulusModal } from './SuratKeteranganLulusModal';

interface DataSiswaViewProps {
  students: Student[];
  onSaveStudents: (students: Student[]) => void;
  schedules?: ScheduleItem[];
  onSaveSchedules?: (schedules: ScheduleItem[]) => void;
  teachers?: Teacher[];
  onSaveTeachers?: (teachers: Teacher[]) => void;
  schoolInfo?: SchoolInfo;
  session?: UserSession;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  students = [],
  onSaveStudents,
  schedules = [],
  onSaveSchedules = () => {},
  teachers = [],
  onSaveTeachers = () => {},
  schoolInfo,
  session
}) => {
  const [subTab, setSubTab] = useState<'aktif' | 'alumni'>('aktif');
  const [classesVersion, setClassesVersion] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeClassFilter, setActiveClassFilter] = useState('Semua');
  const [activeStatusFilter, setActiveStatusFilter] = useState('Semua');
  const [alumniYearFilter, setAlumniYearFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isGraduationModalOpen, setIsGraduationModalOpen] = useState(false);
  const [isSklModalOpen, setIsSklModalOpen] = useState(false);
  const [selectedStudentForSkl, setSelectedStudentForSkl] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Separate Active and Alumni datasets
  const activeStudents = React.useMemo(() => {
    return (students || []).filter(s => s.status !== 'Lulus');
  }, [students]);

  const alumniStudents = React.useMemo(() => {
    return (students || []).filter(s => s.status === 'Lulus');
  }, [students]);

  const finalYearActiveCount = React.useMemo(() => {
    return activeStudents.filter(
      s => (s.kelas === '9' || s.kelas.startsWith('9') || s.kelas.toUpperCase().includes('IX')) && s.status === 'Aktif'
    ).length;
  }, [activeStudents]);

  // Extract distinct graduation years for alumni filter dropdown
  const alumniYears = React.useMemo(() => {
    const set = new Set<string>();
    alumniStudents.forEach(s => {
      if (s.tahunLulus) set.add(s.tahunLulus);
    });
    return Array.from(set).sort().reverse();
  }, [alumniStudents]);

  const [isCustomClass, setIsCustomClass] = useState(false);
  const [customClassInput, setCustomClassInput] = useState('');

  const classes = React.useMemo(
    () => getAllClasses(students, schedules, teachers),
    [students, schedules, teachers, classesVersion]
  );

  const formatClassLabel = (c: string) => (c.toLowerCase().startsWith('kelas') ? c : `Kelas ${c}`);

  // Helper to ensure date has no day of week and no time (e.g. outputs "12 April 2011" or "2011-04-12")
  const sanitizeDateOnly = (val?: string): string => {
    if (!val) return '2011-01-01';
    const clean = val.split('T')[0].split(' ')[0].trim();
    return clean || '2011-01-01';
  };

  const formatBirthDateClean = (dateStr?: string): string => {
    if (!dateStr) return '-';
    const cleanDate = dateStr.split('T')[0].split(' ')[0].replace(/^(Senin|Selasa|Rabu|Kamis|Jum'?at|Sabtu|Minggu|Ahad)[,\s]+/gi, '').trim();
    
    const parts = cleanDate.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day) && !isNaN(year)) {
        return `${day} ${monthNames[monthIndex]} ${year}`;
      }
    }
    return cleanDate;
  };

  const [form, setForm] = useState<Partial<Student>>({
    nisn: '',
    nis: '',
    nama: '',
    gender: 'L',
    kelas: classes[0] || '7',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2011-01-01',
    namaOrangTua: '',
    noHpOrangTua: '',
    namaAyah: '',
    statusAyah: 'Masih Hidup',
    namaIbu: '',
    statusIbu: 'Masih Hidup',
    alamat: '',
    status: 'Aktif'
  });

  // Filter Active Students
  const filteredActiveStudents = React.useMemo(() => {
    return activeStudents.filter((s) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        s.nama.toLowerCase().includes(term) ||
        s.nisn.includes(term) ||
        s.nis.includes(term) ||
        (s.namaOrangTua && s.namaOrangTua.toLowerCase().includes(term)) ||
        (s.namaAyah && s.namaAyah.toLowerCase().includes(term)) ||
        (s.namaIbu && s.namaIbu.toLowerCase().includes(term)) ||
        (s.alamat && s.alamat.toLowerCase().includes(term));
      const matchClass = activeClassFilter === 'Semua' || s.kelas === activeClassFilter;
      const matchStatus = activeStatusFilter === 'Semua' || s.status === activeStatusFilter;
      return matchSearch && matchClass && matchStatus;
    });
  }, [activeStudents, searchTerm, activeClassFilter, activeStatusFilter]);

  // Filter Alumni Students
  const filteredAlumniStudents = React.useMemo(() => {
    return alumniStudents.filter((s) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        s.nama.toLowerCase().includes(term) ||
        s.nisn.includes(term) ||
        s.nis.includes(term) ||
        (s.nomorIjazah && s.nomorIjazah.toLowerCase().includes(term)) ||
        (s.nomorSkl && s.nomorSkl.toLowerCase().includes(term)) ||
        (s.sekolahLanjutan && s.sekolahLanjutan.toLowerCase().includes(term)) ||
        (s.namaOrangTua && s.namaOrangTua.toLowerCase().includes(term));
      const matchYear = alumniYearFilter === 'Semua' || s.tahunLulus === alumniYearFilter;
      return matchSearch && matchYear;
    });
  }, [alumniStudents, searchTerm, alumniYearFilter]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsCustomClass(false);
    setCustomClassInput('');
    const currYearShort = new Date().getFullYear().toString().slice(-2);
    setForm({
      id: `S${Date.now().toString().slice(-4)}`,
      nisn: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      nis: `${currYearShort}07${Math.floor(100 + Math.random() * 899)}`,
      nama: '',
      gender: 'L',
      kelas: classes[0] || '7',
      tempatLahir: 'Banyuwangi',
      tanggalLahir: `${new Date().getFullYear() - 13}-05-15`,
      namaOrangTua: '',
      noHpOrangTua: '',
      namaAyah: '',
      statusAyah: 'Masih Hidup',
      namaIbu: '',
      statusIbu: 'Masih Hidup',
      alamat: '',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleOpenAddAlumni = () => {
    setEditingStudent(null);
    setIsCustomClass(false);
    setCustomClassInput('');
    const currentYear = new Date().getFullYear();
    const currYearShort = currentYear.toString().slice(-2);
    const prevYearShort = (currentYear - 1).toString().slice(-2);
    const defaultGradYear = schoolInfo?.tahunAjaran || `${currentYear - 1}/${currentYear}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const finalClass = classes.find(c => c === '9' || c.startsWith('9')) || '9';

    setForm({
      id: `ALM${Date.now().toString().slice(-5)}`,
      nisn: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      nis: `${prevYearShort}07${Math.floor(100 + Math.random() * 899)}`,
      nama: '',
      gender: 'L',
      kelas: finalClass,
      tempatLahir: 'Banyuwangi',
      tanggalLahir: `${currentYear - 15}-05-15`,
      namaOrangTua: '',
      noHpOrangTua: '',
      namaAyah: '',
      statusAyah: 'Masih Hidup',
      namaIbu: '',
      statusIbu: 'Masih Hidup',
      alamat: 'Banyuwangi',
      status: 'Lulus',
      tahunLulus: defaultGradYear,
      tanggalLulus: todayStr,
      nomorIjazah: `DN-05/D-SMP/K13/${currYearShort}/00${Math.floor(1000 + Math.random() * 9000)}`,
      nomorSkl: `SKL/${schoolInfo?.npsn || '20525621'}/${currentYear}/${Math.floor(100 + Math.random() * 900)}`,
      sekolahLanjutan: '',
      keteranganLulus: 'Lulus Memenuhi Kriteria Kelulusan Satuan Pendidikan'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    if (!classes.includes(student.kelas)) {
      setIsCustomClass(true);
      setCustomClassInput(student.kelas);
    } else {
      setIsCustomClass(false);
      setCustomClassInput('');
    }
    setForm({
      ...student,
      statusAyah: student.statusAyah || 'Masih Hidup',
      statusIbu: student.statusIbu || 'Masih Hidup'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      const updated = students.filter(s => s.id !== id);
      onSaveStudents(updated);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.nisn) return;

    const finalKelas = isCustomClass ? (customClassInput.trim() || '7') : (form.kelas || '7');
    
    // Auto format parent summary
    const ayahText = form.namaAyah ? `${form.namaAyah}${form.statusAyah === 'Meninggal' ? ' (Alm.)' : ''}` : '';
    const ibuText = form.namaIbu ? `${form.namaIbu}${form.statusIbu === 'Meninggal' ? ' (Almh.)' : ''}` : '';
    const autoParentSummary = ayahText && ibuText
      ? `${ayahText} & ${ibuText}`
      : ayahText || ibuText || form.namaOrangTua || 'Orang Tua Siswa';

    if (editingStudent) {
      const updated = (students || []).map(s => (s.id === editingStudent.id ? ({
        ...(form as Student),
        kelas: finalKelas,
        tanggalLahir: sanitizeDateOnly(form.tanggalLahir),
        namaOrangTua: form.namaOrangTua || autoParentSummary,
        statusAyah: form.statusAyah || 'Masih Hidup',
        statusIbu: form.statusIbu || 'Masih Hidup',
        tahunLulus: form.status === 'Lulus' ? form.tahunLulus : undefined,
        tanggalLulus: form.status === 'Lulus' ? form.tanggalLulus : undefined,
        nomorIjazah: form.status === 'Lulus' ? form.nomorIjazah : undefined,
        nomorSkl: form.status === 'Lulus' ? form.nomorSkl : undefined,
        sekolahLanjutan: form.status === 'Lulus' ? form.sekolahLanjutan : undefined,
        keteranganLulus: form.status === 'Lulus' ? form.keteranganLulus : undefined
      } as Student) : s));
      onSaveStudents(updated);
    } else {
      const newStudent: Student = {
        id: form.id || `S${Date.now().toString().slice(-4)}`,
        nisn: form.nisn!,
        nis: form.nis || '2407000',
        nama: form.nama!,
        gender: (form.gender as 'L' | 'P') || 'L',
        kelas: finalKelas,
        tempatLahir: form.tempatLahir || 'Banyuwangi',
        tanggalLahir: sanitizeDateOnly(form.tanggalLahir),
        namaOrangTua: form.namaOrangTua || autoParentSummary,
        noHpOrangTua: form.noHpOrangTua || '08123456789',
        namaAyah: form.namaAyah,
        statusAyah: form.statusAyah || 'Masih Hidup',
        namaIbu: form.namaIbu,
        statusIbu: form.statusIbu || 'Masih Hidup',
        alamat: form.alamat || 'Banyuwangi',
        status: (form.status as any) || 'Aktif',
        tahunLulus: form.status === 'Lulus' ? form.tahunLulus : undefined,
        tanggalLulus: form.status === 'Lulus' ? form.tanggalLulus : undefined,
        nomorIjazah: form.status === 'Lulus' ? form.nomorIjazah : undefined,
        nomorSkl: form.status === 'Lulus' ? form.nomorSkl : undefined,
        sekolahLanjutan: form.status === 'Lulus' ? form.sekolahLanjutan : undefined,
        keteranganLulus: form.status === 'Lulus' ? form.keteranganLulus : undefined
      };
      onSaveStudents([...(students || []), newStudent]);
    }

    setIsModalOpen(false);
  };

  const handleRevertStudent = (student: Student) => {
    if (window.confirm(`Batalkan status kelulusan untuk ${student.nama} (${student.nisn}) dan kembalikan ke status 'Aktif'?`)) {
      const updated = (students || []).map(s => (s.id === student.id ? { ...s, status: 'Aktif' as const } : s));
      onSaveStudents(updated);
      StorageService.addAuditLog({
        userName: session?.name || 'Admin DAPODIK',
        userRole: session?.role === 'admin' ? 'Admin DAPODIK' : 'Waka Kesiswaan',
        action: 'BATALKAN_KELULUSAN',
        module: 'Data Siswa & Alumni',
        details: `Mengembalikan ${student.nama} (${student.nisn}) ke status Aktif di Kelas ${student.kelas}.`
      });
    }
  };

  const handleExportActiveCSV = () => {
    const csvData = activeStudents.map(s => ({
      ID: s.id,
      NISN: s.nisn,
      NIS: s.nis,
      Nama: s.nama,
      Gender: s.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
      Kelas: s.kelas,
      Tempat_Lahir: s.tempatLahir,
      Tanggal_Lahir: s.tanggalLahir,
      Nama_Ayah: s.namaAyah || '-',
      Status_Ayah: s.statusAyah || 'Masih Hidup',
      Nama_Ibu: s.namaIbu || '-',
      Status_Ibu: s.statusIbu || 'Masih Hidup',
      Orang_Tua_Wali: s.namaOrangTua,
      No_HP_Orang_Tua: s.noHpOrangTua,
      Alamat: s.alamat,
      Status: s.status
    }));
    exportToCSV('Data_Santri_Aktif_SMP_Islam_Al_Qomar.csv', csvData);
  };

  const handleExportAlumniCSV = () => {
    const csvData = alumniStudents.map(s => ({
      ID: s.id,
      NISN: s.nisn,
      NIS: s.nis,
      Nama: s.nama,
      Gender: s.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
      Tahun_Lulus: s.tahunLulus || '-',
      Tanggal_Lulus: s.tanggalLulus || '-',
      Nomor_Ijazah: s.nomorIjazah || '-',
      Nomor_SKL: s.nomorSkl || '-',
      Sekolah_Lanjutan: s.sekolahLanjutan || '-',
      Keterangan_Lulus: s.keteranganLulus || 'Lulus',
      Kelas_Terakhir: s.kelas,
      Tempat_Lahir: s.tempatLahir,
      Tanggal_Lahir: s.tanggalLahir,
      Orang_Tua_Wali: s.namaOrangTua,
      No_HP_Orang_Tua: s.noHpOrangTua,
      Alamat: s.alamat
    }));
    exportToCSV('Buku_Induk_Alumni_SMP_Islam_Al_Qomar.csv', csvData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>Master Data Peserta Didik &amp; Buku Induk</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Data Santri &amp; Alumni SMP Islam Al Qomar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pemisahan rapi antara data santri aktif (Kelas 7, 8, 9) dan buku induk kelulusan alumni
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {subTab === 'aktif' ? (
            <>
              <button
                onClick={() => setIsGraduationModalOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-500/40 transition-all shadow-sm"
                title="Buka proses kelulusan santri kelas akhir (Kelas 9), terbitkan SKL, & kelola buku induk alumni"
              >
                <GraduationCap className="w-4 h-4 text-emerald-300" />
                <span>Kelulusan Siswa</span>
                {finalYearActiveCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-black text-[10px]">
                    {finalYearActiveCount} Kelas 9
                  </span>
                )}
              </button>

              <button
                onClick={() => setIsClassModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-500/30 transition-colors shadow-sm"
                title="Kelola, tambah, ganti nama, atau hapus kelas"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Kelola Rombel / Kelas</span>
              </button>

              <button
                onClick={handleExportActiveCSV}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition-colors"
                title="Unduh seluruh data santri aktif dalam format CSV"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                <span>Ekspor CSV Santri Aktif</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa Baru</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsGraduationModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-500/30 transition-colors shadow-sm"
                title="Buka proses kelulusan baru untuk meluluskan santri kelas 9"
              >
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>Proses Kelulusan Baru</span>
              </button>

              <button
                onClick={handleExportAlumniCSV}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition-colors"
                title="Unduh buku induk alumni dalam format CSV"
              >
                <Download className="w-4 h-4 text-amber-700" />
                <span>Ekspor CSV Buku Alumni</span>
              </button>

              <button
                onClick={handleOpenAddAlumni}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-amber-500/40 transition-colors shadow-sm"
                title="Tambah data santri yang sudah lulus (alumni) secara langsung / manual"
              >
                <Plus className="w-4 h-4 text-amber-200" />
                <span>+ Tambah Alumni Manual</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-Tabs Switcher */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setSubTab('aktif');
            setSearchTerm('');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
            subTab === 'aktif'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className={`w-4 h-4 ${subTab === 'aktif' ? 'text-emerald-200' : 'text-slate-500'}`} />
          <span>Santri Aktif (Kelas 7, 8, 9)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            subTab === 'aktif' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-300/80 text-slate-800'
          }`}>
            {activeStudents.length} Santri
          </span>
          {finalYearActiveCount > 0 && (
            <span className={`hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
              subTab === 'aktif' ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
            }`}>
              {finalYearActiveCount} Kelas 9 Siap Lulus
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab('alumni');
            setSearchTerm('');
          }}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
            subTab === 'alumni'
              ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <GraduationCap className={`w-4 h-4 ${subTab === 'alumni' ? 'text-amber-200' : 'text-slate-500'}`} />
          <span>Buku Induk Alumni (Lulusan)</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            subTab === 'alumni' ? 'bg-amber-600 text-amber-100' : 'bg-slate-300/80 text-slate-800'
          }`}>
            {alumniStudents.length} Alumni
          </span>
        </button>
      </div>

      {/* TAB 1: SANTRI AKTIF */}
      {subTab === 'aktif' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Filter & Search Bar for Active Students */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari NISN, nama santri aktif, wali, alamat..."
                className="w-full px-3 py-2 pl-9 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-700 font-bold">Rombel / Kelas:</span>
                <select
                  value={activeClassFilter}
                  onChange={(e) => setActiveClassFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua" className="bg-white text-slate-900">Semua Kelas ({activeStudents.length})</option>
                  {classes.map(c => {
                    const countInClass = activeStudents.filter(s => s.kelas === c).length;
                    return (
                      <option key={c} value={c} className="bg-white text-slate-900">
                        {formatClassLabel(c)} ({countInClass} Santri) {c === '9' || c.startsWith('9') ? '⭐ Tingkat Akhir' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-700 font-bold">Status:</span>
                <select
                  value={activeStatusFilter}
                  onChange={(e) => setActiveStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua" className="bg-white text-slate-900">Semua Status</option>
                  <option value="Aktif" className="bg-white text-slate-900">Aktif ({activeStudents.filter(s => s.status === 'Aktif').length})</option>
                  <option value="Pindah" className="bg-white text-slate-900">Pindah / Mutasi ({activeStudents.filter(s => s.status === 'Pindah').length})</option>
                </select>
              </div>
            </div>

          </div>

          {/* Active Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-3.5">Nama &amp; NISN</th>
                    <th className="p-3.5">Rombel / Kelas</th>
                    <th className="p-3.5">L/P</th>
                    <th className="p-3.5">Tempat &amp; Tgl Lahir</th>
                    <th className="p-3.5">Orang Tua / Wali</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredActiveStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <div className="font-bold text-sm text-slate-700">Tidak ada data santri aktif yang sesuai</div>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter rombel kelas.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredActiveStudents.map((student) => {
                      const isGrade9 = student.kelas === '9' || student.kelas.startsWith('9') || student.kelas.toUpperCase().includes('IX');
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 font-serif text-sm">{student.nama}</span>
                              {isGrade9 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300" title="Santri Tingkat Akhir (Kelas 9) Siap Lulus">
                                  Tingkat Akhir
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                              NISN: {student.nisn} | NIS: {student.nis}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200">
                              Kelas {student.kelas}
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-700">
                            {student.gender === 'L' ? (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">L</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold">P</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-700">
                            <div className="font-semibold text-slate-900">{student.tempatLahir}</div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {formatBirthDateClean(student.tanggalLahir)}
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-700">
                            <div className="font-semibold">{student.namaOrangTua}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{student.noHpOrangTua}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {student.statusAyah === 'Meninggal' && student.statusIbu === 'Meninggal' ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  ✨ Yatim Piatu
                                </span>
                              ) : (
                                <>
                                  {student.statusAyah === 'Meninggal' && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                      🕊️ Alm. Ayah
                                    </span>
                                  )}
                                  {student.statusIbu === 'Meninggal' && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                      🕊️ Almh. Ibu
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              student.status === 'Aktif'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(student)}
                                className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Edit Data Siswa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(student.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUKU INDUK ALUMNI (LULUSAN) */}
      {subTab === 'alumni' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Alumni Information Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-600 text-white rounded-xl shadow-xs mt-0.5">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-serif text-sm sm:text-base text-amber-950">
                  Buku Induk Alumni &amp; Dokumen Kelulusan
                </h3>
                <p className="text-xs text-amber-900/80 mt-0.5 max-w-2xl">
                  Mendata alumni kelulusan santri SMP Islam Al Qomar. Anda dapat mencetak Surat Keterangan Lulus (SKL) resmi, mengarsipkan nomor ijazah, memantau sekolah lanjutan/pondok, atau membatalkan kelulusan santri jika terjadi kekeliruan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 font-black text-xs">
                Total Alumni: {alumniStudents.length} Santri
              </span>
            </div>
          </div>

          {/* Filter & Search Bar for Alumni */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="relative w-full md:w-96">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama alumni, NISN, no ijazah, no SKL, sekolah lanjutan..."
                className="w-full px-3 py-2 pl-9 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-700 font-bold">Tahun Lulus / Angkatan:</span>
                <select
                  value={alumniYearFilter}
                  onChange={(e) => setAlumniYearFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Semua" className="bg-white text-slate-900">Semua Angkatan ({alumniStudents.length})</option>
                  {alumniYears.map(yr => {
                    const countInYear = alumniStudents.filter(s => s.tahunLulus === yr).length;
                    return (
                      <option key={yr} value={yr} className="bg-white text-slate-900">
                        Tahun {yr} ({countInYear} Alumni)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

          </div>

          {/* Alumni Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-50/60 border-b border-amber-200 text-amber-900 font-bold uppercase tracking-wider">
                    <th className="p-3.5">Nama Alumni &amp; NISN</th>
                    <th className="p-3.5">Tahun Kelulusan</th>
                    <th className="p-3.5">Dokumen (Ijazah / SKL)</th>
                    <th className="p-3.5">Sekolah Lanjutan / Ponpes</th>
                    <th className="p-3.5">Orang Tua / Wali</th>
                    <th className="p-3.5 text-center">Aksi Alumni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAlumniStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        <GraduationCap className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                        <div className="font-bold text-sm text-slate-700">Belum ada data alumni yang cocok</div>
                        <p className="text-xs text-slate-400 mt-1">
                          Anda dapat meluluskan santri kelas 9 melalui tombol "Proses Kelulusan Baru" atau "+ Tambah Alumni Manual".
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredAlumniStudents.map((alumnus) => (
                      <tr key={alumnus.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-serif text-sm">{alumnus.nama}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              alumnus.gender === 'L' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {alumnus.gender === 'L' ? 'L' : 'P'}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            NISN: {alumnus.nisn} | NIS: {alumnus.nis}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            TTL: {alumnus.tempatLahir}, {formatBirthDateClean(alumnus.tanggalLahir)}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs w-max">
                              <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                              <span>TA {alumnus.tahunLulus || 'Lulus'}</span>
                            </span>
                            {alumnus.tanggalLulus && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                Tanggal: {alumnus.tanggalLulus}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">
                              Rombel Akhir: Kelas {alumnus.kelas}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-700">
                          <div className="space-y-1">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">No. Seri Ijazah:</span>
                              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                                {alumnus.nomorIjazah || '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">No. Surat SKL:</span>
                              <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200 inline-block">
                                {alumnus.nomorSkl || '-'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-700 max-w-[200px]">
                          {alumnus.sekolahLanjutan ? (
                            <div className="font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              🏫 {alumnus.sekolahLanjutan}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">- Belum dicatat -</span>
                          )}
                          {alumnus.keteranganLulus && (
                            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2" title={alumnus.keteranganLulus}>
                              {alumnus.keteranganLulus}
                            </p>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-700">
                          <div className="font-semibold">{alumnus.namaOrangTua}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{alumnus.noHpOrangTua}</div>
                          {alumnus.alamat && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]" title={alumnus.alamat}>
                              📍 {alumnus.alamat}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedStudentForSkl(alumnus);
                                setIsSklModalOpen(true);
                              }}
                              className="p-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 rounded-lg transition-colors border border-emerald-300"
                              title="Cetak Surat Keterangan Lulus (SKL) Resmi"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(alumnus)}
                              className="p-1.5 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200"
                              title="Edit Data Alumni / Ijazah"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRevertStudent(alumnus)}
                              className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-colors border border-amber-300"
                              title="Batalkan Kelulusan (Kembalikan ke Santri Aktif)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(alumnus.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Data Alumni"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-sm p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header: Sticky at top */}
            <div className={`px-5 py-3.5 border-b flex items-center justify-between shrink-0 ${
              form.status === 'Lulus' ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-2.5">
                {form.status === 'Lulus' && (
                  <div className="p-2 bg-amber-600 text-white rounded-xl shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold font-serif text-base sm:text-lg text-slate-900">
                    {editingStudent
                      ? (form.status === 'Lulus' ? 'Edit Data Alumni' : 'Edit Data Santri / Siswa')
                      : (form.status === 'Lulus' ? 'Tambah Data Alumni (Manual)' : 'Tambah Santri / Siswa Baru')}
                  </h3>
                  {form.status === 'Lulus' ? (
                    <p className="text-[11px] text-amber-800 font-medium">
                      Pengisian cepat: hanya isi nama, kelulusan &amp; capaian
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Formulir pendaftaran dan mutasi santri ke Buku Induk
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable with proper scroll boundaries */}
            <form id="student-modal-form" onSubmit={handleFormSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 text-xs">
              
              {/* TAMPILAN KHUSUS ALUMNI (JIKA STATUS LULUS): ULTRA-RINGKAS, BIDANG SEKUNDER DISEMBUNYIKAN */}
              {form.status === 'Lulus' ? (
                <>
                  {/* 1. Nama Lengkap (Wajib & Utama) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nama Lengkap Santri / Siswa <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      required
                      placeholder="Contoh: Muhammad Farhan Al-Fatih"
                      autoFocus
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* 2. Baris Ringkas: Tahun Lulus, Kelas Terakhir, Gender */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Tahun Lulus <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="contoh: 2024/2025"
                        required
                        value={form.tahunLulus || ''}
                        onChange={(e) => setForm({ ...form, tahunLulus: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Kelas Terakhir</label>
                      <select
                        value={form.kelas}
                        onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      >
                        {classes.map(c => (
                          <option key={c} value={c}>
                            {formatClassLabel(c)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="L">Laki-Laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Sekolah Lanjutan / Pondok Pesantren */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-2">
                    <label className="block text-[11px] font-bold text-amber-950">
                      Sekolah Lanjutan / Pondok Pesantren
                    </label>
                    <input
                      type="text"
                      placeholder="Ketik atau pilih rekomendasi di bawah..."
                      value={form.sekolahLanjutan || ''}
                      onChange={(e) => setForm({ ...form, sekolahLanjutan: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Pilihan Cepat:</span>
                      {['MAN 1 Banyuwangi', 'SMAN 1 Giri', 'SMKN 1 Banyuwangi', 'Ponpes Darussalam Blokagung', 'Ponpes Gontor'].map(inst => (
                        <button
                          key={inst}
                          type="button"
                          onClick={() => setForm({ ...form, sekolahLanjutan: inst })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                            form.sekolahLanjutan === inst
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-100 hover:border-amber-300'
                          }`}
                        >
                          {inst}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Capaian / Prestasi Khusus Kelulusan */}
                  <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70 space-y-2">
                    <label className="block text-[11px] font-bold text-amber-950">
                      Capaian / Prestasi Khusus Kelulusan
                    </label>
                    <input
                      type="text"
                      placeholder="Ketik capaian atau pilih preset..."
                      value={form.keteranganLulus || ''}
                      onChange={(e) => setForm({ ...form, keteranganLulus: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Preset:</span>
                      {['Tahfidz 5 Juz & Mumtaz', 'Tahfidz 3 Juz', 'Lulusan Terbaik Akademik', 'Juara MTQ & Sains', 'Lulus Memenuhi Kriteria'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm({ ...form, keteranganLulus: c })}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                            form.keteranganLulus === c
                              ? 'bg-amber-600 text-white border-amber-600 font-bold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-100 hover:border-amber-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 5. BAGIAN TAMBAHAN DISEMBUNYIKAN (ACCORDION / PANEL LIPAT OPSIONAL) */}
                  <details className="group border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs transition-all">
                    <summary className="cursor-pointer font-bold text-slate-700 hover:text-amber-800 list-none flex items-center justify-between select-none">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-amber-700" />
                        <span>Data Tambahan: NISN, Ijazah, SKL, Tempat/Tanggal Lahir</span>
                      </span>
                      <span className="text-[10px] bg-slate-200 group-open:bg-amber-200 text-slate-700 group-open:text-amber-900 px-2 py-0.5 rounded font-bold transition-colors">
                        Klik Buka/Tutup
                      </span>
                    </summary>

                    <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                      <p className="text-[11px] text-slate-500">
                        NISN dan NIS sudah terisi otomatis oleh sistem. Anda dapat mengubahnya jika ada data resmi dari Ijazah:
                      </p>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">NISN (10 Digit)</label>
                          <input
                            type="text"
                            value={form.nisn}
                            onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">NIS Lokal</label>
                          <input
                            type="text"
                            value={form.nis}
                            onChange={(e) => setForm({ ...form, nis: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor Seri Ijazah (Opsional)</label>
                          <input
                            type="text"
                            placeholder="DN-05/DIK/2026/..."
                            value={form.nomorIjazah || ''}
                            onChange={(e) => setForm({ ...form, nomorIjazah: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor SKL (Opsional)</label>
                          <input
                            type="text"
                            placeholder="SKL/20525621/..."
                            value={form.nomorSkl || ''}
                            onChange={(e) => setForm({ ...form, nomorSkl: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Kelulusan</label>
                          <input
                            type="date"
                            value={form.tanggalLulus || ''}
                            onChange={(e) => setForm({ ...form, tanggalLulus: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Data</label>
                          <select
                            value={form.status}
                            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                          >
                            <option value="Lulus">🎓 Lulus (Alumni)</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Pindah">Pindah</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Tempat Lahir</label>
                          <input
                            type="text"
                            value={form.tempatLahir}
                            onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Lahir</label>
                          <input
                            type="date"
                            value={sanitizeDateOnly(form.tanggalLahir)}
                            onChange={(e) => setForm({ ...form, tanggalLahir: sanitizeDateOnly(e.target.value) })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Orang Tua / Wali</label>
                          <input
                            type="text"
                            value={form.namaOrangTua || ''}
                            placeholder="Wali Santri"
                            onChange={(e) => setForm({ ...form, namaOrangTua: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Alamat Domisili</label>
                          <input
                            type="text"
                            value={form.alamat || ''}
                            placeholder="Banyuwangi"
                            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </details>
                </>
              ) : (
                /* TAMPILAN STANDAR UNTUK SANTRI AKTIF / PINDAH */
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NISN (10 Digit)</label>
                      <input
                        type="text"
                        value={form.nisn}
                        onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NIS Lokal</label>
                      <input
                        type="text"
                        value={form.nis}
                        onChange={(e) => setForm({ ...form, nis: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">Rombel / Kelas</label>
                      <button
                        type="button"
                        onClick={() => setIsCustomClass(!isCustomClass)}
                        className="text-[11px] font-bold text-emerald-800 hover:underline"
                      >
                        {isCustomClass ? 'Pilih dari List' : '+ Tulis Kustom'}
                      </button>
                    </div>
                    {isCustomClass ? (
                      <input
                        type="text"
                        required
                        value={customClassInput}
                        onChange={(e) => setCustomClassInput(e.target.value)}
                        placeholder="Contoh: 7C, 8-Tahfidz, VII Putri..."
                        className="w-full px-3 py-2 bg-white border border-emerald-500 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <select
                        value={form.kelas}
                        onChange={(e) => {
                          if (e.target.value === '__CUSTOM__') {
                            setIsCustomClass(true);
                            setCustomClassInput('');
                          } else {
                            setForm({ ...form, kelas: e.target.value });
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        {classes.map(c => (
                          <option key={c} value={c} className="bg-white text-slate-900">
                            {formatClassLabel(c)}
                          </option>
                        ))}
                        <option value="__CUSTOM__" className="bg-emerald-50 text-emerald-950 font-bold">
                          + Tulis Kelas Kustom Baru...
                        </option>
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="L" className="bg-white text-slate-900">Laki-Laki</option>
                        <option value="P" className="bg-white text-slate-900">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Aktif" className="bg-white text-slate-900">Aktif</option>
                        <option value="Lulus" className="bg-white text-slate-900">🎓 Lulus (Alumni)</option>
                        <option value="Pindah" className="bg-white text-slate-900">Pindah</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                      <input
                        type="text"
                        value={form.tempatLahir}
                        onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                      <input
                        type="date"
                        value={sanitizeDateOnly(form.tanggalLahir)}
                        onChange={(e) => setForm({ ...form, tanggalLahir: sanitizeDateOnly(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Format tanggal lahir murni (tanpa nama hari &amp; tanpa jam)</p>
                    </div>
                  </div>

                  {/* Data Ayah Kandung */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">👨 Data Ayah Kandung</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, statusAyah: 'Masih Hidup' })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            form.statusAyah === 'Masih Hidup'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Masih Hidup
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, statusAyah: 'Meninggal' })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            form.statusAyah === 'Meninggal'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Meninggal (Alm.)
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder={form.statusAyah === 'Meninggal' ? 'Nama Lengkap Almarhum Ayah' : 'Nama Lengkap Ayah Kandung'}
                      value={form.namaAyah || ''}
                      onChange={(e) => setForm({ ...form, namaAyah: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Data Ibu Kandung */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-800">👩 Data Ibu Kandung</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, statusIbu: 'Masih Hidup' })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            form.statusIbu === 'Masih Hidup'
                              ? 'bg-pink-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Masih Hidup
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, statusIbu: 'Meninggal' })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                            form.statusIbu === 'Meninggal'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          Meninggal (Almh.)
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder={form.statusIbu === 'Meninggal' ? 'Nama Lengkap Almarhumah Ibu' : 'Nama Lengkap Ibu Kandung'}
                      value={form.namaIbu || ''}
                      onChange={(e) => setForm({ ...form, namaIbu: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Orang Tua / Wali (Ringkasan)</label>
                      <input
                        type="text"
                        value={form.namaOrangTua}
                        placeholder="Otomatis atau masukkan manual"
                        onChange={(e) => setForm({ ...form, namaOrangTua: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">No. HP Orang Tua / Kontak</label>
                      <input
                        type="text"
                        value={form.noHpOrangTua}
                        placeholder="Contoh: 081234567890"
                        onChange={(e) => setForm({ ...form, noHpOrangTua: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                    <textarea
                      value={form.alamat}
                      onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </form>

            {/* Modal Footer Action Buttons: Pinned at bottom, always visible! */}
            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="student-modal-form"
                className={`px-5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition-all ${
                  form.status === 'Lulus'
                    ? 'bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700'
                    : 'bg-emerald-800 hover:bg-emerald-700'
                }`}
              >
                {form.status === 'Lulus' ? 'Simpan Data Alumni' : 'Simpan Data Siswa'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Kelola Kelas Modal */}
      <KelolaKelasModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        students={students}
        schedules={schedules}
        teachers={teachers}
        onUpdateStudents={onSaveStudents}
        onUpdateSchedules={onSaveSchedules}
        onUpdateTeachers={onSaveTeachers}
        onClassesChange={() => setClassesVersion(v => v + 1)}
      />

      {/* Kelulusan Siswa Kelas Akhir Modal */}
      <KelulusanSiswaModal
        isOpen={isGraduationModalOpen}
        onClose={() => setIsGraduationModalOpen(false)}
        students={students}
        onSaveStudents={onSaveStudents}
        schoolInfo={schoolInfo || StorageService.getSchoolInfo()}
        session={session}
        classes={classes}
      />

      {/* Surat Keterangan Lulus (SKL) Modal Preview & Cetak */}
      {selectedStudentForSkl && (
        <SuratKeteranganLulusModal
          isOpen={isSklModalOpen}
          onClose={() => {
            setIsSklModalOpen(false);
            setSelectedStudentForSkl(null);
          }}
          student={selectedStudentForSkl}
          schoolInfo={schoolInfo || StorageService.getSchoolInfo()}
        />
      )}

    </div>
  );
};
