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
  const [classesVersion, setClassesVersion] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isGraduationModalOpen, setIsGraduationModalOpen] = useState(false);
  const [isSklModalOpen, setIsSklModalOpen] = useState(false);
  const [selectedStudentForSkl, setSelectedStudentForSkl] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const finalYearActiveCount = React.useMemo(() => {
    return (students || []).filter(
      s => (s.kelas === '9' || s.kelas.startsWith('9') || s.kelas.toUpperCase().includes('IX')) && s.status === 'Aktif'
    ).length;
  }, [students]);

  const alumniCount = React.useMemo(() => {
    return (students || []).filter(s => s.status === 'Lulus').length;
  }, [students]);

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
    // Remove any ISO timestamp or space timestamp
    const clean = val.split('T')[0].split(' ')[0].trim();
    return clean || '2011-01-01';
  };

  const formatBirthDateClean = (dateStr?: string): string => {
    if (!dateStr) return '-';
    // Strip any day names (e.g. "Senin, ", "Selasa, ") and times (e.g. " 00:00:00")
    const cleanDate = dateStr.split('T')[0].split(' ')[0].replace(/^(Senin|Selasa|Rabu|Kamis|Jum'?at|Sabtu|Minggu|Ahad)[,\s]+/gi, '').trim();
    
    // Parse YYYY-MM-DD
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

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm) ||
      s.namaOrangTua.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.namaAyah && s.namaAyah.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.namaIbu && s.namaIbu.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchClass = classFilter === 'Semua' || s.kelas === classFilter;
    const matchStatus = statusFilter === 'Semua' || s.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

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

  const handleExportCSV = () => {
    const csvData = (students || []).map(s => ({
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
      Status: s.status,
      Tahun_Lulus: s.tahunLulus || '-',
      Tanggal_Lulus: s.tanggalLulus || '-',
      Nomor_Ijazah: s.nomorIjazah || '-',
      Sekolah_Lanjutan: s.sekolahLanjutan || '-'
    }));
    exportToCSV('Data_Siswa_SMP_Islam_Al_Qomar.csv', csvData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>Master Data Peserta Didik</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Kelola Data Siswa & Santri SMP Islam Al Qomar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Induk data NISN, NIS, rombel kelas, orang tua/wali, serta status keaktifan santri
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenAddAlumni}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-amber-500/40 transition-colors shadow-sm"
            title="Tambah data santri yang sudah lulus (alumni) secara langsung / manual"
          >
            <GraduationCap className="w-4 h-4 text-amber-200" />
            <span>+ Tambah Alumni Manual</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari NISN, nama siswa, wali, no ijazah..."
            className="w-full px-3 py-2 pl-9 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-700 font-bold">Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua" className="bg-white text-slate-900">Semua Kelas</option>
              {classes.map(c => (
                <option key={c} value={c} className="bg-white text-slate-900">
                  {formatClassLabel(c)} {c === '9' || c.startsWith('9') ? '⭐ (Tingkat Akhir)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-700 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua" className="bg-white text-slate-900">Semua Status ({students.length})</option>
              <option value="Aktif" className="bg-white text-slate-900">Aktif ({students.filter(s => s.status === 'Aktif').length})</option>
              <option value="Lulus" className="bg-white text-slate-900">🎓 Lulus / Alumni ({alumniCount})</option>
              <option value="Pindah" className="bg-white text-slate-900">Pindah ({students.filter(s => s.status === 'Pindah').length})</option>
            </select>
          </div>
        </div>

      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">Nama & NISN</th>
                <th className="p-3.5">Rombel / Kelas</th>
                <th className="p-3.5">L/P</th>
                <th className="p-3.5">Tempat & Tgl Lahir</th>
                <th className="p-3.5">Orang Tua / Wali</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 font-serif text-sm">{student.nama}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      NISN: {student.nisn} | NIS: {student.nis}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200">
                      Kelas {student.kelas}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700">
                    {student.gender}
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
                    {student.status === 'Lulus' ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                          <span>Lulus (Alumni)</span>
                        </span>
                        {student.tahunLulus && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            TA {student.tahunLulus}
                          </span>
                        )}
                        {student.nomorIjazah && (
                          <span className="text-[10px] text-emerald-800 font-mono font-semibold">
                            Ijazah: {student.nomorIjazah}
                          </span>
                        )}
                        {student.sekolahLanjutan && (
                          <span className="text-[10px] text-slate-600 truncate max-w-[130px]" title={student.sekolahLanjutan}>
                            ➡️ {student.sekolahLanjutan}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        student.status === 'Aktif'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {student.status}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {student.status === 'Lulus' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedStudentForSkl(student);
                              setIsSklModalOpen(true);
                            }}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Cetak Surat Keterangan Lulus (SKL) Resmi"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRevertStudent(student)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Batalkan Kelulusan (Kembalikan Santri ke Aktif)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </>
                      )}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
