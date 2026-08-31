import React, { useState, useEffect } from 'react';
import { Student, SubjectGradeRecord, Teacher, UserSession, GradeLockRecord, SchoolInfo } from '../../types';
import { StorageService } from '../../services/storage';
import { AuditLogModal } from './AuditLogModal';
import { DEFAULT_MAPEL_LIST, getAllClasses, getTeacherAllowedMapelList } from '../../data/constants';
import {
  Award,
  Save,
  CheckCircle2,
  BookOpen,
  Edit3,
  Sparkles,
  HelpCircle,
  Lock,
  Unlock,
  ShieldAlert,
  History,
  Calendar,
  AlertTriangle,
  UserCheck,
  Key,
  ShieldCheck,
  X
} from 'lucide-react';

interface InputNilaiViewProps {
  students: Student[];
  grades: SubjectGradeRecord[];
  teachers: Teacher[];
  session: UserSession;
  schoolInfo?: SchoolInfo;
  onSaveGrades: (grades: SubjectGradeRecord[]) => void;
}

export const InputNilaiView: React.FC<InputNilaiViewProps> = ({
  students,
  grades,
  teachers,
  session,
  schoolInfo,
  onSaveGrades
}) => {
  const dynamicClasses = getAllClasses(students, [], teachers);
  const mapelList = DEFAULT_MAPEL_LIST;

  const { allowedMapels, isRestricted, loggedTeacher } = getTeacherAllowedMapelList(
    session,
    teachers,
    mapelList
  );

  const teacherDefaultMapel = allowedMapels[0] || loggedTeacher?.mapelUtama || mapelList[0];

  const [selectedClass, setSelectedClass] = useState(dynamicClasses[0] || '7A');
  const [selectedMapel, setSelectedMapel] = useState(teacherDefaultMapel);
  const [selectedTeacher, setSelectedTeacher] = useState(session.name || loggedTeacher?.nama || teachers[0]?.nama || 'Ustadz Amjad Mahbubi, S.Pd.');
  const [semester, setSemester] = useState<'Ganjil' | 'Genap'>(schoolInfo?.semesterAktif || 'Ganjil');

  // Update semester when schoolInfo changes
  useEffect(() => {
    if (schoolInfo?.semesterAktif) {
      setSemester(schoolInfo.semesterAktif);
    }
  }, [schoolInfo?.semesterAktif]);

  // Grade Locks & Audit Trail State
  const [gradeLocks, setGradeLocks] = useState<GradeLockRecord[]>(() => StorageService.getGradeLocks());
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockDeadline, setLockDeadline] = useState('2026-12-20');
  const [lockReason, setLockReason] = useState('Draft nilai dikunci untuk rekapitulasi Rapor Digital');

  useEffect(() => {
    if (allowedMapels.length > 0 && !allowedMapels.includes(selectedMapel)) {
      setSelectedMapel(allowedMapels[0]);
    }
  }, [allowedMapels, selectedMapel]);

  useEffect(() => {
    if (loggedTeacher?.nama && session.role === 'guru') {
      setSelectedTeacher(loggedTeacher.nama);
    }
  }, [session.teacherId, session.name, loggedTeacher]);

  const classes = dynamicClasses;
  const classStudents = students.filter(s => s.kelas === selectedClass && s.status === 'Aktif');


  // Find existing grade record for mapel + class + semester
  const existingRecord = grades.find(
    g => g.kelas === selectedClass && g.mapel === selectedMapel && g.semester === semester
  );

  // --- PERMISSION & ACCESS LOGIC ---
  const isAdmin = session.role === 'admin';
  const isWakaKurikulum = Boolean(
    loggedTeacher?.jabatan?.toLowerCase().includes('kurikulum') ||
    session.name.toLowerCase().includes('kurikulum')
  );
  const isWaliKelas = Boolean(
    loggedTeacher?.waliKelasDi === selectedClass ||
    loggedTeacher?.jabatan?.toLowerCase().includes(`wali kelas ${selectedClass.toLowerCase()}`) ||
    loggedTeacher?.jabatan?.toLowerCase().includes('wali kelas')
  );

  // Kunci Akses Edit Mapel: Regular teacher can only edit their assigned subject(s)
  const teacherAllMapels = [
    loggedTeacher?.mapelUtama,
    ...(Array.isArray(loggedTeacher?.mapelTambahan) ? loggedTeacher.mapelTambahan : [])
  ].filter(Boolean) as string[];

  const isSubjectTeacher = Boolean(
    isAdmin ||
    isWakaKurikulum ||
    teacherAllMapels.some(
      m =>
        selectedMapel.toLowerCase().includes(m.toLowerCase()) ||
        m.toLowerCase().includes(selectedMapel.toLowerCase())
    ) ||
    selectedTeacher.toLowerCase() === (session.name || '').toLowerCase()
  );

  const isSubjectAccessRestricted = session.role === 'guru' && !isAdmin && !isWakaKurikulum && !isSubjectTeacher;

  // Grade Lock Status
  const currentLockKey = `${selectedClass}-${selectedMapel}-${semester}`;
  const currentLockRecord = gradeLocks.find(
    l => l.id === currentLockKey || (l.kelas === selectedClass && l.mapel === selectedMapel && l.semester === semester)
  );
  const isDraftLocked = currentLockRecord ? currentLockRecord.isLocked : Boolean(existingRecord?.isLocked);

  // Can user toggle lock status? (Admin, Waka Kurikulum, or Wali Kelas)
  const canToggleLock = isAdmin || isWakaKurikulum || isWaliKelas;

  // Can user edit grade inputs right now?
  const canUserEdit = !isSubjectAccessRestricted && (!isDraftLocked || isAdmin || isWakaKurikulum);

  // Helper to get default TP titles based on subject
  const getDefaultTpList = (mapelName: string): string[] => {
    if (mapelName.toLowerCase().includes('inggris')) {
      return ['It is My Family', 'She is My Sister', 'The Elephant is Big', 'The Giraffe is Tall', 'Yummy Fried Chicken', '0', '0', '0', '0', '0'];
    }
    if (mapelName.toLowerCase().includes('matematika')) {
      return ['Bilangan Bulat & Pecahan', 'Persamaan Aljabar', 'Segi Empat & Segitiga', 'Penyajian Data', 'Skala & Perbandingan', '0', '0', '0', '0', '0'];
    }
    if (mapelName.toLowerCase().includes('agama') || mapelName.toLowerCase().includes('qur\'an')) {
      return ['Hafalan Surat Pendek', 'Hukum Tajwid Nun Mati', 'Akidah Asmaul Husna', 'Fiqih Thaharah', 'Sejarah Nabi Muhammad', '0', '0', '0', '0', '0'];
    }
    if (mapelName.toLowerCase().includes('indonesia')) {
      return ['Teks Deskripsi', 'Teks Narasi/Fabel', 'Puisi Rakyat', 'Teks Prosedur', 'Surat Pribadi & Dinas', '0', '0', '0', '0', '0'];
    }
    return ['Pengenalan Bab 1', 'Konsep Dasar Bab 2', 'Penerapan Bab 3', 'Evaluasi Bab 4', 'Proyek Mandiri', '0', '0', '0', '0', '0'];
  };

  // State for 10 Tujuan Pembelajaran (TP) Titles
  const [tpList, setTpList] = useState<string[]>(
    existingRecord?.tpList || getDefaultTpList(selectedMapel)
  );

  // Modal to edit TP titles
  const [isEditingTpModal, setIsEditingTpModal] = useState(false);

  // State for student sumatif & exam grades
  const [studentGradesMap, setStudentGradesMap] = useState<{
    [studentId: string]: {
      sumatif: number[];
      pts: number;
      pas: number;
      catatan: string;
    };
  }>({});

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync TP list and Student Grades when mapel / class / semester changes
  useEffect(() => {
    const currentTpList = existingRecord?.tpList && existingRecord.tpList.length === 10
      ? existingRecord.tpList
      : getDefaultTpList(selectedMapel);

    setTpList(currentTpList);

    const initialMap: {
      [studentId: string]: { sumatif: number[]; pts: number; pas: number; catatan: string };
    } = {};

    classStudents.forEach(s => {
      const entry = existingRecord?.studentGrades.find(e => e.studentId === s.id);
      
      let sumatifArray: number[] = [85, 88, 85, 82, 86, 0, 0, 0, 0, 0];
      if (entry?.sumatifScores && entry.sumatifScores.length === 10) {
        sumatifArray = [...entry.sumatifScores];
      } else if (entry) {
        sumatifArray = [entry.nilaiFormatif1 || 85, entry.nilaiFormatif2 || 88, entry.nilaiSumatifLM || 85, 82, 86, 0, 0, 0, 0, 0];
      }

      const defaultAutoCatatan = generateCatatanFromTP(sumatifArray, currentTpList);

      initialMap[s.id] = {
        sumatif: sumatifArray,
        pts: entry ? entry.nilaiPTS : 82,
        pas: entry ? entry.nilaiPAS : 86,
        catatan: entry?.catatanKompetensi || defaultAutoCatatan
      };
    });

    setStudentGradesMap(initialMap);
  }, [selectedClass, selectedMapel, semester]);

  const handleSumatifChange = (studentId: string, tpIndex: number, val: number) => {
    if (!canUserEdit) return;
    const clamped = Math.max(0, Math.min(100, val));
    setStudentGradesMap(prev => {
      const currentStudent = prev[studentId] || {
        sumatif: [85, 88, 85, 82, 86, 0, 0, 0, 0, 0],
        pts: 82,
        pas: 86,
        catatan: ''
      };
      const newSumatif = [...currentStudent.sumatif];
      newSumatif[tpIndex] = clamped;

      return {
        ...prev,
        [studentId]: {
          ...currentStudent,
          sumatif: newSumatif
        }
      };
    });
  };

  const handleExamChange = (studentId: string, field: 'pts' | 'pas', val: number) => {
    if (!canUserEdit) return;
    const clamped = Math.max(0, Math.min(100, val));
    setStudentGradesMap(prev => {
      const currentStudent = prev[studentId] || {
        sumatif: [85, 88, 85, 82, 86, 0, 0, 0, 0, 0],
        pts: 82,
        pas: 86,
        catatan: ''
      };
      return {
        ...prev,
        [studentId]: {
          ...currentStudent,
          [field]: clamped
        }
      };
    });
  };

  const handleCatatanChange = (studentId: string, text: string) => {
    if (!canUserEdit) return;
    setStudentGradesMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        catatan: text
      }
    }));
  };

  // Calculate Average Sumatif Lingkup Materi
  const calculateRataSumatifLM = (sumatifArray: number[], currentTpList: string[]) => {
    let sum = 0;
    let count = 0;
    for (let i = 0; i < 10; i++) {
      const title = currentTpList[i];
      const val = sumatifArray[i] || 0;
      if ((title && title !== '0' && title.trim() !== '') || val > 0) {
        sum += val;
        count++;
      }
    }
    return count > 0 ? Math.round(sum / count) : 0;
  };

  // Auto-generate Catatan Capaian Kompetensi using Kurikulum Merdeka IF-logic
  const generateCatatanFromTP = (sumatifArray: number[], currentTpList: string[]): string => {
    const activeTps: { title: string; score: number }[] = [];

    for (let i = 0; i < 10; i++) {
      const title = currentTpList[i];
      const score = sumatifArray[i] ?? 0;
      if (title && title !== '0' && title.trim() !== '' && score > 0) {
        activeTps.push({ title: title.trim(), score });
      }
    }

    if (activeTps.length === 0) {
      return 'Menunjukkan penguasaan yang baik dalam mencapai Tujuan Pembelajaran (TP).';
    }

    activeTps.sort((a, b) => b.score - a.score);

    const highest = activeTps[0];
    const lowest = activeTps[activeTps.length - 1];

    let textHigh = '';
    if (highest.score >= 90) {
      textHigh = `Menunjukkan penguasaan yang sangat baik dalam ${highest.title}`;
    } else if (highest.score >= 80) {
      textHigh = `Menunjukkan penguasaan yang baik dalam ${highest.title}`;
    } else if (highest.score >= 70) {
      textHigh = `Menunjukkan penguasaan cukup dalam ${highest.title}`;
    } else {
      textHigh = `Menunjukkan penguasaan awal dalam ${highest.title}`;
    }

    let textLow = '';
    if (activeTps.length > 1 && (lowest.score < 75 || (highest.score - lowest.score >= 5 && lowest.score < 85))) {
      textLow = `, serta perlu bimbingan dan peningkatan lebih lanjut dalam ${lowest.title}.`;
    } else {
      textLow = '.';
    }

    return `${textHigh}${textLow}`;
  };

  const handleAutoGenerateAllCatatan = () => {
    if (!canUserEdit) return;
    setStudentGradesMap(prev => {
      const updatedMap = { ...prev };
      classStudents.forEach(s => {
        const studentObj = updatedMap[s.id] || {
          sumatif: [85, 88, 85, 82, 86, 0, 0, 0, 0, 0],
          pts: 82,
          pas: 86,
          catatan: ''
        };
        const autoText = generateCatatanFromTP(studentObj.sumatif, tpList);
        updatedMap[s.id] = {
          ...studentObj,
          catatan: autoText
        };
      });
      return updatedMap;
    });
  };

  const calculateNilaiAkhir = (rataLM: number, pts: number, pas: number) => {
    return Math.round((rataLM * 0.5) + (pts * 0.25) + (pas * 0.25));
  };

  // Lock / Unlock Toggle Handler
  const handleToggleLockDraft = (lockState: boolean) => {
    const updatedLocks = gradeLocks.filter(l => l.id !== currentLockKey);
    const userRoleLabel = isAdmin ? 'Admin DAPODIK' : isWakaKurikulum ? 'Waka Kurikulum' : isWaliKelas ? `Wali Kelas ${selectedClass}` : 'Otoritas Kurikulum';
    
    const newLockEntry: GradeLockRecord = {
      id: currentLockKey,
      kelas: selectedClass,
      mapel: selectedMapel,
      semester,
      isLocked: lockState,
      lockedBy: `${session.name || selectedTeacher} (${userRoleLabel})`,
      lockedAt: new Date().toLocaleString('id-ID'),
      deadline: lockDeadline,
      catatan: lockReason
    };

    const newLocksList = [newLockEntry, ...updatedLocks];
    setGradeLocks(newLocksList);
    StorageService.saveGradeLocks(newLocksList);

    // Audit Trail Recording
    StorageService.addAuditLog({
      userName: session.name || selectedTeacher,
      userRole: userRoleLabel,
      action: lockState ? 'LOCK_DRAFT_NILAI' : 'UNLOCK_DRAFT_NILAI',
      module: 'Input Nilai Asesmen',
      kelas: selectedClass,
      mapel: selectedMapel,
      semester,
      details: lockState
        ? `Mengunci Form Draft Nilai Asesmen ${selectedMapel} Kelas ${selectedClass} Semester ${semester} (Batas Akhir Deadline: ${lockDeadline}). Catatan: "${lockReason}".`
        : `Membuka kembali kunci edit draft nilai ${selectedMapel} Kelas ${selectedClass} Semester ${semester}.`,
      previousDataSummary: `Status: ${lockState ? 'Terbuka (Editable)' : 'Terkunci (Locked)'}`,
      newDataSummary: `Status: ${lockState ? 'Terkunci (Locked)' : 'Terbuka (Editable)'}`
    });

    setIsLockModalOpen(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUserEdit) {
      alert('Akses edit terkunci! Anda tidak memiliki wewenang untuk mengubah nilai pada mata pelajaran ini atau draft nilai sedang dikunci.');
      return;
    }

    const studentGrades = classStudents.map(s => {
      const g = studentGradesMap[s.id] || { sumatif: [85, 88, 85, 82, 86, 0, 0, 0, 0, 0], pts: 80, pas: 85, catatan: '' };
      const rataLM = calculateRataSumatifLM(g.sumatif, tpList);

      return {
        studentId: s.id,
        studentName: s.nama,
        sumatifScores: g.sumatif,
        nilaiFormatif1: g.sumatif[0] || 85,
        nilaiFormatif2: g.sumatif[1] || 88,
        nilaiSumatifLM: rataLM,
        nilaiPTS: Number(g.pts),
        nilaiPAS: Number(g.pas),
        catatanKompetensi: g.catatan
      };
    });

    const activeTahunAjaran = schoolInfo?.tahunAjaran || '2024/2025';

    const newRecord: SubjectGradeRecord = {
      id: existingRecord ? existingRecord.id : `GRD${Date.now().toString().slice(-4)}`,
      mapel: selectedMapel,
      kelas: selectedClass,
      teacherId: session.teacherId || 'T001',
      teacherName: selectedTeacher,
      semester,
      tahunAjaran: activeTahunAjaran,
      tpList,
      studentGrades,
      isLocked: isDraftLocked,
      lockedBy: currentLockRecord?.lockedBy,
      lockedAt: currentLockRecord?.lockedAt,
      deadline: currentLockRecord?.deadline,
      lockReason: currentLockRecord?.catatan
    };

    const updated = existingRecord
      ? grades.map(g => (g.id === existingRecord.id ? newRecord : g))
      : [newRecord, ...grades];

    onSaveGrades(updated);

    // Record to Audit Log
    StorageService.addAuditLog({
      userName: session.name || selectedTeacher,
      userRole: session.role === 'admin' ? 'Admin DAPODIK' : (loggedTeacher?.jabatan || 'Guru Mapel'),
      action: 'UPDATE_NILAI',
      module: 'Input Nilai Asesmen',
      kelas: selectedClass,
      mapel: selectedMapel,
      semester,
      details: `Memperbarui & menyimpan data nilai untuk ${classStudents.length} siswa pada Mapel ${selectedMapel} Kelas ${selectedClass} (${semester} TA ${activeTahunAjaran}). Guru Pengampu: ${selectedTeacher}.`,
      previousDataSummary: existingRecord ? `Versi Terakhir: ID ${existingRecord.id}` : 'Entri Baru',
      newDataSummary: `Total Siswa Terupdate: ${classStudents.length} Santri`
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Award className="w-3.5 h-3.5 text-emerald-700" />
              <span>Input Nilai Asesmen &amp; Raport Kurikulum Merdeka</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md border border-emerald-300 font-mono">
              ⚡ TA: {schoolInfo?.tahunAjaran || '2024/2025'} (Sinkron Profil)
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Penilaian Sumatif Lingkup Materi (TP) &amp; Akhir Semester
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Format sesuai petunjuk Kurikulum Merdeka: Input nilai berdasarkan Tujuan Pembelajaran (TP 1 - 10) dari Administrasi Guru • TA {schoolInfo?.tahunAjaran || '2024/2025'}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Audit Log Button */}
          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2 border border-slate-700"
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>📜 Audit Log (Riwayat)</span>
          </button>

          {/* Lock / Unlock Draft Control Button for Authorized Roles */}
          {canToggleLock && (
            <button
              type="button"
              onClick={() => setIsLockModalOpen(true)}
              className={`font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2 border ${
                isDraftLocked
                  ? 'bg-red-600 hover:bg-red-700 text-white border-red-700'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600'
              }`}
            >
              {isDraftLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>{isDraftLocked ? '🔒 Status: Terkunci (Kelola)' : '🔓 Kunci Draft Nilai'}</span>
            </button>
          )}

          {savedSuccess && (
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Nilai Berhasil Disimpan!</span>
            </div>
          )}
        </div>
      </div>

      {/* --- WARNING BANNERS FOR PERMISSIONS & DRAFT LOCK --- */}

      {/* 1. Subject Permission Restricted Banner */}
      {isSubjectAccessRestricted && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-amber-950 text-xs shadow-sm">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <span>Mode Lihat Saja (Akses Terkunci Guru Mapel)</span>
              <span className="bg-amber-200 text-amber-900 border border-amber-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                READ ONLY
              </span>
            </div>
            <p className="mt-1 leading-relaxed text-amber-900">
              Anda saat ini terdaftar sebagai <strong>Guru Pengampu: {teacherAllMapels.join(', ') || 'Lainnya'}</strong>.
              Sesuai aturan keamanan data, Anda hanya berwenang mengedit nilai untuk mata pelajaran Anda sendiri.
              Mata pelajaran <strong>{selectedMapel}</strong> ditampilkan dalam mode <strong>Lihat Saja</strong>.
            </p>
          </div>
        </div>
      )}

      {/* 2. Draft Lock Active Banner */}
      {isDraftLocked && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl flex items-start justify-between gap-3 text-red-950 text-xs shadow-sm">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-900 text-sm flex items-center gap-2">
                <span>Form Input Nilai DRAFT TERKUNCI (Lock Draft Active)</span>
                <span className="bg-red-200 text-red-900 border border-red-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  LOCKED BY CURRICULUM
                </span>
              </div>
              <p className="mt-1 leading-relaxed text-red-900">
                Penginputan nilai untuk <strong>{selectedMapel} Kelas {selectedClass} Semester {semester}</strong> telah dikunci oleh <strong>{currentLockRecord?.lockedBy || 'Waka Kurikulum / Wali Kelas'}</strong> {currentLockRecord?.lockedAt ? `pada ${currentLockRecord.lockedAt}` : ''}. Batas waktu pengisian nilai telah berakhir untuk menjaga integritas data Rapor Digital.
              </p>
              {currentLockRecord?.catatan && (
                <p className="mt-1 text-red-800 font-semibold italic bg-red-100/80 px-2.5 py-1 rounded-lg border border-red-200 inline-block">
                  Catatan Kunci: &quot;{currentLockRecord.catatan}&quot;
                </p>
              )}
            </div>
          </div>

          {canToggleLock && (
            <button
              type="button"
              onClick={() => setIsLockModalOpen(true)}
              className="shrink-0 bg-red-700 hover:bg-red-800 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
            >
              <Unlock className="w-4 h-4" />
              <span>Buka Kunci (Unlock)</span>
            </button>
          )}
        </div>
      )}

      {/* Selector Bar & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Mata Pelajaran</label>
              {isRestricted && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  Mapel Diampu
                </span>
              )}
            </div>
            {isRestricted && allowedMapels.length === 1 ? (
              <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-center justify-between shadow-xs">
                <span>{allowedMapels[0]}</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-emerald-200">
                  Terkunci
                </span>
              </div>
            ) : (
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {allowedMapels.map(m => (
                  <option key={m} value={m} className="bg-white text-slate-900">
                    {m} {teacherAllMapels.includes(m) ? '★ (Mapel Anda)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Rombel / Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classes.map(c => (
                <option key={c} value={c} className="bg-white text-slate-900">
                  {c.toLowerCase().startsWith('kelas') ? c : `Kelas ${c}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
            >
              <option value="Ganjil" className="bg-white text-slate-900">Semester Ganjil</option>
              <option value="Genap" className="bg-white text-slate-900">Semester Genap</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Guru Pengampu</label>
              {isRestricted && (
                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                  Akun Anda
                </span>
              )}
            </div>
            <input
              type="text"
              readOnly={isRestricted}
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              disabled={!canUserEdit && !isRestricted}
              className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${
                isRestricted
                  ? 'bg-slate-100/90 border-slate-300 text-slate-700 cursor-not-allowed'
                  : 'bg-slate-100 border-slate-300 text-slate-900 focus:outline-none disabled:opacity-60'
              }`}
            />
          </div>
        </div>

        {/* TP Administrasi Control Bar */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-800" />
            <span className="text-xs font-bold text-slate-800">
              Tujuan Pembelajaran (TP) Administrasi Mapel:
            </span>
            <span className="text-xs text-slate-600 font-medium hidden sm:inline">
              ({tpList.filter(t => t && t !== '0').length} TP Aktif)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canUserEdit}
              onClick={() => setIsEditingTpModal(true)}
              className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Kelola Judul TP / Material</span>
            </button>

            <button
              type="button"
              disabled={!canUserEdit}
              onClick={() => setTpList(getDefaultTpList(selectedMapel))}
              className="text-xs text-slate-600 hover:text-emerald-800 font-bold px-2 py-1 underline disabled:opacity-40"
            >
              Reset Ke Default Mapel
            </button>
          </div>
        </div>
      </div>

      {/* Grade Entry Table */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                {/* ROW 1 */}
                <tr className="bg-[#d8ebd2] text-[#163a14] font-bold text-center border-b border-[#a6cf9b]">
                  <th rowSpan={3} className="p-2 border-r border-[#a6cf9b] w-8">
                    No
                  </th>
                  <th rowSpan={3} className="p-2 border-r border-[#a6cf9b] min-w-[150px] text-left">
                    Nama Siswa
                  </th>
                  <th colSpan={10} className="p-2 border-r border-[#a6cf9b] text-center font-bold text-xs tracking-wide">
                    Sumatif Akhir Lingkup Materi (Wajib)
                  </th>
                  <th colSpan={2} className="p-2 border-r border-[#a6cf9b] text-center font-bold text-xs tracking-wide">
                    Sumatif Akhir Semester (Tidak Wajib)
                  </th>
                  <th rowSpan={3} className="p-2 border-r border-[#a6cf9b] w-16 text-center font-bold">
                    Rata Sumatif LM
                  </th>
                  <th rowSpan={3} className="p-2 border-r border-[#a6cf9b] w-16 text-center font-bold">
                    Nilai Akhir
                  </th>
                  <th rowSpan={3} className="p-2 min-w-[260px] text-left font-bold">
                    <div className="flex items-center justify-between gap-1">
                      <span>Catatan Capaian Kompetensi (RPP/TP)</span>
                      <button
                        type="button"
                        disabled={!canUserEdit}
                        onClick={handleAutoGenerateAllCatatan}
                        title="Generate Otomatis Catatan Semua Siswa berdasarkan Rumus Nilai TP"
                        className="bg-emerald-900 hover:bg-emerald-800 text-white font-bold text-[10px] px-2 py-1 rounded shadow flex items-center gap-1 transition-colors disabled:opacity-40"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Auto-Rumus TP</span>
                      </button>
                    </div>
                  </th>
                </tr>

                {/* ROW 2 */}
                <tr className="bg-[#d8ebd2] text-[#163a14] font-bold text-center border-b border-[#a6cf9b]">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <th key={`s-head-${idx}`} className="p-1.5 border-r border-[#a6cf9b] min-w-[85px]">
                      Sumatif {idx + 1}
                    </th>
                  ))}
                  <th className="p-1.5 border-r border-[#a6cf9b] min-w-[60px]">PTS</th>
                  <th className="p-1.5 border-r border-[#a6cf9b] min-w-[60px]">PAS</th>
                </tr>

                {/* ROW 3 */}
                <tr className="bg-[#e4f2e0] text-[#1e461a] text-center font-semibold text-[10px] border-b border-[#a6cf9b]">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <th key={`tp-head-${idx}`} className="p-1.5 border-r border-[#a6cf9b] min-w-[85px] leading-tight font-medium">
                      <div className="line-clamp-2 italic" title={tpList[idx] || '0'}>
                        {tpList[idx] || '0'}
                      </div>
                    </th>
                  ))}
                  <th className="p-1 border-r border-[#a6cf9b]">PTS</th>
                  <th className="p-1 border-r border-[#a6cf9b]">PAS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {classStudents.map((s, idx) => {
                  const currentGrades = studentGradesMap[s.id] || {
                    sumatif: [85, 88, 85, 82, 86, 0, 0, 0, 0, 0],
                    pts: 82,
                    pas: 86,
                    catatan: ''
                  };

                  const rataLM = calculateRataSumatifLM(currentGrades.sumatif, tpList);
                  const nilaiAkhir = calculateNilaiAkhir(rataLM, currentGrades.pts, currentGrades.pas);

                  return (
                    <tr key={s.id} className="hover:bg-emerald-50/50 transition-colors">
                      <td className="p-2 text-center font-mono font-bold text-slate-500 border-r border-slate-200">
                        {idx + 1}
                      </td>

                      <td className="p-2 border-r border-slate-200">
                        <div className="font-bold text-slate-900 font-serif">{s.nama}</div>
                        <div className="text-[10px] font-mono text-slate-500">NISN: {s.nisn}</div>
                      </td>

                      {/* 10 Sumatif TP Inputs */}
                      {Array.from({ length: 10 }).map((_, tpIdx) => {
                        const val = currentGrades.sumatif[tpIdx] ?? 0;
                        const isTpActive = tpList[tpIdx] && tpList[tpIdx] !== '0' && tpList[tpIdx].trim() !== '';

                        return (
                          <td key={`sumatif-cell-${s.id}-${tpIdx}`} className="p-1 text-center border-r border-slate-200">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={val}
                              disabled={!canUserEdit}
                              onChange={(e) => handleSumatifChange(s.id, tpIdx, Number(e.target.value))}
                              className={`w-14 px-1 py-1 text-center font-bold text-xs rounded border focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-400 ${
                                isTpActive
                                  ? 'bg-white border-slate-300 text-slate-900'
                                  : 'bg-slate-100 border-slate-200 text-slate-400'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* PTS Input */}
                      <td className="p-1 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentGrades.pts}
                          disabled={!canUserEdit}
                          onChange={(e) => handleExamChange(s.id, 'pts', Number(e.target.value))}
                          className="w-13 px-1 py-1 bg-white border border-slate-300 rounded text-center font-bold text-xs text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>

                      {/* PAS Input */}
                      <td className="p-1 text-center border-r border-slate-200">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={currentGrades.pas}
                          disabled={!canUserEdit}
                          onChange={(e) => handleExamChange(s.id, 'pas', Number(e.target.value))}
                          className="w-13 px-1 py-1 bg-white border border-slate-300 rounded text-center font-bold text-xs text-slate-900 focus:ring-1 focus:ring-emerald-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </td>

                      {/* Rata-rata Sumatif LM */}
                      <td className="p-2 text-center border-r border-slate-200 bg-slate-50 font-bold text-emerald-900 font-mono text-xs">
                        {rataLM}
                      </td>

                      {/* Nilai Akhir */}
                      <td className="p-2 text-center border-r border-slate-200 bg-emerald-100/60 font-black text-emerald-900 font-mono text-sm">
                        {nilaiAkhir}
                      </td>

                      {/* Catatan Capaian Kompetensi */}
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={currentGrades.catatan}
                            disabled={!canUserEdit}
                            onChange={(e) => handleCatatanChange(s.id, e.target.value)}
                            placeholder="Deskripsi ketercapaian TP..."
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                          />
                          <button
                            type="button"
                            disabled={!canUserEdit}
                            onClick={() => handleCatatanChange(s.id, generateCatatanFromTP(currentGrades.sumatif, tpList))}
                            title="Generate Catatan Siswa Ini berdasarkan Rumus TP"
                            className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded transition-colors flex-shrink-0 disabled:opacity-40"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 italic flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>* Nilai Akhir dihitung otomatis: 50% Rata-rata Sumatif LM + 25% PTS + 25% PAS.</span>
          </div>

          <button
            type="submit"
            disabled={!canUserEdit}
            className={`font-bold text-sm px-8 py-3 rounded-xl shadow transition-colors flex items-center gap-2 ${
              canUserEdit
                ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{canUserEdit ? 'Simpan Nilai Asesmen Mapel' : 'Akses Terkunci (Read Only)'}</span>
          </button>
        </div>
      </form>

      {/* MODAL 1: Edit Tujuan Pembelajaran (TP) Titles */}
      {isEditingTpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold font-serif text-lg text-slate-900">
                  Kelola Tujuan Pembelajaran (TP) - {selectedMapel}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTpModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Masukkan judul Tujuan Pembelajaran (TP) / Lingkup Materi sesuai perangkat RPP / Administrasi Guru Anda. Kosongkan atau isi &quot;0&quot; jika TP tidak digunakan.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={`tp-edit-input-${idx}`} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                    Sumatif {idx + 1} (Tujuan Pembelajaran {idx + 1}):
                  </label>
                  <input
                    type="text"
                    value={tpList[idx] || ''}
                    onChange={(e) => {
                      const updated = [...tpList];
                      updated[idx] = e.target.value;
                      setTpList(updated);
                    }}
                    placeholder={`Misal: TP ${idx + 1} ...`}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditingTpModal(false)}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-colors"
              >
                Selesai &amp; Terapkan Ke Tabel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LOCK / UNLOCK DRAFT CONTROL */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  {isDraftLocked ? <Unlock className="w-5 h-5 text-amber-700" /> : <Lock className="w-5 h-5 text-amber-700" />}
                </div>
                <div>
                  <h3 className="font-bold font-serif text-base text-slate-900">
                    {isDraftLocked ? 'Buka Kunci Draft Nilai (Unlock Draft)' : 'Kunci Draft Nilai (Lock Draft)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Waka Kurikulum / Wali Kelas / Admin Authority
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Mata Pelajaran:</span>
                <span className="font-bold text-slate-900">{selectedMapel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rombel / Kelas:</span>
                <span className="font-bold text-slate-900">Kelas {selectedClass} ({semester})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Saat Ini:</span>
                <span className={`font-bold ${isDraftLocked ? 'text-red-700' : 'text-emerald-700'}`}>
                  {isDraftLocked ? '🔒 TERKUNCI (Locked)' : '🔓 TERBUKA (Editable)'}
                </span>
              </div>
            </div>

            {!isDraftLocked && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Batas Akhir Penginputan Nilai (Deadline)
                  </label>
                  <input
                    type="date"
                    value={lockDeadline}
                    onChange={(e) => setLockDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Instsruksi / Alasan Penguncian
                  </label>
                  <textarea
                    rows={3}
                    value={lockReason}
                    onChange={(e) => setLockReason(e.target.value)}
                    placeholder="Contoh: Draft nilai dikunci menjelang pencetakan Rapor Digital Semester Ganjil..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>

              {isDraftLocked ? (
                <button
                  type="button"
                  onClick={() => handleToggleLockDraft(false)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Ya, Buka Kunci Edit Nilai</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleLockDraft(true)}
                  className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>Kunci Form Draft Nilai Sekarang</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT LOG VIEWER */}
      <AuditLogModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        currentClass={selectedClass}
        currentMapel={selectedMapel}
      />

    </div>
  );
};

