import React, { useState } from 'react';
import { Student, AttendanceRecord, SubjectGradeRecord, SchoolInfo, Teacher } from '../../types';
import { Search, GraduationCap, Award, CheckSquare, FileText, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

interface PublicPortalRaporProps {
  students: Student[];
  attendance: AttendanceRecord[];
  grades: SubjectGradeRecord[];
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  onSelectStudentForRapor: (student: Student) => void;
}

export const PublicPortalRapor: React.FC<PublicPortalRaporProps> = ({
  students,
  attendance,
  grades,
  schoolInfo,
  teachers,
  onSelectStudentForRapor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();
    const found = students.find(
      s => s.nisn.toLowerCase() === query || s.nis.toLowerCase() === query || s.nama.toLowerCase().includes(query)
    );

    setSelectedStudent(found || null);
  };

  // Calculate attendance summary for selected student
  const getStudentAttendance = (studentId: string) => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    attendance.forEach(rec => {
      const entry = rec.entries.find(e => e.studentId === studentId);
      if (entry) {
        if (entry.status === 'H') hadir++;
        else if (entry.status === 'I') izin++;
        else if (entry.status === 'S') sakit++;
        else if (entry.status === 'A') alpa++;
      }
    });

    const total = hadir + izin + sakit + alpa;
    const persentase = total > 0 ? Math.round((hadir / total) * 100) : 100;

    return { hadir, izin, sakit, alpa, total, persentase };
  };

  // Get grades for selected student
  const getStudentGrades = (studentId: string) => {
    const list: {
      mapel: string;
      teacherName: string;
      formatif: number;
      pts: number;
      pas: number;
      akhir: number;
      predikat: string;
      catatan: string;
    }[] = [];

    grades.forEach(g => {
      const entry = g.studentGrades.find(e => e.studentId === studentId);
      if (entry) {
        const avgFormatif = Math.round((entry.nilaiFormatif1 + entry.nilaiFormatif2) / 2);
        // Formula: 40% Formatif + 30% PTS + 30% PAS
        const akhir = Math.round((avgFormatif * 0.4) + (entry.nilaiPTS * 0.3) + (entry.nilaiPAS * 0.3));
        let predikat = 'C';
        if (akhir >= 90) predikat = 'A (Sangat Baik)';
        else if (akhir >= 80) predikat = 'B (Baik)';
        else if (akhir >= 70) predikat = 'C (Cukup)';
        else predikat = 'D (Perlu Bimbingan)';

        list.push({
          mapel: g.mapel,
          teacherName: g.teacherName,
          formatif: avgFormatif,
          pts: entry.nilaiPTS,
          pas: entry.nilaiPAS,
          akhir,
          predikat,
          catatan: entry.catatanKompetensi
        });
      }
    });

    return list;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
          <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
          <span>Portal Hasil Belajar Siswa & Wali Murid</span>
        </div>
        <h2 className="text-xl font-bold font-serif text-white">
          Cek Nilai & Laporan Hasil Belajar (Rapor Digital)
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Masukkan NISN atau Nama Santri/Siswa untuk melihat ringkasan capaian akademik dan kehadiran harian.
        </p>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik NISN (contoh: 0098234101) atau nama siswa..."
              className="w-full px-4 py-3 pl-10 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          </div>

          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-300/50"
          >
            <span>Cari Rapor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Suggestion Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400">Contoh pencarian cepat:</span>
          {students.slice(0, 3).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSearchQuery(s.nisn);
                setSelectedStudent(s);
              }}
              className="bg-slate-950/40 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 px-2.5 py-1 rounded-md border border-white/10 text-xs font-mono transition-colors"
            >
              {s.nama} ({s.nisn})
            </button>
          ))}
        </div>
      </div>

      {/* STUDENT RESULT */}
      {selectedStudent ? (
        <div className="space-y-6">
          
          {/* Student Profile Card */}
          <div className="glass backdrop-blur-xl bg-slate-900/80 text-white rounded-2xl p-6 shadow-xl border border-emerald-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-400 text-slate-950 font-black text-3xl flex items-center justify-center border-2 border-amber-300 shadow-lg">
                {selectedStudent.nama.charAt(0)}
              </div>
              <div>
                <span className="bg-amber-400/20 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-amber-400/30">
                  KELAS {selectedStudent.kelas}
                </span>
                <h3 className="text-xl font-bold font-serif text-white mt-1">
                  {selectedStudent.nama}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">
                  NISN: {selectedStudent.nisn} | NIS: {selectedStudent.nis} | Wali murid: {selectedStudent.namaOrangTua}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectStudentForRapor(selectedStudent)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 self-start md:self-auto border border-amber-300"
            >
              <FileText className="w-4 h-4" />
              <span>Buka Rapor Lengkap & Cetak PDF</span>
            </button>
          </div>

          {/* Attendance Stats & Summary */}
          {(() => {
            const att = getStudentAttendance(selectedStudent.id);
            const stGrades = getStudentGrades(selectedStudent.id);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Attendance Card */}
                <div className="lg:col-span-4 glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="font-bold text-sm text-white font-serif flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span>Rekap Kehadiran Siswa</span>
                    </h4>
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 rounded">
                      {att.persentase}% Kehadiran
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-emerald-500/10 border border-emerald-400/30 p-3 rounded-xl">
                      <span className="text-2xl font-black text-emerald-300 font-serif">{att.hadir}</span>
                      <span className="block text-[11px] font-semibold text-emerald-400 mt-0.5">Hadir (H)</span>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-400/30 p-3 rounded-xl">
                      <span className="text-2xl font-black text-blue-300 font-serif">{att.izin}</span>
                      <span className="block text-[11px] font-semibold text-blue-400 mt-0.5">Izin (I)</span>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-400/30 p-3 rounded-xl">
                      <span className="text-2xl font-black text-amber-300 font-serif">{att.sakit}</span>
                      <span className="block text-[11px] font-semibold text-amber-400 mt-0.5">Sakit (S)</span>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-400/30 p-3 rounded-xl">
                      <span className="text-2xl font-black text-rose-300 font-serif">{att.alpa}</span>
                      <span className="block text-[11px] font-semibold text-rose-400 mt-0.5">Alpa (A)</span>
                    </div>
                  </div>
                </div>

                {/* Grades Summary */}
                <div className="lg:col-span-8 glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h4 className="font-bold text-sm text-white font-serif flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Capaian Nilai Mata Pelajaran</span>
                    </h4>
                    <span className="text-xs text-slate-300">TA {schoolInfo.tahunAjaran}</span>
                  </div>

                  {stGrades.length > 0 ? (
                    <div className="space-y-3">
                      {stGrades.map((g, idx) => (
                        <div key={idx} className="bg-slate-950/60 p-4 rounded-xl border border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-white font-serif">{g.mapel}</span>
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-xs px-2.5 py-1 rounded-lg">
                              Nilai Akhir: {g.akhir}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-white/5">
                            <div>Formatif: <strong className="text-white">{g.formatif}</strong></div>
                            <div>PTS: <strong className="text-white">{g.pts}</strong></div>
                            <div>PAS: <strong className="text-white">{g.pas}</strong></div>
                          </div>

                          <p className="text-xs text-slate-300 italic">
                            "{g.catatan}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-dashed border-white/15">
                      Belum ada entri nilai yang dipublikasikan untuk semester ini.
                    </div>
                  )}
                </div>

              </div>
            );
          })()}

        </div>
      ) : searchQuery ? (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-10 border border-white/10 shadow-xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">
            Data Siswa Tidak Ditemukan
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Tidak ditemukan siswa dengan kata kunci "<strong>{searchQuery}</strong>". Pastikan NISN atau Nama yang dimasukkan sudah benar.
          </p>
        </div>
      ) : null}

    </div>
  );
};
