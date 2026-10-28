import React, { useState, useMemo } from 'react';
import { Student, SubjectGradeRecord, AttendanceRecord, SchoolInfo, Teacher, StudentDiniyahReport } from '../../types';
import {
  Printer,
  ArrowLeft,
  FileText,
  Users,
  User,
  Download,
  Sparkles,
  CheckCircle2,
  Bookmark,
  Edit3,
  PlusCircle,
  Trophy,
  BookOpen,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  ShieldCheck,
  AlertCircle,
  SlidersHorizontal,
  RotateCcw,
  X,
  Info,
  Settings
} from 'lucide-react';
import { EditDiniyahEkskulModal, BatchApplyScope } from './EditDiniyahEkskulModal';
import { StorageService } from '../../services/storage';
import {
  DEFAULT_MAPEL_LIST,
  getMapelSortIndex,
  OFFICIAL_MAPEL_ORDER,
  OFFICIAL_MAPEL_TEACHERS,
  normalizeMapelName
} from '../../data/constants';

interface LaporanRaporViewProps {
  students: Student[];
  grades: SubjectGradeRecord[];
  attendance: AttendanceRecord[];
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  initialSelectedStudent?: Student | null;
  onBack?: () => void;
  onSaveStudents?: (updated: Student[]) => void;
}

export const LaporanRaporView: React.FC<LaporanRaporViewProps> = ({
  students,
  grades,
  attendance,
  schoolInfo,
  teachers,
  initialSelectedStudent,
  onBack,
  onSaveStudents
}) => {
  // Extract unique classes
  const availableClasses = Array.from(new Set(students.map(s => s.kelas))).sort();

  const [selectedKelas, setSelectedKelas] = useState<string>(
    initialSelectedStudent ? initialSelectedStudent.kelas : (availableClasses[0] || '7')
  );

  const [viewMode, setViewMode] = useState<'individual' | 'bulk'>('individual');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudent ? initialSelectedStudent.id : (students.find(s => s.kelas === selectedKelas)?.id || students[0]?.id || '')
  );

  // Modal State for editing Diniyah & Extracurricular achievements
  const [isEditDiniyahOpen, setIsEditDiniyahOpen] = useState<boolean>(false);
  const [editTargetStudentId, setEditTargetStudentId] = useState<string>('');
  const [showGradeChecklist, setShowGradeChecklist] = useState<boolean>(false);
  const [showAllOfficialMapels, setShowAllOfficialMapels] = useState<boolean>(true);

  // Print Margin Configuration State (Standar Resmi Dokumen Rapor Kedinasan)
  const [printMargins, setPrintMargins] = useState<{
    preset: 'resmi' | 'seimbang' | 'kompak' | 'custom';
    top: number;
    right: number;
    bottom: number;
    left: number;
  }>(() => {
    try {
      const saved = localStorage.getItem('alqomar_print_margins');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      preset: 'resmi',
      top: 20,
      right: 20,
      bottom: 20,
      left: 25
    };
  });
  const [isMarginModalOpen, setIsMarginModalOpen] = useState<boolean>(false);

  const applyMarginPreset = (preset: 'resmi' | 'seimbang' | 'kompak') => {
    let nextMargins;
    if (preset === 'resmi') {
      nextMargins = { preset: 'resmi' as const, top: 20, right: 20, bottom: 20, left: 25 };
    } else if (preset === 'seimbang') {
      nextMargins = { preset: 'seimbang' as const, top: 20, right: 20, bottom: 20, left: 20 };
    } else {
      nextMargins = { preset: 'kompak' as const, top: 15, right: 15, bottom: 15, left: 15 };
    }
    setPrintMargins(nextMargins);
    try {
      localStorage.setItem('alqomar_print_margins', JSON.stringify(nextMargins));
    } catch {}
  };

  const handleCustomMarginChange = (side: 'top' | 'right' | 'bottom' | 'left', val: number) => {
    const clamped = Math.max(5, Math.min(45, val));
    const nextMargins = {
      ...printMargins,
      preset: 'custom' as const,
      [side]: clamped
    };
    setPrintMargins(nextMargins);
    try {
      localStorage.setItem('alqomar_print_margins', JSON.stringify(nextMargins));
    } catch {}
  };

  const handleOpenEditDiniyah = (studentId: string) => {
    setEditTargetStudentId(studentId);
    setIsEditDiniyahOpen(true);
  };

  const handleSaveStudentDiniyah = (
    targetStudentId: string,
    diniyahReport: StudentDiniyahReport,
    applyToAllInClass: boolean = false,
    batchScope?: BatchApplyScope
  ) => {
    let updated: Student[];
    if (applyToAllInClass) {
      const targetStudent = students.find(s => s.id === targetStudentId);
      const targetClass = targetStudent ? targetStudent.kelas : selectedKelas;
      const scope = batchScope || {
        applyKokurikuler: true,
        applyEkskul: true,
        applyDiniyah: false,
        applyCatatan: false
      };

      updated = students.map(s => {
        if (s.id === targetStudentId) {
          return {
            ...s,
            diniyahReport: { ...diniyahReport }
          };
        }
        if (s.kelas === targetClass) {
          const prevRep = s.diniyahReport;
          return {
            ...s,
            diniyahReport: {
              // Menjaga hafalan Al-Qur'an dan karakter riil masing-masing santri agar tidak tertimpa
              tahfidz: (scope.applyDiniyah ? diniyahReport.tahfidz : prevRep?.tahfidz) || "Hafal Juz 30 (Lancar & Mutqin)",
              adab: (scope.applyDiniyah ? diniyahReport.adab : prevRep?.adab) || "Istiqomah, Santun & Disiplin",
              shalat: (scope.applyDiniyah ? diniyahReport.shalat : prevRep?.shalat) || "Rutin Shalat Dhuha & Dzuhur Berjamaah",
              // Salin tema Projek P5 Kokurikuler & Ekstrakurikuler Wajib/Pilihan serentak sekelas
              kokurikuler: scope.applyKokurikuler ? diniyahReport.kokurikuler : (prevRep?.kokurikuler || diniyahReport.kokurikuler),
              ekskul: scope.applyEkskul ? [...diniyahReport.ekskul] : (prevRep?.ekskul || [...diniyahReport.ekskul]),
              catatanWaliKelas: scope.applyCatatan ? diniyahReport.catatanWaliKelas : prevRep?.catatanWaliKelas,
              tanggapanOrtu: prevRep?.tanggapanOrtu
            }
          };
        }
        return s;
      });
    } else {
      updated = students.map(s => {
        if (s.id === targetStudentId) {
          return {
            ...s,
            diniyahReport: { ...diniyahReport }
          };
        }
        return s;
      });
    }

    if (onSaveStudents) {
      onSaveStudents(updated);
    } else {
      StorageService.setStudents(updated);
    }
  };

  // Filter students by selected class
  const classStudents = students.filter(s => s.kelas === selectedKelas);

  // Pre-flight check: Status kelengkapan nilai mapel per rombel kelas
  const classGradeStatus = useMemo(() => {
    if (classStudents.length === 0) return { completeList: [], missingList: [], percentage: 0, isAllComplete: true, totalMapels: 0 };

    const totalStudents = classStudents.length;
    const completeList: { mapel: string; guru: string; filledCount: number; totalCount: number }[] = [];
    const missingList: { mapel: string; guru: string; filledCount: number; totalCount: number; status: 'kosong' | 'sebagian' }[] = [];

    DEFAULT_MAPEL_LIST.forEach(mapelName => {
      // Cari guru pengampu mapel ini
      const teacher = teachers.find(t => 
        t.mapelUtama === mapelName || t.mapelTambahan?.includes(mapelName)
      );
      const teacherName = teacher ? teacher.nama : 'Guru Pengampu';

      // Cari rekor nilai untuk kelas & mapel ini
      const gradeRecord = grades.find(g => g.kelas === selectedKelas && g.mapel === mapelName);

      if (!gradeRecord || !gradeRecord.studentGrades || gradeRecord.studentGrades.length === 0) {
        missingList.push({
          mapel: mapelName,
          guru: teacherName,
          filledCount: 0,
          totalCount: totalStudents,
          status: 'kosong'
        });
      } else {
        // Hitung berapa siswa di kelas ini yang sudah memiliki nilai akhir > 0
        let filledCount = 0;
        classStudents.forEach(st => {
          const entry = gradeRecord.studentGrades.find(e => e.studentId === st.id);
          if (entry) {
            const avgF = Math.round((entry.nilaiFormatif1 + entry.nilaiFormatif2) / 2);
            const akhir = Math.round((avgF * 0.4) + (entry.nilaiPTS * 0.3) + (entry.nilaiPAS * 0.3));
            if (akhir > 0) filledCount++;
          }
        });

        if (filledCount === totalStudents) {
          completeList.push({
            mapel: mapelName,
            guru: gradeRecord.teacherName || teacherName,
            filledCount,
            totalCount: totalStudents
          });
        } else {
          missingList.push({
            mapel: mapelName,
            guru: gradeRecord.teacherName || teacherName,
            filledCount,
            totalCount: totalStudents,
            status: filledCount === 0 ? 'kosong' : 'sebagian'
          });
        }
      }
    });

    const totalMapels = DEFAULT_MAPEL_LIST.length;
    const percentage = totalMapels > 0 ? Math.round((completeList.length / totalMapels) * 100) : 100;
    const isAllComplete = missingList.length === 0;

    return {
      completeList,
      missingList,
      percentage,
      isAllComplete,
      totalMapels
    };
  }, [classStudents, grades, selectedKelas, teachers]);

  // Current selected student object
  const currentStudent = students.find(s => s.id === selectedStudentId) || classStudents[0] || students[0];

  // Wali Kelas for selected class
  const currentWaliKelas = teachers.find(t => t.waliKelasDi === selectedKelas) || teachers[0];

  const handlePrint = () => {
    window.print();
  };

  const handleClassChange = (newKelas: string) => {
    setSelectedKelas(newKelas);
    const firstStudentInClass = students.find(s => s.kelas === newKelas);
    if (firstStudentInClass) {
      setSelectedStudentId(firstStudentInClass.id);
    }
  };

  // Helper to calculate student attendance summary
  const getAttendanceForStudent = (stId: string) => {
    let hadir = 0, izin = 0, sakit = 0, alpa = 0;
    attendance.forEach(rec => {
      const entry = rec.entries.find(e => e.studentId === stId);
      if (entry) {
        if (entry.status === 'H') hadir++;
        else if (entry.status === 'I') izin++;
        else if (entry.status === 'S') sakit++;
        else if (entry.status === 'A') alpa++;
      }
    });
    return { hadir, izin, sakit, alpa };
  };

  // Helper generator deskripsi narasi capaian kompetensi otomatis (Kurikulum Merdeka)
  const generateAutoKompetensi = (mapel: string, akhir: number, tpList?: string[]): string => {
    const activeTps = (tpList || []).filter(t => t && t !== '0' && t !== '-' && t.trim() !== '');
    const tpStr = activeTps.length > 0 
      ? `materi ${activeTps.slice(0, 2).join(' serta ')}` 
      : `tujuan pembelajaran pokok ${mapel}`;

    if (akhir >= 85) {
      return `Menunjukkan penguasaan yang sangat baik dalam memahami dan menerapkan ${tpStr}. Sangat disiplin dan tuntas dalam pengerjaan asesmen.`;
    } else if (akhir >= 75) {
      return `Menunjukkan penguasaan yang baik dalam mencapai ${tpStr}. Mampu menyelesaikan tugas pembelajaran dengan baik dan terarah.`;
    } else if (akhir >= 60) {
      return `Menunjukkan pemahaman yang cukup dalam menguasai ${tpStr}. Perlu meningkatkan latihan mandiri dan keaktifan bertanya di kelas.`;
    } else if (akhir > 0) {
      return `Perlu bimbingan dan pendampingan intensif dari guru serta orang tua dalam memahami ${tpStr}.`;
    } else {
      return `Penilaian asesmen sumatif lingkup materi sedang dalam proses penyelesaian oleh guru pengampu.`;
    }
  };

  // Helper to calculate student grades list
  const getGradesForStudent = (stId: string) => {
    // Kumpulkan seluruh data nilai yang sudah diinput guru untuk siswa ini
    const existingEntriesMap: Record<string, {
      mapel: string;
      guru: string;
      formatif: number;
      pts: number;
      pas: number;
      akhir: number;
      predikat: string;
      catatan: string;
      tpList?: string[];
    }> = {};

    grades.forEach(g => {
      const entry = g.studentGrades.find(e => e.studentId === stId);
      if (entry) {
        const avgF = Math.round((entry.nilaiFormatif1 + entry.nilaiFormatif2) / 2);
        const akhir = Math.round((avgF * 0.4) + (entry.nilaiPTS * 0.3) + (entry.nilaiPAS * 0.3));
        let predikat = '-';
        if (akhir >= 90) predikat = 'A';
        else if (akhir >= 80) predikat = 'B';
        else if (akhir >= 70) predikat = 'C';
        else if (akhir > 0) predikat = 'D';
        else predikat = '-';

        // Auto-generate catatan narasi kompetensi jika catatan kosong atau hanya tanda strip '-'
        let catatan = (entry.catatanKompetensi || '').trim();
        if (!catatan || catatan === '-' || catatan === '0') {
          catatan = generateAutoKompetensi(g.mapel, akhir, g.tpList);
        }

        const normKey = normalizeMapelName(g.mapel);
        existingEntriesMap[normKey] = {
          mapel: g.mapel,
          guru: g.teacherName || OFFICIAL_MAPEL_TEACHERS[normKey]?.teacherName || 'Guru Pengampu',
          formatif: avgF,
          pts: entry.nilaiPTS,
          pas: entry.nilaiPAS,
          akhir,
          predikat,
          catatan,
          tpList: g.tpList
        };
      }
    });

    const list: {
      mapel: string;
      guru: string;
      formatif: number;
      pts: number;
      pas: number;
      akhir: number | string;
      predikat: string;
      catatan: string;
    }[] = [];

    if (showAllOfficialMapels) {
      // 1. Tampilkan 13 Mata Pelajaran Pokok Resmi Kurikulum Merdeka (Format Baku Buku Rapor)
      OFFICIAL_MAPEL_ORDER.forEach(mapelName => {
        const normKey = normalizeMapelName(mapelName);
        const existing = existingEntriesMap[normKey];
        if (existing) {
          list.push({
            mapel: mapelName,
            guru: existing.guru,
            formatif: existing.formatif,
            pts: existing.pts,
            pas: existing.pas,
            akhir: existing.akhir,
            predikat: existing.predikat,
            catatan: existing.catatan
          });
        } else {
          // Mapel resmi yang belum diinput oleh guru pengampu
          const teacherObj = OFFICIAL_MAPEL_TEACHERS[normKey];
          list.push({
            mapel: mapelName,
            guru: teacherObj?.teacherName || 'Guru Pengampu',
            formatif: 0,
            pts: 0,
            pas: 0,
            akhir: '-',
            predikat: '-',
            catatan: 'Belum diisi oleh guru pengampu (menunggu asesmen pembelajaran).'
          });
        }
      });

      // 2. Tambahkan mapel kekhasan / diniyah lain yang ada di database
      Object.keys(existingEntriesMap).forEach(key => {
        const isOfficial = (OFFICIAL_MAPEL_ORDER as readonly string[]).some(
          m => normalizeMapelName(m) === key
        );
        if (!isOfficial) {
          const entry = existingEntriesMap[key];
          list.push({
            mapel: entry.mapel,
            guru: entry.guru,
            formatif: entry.formatif,
            pts: entry.pts,
            pas: entry.pas,
            akhir: entry.akhir,
            predikat: entry.predikat,
            catatan: entry.catatan
          });
        }
      });
    } else {
      // Mode hanya mapel yang sudah memiliki nilai di sistem
      Object.values(existingEntriesMap).forEach(entry => {
        list.push({
          mapel: entry.mapel,
          guru: entry.guru,
          formatif: entry.formatif,
          pts: entry.pts,
          pas: entry.pas,
          akhir: entry.akhir,
          predikat: entry.predikat,
          catatan: entry.catatan
        });
      });

      list.sort((a, b) => {
        const idxA = getMapelSortIndex(a.mapel);
        const idxB = getMapelSortIndex(b.mapel);
        if (idxA !== idxB) {
          return idxA - idxB;
        }
        return a.mapel.localeCompare(b.mapel, 'id');
      });
    }

    return list;
  };

  // Render individual Report Card sheet
  const renderReportCard = (st: Student, isBulkItem: boolean = false) => {
    const wali = teachers.find(t => t.waliKelasDi === st.kelas) || currentWaliKelas;
    const att = getAttendanceForStudent(st.id);
    const stGrades = getGradesForStudent(st.id);

    const officialKepsek = teachers.find(
      t => t.jabatan === 'Kepala Sekolah' || t.jabatan?.toLowerCase().trim() === 'kepala sekolah'
    );
    const kepsekNama = officialKepsek?.nama || schoolInfo.kepalaSekolah || 'Kepala Sekolah';
    const kepsekNigy = officialKepsek?.nigy || officialKepsek?.nip || schoolInfo.nigyKepalaSekolah || '-';

    return (
      <div
        key={st.id}
        id={`rapor-student-${st.id}`}
        className={`bg-white rounded-2xl p-7 border border-slate-300 shadow-md max-w-4xl mx-auto space-y-4 text-slate-900 font-sans print:max-w-none print:w-full print:p-0 print:border-none print:shadow-none print:space-y-3.5 print:rounded-none ${
          isBulkItem ? 'page-break mb-10 print:mb-0' : ''
        }`}
      >
        {/* Official Kop Header */}
        <div className={`text-center relative ${schoolInfo.kopSuratUrl ? 'pb-1 mb-1 print:pb-0.5 print:mb-1' : 'border-b-4 border-double border-emerald-900 pb-2 mb-2 print:pb-1.5 print:mb-1.5'}`}>
          {schoolInfo.kopSuratUrl ? (
            <div className="w-full flex justify-center mb-1">
              <img 
                src={schoolInfo.kopSuratUrl} 
                alt="Kop Surat Resmi SMP Islam Al Qomar" 
                className="w-full max-h-28 object-contain mx-auto print:max-h-24"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 print:gap-2.5">
              <div className="w-12 h-12 rounded-full bg-white text-emerald-950 font-black text-xl flex items-center justify-center border-2 border-emerald-500 overflow-hidden shrink-0 p-1 print:w-11 print:h-11">
                {schoolInfo.logoUrl ? (
                  <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-contain" />
                ) : (
                  "☪"
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest font-serif print:text-[10px]">
                  YAYASAN AL QOMAR BANYUWANGI
                </p>
                <h1 className="text-lg font-black text-emerald-950 font-serif tracking-tight print:text-base">
                  {schoolInfo.nama.toUpperCase()}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium print:text-[10.5px]">
                  {schoolInfo.alamat} | Telp: {schoolInfo.telepon}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Official Document Title Header */}
        <div className="relative flex items-center justify-between my-1 print:my-1">
          <div className="w-full text-center">
            <h2 className="text-sm sm:text-base font-bold font-serif underline tracking-wide uppercase text-slate-900 print:text-sm">
              LAPORAN HASIL BELAJAR (RAPOR)
            </h2>
          </div>

          <div className="no-print absolute right-0 top-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenEditDiniyah(st.id)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-amber-400 hover:bg-amber-300 px-3 py-1.5 rounded-lg shadow-sm border border-amber-300 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-900" />
              <span>Edit Capaian Rapor Siswa Ini</span>
            </button>
          </div>
        </div>

        {/* Biodata Murid (2 Columns with aligned colons : matching diagram items ①-⑧) */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs print:text-[11px] text-slate-900 font-medium py-1.5 border-y border-slate-300 print:border-slate-400 break-inside-avoid">
          {/* Kolom Kiri: ① Nama Murid, ② NISN, ③ Sekolah, ④ Alamat */}
          <div className="space-y-0.5">
            <div className="flex">
              <span className="w-28 print:w-24 font-bold text-slate-800 shrink-0">Nama Murid</span>
              <span className="mr-2 font-bold">:</span>
              <span className="font-bold font-serif text-slate-950 flex-1">{st.nama}</span>
            </div>
            <div className="flex">
              <span className="w-28 print:w-24 font-bold text-slate-800 shrink-0">NISN</span>
              <span className="mr-2 font-bold">:</span>
              <span className="font-mono flex-1">{st.nisn}</span>
            </div>
            <div className="flex">
              <span className="w-28 print:w-24 font-bold text-slate-800 shrink-0">Sekolah</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1">{schoolInfo.nama}</span>
            </div>
            <div className="flex">
              <span className="w-28 print:w-24 font-bold text-slate-800 shrink-0">Alamat</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1 text-[11px] print:text-[10px] leading-tight text-slate-700">{schoolInfo.alamat}</span>
            </div>
          </div>

          {/* Kolom Kanan: ⑤ Kelas, ⑥ Fase, ⑦ Semester, ⑧ Tahun Ajaran */}
          <div className="space-y-0.5">
            <div className="flex">
              <span className="w-28 print:w-24 font-bold text-slate-800 shrink-0">Kelas</span>
              <span className="mr-2 font-bold">:</span>
              <span className="font-bold flex-1">{st.kelas}</span>
            </div>
            <div className="flex">
              <span className="w-28 print:w-24 font-bold text-slate-800 shrink-0">Fase</span>
              <span className="mr-2 font-bold">:</span>
              <span className="font-bold flex-1">Fase D</span>
            </div>
            <div className="flex">
              <span className="w-28 print:w-24 font-bold text-slate-800 shrink-0">Semester</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1">{schoolInfo.semesterAktif === 'Ganjil' ? '1 (Ganjil)' : '2 (Genap)'}</span>
            </div>
            <div className="flex">
              <span className="w-28 print:w-24 font-bold text-slate-800 shrink-0">Tahun Ajaran</span>
              <span className="mr-2 font-bold">:</span>
              <span className="flex-1">{schoolInfo.tahunAjaran}</span>
            </div>
          </div>
        </div>

        {/* Tabel Intrakurikuler (Nilai Akhir & Capaian Kompetensi items ⑨-⑪) */}
        <div className="space-y-1">
          <table className="w-full text-left border-collapse border border-slate-500 text-xs print:text-[11px]">
            <thead>
              <tr className="bg-slate-300 text-slate-900 font-bold text-center border-b border-slate-500 print:bg-slate-200">
                <th className="border border-slate-500 p-2 print:p-1.5 w-10 text-center">No.</th>
                <th className="border border-slate-500 p-2 print:p-1.5 text-center w-52 print:w-48">Mata Pelajaran</th>
                <th className="border border-slate-500 p-2 print:p-1.5 w-20 text-center">Nilai Akhir</th>
                <th className="border border-slate-500 p-2 print:p-1.5 text-center">Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {stGrades.length > 0 ? (
                stGrades.map((g, idx) => (
                  <tr key={idx} className="border-b border-slate-400">
                    <td className="border-r border-slate-400 p-2 print:p-1.5 text-center font-bold">{idx + 1}</td>
                    <td className="border-r border-slate-400 p-2 print:p-1.5 font-bold font-serif text-slate-900">{g.mapel}</td>
                    <td className="border-r border-slate-400 p-2 print:p-1.5 text-center font-black text-slate-900 bg-slate-50/50 print:bg-transparent">{g.akhir}</td>
                    <td className="p-2 print:p-1.5 text-xs print:text-[11px] text-slate-800 leading-relaxed">{g.catatan}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-slate-500 italic text-xs">
                    Belum ada data nilai mata pelajaran terisi untuk siswa ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Kotak Kokurikuler ⑫ (P5 & Karakter Diniyah Islamiyyah Al Qomar) */}
        <div className="border border-slate-500 rounded-sm overflow-hidden text-xs print:text-[11px] break-inside-avoid">
          <div className="bg-slate-300 font-bold text-slate-900 px-3 py-1.5 print:py-1 border-b border-slate-500 flex items-center justify-between print:bg-slate-200">
            <span>Kokurikuler</span>
            <div className="no-print flex items-center gap-2">
              <span className="text-[10px] text-slate-600 font-normal">P5 &amp; Karakter Diniyah</span>
              <button
                type="button"
                onClick={() => handleOpenEditDiniyah(st.id)}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded shadow-xs border border-amber-500/50 transition-colors cursor-pointer"
                title="Edit isian narasi Kokurikuler P5 siswa ini"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Edit Kokurikuler</span>
              </button>
            </div>
          </div>
          <div className="p-2.5 print:p-2 text-slate-800 leading-relaxed bg-white">
            {st.diniyahReport?.kokurikuler || (
              <span>
                Mengikuti Projek Penguatan Profil Pelajar Pancasila (P5) dengan baik serta aktif dalam pembiasaan Diniyah Islamiyyah: 
                Tahfidz Al-Qur'an (<strong>{st.diniyahReport?.tahfidz || "Hafal Juz 30 Lancar & Mutqin"}</strong>), 
                Adab &amp; Akhlaqul Karimah (<strong>{st.diniyahReport?.adab || "Istiqomah, Santun & Disiplin"}</strong>), 
                dan Kedisiplinan Shalat (<strong>{st.diniyahReport?.shalat || "Rutin Shalat Dhuha & Dzuhur Berjamaah"}</strong>).
              </span>
            )}
          </div>
        </div>

        {/* Tabel Ekstrakurikuler ⑬-⑭ */}
        <div className="border border-slate-500 rounded-sm overflow-hidden text-xs print:text-[11px] break-inside-avoid">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-300 text-slate-900 font-bold text-center border-b border-slate-500 print:bg-slate-200">
                <th className="border-r border-slate-500 p-2 print:p-1.5 w-10 text-center">No.</th>
                <th className="border-r border-slate-500 p-2 print:p-1.5 w-60 print:w-56 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Ekstrakurikuler</span>
                    <button
                      type="button"
                      onClick={() => handleOpenEditDiniyah(st.id)}
                      className="no-print inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-1.5 py-0.2 rounded shadow-xs border border-amber-500/50 transition-colors cursor-pointer"
                      title="Edit daftar ekstrakurikuler siswa ini"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </th>
                <th className="p-2 print:p-1.5 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {(st.diniyahReport?.ekskul && st.diniyahReport.ekskul.length > 0) ? (
                st.diniyahReport.ekskul.map((ek, ekIdx) => (
                  <tr key={ekIdx} className="border-b border-slate-400 last:border-b-0">
                    <td className="border-r border-slate-400 p-2 print:p-1.5 text-center font-bold">{ekIdx + 1}</td>
                    <td className="border-r border-slate-400 p-2 print:p-1.5 font-bold font-serif text-slate-900">
                      {ek.nama}
                    </td>
                    <td className="p-2 print:p-1.5 text-xs print:text-[11px] text-slate-800 leading-relaxed">{ek.keterangan}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-slate-400 last:border-b-0">
                  <td className="border-r border-slate-400 p-2 print:p-1.5 text-center font-bold">1</td>
                  <td className="border-r border-slate-400 p-2 print:p-1.5 font-bold font-serif text-slate-900">
                    Praja Muda Karana (Pramuka)
                  </td>
                  <td className="p-2 print:p-1.5 text-xs print:text-[11px] text-slate-800 leading-relaxed">
                    Aktif, disiplin, dan terampil dalam kepramukaan serta pionering.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Grid Berdampingan: Ketidakhadiran ⑮ & Catatan Wali Kelas ⑯ */}
        <div className="grid grid-cols-2 gap-4 print:gap-3 text-xs print:text-[11px] break-inside-avoid">
          {/* Box Kiri: Ketidakhadiran ⑮ */}
          <div className="border border-slate-500 rounded-sm overflow-hidden">
            <div className="bg-slate-300 font-bold text-slate-900 px-3 py-1.5 print:py-1 border-b border-slate-500 text-center print:bg-slate-200">
              Ketidakhadiran
            </div>
            <table className="w-full text-xs print:text-[11px]">
              <tbody>
                <tr className="border-b border-slate-400">
                  <td className="p-2 print:p-1.5 border-r border-slate-400 w-1/2 font-medium">Sakit</td>
                  <td className="p-2 print:p-1.5 text-center font-bold">{att.sakit} hari</td>
                </tr>
                <tr className="border-b border-slate-400">
                  <td className="p-2 print:p-1.5 border-r border-slate-400 font-medium">Izin</td>
                  <td className="p-2 print:p-1.5 text-center font-bold">{att.izin} hari</td>
                </tr>
                <tr>
                  <td className="p-2 print:p-1.5 border-r border-slate-400 font-medium">Tanpa Keterangan</td>
                  <td className="p-2 print:p-1.5 text-center font-bold">{att.alpa} hari</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Box Kanan: Catatan Wali Kelas ⑯ */}
          <div className="border border-slate-500 rounded-sm overflow-hidden flex flex-col">
            <div className="bg-slate-300 font-bold text-slate-900 px-3 py-1.5 print:py-1 border-b border-slate-500 flex items-center justify-between print:justify-center print:bg-slate-200">
              <span className="mx-auto print:mx-0">Catatan Wali Kelas</span>
              <button
                type="button"
                onClick={() => handleOpenEditDiniyah(st.id)}
                className="no-print inline-flex items-center gap-0.5 text-[9px] font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 px-1.5 py-0.2 rounded shadow-xs border border-amber-500/50 transition-colors cursor-pointer"
                title="Edit Catatan Wali Kelas siswa ini"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Edit</span>
              </button>
            </div>
            <div className="p-2.5 print:p-2 text-slate-800 leading-relaxed flex-1 bg-white flex items-center text-xs print:text-[11px]">
              <p className="italic">
                "{st.diniyahReport?.catatanWaliKelas || "Ananda menunjukkan kesungguhan belajar yang baik, pertahankan kedisiplinan dan terus istiqomah dalam ibadah serta hafalan Al-Qur'an."}"
              </p>
            </div>
          </div>
        </div>

        {/* Kotak Tanggapan Orang Tua/ Wali Murid ⑰ */}
        <div className="border border-slate-500 rounded-sm overflow-hidden text-xs print:text-[11px] break-inside-avoid">
          <div className="bg-slate-300 font-bold text-slate-900 px-3 py-1.5 print:py-1 border-b border-slate-500 text-center print:bg-slate-200">
            Tanggapan Orang Tua/ Wali Murid
          </div>
          <div className="p-2.5 print:p-2 min-h-[3.5rem] print:min-h-[3rem] bg-white text-slate-700 text-xs print:text-[11px]">
            {st.diniyahReport?.tanggapanOrtu ? (
              <p className="italic">"{st.diniyahReport.tanggapanOrtu}"</p>
            ) : (
              <div className="h-full flex items-end">
                <span className="text-[10px] text-slate-400 italic">
                  * Ruang catatan/masukan dari orang tua murid setelah menerima rapor.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tiga Tanda Tangan Resmi (Tata Letak Sesuai Gambar: Kiri Orang Tua, Tengah Kepala Sekolah, Kanan Wali Kelas + Tanggal) */}
        <div className="pt-3 print:pt-2.5 break-inside-avoid">
          <table className="w-full text-center border-none border-collapse text-xs print:text-[11px] text-slate-900">
            <tbody>
              {/* Row 1: Header Jabatan & Titimangsa */}
              <tr>
                {/* Kiri: Orang Tua Murid */}
                <td className="w-1/3 align-top pb-1">
                  <p className="text-transparent select-none print:hidden">&nbsp;</p>
                  <p className="font-bold">Orang Tua Murid</p>
                </td>

                {/* Tengah: Kepala Sekolah */}
                <td className="w-1/3 align-top pb-1">
                  <p className="text-transparent select-none print:hidden">&nbsp;</p>
                  <p className="font-bold">Kepala Sekolah</p>
                </td>

                {/* Kanan: Tempat, Tanggal rapor & Wali Kelas */}
                <td className="w-1/3 align-top pb-1">
                  <p className="font-medium text-slate-700">
                    Banyuwangi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold">Wali Kelas</p>
                </td>
              </tr>

              {/* Row 2: Ruang Kosong Tanda Tangan Basah & Stempel Resmi */}
              <tr>
                <td className="h-16 print:h-14"></td>
                <td className="h-16 print:h-14"></td>
                <td className="h-16 print:h-14"></td>
              </tr>

              {/* Row 3: Nama Penandatangan, Garis Bawah Presisi, dan Identitas NIGY */}
              <tr>
                {/* Kolom Kiri: Orang Tua Murid */}
                <td className="align-bottom px-2">
                  <div className="font-bold text-slate-900 text-xs print:text-[11px] leading-tight min-h-[1.75rem] flex items-end justify-center pb-0.5">
                    {st.namaOrangTua || '................................'}
                  </div>
                  <div className="w-44 sm:w-48 mx-auto border-b-2 border-slate-700"></div>
                  <div className="text-[10px] print:text-[9.5px] text-transparent select-none pt-0.5 font-mono">
                    &nbsp;
                  </div>
                </td>

                {/* Kolom Tengah: Kepala Sekolah */}
                <td className="align-bottom px-2">
                  <div className="font-bold text-slate-900 text-xs print:text-[11px] leading-tight min-h-[1.75rem] flex items-end justify-center pb-0.5">
                    {kepsekNama}
                  </div>
                  <div className="w-44 sm:w-48 mx-auto border-b-2 border-slate-700"></div>
                  <div className="text-[10px] print:text-[10px] text-slate-600 pt-0.5 font-mono">
                    NIGY: {kepsekNigy}
                  </div>
                </td>

                {/* Kolom Kanan: Wali Kelas */}
                <td className="align-bottom px-2">
                  <div className="font-bold text-slate-900 text-xs print:text-[11px] leading-tight min-h-[1.75rem] flex items-end justify-center pb-0.5">
                    {wali?.nama || 'Ustadzah Siti Fatimah, S.Pd.'}
                  </div>
                  <div className="w-44 sm:w-48 mx-auto border-b-2 border-slate-700"></div>
                  <div className="text-[10px] print:text-[10px] text-slate-600 pt-0.5 font-mono">
                    NIGY: {wali?.nigy || wali?.nip || '-'}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Dynamic Print Margin Style Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: ${printMargins.top}mm ${printMargins.right}mm ${printMargins.bottom}mm ${printMargins.left}mm !important;
          }
        }
      ` }} />

      {/* Top Controls Bar (Hidden when Printing) */}
      <div className="no-print glass backdrop-blur-xl bg-slate-900/80 rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cetak Laporan Rapor Belajar (Kurikulum Merdeka)</span>
            </div>
            <h2 className="text-xl font-bold font-serif text-white">
              Rapor Digital &amp; Bulk Export PDF per Kelas
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Pilih mode cetak individu per siswa atau cetak kolektif (*bulk PDF*) seluruh siswa dalam satu rombel kelas untuk Wali Kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl border border-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>
            )}

            {/* View Mode Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('individual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'individual'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Satu Siswa</span>
              </button>

              <button
                onClick={() => setViewMode('bulk')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'bulk'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Bulk 1 Kelas ({classStudents.length} Siswa)</span>
              </button>
            </div>

            {/* Atur Batas Margin Kertas Button */}
            <button
              type="button"
              onClick={() => setIsMarginModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-white/10 transition-all cursor-pointer shadow-md hover:scale-[1.02]"
              title="Sesuaikan batas tepi margin cetak rapor (Atas, Kiri, Kanan, Bawah)"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              <span>Batas Margin Kertas</span>
              <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-emerald-300 font-mono border border-emerald-500/30">
                {printMargins.left}/{printMargins.top}/{printMargins.right}/{printMargins.bottom}mm
              </span>
            </button>

            {/* Edit Diniyah & Ekskul Button */}
            <button
              onClick={() => handleOpenEditDiniyah(currentStudent?.id || selectedStudentId)}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-lg transition-all border border-amber-300 cursor-pointer"
              title="Edit dan sesuaikan capaian Diniyah & Ekstrakurikuler santri"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Edit Diniyah &amp; Ekskul</span>
            </button>

            {/* Print / Export PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all border border-emerald-300/50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>
                {viewMode === 'bulk'
                  ? `Cetak / PDF Bulk Kelas ${selectedKelas} (${classStudents.length} Siswa)`
                  : 'Cetak / PDF Rapor Siswa'}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10 text-xs">
          
          {/* Class Selector */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Pilih Kelas:</span>
            <select
              value={selectedKelas}
              onChange={(e) => handleClassChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableClasses.map(k => (
                <option key={k} value={k}>
                  Kelas {k} ({students.filter(s => s.kelas === k).length} Siswa)
                </option>
              ))}
            </select>
          </div>

          {/* Individual Student Selector (Only shown in individual mode) */}
          {viewMode === 'individual' && (
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <span className="font-bold text-slate-300">Pilih Siswa:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {classStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nama} - NISN: {s.nisn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Tampilkan Seluruh 13 Mapel Standar */}
          <label className="flex items-center gap-2 cursor-pointer bg-slate-950/60 hover:bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10 transition-colors">
            <input
              type="checkbox"
              checked={showAllOfficialMapels}
              onChange={(e) => setShowAllOfficialMapels(e.target.checked)}
              className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400 focus:ring-offset-slate-900 cursor-pointer"
            />
            <span className="font-bold text-emerald-300 select-none">
              Tampilkan 13 Mapel Resmi (Standar Dokumen Rapor Lengkap)
            </span>
          </label>

          {/* Quick Margin Indicator Badge */}
          <button
            type="button"
            onClick={() => setIsMarginModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold transition-all cursor-pointer"
            title="Klik untuk melihat / mengubah batas margin cetak rapor"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Margin: <strong>Kiri {printMargins.left}mm</strong> (Ruang Jilid) • <strong>Atas {printMargins.top}mm</strong> • <strong>Kanan {printMargins.right}mm</strong> • <strong>Bawah {printMargins.bottom}mm</strong></span>
          </button>

          {/* Wali Kelas Badge */}
          <div className="ml-auto text-[11px] text-amber-300 bg-amber-500/10 border border-amber-400/20 px-3 py-1 rounded-xl">
            Wali Kelas {selectedKelas}: <strong>{currentWaliKelas?.nama || 'Ustadzah Siti Fatimah, S.Pd.'}</strong>
          </div>

        </div>

        {/* Visual Indicator: Status Kesiapan Nilai Mapel Kelas (Wali Kelas Pre-Flight Checklist) */}
        <div className={`p-4 rounded-xl border transition-all ${
          classGradeStatus.isAllComplete
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                classGradeStatus.isAllComplete
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                {classGradeStatus.isAllComplete ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-300" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                    <span>Status Kesiapan Nilai Kelas {selectedKelas}:</span>
                    {classGradeStatus.isAllComplete ? (
                      <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-400" />
                        100% LENGKAP &amp; SIAP CETAK
                      </span>
                    ) : (
                      <span className="text-amber-300 font-extrabold">
                        {classGradeStatus.missingList.length} Mapel Belum Lengkap / Masih Kosong
                      </span>
                    )}
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    classGradeStatus.isAllComplete
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                  }`}>
                    {classGradeStatus.completeList.length} / {classGradeStatus.totalMapels} Mapel Selesai
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {classGradeStatus.isAllComplete
                    ? `Seluruh nilai mata pelajaran untuk ${classStudents.length} santri Kelas ${selectedKelas} telah diinput lengkap oleh masing-masing guru pengampu.`
                    : `Peringatan untuk Wali Kelas ${selectedKelas}: Beberapa mata pelajaran belum diisi penuh oleh guru pengampu. Sebaiknya periksa sebelum mencetak rapor fisik ke kertas A4.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGradeChecklist(prev => !prev)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors cursor-pointer"
            >
              <span>{showGradeChecklist ? 'Tutup Rincian Mapel' : 'Periksa Rincian Mapel'}</span>
              {showGradeChecklist ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Subject Checklist Detail */}
          {showGradeChecklist && (
            <div className="mt-3 pt-3 border-t border-white/10 space-y-2.5 animate-in fade-in duration-200">
              {classGradeStatus.missingList.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Mata Pelajaran yang Belum Lengkap / Masih Perlu Dikonfirmasi ke Guru Pengampu:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {classGradeStatus.missingList.map((m, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-xs flex items-start justify-between gap-2"
                      >
                        <div>
                          <strong className="text-white block font-medium">{m.mapel}</strong>
                          <span className="text-[10px] text-amber-300/80 block">
                            Guru: {m.guru}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30 shrink-0">
                          {m.status === 'kosong' ? 'Kosong 0%' : `${m.filledCount}/${m.totalCount} Terisi`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {classGradeStatus.completeList.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mata Pelajaran yang Sudah 100% Terisi Lengkap:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {classGradeStatus.completeList.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>{m.mapel}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bulk View Quick Student Index Navigator */}
        {viewMode === 'bulk' && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5" />
                Daftar Siswa Kelas {selectedKelas} Siap Cetak Kolektif ({classStudents.length} Rapor):
              </span>
              <span className="text-[10px] text-slate-400">
                Klik nama siswa untuk melompat ke posisi rapor
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {classStudents.map((s, idx) => (
                <a
                  key={s.id}
                  href={`#rapor-student-${s.id}`}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-800/80 text-slate-200 hover:text-white rounded-lg text-[11px] font-medium transition-colors border border-white/5 flex items-center gap-1"
                >
                  <span className="font-mono text-[10px] text-emerald-400">{idx + 1}.</span>
                  <span>{s.nama}</span>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* REPORT CARD DISPLAY AREA */}
      {viewMode === 'individual' ? (
        // Single Student Mode
        currentStudent ? (
          renderReportCard(currentStudent, false)
        ) : (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-600">
            Data siswa tidak ditemukan di kelas ini.
          </div>
        )
      ) : (
        // Bulk Class Mode (Renders all students in selected class with CSS page breaks)
        <div className="space-y-8">
          {classStudents.length > 0 ? (
            classStudents.map(st => renderReportCard(st, true))
          ) : (
            <div className="bg-white p-8 rounded-2xl text-center text-slate-600">
              Tidak ada siswa terdaftar di Kelas {selectedKelas}.
            </div>
          )}
        </div>
      )}

      {/* Edit Diniyah & Ekstrakurikuler Modal */}
      {isEditDiniyahOpen && (
        <EditDiniyahEkskulModal
          isOpen={isEditDiniyahOpen}
          onClose={() => setIsEditDiniyahOpen(false)}
          students={students}
          currentStudentId={editTargetStudentId || selectedStudentId}
          onSelectStudentId={(id) => setEditTargetStudentId(id)}
          onSaveStudentDiniyah={handleSaveStudentDiniyah}
          grades={grades}
          attendance={attendance}
        />
      )}

      {/* Print Margin Settings Modal */}
      {isMarginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[92vh] overflow-y-auto text-white shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold font-serif text-white">
                    Pengaturan Batas Tepi Kertas Rapor (Margin Cetak A4)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Sesuaikan jarak margin kertas agar dokumen rapor rapi, proporsional, dan aman untuk map jilid.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMarginModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Standard Explanation Box */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-200/95 leading-relaxed flex items-start gap-2.5">
              <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-emerald-300">
                  Standar Resmi Dokumen Rapor &amp; Tata Naskah Dinas Pendidikan:
                </p>
                <p>
                  • <strong>Margin Kiri (25 mm / 2,5 cm)</strong>: Memberikan ruang aman untuk lubang perforator binder, map rapor berkancing/jepit, atau jilid buku raport tanpa menutupi nomor urut dan tulisan.
                </p>
                <p>
                  • <strong>Margin Atas, Kanan, &amp; Bawah (20 mm / 2,0 cm)</strong>: Memberikan jarak estetis pada kop surat, batas kanan tabel, serta ruang tanda tangan dan stempel resmi agar tidak menempel di tepi kertas.
                </p>
              </div>
            </div>

            {/* Preset Selection Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pilih Preset Standar Margin:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Preset 1: Standar Kedinasan */}
                <button
                  type="button"
                  onClick={() => applyMarginPreset('resmi')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    printMargins.preset === 'resmi'
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-950/50 border-white/10 hover:border-white/20 hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Standar Kedinasan</span>
                      {printMargins.preset === 'resmi' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 mb-2 border border-emerald-400/30">
                      Rekomendasi Resmi
                    </span>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      Kiri: 25mm (Aman Jilid) • Atas: 20mm • Kanan: 20mm • Bawah: 20mm
                    </p>
                  </div>
                </button>

                {/* Preset 2: Proporsional Simetris */}
                <button
                  type="button"
                  onClick={() => applyMarginPreset('seimbang')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    printMargins.preset === 'seimbang'
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-950/50 border-white/10 hover:border-white/20 hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Proporsional (2 cm)</span>
                      {printMargins.preset === 'seimbang' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 mb-2 border border-white/10">
                      Simetris 4 Sisi
                    </span>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      Kiri: 20mm • Atas: 20mm • Kanan: 20mm • Bawah: 20mm
                    </p>
                  </div>
                </button>

                {/* Preset 3: Kompak */}
                <button
                  type="button"
                  onClick={() => applyMarginPreset('kompak')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    printMargins.preset === 'kompak'
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-950/50 border-white/10 hover:border-white/20 hover:bg-slate-800/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">Kompak (1.5 cm)</span>
                      {printMargins.preset === 'kompak' && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                    <span className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 mb-2 border border-white/10">
                      Area Cetak Maksimal
                    </span>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      Kiri: 15mm • Atas: 15mm • Kanan: 15mm • Bawah: 15mm
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Margin Sliders & Inputs */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                  Kustomisasi Ukuran Margin Manual (Milimeter / mm):
                </span>
                <span className="text-[10px] text-slate-400">
                  Nilai otomatis tersimpan saat diubah
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Atas */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300 flex justify-between">
                    <span>Atas (Top):</span>
                    <span className="font-mono font-bold text-emerald-400">{printMargins.top} mm</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={printMargins.top}
                    onChange={(e) => handleCustomMarginChange('top', parseInt(e.target.value) || 20)}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={printMargins.top}
                    onChange={(e) => handleCustomMarginChange('top', parseInt(e.target.value) || 20)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-center font-mono font-bold text-white"
                  />
                </div>

                {/* Kiri (Ruang Jilid) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-emerald-300 flex justify-between">
                    <span>Kiri (Jilid):</span>
                    <span className="font-mono font-bold text-emerald-400">{printMargins.left} mm</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={printMargins.left}
                    onChange={(e) => handleCustomMarginChange('left', parseInt(e.target.value) || 25)}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="5"
                    max="45"
                    value={printMargins.left}
                    onChange={(e) => handleCustomMarginChange('left', parseInt(e.target.value) || 25)}
                    className="w-full bg-slate-900 border border-emerald-400/40 rounded px-2 py-1 text-xs text-center font-mono font-bold text-emerald-300"
                  />
                </div>

                {/* Kanan */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300 flex justify-between">
                    <span>Kanan (Right):</span>
                    <span className="font-mono font-bold text-emerald-400">{printMargins.right} mm</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={printMargins.right}
                    onChange={(e) => handleCustomMarginChange('right', parseInt(e.target.value) || 20)}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={printMargins.right}
                    onChange={(e) => handleCustomMarginChange('right', parseInt(e.target.value) || 20)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-center font-mono font-bold text-white"
                  />
                </div>

                {/* Bawah */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300 flex justify-between">
                    <span>Bawah (Bottom):</span>
                    <span className="font-mono font-bold text-emerald-400">{printMargins.bottom} mm</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    step="1"
                    value={printMargins.bottom}
                    onChange={(e) => handleCustomMarginChange('bottom', parseInt(e.target.value) || 20)}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <input
                    type="number"
                    min="5"
                    max="40"
                    value={printMargins.bottom}
                    onChange={(e) => handleCustomMarginChange('bottom', parseInt(e.target.value) || 20)}
                    className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-center font-mono font-bold text-white"
                  />
                </div>
              </div>
            </div>

            {/* Browser Printing Best-Practice Alert */}
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                Petunjuk Penting saat Jendela Cetak Browser Muncul:
              </span>
              <p>
                1. Pada pengaturan printer / PDF browser, pilih opsi <strong>Margin: Default</strong> (atau biarkan default) agar ukuran presisi yang dipilih di atas langsung diterapkan.
              </p>
              <p>
                2. Centang opsi <strong>Background Graphics (Grafik Latar Belakang)</strong> agar kop resmi dan garis tabel tercetak tajam.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => applyMarginPreset('resmi')}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Standar Resmi (20-25-20-20 mm)</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsMarginModalOpen(false)}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-white/10"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMarginModalOpen(false);
                    setTimeout(() => handlePrint(), 250);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-lg hover:scale-[1.02]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Terapkan &amp; Cetak Rapor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
