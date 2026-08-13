import React, { useState } from 'react';
import { Student, SubjectGradeRecord, AttendanceRecord, SchoolInfo, Teacher } from '../../types';
import { Printer, ArrowLeft, FileText, Users, User, Download, Sparkles, CheckCircle2, Bookmark } from 'lucide-react';

interface LaporanRaporViewProps {
  students: Student[];
  grades: SubjectGradeRecord[];
  attendance: AttendanceRecord[];
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  initialSelectedStudent?: Student | null;
  onBack?: () => void;
}

export const LaporanRaporView: React.FC<LaporanRaporViewProps> = ({
  students,
  grades,
  attendance,
  schoolInfo,
  teachers,
  initialSelectedStudent,
  onBack
}) => {
  // Extract unique classes
  const availableClasses = Array.from(new Set(students.map(s => s.kelas))).sort();

  const [selectedKelas, setSelectedKelas] = useState<string>(
    initialSelectedStudent ? initialSelectedStudent.kelas : (availableClasses[0] || '7A')
  );

  const [viewMode, setViewMode] = useState<'individual' | 'bulk'>('individual');

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudent ? initialSelectedStudent.id : (students.find(s => s.kelas === selectedKelas)?.id || students[0]?.id || '')
  );

  // Filter students by selected class
  const classStudents = students.filter(s => s.kelas === selectedKelas);

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
        let predikat = 'C';
        if (akhir >= 90) predikat = 'A';
        else if (akhir >= 80) predikat = 'B';
        else if (akhir >= 70) predikat = 'C';
        else predikat = 'D';

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
        className={`bg-white rounded-2xl p-8 border border-slate-300 shadow-md max-w-4xl mx-auto space-y-6 text-slate-900 font-sans ${
          isBulkItem ? 'page-break mb-10' : ''
        }`}
      >
        {/* Islamic Kop Header */}
        <div className="border-b-4 border-double border-emerald-900 pb-4 text-center relative">
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-900 text-amber-300 font-black text-2xl flex items-center justify-center border-2 border-amber-400 overflow-hidden shrink-0">
              {schoolInfo.logoUrl ? (
                <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-cover" />
              ) : (
                "☪"
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-amber-700 uppercase tracking-widest font-serif">
                YAYASAN AL QOMAR BANYUWANGI
              </p>
              <h1 className="text-2xl font-black text-emerald-950 font-serif tracking-tight">
                {schoolInfo.nama.toUpperCase()}
              </h1>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                {schoolInfo.alamat} | Telp: {schoolInfo.telepon}
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                NPSN: {schoolInfo.npsn} | Akreditasi: {schoolInfo.akreditasi} | Email: {schoolInfo.email}
              </p>
            </div>
          </div>
        </div>

        {/* Report Card Title */}
        <div className="text-center">
          <h2 className="text-base font-bold font-serif underline tracking-wide uppercase text-slate-900">
            LAPORAN HASIL BELAJAR PESERTA DIDIK (RAPOR)
          </h2>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">
            Tahun Ajaran {schoolInfo.tahunAjaran} - Semester {schoolInfo.semesterAktif}
          </p>
        </div>

        {/* Student Biodata Box */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1">
            <p><strong>Nama Peserta Didik:</strong> <span className="font-serif font-bold text-slate-900">{st.nama}</span></p>
            <p><strong>NISN / NIS:</strong> <span className="font-mono">{st.nisn} / {st.nis}</span></p>
            <p><strong>Kelas / Rombel:</strong> Kelas {st.kelas}</p>
          </div>
          <div className="space-y-1 text-right sm:text-left">
            <p><strong>Nama Sekolah:</strong> {schoolInfo.nama}</p>
            <p><strong>Wali Kelas:</strong> {wali?.nama || 'Ustadzah Siti Fatimah, S.Pd.'}</p>
            <p><strong>Orang Tua / Wali:</strong> {st.namaOrangTua}</p>
          </div>
        </div>

        {/* Academic Grades Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold font-serif uppercase tracking-wider text-slate-800 border-b pb-1">
            A. Capaian Asesmen Akademik &amp; Kurikulum Merdeka
          </h3>

          <table className="w-full text-left border-collapse border border-slate-300 text-xs">
            <thead>
              <tr className="bg-emerald-950 text-white font-bold text-center">
                <th className="border border-slate-400 p-2 w-8">No</th>
                <th className="border border-slate-400 p-2 text-left">Mata Pelajaran</th>
                <th className="border border-slate-400 p-2 w-14">Formatif</th>
                <th className="border border-slate-400 p-2 w-12">PTS</th>
                <th className="border border-slate-400 p-2 w-12">PAS</th>
                <th className="border border-slate-400 p-2 w-16">Nilai Akhir</th>
                <th className="border border-slate-400 p-2 w-12">Predikat</th>
                <th className="border border-slate-400 p-2 text-left min-w-[180px]">Deskripsi Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {stGrades.length > 0 ? (
                stGrades.map((g, idx) => (
                  <tr key={idx} className="border border-slate-300">
                    <td className="border border-slate-300 p-2 text-center font-bold">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-bold font-serif">{g.mapel}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{g.formatif}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{g.pts}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{g.pas}</td>
                    <td className="border border-slate-300 p-2 text-center font-black text-emerald-900 bg-emerald-50">{g.akhir}</td>
                    <td className="border border-slate-300 p-2 text-center font-bold">{g.predikat}</td>
                    <td className="border border-slate-300 p-2 text-[11px] text-slate-700 leading-snug">{g.catatan}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                    Belum ada data nilai mata pelajaran terisi untuk siswa ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Islamic Character & Extracurricular */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 space-y-1.5">
            <h4 className="font-bold font-serif text-slate-800 border-b border-slate-200 pb-1">
              B. Capaian Character &amp; Diniyah Islamiyyah
            </h4>
            <p>• <strong>Tahfidz Al-Qur'an:</strong> Hafal Juz 30 (Lancar &amp; Mutqin)</p>
            <p>• <strong>Adab &amp; Akhlaq:</strong> Istiqomah, Santun &amp; Disiplin</p>
            <p>• <strong>Kedisiplinan Shalat:</strong> Rutin Shalat Dhuha &amp; Dzuhur Berjamaah</p>
          </div>

          <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 space-y-1.5">
            <h4 className="font-bold font-serif text-slate-800 border-b border-slate-200 pb-1">
              C. Kehadiran &amp; Rekapitulasi Presensi
            </h4>
            <p>• Hadir: <strong>{att.hadir} hari</strong></p>
            <p>• Izin: <strong>{att.izin} hari</strong> | Sakit: <strong>{att.sakit} hari</strong></p>
            <p>• Tanpa Keterangan (Alpa): <strong>{att.alpa} hari</strong></p>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs text-slate-800">
          <div>
            <p>Orang Tua / Wali Santri</p>
            <div className="h-16"></div>
            <p className="font-bold border-b border-slate-400 inline-block px-4">
              {st.namaOrangTua}
            </p>
          </div>

          <div>
            <p>Wali Kelas {st.kelas}</p>
            <div className="h-16"></div>
            <p className="font-bold border-b border-slate-400 inline-block px-4">
              {wali?.nama || 'Ustadzah Siti Fatimah, S.Pd.'}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              NIGY: {wali?.nigy || wali?.nip || 'NIGY.201503.200'}
            </p>
          </div>

          <div>
            <p>Banyuwangi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>Kepala Sekolah,</p>
            <div className="h-12"></div>
            <p className="font-bold border-b border-slate-400 inline-block px-4">
              {schoolInfo.kepalaSekolah}
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              NIGY: {schoolInfo.nigyKepalaSekolah || schoolInfo.nipKepalaSekolah}
            </p>
          </div>
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

            {/* Print / Export PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all border border-emerald-300/50"
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

    </div>
  );
};
