import React, { useState, useMemo } from 'react';
import { Student, AttendanceRecord, Teacher, UserSession, SchoolInfo } from '../../types';
import { 
  CheckSquare, 
  Calendar, 
  Users, 
  Save, 
  Check, 
  CheckCircle2, 
  MessageSquare, 
  Send, 
  Share2, 
  Printer, 
  FileText, 
  BarChart3, 
  Trophy, 
  AlertTriangle, 
  Sparkles,
  Download
} from 'lucide-react';
import { WAService } from '../../services/whatsappService';
import { DEFAULT_MAPEL_LIST, getAllClasses, getTeacherAllowedMapelList } from '../../data/constants';

interface AbsensiSiswaViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  teachers: Teacher[];
  session: UserSession;
  schoolInfo?: SchoolInfo;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
}

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

export const AbsensiSiswaView: React.FC<AbsensiSiswaViewProps> = ({
  students,
  attendance,
  teachers,
  session,
  schoolInfo,
  onSaveAttendance
}) => {
  const dynamicClasses = getAllClasses(students, [], teachers);
  const mapelList = DEFAULT_MAPEL_LIST;

  const { allowedMapels, loggedTeacher } = getTeacherAllowedMapelList(
    session,
    teachers,
    mapelList
  );

  const teacherDefaultMapel = allowedMapels[0] || loggedTeacher?.mapelUtama || mapelList[0];

  // Mode: 'harian' for daily logging, 'bulanan' for monthly recap & printing
  const [viewMode, setViewMode] = useState<'harian' | 'bulanan'>('harian');

  // --- HARIAN STATE ---
  const [selectedClass, setSelectedClass] = useState(dynamicClasses[0] || '7A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMapel, setSelectedMapel] = useState(teacherDefaultMapel);
  const [selectedTeacher, setSelectedTeacher] = useState(session.name || loggedTeacher?.nama || teachers[0]?.nama || 'Ustadz Amjad Mahbubi, S.Pd.');

  React.useEffect(() => {
    if (allowedMapels.length > 0 && !allowedMapels.includes(selectedMapel)) {
      setSelectedMapel(allowedMapels[0]);
    }
  }, [allowedMapels, selectedMapel]);

  React.useEffect(() => {
    if (loggedTeacher?.nama && session.role === 'guru') {
      setSelectedTeacher(loggedTeacher.nama);
    }
  }, [session.teacherId, session.name, loggedTeacher]);

  const classStudents = students.filter(s => s.kelas === selectedClass && s.status === 'Aktif');

  // Check if attendance already logged for this date & class
  const existingRecord = attendance.find(
    a => a.tanggal === selectedDate && a.kelas === selectedClass && a.mapel === selectedMapel
  );

  const [studentStatuses, setStudentStatuses] = useState<{ [studentId: string]: 'H' | 'I' | 'S' | 'A' }>({});
  const [studentCatatan, setStudentCatatan] = useState<{ [studentId: string]: string }>({});
  const [savedMessage, setSavedMessage] = useState(false);

  // Initialize or load existing statuses when class or date changes
  React.useEffect(() => {
    const initial: { [studentId: string]: 'H' | 'I' | 'S' | 'A' } = {};
    const notes: { [studentId: string]: string } = {};

    classStudents.forEach(s => {
      const existingEntry = existingRecord?.entries.find(e => e.studentId === s.id);
      initial[s.id] = existingEntry ? existingEntry.status : 'H';
      notes[s.id] = existingEntry?.catatan || '';
    });

    setStudentStatuses(initial);
    setStudentCatatan(notes);
  }, [selectedClass, selectedDate, selectedMapel]);

  const handleStatusChange = (studentId: string, status: 'H' | 'I' | 'S' | 'A') => {
    setStudentStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSetAllHadir = () => {
    const updated: { [studentId: string]: 'H' | 'I' | 'S' | 'A' } = {};
    classStudents.forEach(s => {
      updated[s.id] = 'H';
    });
    setStudentStatuses(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const entries = classStudents.map(s => ({
      studentId: s.id,
      studentName: s.nama,
      status: studentStatuses[s.id] || 'H',
      catatan: studentCatatan[s.id] || ''
    }));

    const newRecord: AttendanceRecord = {
      id: existingRecord ? existingRecord.id : `ATT${Date.now().toString().slice(-4)}`,
      tanggal: selectedDate,
      kelas: selectedClass,
      mapel: selectedMapel,
      teacherId: session.teacherId || 'T001',
      teacherName: selectedTeacher,
      entries
    };

    const updatedRecords = existingRecord
      ? attendance.map(a => (a.id === existingRecord.id ? newRecord : a))
      : [newRecord, ...attendance];

    onSaveAttendance(updatedRecords);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  // Summary counters for daily
  const hadirCount = Object.values(studentStatuses).filter(s => s === 'H').length;
  const izinCount = Object.values(studentStatuses).filter(s => s === 'I').length;
  const sakitCount = Object.values(studentStatuses).filter(s => s === 'S').length;
  const alpaCount = Object.values(studentStatuses).filter(s => s === 'A').length;

  // Helper for sending WA notification to individual parent (using custom placeholder template)
  const handleSendWAIndividual = (s: Student) => {
    const status = studentStatuses[s.id] || 'H';
    const note = studentCatatan[s.id] || '';
    const phone = s.noHpOrangTua || '081234567890';

    const msg = WAService.createAbsensiMessage({
      studentName: s.nama,
      kelas: s.kelas,
      tanggal: selectedDate,
      status,
      catatan: note,
      mapel: selectedMapel,
      guruName: selectedTeacher,
      schoolName: schoolInfo?.nama || 'SMP Islam Al Qomar'
    });

    WAService.sendWA(phone, msg, s.namaOrangTua || s.nama, 'PRESENSI_SISWA');
  };

  // Helper for broadcasting class attendance summary
  const handleSendWABroadcastClass = () => {
    const nonHadirNames = classStudents
      .filter(s => (studentStatuses[s.id] || 'H') !== 'H')
      .map(s => {
        const st = studentStatuses[s.id];
        const label = st === 'I' ? 'Izin' : st === 'S' ? 'Sakit' : 'Alpa';
        const note = studentCatatan[s.id] ? ` (${studentCatatan[s.id]})` : '';
        return `${s.nama} - [${label}]${note}`;
      });

    const msg = WAService.createClassAttendanceBroadcast({
      kelas: selectedClass,
      tanggal: selectedDate,
      totalHadir: hadirCount,
      totalIzin: izinCount,
      totalSakit: sakitCount,
      totalAlpa: alpaCount,
      nonHadirNames,
      schoolName: schoolInfo?.nama || 'SMP Islam Al Qomar'
    });

    WAService.sendWA('081234567890', msg, `Grup WA Kelas ${selectedClass}`, 'BROADCAST_KELAS');
  };

  // --- REKAP BULANAN STATE & LOGIC ---
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const [selectedMonthlyClass, setSelectedMonthlyClass] = useState(dynamicClasses[0] || '7A');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum);
  const [selectedMonthlyMapel, setSelectedMonthlyMapel] = useState<string>('ALL');

  const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const selectedMonthLabel = MONTHS.find(m => m.value === selectedMonth)?.label || 'Bulan';

  // Filter attendance records for chosen class, year & month
  const monthlyRecords = useMemo(() => {
    return attendance.filter(a => {
      const matchClass = a.kelas === selectedMonthlyClass;
      const matchMonth = a.tanggal.startsWith(monthPrefix);
      const matchMapel = selectedMonthlyMapel === 'ALL' || a.mapel === selectedMonthlyMapel;
      return matchClass && matchMonth && matchMapel;
    });
  }, [attendance, selectedMonthlyClass, monthPrefix, selectedMonthlyMapel]);

  // Active students in chosen class
  const monthlyClassStudents = useMemo(() => {
    return students.filter(s => s.kelas === selectedMonthlyClass && s.status === 'Aktif');
  }, [students, selectedMonthlyClass]);

  // Distinct dates in that month
  const recordedDates = useMemo(() => {
    return Array.from(new Set(monthlyRecords.map(r => r.tanggal))).sort();
  }, [monthlyRecords]);

  // Calculate stats for each student in the month
  const studentMonthlyStats = useMemo(() => {
    return monthlyClassStudents.map(student => {
      let h = 0, i = 0, s = 0, a = 0;
      monthlyRecords.forEach(rec => {
        const entry = rec.entries.find(e => e.studentId === student.id);
        if (entry) {
          if (entry.status === 'H') h++;
          else if (entry.status === 'I') i++;
          else if (entry.status === 'S') s++;
          else if (entry.status === 'A') a++;
        }
      });
      const total = h + i + s + a;
      const persentase = total > 0 ? Math.round((h / total) * 100) : (recordedDates.length > 0 ? 0 : 100);
      return {
        student,
        hadir: h,
        izin: i,
        sakit: s,
        alpa: a,
        totalHari: total,
        persentase
      };
    });
  }, [monthlyClassStudents, monthlyRecords, recordedDates]);

  // Class monthly metrics
  const totalMeetings = recordedDates.length;
  const classAvgPersentase = studentMonthlyStats.length > 0
    ? Math.round(studentMonthlyStats.reduce((sum, s) => sum + s.persentase, 0) / studentMonthlyStats.length)
    : 100;
  const perfectAttendanceCount = studentMonthlyStats.filter(s => s.persentase === 100 && s.totalHari > 0).length;
  const attentionNeededCount = studentMonthlyStats.filter(s => s.alpa >= 1 || s.persentase < 85).length;

  // Find Wali Kelas
  const waliKelasTeacher = teachers.find(
    t => t.waliKelasDi === selectedMonthlyClass ||
      (t.jabatan && t.jabatan.toLowerCase().includes(selectedMonthlyClass.toLowerCase()))
  );

  const handlePrintMonthlyRecap = () => {
    window.print();
  };

  const handleSendMonthlyWARecap = (stat: typeof studentMonthlyStats[0]) => {
    const phone = stat.student.noHpOrangTua || '081234567890';
    const msg =
      `*LAPORAN REKAPITULASI PRESENSI BULANAN*\n` +
      `*${(schoolInfo?.nama || 'SMP Islam Al Qomar').toUpperCase()}*\n\n` +
      `Assalamualaikum Wr. Wb. Yth. Orang Tua/Wali dari *${stat.student.nama}* (Kelas ${stat.student.kelas}),\n\n` +
      `Berikut rekapitulasi kehadiran ananda selama bulan *${selectedMonthLabel} ${selectedYear}*:\n` +
      `• Hadir: *${stat.hadir} kali*\n` +
      `• Izin: *${stat.izin} kali*\n` +
      `• Sakit: *${stat.sakit} kali*\n` +
      `• Alpa: *${stat.alpa} kali*\n` +
      `• Total Pertemuan: *${stat.totalHari} kali*\n` +
      `• Persentase Kehadiran: *${stat.persentase}%*\n\n` +
      (stat.alpa > 0
        ? `⚠️ *Catatan Wali Kelas:* Terdapat catatan ${stat.alpa} kali alpa (tanpa keterangan). Mohon perhatian dan kerja sama Bpk/Ibu agar ananda lebih disiplin.\n\n`
        : ` Alhamdulillaah, ananda memiliki catatan kehadiran yang sangat baik. Pertahankan terus kedisiplinan belajar ananda.\n\n`) +
      `Wassalamualaikum Wr. Wb.\n` +
      `_Wali Kelas ${selectedMonthlyClass} • ${schoolInfo?.nama || 'SMP Islam Al Qomar'}_`;

    WAService.sendWA(phone, msg, stat.student.namaOrangTua || stat.student.nama, 'PRESENSI_SISWA');
  };

  const handleSendMonthlyClassBroadcast = () => {
    const msg =
      `*REKAPITULASI KEHADIRAN BULANAN KELAS ${selectedMonthlyClass}*\n` +
      `*${(schoolInfo?.nama || 'SMP Islam Al Qomar').toUpperCase()}*\n` +
      `📅 Periode: *${selectedMonthLabel} ${selectedYear}*\n\n` +
      `📊 *STATISTIK KEHADIRAN KELAS:*\n` +
      `• Total Hari/Pertemuan: *${totalMeetings} kali*\n` +
      `• Rata-rata Kehadiran Kelas: *${classAvgPersentase}%*\n` +
      `• Santri Disiplin 100%: *${perfectAttendanceCount} siswa*\n` +
      `• Santri Perlu Pembinaan: *${attentionNeededCount} siswa*\n\n` +
      `Laporan resmi ini dipergunakan sebagai bahan rapat evaluasi bulanan wali kelas dan pembinaan santri.\n\n` +
      `_Wali Kelas ${selectedMonthlyClass} • ${schoolInfo?.nama || 'SMP Islam Al Qomar'}_`;

    WAService.sendWA('081234567890', msg, `Grup WA Wali Santri Kelas ${selectedMonthlyClass}`, 'BROADCAST_KELAS');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Main Navigation Header with Sub-Tabs */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>Presensi Kehadiran Siswa</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md border border-emerald-300 font-mono">
              ⚡ TA: {schoolInfo?.tahunAjaran || '2024/2025'} ({schoolInfo?.semesterAktif || 'Ganjil'})
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            {viewMode === 'harian' ? `Input Jurnal Presensi Harian` : `Rekapitulasi Kehadiran Bulanan (Rapat Evaluasi)`}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === 'harian'
              ? 'Catat kehadiran harian Hadir (H), Izin (I), Sakit (S), atau Alpa (A) per jam pelajaran.'
              : 'Rekapitulasi persentase kehadiran per bulan untuk lampiran resmi rapat evaluasi bulanan wali kelas & BK.'}
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={() => setViewMode('harian')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'harian'
                ? 'bg-emerald-800 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Presensi Harian</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('bulanan')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'bulanan'
                ? 'bg-emerald-800 text-white shadow'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Rekap Bulanan &amp; Cetak Rapat</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: PRESENSI HARIAN                                                   */}
      {/* ========================================================================= */}
      {viewMode === 'harian' && (
        <div className="space-y-5 no-print">
          {savedMessage && (
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-3 rounded-xl text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Presensi Harian Berhasil Disimpan ke Sistem &amp; Database!</span>
            </div>
          )}

          {/* Control Panel: Date, Class, Mapel, Teacher */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kehadiran</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {dynamicClasses.map(c => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {mapelList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guru Pengampu</label>
                <input
                  type="text"
                  value={selectedTeacher}
                  readOnly={session.role === 'guru'}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${
                    session.role === 'guru'
                      ? 'bg-slate-200 border-slate-300 text-slate-700 cursor-not-allowed'
                      : 'bg-slate-100 border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>

            {/* Attendance Counters & Fast Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg border border-emerald-300">
                  Hadir: {hadirCount}
                </span>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg border border-blue-300">
                  Izin: {izinCount}
                </span>
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg border border-amber-300">
                  Sakit: {sakitCount}
                </span>
                <span className="px-2.5 py-1 bg-rose-100 text-rose-900 rounded-lg border border-rose-300">
                  Alpa: {alpaCount}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendWABroadcastClass}
                  className="text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Broadcast Rekap WA Kelas</span>
                </button>

                <button
                  type="button"
                  onClick={handleSetAllHadir}
                  className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  ✓ Tandai Semua Hadir (H)
                </button>
              </div>
            </div>
          </div>

          {/* Student Attendance Form Table */}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <th className="p-3.5 w-12 text-center">No</th>
                    <th className="p-3.5">NISN &amp; Nama Siswa</th>
                    <th className="p-3.5 text-center">Pilihan Kehadiran (H / I / S / A)</th>
                    <th className="p-3.5">Catatan Khusus (Alasan)</th>
                    <th className="p-3.5 text-center w-28">WA Notif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((s, idx) => {
                    const currentStatus = studentStatuses[s.id] || 'H';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 font-serif text-sm">{s.nama}</div>
                          <div className="text-[11px] font-mono text-slate-500">NISN: {s.nisn}</div>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'H')}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                currentStatus === 'H'
                                  ? 'bg-emerald-700 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-emerald-800'
                              }`}
                            >
                              H
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'I')}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                currentStatus === 'I'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-blue-800'
                              }`}
                            >
                              I
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'S')}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                currentStatus === 'S'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-amber-800'
                              }`}
                            >
                              S
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, 'A')}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                                currentStatus === 'A'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'text-slate-600 hover:text-rose-800'
                              }`}
                            >
                              A
                            </button>
                          </div>
                        </td>

                        <td className="p-3.5">
                          <input
                            type="text"
                            value={studentCatatan[s.id] || ''}
                            onChange={(e) =>
                              setStudentCatatan({ ...studentCatatan, [s.id]: e.target.value })
                            }
                            placeholder="Contoh: Demam, Izin bepergian..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                          />
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleSendWAIndividual(s)}
                            title={`Kirim WA Notifikasi Kehadiran ke Orang Tua ${s.nama}`}
                            className={`p-2 rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer ${
                              currentStatus !== 'H'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow animate-pulse'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Kirim</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Submit button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm px-8 py-3 rounded-xl shadow transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Rekap Presensi Kehadiran</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: REKAP BULANAN & CETAK RAPAT EVALUASI WALI KELAS                   */}
      {/* ========================================================================= */}
      {viewMode === 'bulanan' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 no-print">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-800 font-serif">
                  Filter Periode Rekapitulasi Rapat Evaluasi
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Wali Kelas: <strong className="text-slate-800">{waliKelasTeacher?.nama || 'Belum Ditentukan'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kelas</label>
                <select
                  value={selectedMonthlyClass}
                  onChange={(e) => setSelectedMonthlyClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {dynamicClasses.map(c => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Bulan</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {MONTHS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Tahun</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {[currentYearNum - 1, currentYearNum, currentYearNum + 1].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={selectedMonthlyMapel}
                  onChange={(e) => setSelectedMonthlyMapel(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Semua Mapel (Akumulasi Presensi)</option>
                  {mapelList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Menampilkan data untuk: <strong>Kelas {selectedMonthlyClass} • Periode {selectedMonthLabel} {selectedYear}</strong> ({recordedDates.length} hari pertemuan tercatat)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendMonthlyClassBroadcast}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                  title="Broadcast ringkasan bulanan kelas ke grup WhatsApp orang tua"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Broadcast Rekap ke WA Grup</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintMonthlyRecap}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition-colors cursor-pointer"
                  title="Cetak dokumen resmi untuk lampiran rapat evaluasi bulanan wali kelas"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Cetak Dokumen Rapat (PDF/Print)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Monthly Statistics Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 no-print">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Pertemuan</span>
              <div className="text-2xl font-bold font-serif text-slate-900">{totalMeetings} <span className="text-xs font-normal text-slate-500">Hari</span></div>
              <p className="text-[10px] text-slate-400">Tercatat di {selectedMonthLabel}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase">Rata-rata Kelas</span>
              <div className="text-2xl font-bold font-serif text-emerald-800">{classAvgPersentase}%</div>
              <p className="text-[10px] text-emerald-600">Kehadiran Seluruh Siswa</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-blue-700 uppercase">Hadir 100%</span>
              <div className="text-2xl font-bold font-serif text-blue-800">{perfectAttendanceCount} <span className="text-xs font-normal text-slate-500">Siswa</span></div>
              <p className="text-[10px] text-blue-600">Disiplin Sempurna</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-rose-700 uppercase">Perlu Perhatian</span>
              <div className="text-2xl font-bold font-serif text-rose-800">{attentionNeededCount} <span className="text-xs font-normal text-slate-500">Siswa</span></div>
              <p className="text-[10px] text-rose-600">Alpa ≥ 1 atau &lt; 85%</p>
            </div>
          </div>

          {/* Interactive Table (Screen View) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm font-serif">
                  Tabel Rekapitulasi Presensi Santri - Kelas {selectedMonthlyClass}
                </h4>
                <p className="text-xs text-slate-500">
                  Periode {selectedMonthLabel} {selectedYear} • {monthlyClassStudents.length} Siswa Terdaftar
                </p>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Disiplin (≥ 85%)</span>
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-2"></span>
                <span>Perlu Pembinaan (&lt; 85% / Alpa)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 w-28">NISN</th>
                    <th className="p-3">Nama Lengkap Santri / Siswa</th>
                    <th className="p-3 text-center w-12">L/P</th>
                    <th className="p-3 text-center w-14 bg-emerald-50/50 text-emerald-900">H</th>
                    <th className="p-3 text-center w-14 bg-blue-50/50 text-blue-900">I</th>
                    <th className="p-3 text-center w-14 bg-amber-50/50 text-amber-900">S</th>
                    <th className="p-3 text-center w-14 bg-rose-50/50 text-rose-900">A</th>
                    <th className="p-3 text-center w-20">Total Hari</th>
                    <th className="p-3 text-center w-24">% Hadir</th>
                    <th className="p-3 text-center w-36">Status Evaluasi</th>
                    <th className="p-3 text-center w-24">WA Notif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentMonthlyStats.map((stat, idx) => {
                    const isWarning = stat.alpa >= 1 || stat.persentase < 85;

                    return (
                      <tr key={stat.student.id} className={`hover:bg-slate-50 transition-colors ${isWarning ? 'bg-rose-50/30' : ''}`}>
                        <td className="p-3 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {stat.student.nisn}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-900 text-sm font-serif">
                            {stat.student.nama}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-500">
                          {stat.student.gender}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/30">
                          {stat.hadir}
                        </td>
                        <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/30">
                          {stat.izin}
                        </td>
                        <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/30">
                          {stat.sakit}
                        </td>
                        <td className="p-3 text-center font-bold text-rose-700 bg-rose-50/30">
                          {stat.alpa}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600">
                          {stat.totalHari}
                        </td>
                        <td className="p-3 text-center font-bold font-mono">
                          <span className={`px-2 py-0.5 rounded-md ${
                            stat.persentase === 100
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : stat.persentase >= 85
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {stat.persentase}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {stat.persentase === 100 && stat.totalHari > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <Trophy className="w-3 h-3 text-amber-500" />
                              <span>Sangat Disiplin</span>
                            </span>
                          ) : isWarning ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Perlu Pembinaan</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                              Baik Normal
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSendMonthlyWARecap(stat)}
                            title={`Kirim WA Rekap Bulanan ke Wali Santri ${stat.student.nama}`}
                            className={`p-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer ${
                              isWarning
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span className="text-[10px]">Kirim</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PRINTABLE OFFICIAL DOCUMENT (PRINT VIEW & PDF EXPORT)                    */}
          {/* ========================================================================= */}
          <div id="printable-monthly-recap" className="bg-white text-black p-6 rounded-2xl border border-slate-300 shadow-lg print:p-0 print:border-none print:shadow-none">
            
            {/* KOP SURAT RESMI SEKOLAH */}
            <div className="border-b-4 border-double border-black pb-3 text-center">
              <div className="flex items-center justify-between gap-4">
                <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                  {schoolInfo?.logoUrl ? (
                    <img src={schoolInfo.logoUrl} alt="Logo Sekolah" className="w-18 h-18 object-contain" />
                  ) : (
                    <div className="text-3xl font-bold font-serif">☪</div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-slate-800">
                    YAYASAN PENDIDIKAN ISLAM AL-QOMAR BANYUWANGI
                  </h4>
                  <h2 className="text-xl font-bold uppercase tracking-wide font-serif text-black leading-tight">
                    {schoolInfo?.nama || 'SMP ISLAM AL QOMAR'}
                  </h2>
                  <p className="text-xs text-slate-800 font-semibold mt-0.5">
                    NPSN: {schoolInfo?.npsn || '69900000'} • AKREDITASI {schoolInfo?.akreditasi || 'A'}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {schoolInfo?.alamat || 'Jl. Raya Al Qomar, Banyuwangi, Jawa Timur'} • Telp: {schoolInfo?.telepon || '-'} • Email: {schoolInfo?.email || '-'}
                  </p>
                </div>
                <div className="w-20 h-20 shrink-0 hidden sm:block"></div>
              </div>
            </div>

            {/* JUDUL DOKUMEN LAPORAN RESMI */}
            <div className="text-center my-4 space-y-1">
              <h3 className="text-base font-bold uppercase tracking-wider underline font-serif">
                REKAPITULASI PRESENSI &amp; KEHADIRAN SISWA BULANAN
              </h3>
              <p className="text-xs font-semibold uppercase text-slate-800">
                Lampiran Dokumen Rapat Evaluasi Bulanan Wali Kelas &amp; Dewan Guru
              </p>
            </div>

            {/* METADATA DOKUMEN */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-3 pb-2 border-b border-slate-300">
              <div className="space-y-1">
                <p><strong>Kelas / Rombel:</strong> Kelas {selectedMonthlyClass}</p>
                <p><strong>Periode Bulan:</strong> {selectedMonthLabel} {selectedYear}</p>
                <p><strong>Total Hari Efektif / Pertemuan:</strong> {totalMeetings} Hari Tercatat</p>
              </div>
              <div className="space-y-1">
                <p><strong>Tahun Ajaran:</strong> {schoolInfo?.tahunAjaran || '2024/2025'}</p>
                <p><strong>Semester:</strong> {schoolInfo?.semesterAktif || 'Ganjil'}</p>
                <p><strong>Wali Kelas:</strong> {waliKelasTeacher?.nama || '-'}</p>
              </div>
            </div>

            {/* TABEL CETAK RESMI */}
            <table className="w-full text-left border-collapse border border-black text-xs my-3">
              <thead>
                <tr className="bg-slate-100 border border-black text-center font-bold">
                  <th className="border border-black p-2 w-8">No</th>
                  <th className="border border-black p-2 w-24">NISN</th>
                  <th className="border border-black p-2 text-left">Nama Lengkap Siswa</th>
                  <th className="border border-black p-2 w-10">L/P</th>
                  <th className="border border-black p-2 w-12">Hadir</th>
                  <th className="border border-black p-2 w-12">Izin</th>
                  <th className="border border-black p-2 w-12">Sakit</th>
                  <th className="border border-black p-2 w-12">Alpa</th>
                  <th className="border border-black p-2 w-14">Total</th>
                  <th className="border border-black p-2 w-16">% Hadir</th>
                  <th className="border border-black p-2 w-28">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {studentMonthlyStats.map((stat, idx) => (
                  <tr key={stat.student.id} className="border border-black text-center">
                    <td className="border border-black p-1.5 font-mono">{idx + 1}</td>
                    <td className="border border-black p-1.5 font-mono">{stat.student.nisn}</td>
                    <td className="border border-black p-1.5 text-left font-semibold">{stat.student.nama}</td>
                    <td className="border border-black p-1.5">{stat.student.gender}</td>
                    <td className="border border-black p-1.5 font-bold">{stat.hadir}</td>
                    <td className="border border-black p-1.5">{stat.izin}</td>
                    <td className="border border-black p-1.5">{stat.sakit}</td>
                    <td className="border border-black p-1.5 font-bold text-rose-700">{stat.alpa}</td>
                    <td className="border border-black p-1.5 font-mono">{stat.totalHari}</td>
                    <td className="border border-black p-1.5 font-bold font-mono">{stat.persentase}%</td>
                    <td className="border border-black p-1.5 text-[11px]">
                      {stat.persentase === 100 && stat.totalHari > 0
                        ? 'Sangat Disiplin'
                        : stat.alpa >= 1 || stat.persentase < 85
                        ? 'Perlu Pembinaan'
                        : 'Baik'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* RESUME STATISTIK RAPAT */}
            <div className="border border-black p-3 rounded-lg text-xs my-4 space-y-1">
              <p className="font-bold underline uppercase">Catatan &amp; Resume Rapat Evaluasi Bulanan:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                <div>• Rata-rata Kehadiran: <strong>{classAvgPersentase}%</strong></div>
                <div>• Santri 100% Hadir: <strong>{perfectAttendanceCount} Orang</strong></div>
                <div>• Perlu Perhatian Khusus: <strong>{attentionNeededCount} Orang</strong></div>
                <div>• Status Kelas: <strong>{classAvgPersentase >= 90 ? 'Sangat Baik' : 'Cukup Baik'}</strong></div>
              </div>
            </div>

            {/* KOLOM TANDA TANGAN RESMI */}
            <div className="grid grid-cols-2 gap-8 text-xs text-center mt-8 pt-4">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah</p>
                <div className="h-20"></div>
                <p className="font-bold underline uppercase">
                  {schoolInfo?.kepalaSekolah || 'Ustadz Amjad Mahbubi, S.Pd.'}
                </p>
                <p className="text-[10px] text-slate-700">
                  NIGY. {schoolInfo?.nigyKepalaSekolah || schoolInfo?.nipKepalaSekolah || '198701012022031001'}
                </p>
              </div>

              <div>
                <p>Banyuwangi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p className="font-bold">Wali Kelas {selectedMonthlyClass}</p>
                <div className="h-20"></div>
                <p className="font-bold underline uppercase">
                  {waliKelasTeacher?.nama || selectedTeacher || 'Wali Kelas'}
                </p>
                <p className="text-[10px] text-slate-700">
                  NIGY/NUPTK. {waliKelasTeacher?.nigy || waliKelasTeacher?.nuptk || '-'}
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
