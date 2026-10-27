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
  AlertCircle
} from 'lucide-react';
import { EditDiniyahEkskulModal, BatchApplyScope } from './EditDiniyahEkskulModal';
import { StorageService } from '../../services/storage';
import { DEFAULT_MAPEL_LIST, getMapelSortIndex } from '../../data/constants';

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

  // Helper to calculate student grades list
  const getGradesForStudent = (stId: string) => {
    const list: {
      mapel: string;
      guru: string;
      formatif: number;
      pts: number;
      pas: number;
      akhir: number;
      predikat: string;
      catatan: string;
    }[] = [];

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

        list.push({
          mapel: g.mapel,
          guru: g.teacherName,
          formatif: avgF,
          pts: entry.nilaiPTS,
          pas: entry.nilaiPAS,
          akhir,
          predikat,
          catatan: entry.catatanKompetensi
        });
      }
    });

    // Urutkan nilai mata pelajaran sesuai struktur resmi Kurikulum Merdeka (Fase D SMP):
    // 1. Pendidikan Agama dan Budi Pekerti
    // 2. Pendidikan Pancasila
    // 3. Bahasa Indonesia
    // 4. Matematika
    // 5. Ilmu Pengetahuan Alam
    // 6. Ilmu Pengetahuan Sosial
    // 7. Bahasa Inggris
    // 8. Pendidikan Jasmani, Olahraga, dan Kesehatan
    // 9. Informatika
    // 10. Seni dan Budaya
    // 11. Prakarya
    // 12. Bahasa Jawa (Mulok Daerah)
    // 13. Bahasa Arab (Mulok Pesantren)
    // dilanjutkan dengan mapel keagamaan/diniyah lainnya
    list.sort((a, b) => {
      const idxA = getMapelSortIndex(a.mapel);
      const idxB = getMapelSortIndex(b.mapel);
      if (idxA !== idxB) {
        return idxA - idxB;
      }
      return a.mapel.localeCompare(b.mapel, 'id');
    });

    return list;
  };

  // Render individual Report Card sheet
  const renderReportCard = (st: Student, isBulkItem: boolean = false) => {
    const wali = teachers.find(t => t.waliKelasDi === st.kelas) || currentWaliKelas;
    const att = getAttendanceForStudent(st.id);
    const stGrades = getGradesForStudent(st.id);

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
                    {schoolInfo.kepalaSekolah}
                  </div>
                  <div className="w-44 sm:w-48 mx-auto border-b-2 border-slate-700"></div>
                  <div className="text-[10px] print:text-[10px] text-slate-600 pt-0.5 font-mono">
                    NIGY: {schoolInfo.nigyKepalaSekolah || schoolInfo.nipKepalaSekolah || '992 101 007'}
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

    </div>
  );
};
