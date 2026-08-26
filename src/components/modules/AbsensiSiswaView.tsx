import React, { useState } from 'react';
import { Student, AttendanceRecord, Teacher, UserSession, SchoolInfo } from '../../types';
import { CheckSquare, Calendar, Users, Save, Check, CheckCircle2, MessageSquare, Send, Share2, Lock } from 'lucide-react';
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

  const { allowedMapels, isRestricted, loggedTeacher } = getTeacherAllowedMapelList(
    session,
    teachers,
    mapelList
  );

  const teacherDefaultMapel = allowedMapels[0] || loggedTeacher?.mapelUtama || mapelList[0];

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

  const classes = dynamicClasses;
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

  // Summary counters
  const hadirCount = Object.values(studentStatuses).filter(s => s === 'H').length;
  const izinCount = Object.values(studentStatuses).filter(s => s === 'I').length;
  const sakitCount = Object.values(studentStatuses).filter(s => s === 'S').length;
  const alpaCount = Object.values(studentStatuses).filter(s => s === 'A').length;

  // Helper for sending WA notification to individual parent
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
      schoolName: 'SMP Islam Al Qomar'
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
      schoolName: 'SMP Islam Al Qomar'
    });

    WAService.sendWA('081234567890', msg, `Grup WA Kelas ${selectedClass}`, 'BROADCAST_KELAS');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>Presensi Kehadiran Siswa Harian</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md border border-emerald-300 font-mono">
              ⚡ TA: {schoolInfo?.tahunAjaran || '2024/2025'} (Sinkron Profil)
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Input Absensi Santri & Siswa Kelas {selectedClass}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Catat kehadiran Hadir (H), Izin (I), Sakit (S), atau Alpa (A) secara akurat per jam pelajaran • TA {schoolInfo?.tahunAjaran || '2024/2025'}
          </p>
        </div>

        {savedMessage && (
          <div className="flex items-center gap-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Absensi Berhasil Disimpan!</span>
          </div>
        )}
      </div>

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
              {classes.map(c => <option key={c} value={c} className="bg-white text-slate-900">Kelas {c}</option>)}
            </select>
          </div>

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
                    {m}
                  </option>
                ))}
              </select>
            )}
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
              className={`w-full px-3 py-2 border rounded-xl text-xs font-bold ${
                isRestricted
                  ? 'bg-slate-100/90 border-slate-300 text-slate-700 cursor-not-allowed'
                  : 'bg-slate-100 border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500'
              }`}
            />
          </div>
        </div>

        {/* Counter Summary & Set All Hadir & Broadcast WA Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-lg border border-emerald-200">
              Hadir: {hadirCount}
            </span>
            <span className="bg-blue-100 text-blue-900 px-3 py-1 rounded-lg border border-blue-200">
              Izin: {izinCount}
            </span>
            <span className="bg-amber-100 text-amber-900 px-3 py-1 rounded-lg border border-amber-200">
              Sakit: {sakitCount}
            </span>
            <span className="bg-rose-100 text-rose-900 px-3 py-1 rounded-lg border border-rose-200">
              Alpa: {alpaCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWABroadcastClass}
              className="text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 border border-emerald-500 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Broadcast Rekap WA Kelas</span>
            </button>

            <button
              type="button"
              onClick={handleSetAllHadir}
              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
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
                <th className="p-3.5">NISN & Nama Siswa</th>
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
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
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
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
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
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
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
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${
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
                        placeholder="Contoh: Demam, Izin acara keluarga..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                      />
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleSendWAIndividual(s)}
                        title={`Kirim WA Notifikasi Kehadiran ke Orang Tua ${s.nama}`}
                        className={`p-2 rounded-lg font-bold text-xs transition-colors inline-flex items-center gap-1 ${
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
            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm px-8 py-3 rounded-xl shadow transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Rekap Presensi Kehadiran</span>
          </button>
        </div>
      </form>

    </div>
  );
};
