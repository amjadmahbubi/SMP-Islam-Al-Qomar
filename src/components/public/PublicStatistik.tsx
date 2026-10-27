import React, { useMemo, useState } from 'react';
import { SchoolInfo, Student, Teacher, SarprasItem, ScheduleItem, AttendanceRecord, SubjectGradeRecord, StudentAchievement, UserSession } from '../../types';
import { getAllClasses } from '../../data/constants';
import { 
  Users, 
  GraduationCap, 
  Building2, 
  Award, 
  BookOpen, 
  HeartHandshake, 
  CheckCircle, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Search, 
  Trophy, 
  RefreshCw, 
  FileSpreadsheet, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';

interface PublicStatistikProps {
  schoolInfo: SchoolInfo;
  students: Student[];
  teachers: Teacher[];
  sarpras: SarprasItem[];
  schedules?: ScheduleItem[];
  attendance?: AttendanceRecord[];
  grades?: SubjectGradeRecord[];
  achievements?: StudentAchievement[];
  session?: UserSession;
  autoSyncStatus?: {
    status: 'idle' | 'checking' | 'synced' | 'offline';
    lastSyncTime?: string;
    message?: string;
  };
  onTriggerAutoSync?: () => Promise<void> | void;
  onNavigateToSheets?: () => void;
}

export const PublicStatistik: React.FC<PublicStatistikProps> = ({
  schoolInfo,
  students,
  teachers,
  sarpras,
  schedules = [],
  achievements = [],
  session,
  autoSyncStatus,
  onTriggerAutoSync,
  onNavigateToSheets
}) => {
  const [isPulling, setIsPulling] = useState(false);

  const handleQuickPull = async () => {
    if (onTriggerAutoSync) {
      setIsPulling(true);
      try {
        await onTriggerAutoSync();
      } finally {
        setTimeout(() => setIsPulling(false), 800);
      }
    }
  };

  const activeStudents = students.filter(s => s.status === 'Aktif');
  const alumniStudents = useMemo(() => students.filter(s => s.status === 'Lulus'), [students]);

  // Unique graduation years
  const alumniYears = useMemo(() => {
    const years = Array.from(new Set(alumniStudents.map(a => a.tahunLulus).filter(Boolean))) as string[];
    return years.sort().reverse();
  }, [alumniStudents]);

  const [alumniYearFilter, setAlumniYearFilter] = useState<string>('Semua');
  const [alumniSearch, setAlumniSearch] = useState<string>('');

  const filteredAlumni = useMemo(() => {
    return alumniStudents.filter(a => {
      const matchYear = alumniYearFilter === 'Semua' || a.tahunLulus === alumniYearFilter;
      const matchSearch = !alumniSearch.trim() ||
        a.nama.toLowerCase().includes(alumniSearch.toLowerCase()) ||
        (a.sekolahLanjutan && a.sekolahLanjutan.toLowerCase().includes(alumniSearch.toLowerCase())) ||
        (a.keteranganLulus && a.keteranganLulus.toLowerCase().includes(alumniSearch.toLowerCase()));
      return matchYear && matchSearch;
    });
  }, [alumniStudents, alumniYearFilter, alumniSearch]);

  const dynamicClasses = useMemo(
    () => getAllClasses(students, schedules, teachers),
    [students, schedules, teachers]
  );
  const formatClassLabel = (c: unknown) => {
    const str = String(c || '').trim();
    if (!str) return '';
    return str.toLowerCase().startsWith('kelas') ? str : `Kelas ${str}`;
  };

  const rombelSubText = dynamicClasses.length > 0 
    ? dynamicClasses.map(formatClassLabel).filter(Boolean).join(', ') 
    : 'Semua Rombel';

  const statsCards = [
    {
      title: 'Total Siswa Aktif',
      value: activeStudents.length,
      unit: 'Siswa',
      sub: 'Kelas VII, VIII, IX',
      icon: Users,
      color: 'from-emerald-800 to-emerald-700',
      badge: 'Terdaftar'
    },
    {
      title: 'Guru & Tenaga Kependidikan',
      value: teachers.length,
      unit: 'Ustadz & Ustadzah',
      sub: 'Berijazah S1 & S2',
      icon: GraduationCap,
      color: 'from-teal-800 to-teal-700',
      badge: 'Pengajar'
    },
    {
      title: 'Rombongan Belajar (Rombel)',
      value: dynamicClasses.length,
      unit: 'Kelas',
      sub: rombelSubText,
      icon: Building2,
      color: 'from-amber-700 to-amber-600',
      badge: 'Aktif Terdata'
    },
    {
      title: 'Prestasi & Kejuaraan Murid',
      value: achievements.length,
      unit: 'Prestasi',
      sub: 'Tahfidz, OSN, Olahraga & Seni',
      icon: Trophy,
      color: 'from-amber-600 to-yellow-600',
      badge: 'Membanggakan'
    },
    {
      title: 'Status Akreditasi BAN-S/M',
      value: schoolInfo.akreditasi,
      unit: 'Nilai 96',
      sub: 'Surat Keputusan BAN-S/M',
      icon: Award,
      color: 'from-emerald-900 to-emerald-800',
      badge: 'Sangat Baik'
    }
  ];

  const isSyncChecking = isPulling || autoSyncStatus?.status === 'checking';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Hero Islamic Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-emerald-800/80">
        
        {/* Subtle Islamic Celestial Stars / Al-Qomar Night Sky Atmosphere */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          {/* Subtle sparkling star particles with varied positions, colors & breathing delays */}
          <span className="celestial-star absolute top-4 left-[12%] w-1.5 h-1.5 rounded-full bg-amber-300 opacity-60" style={{ animationDelay: '0s' }} />
          <span className="celestial-star absolute top-10 left-[28%] w-1 h-1 rounded-full bg-emerald-200 opacity-40" style={{ animationDelay: '1.4s' }} />
          <span className="celestial-star absolute top-6 left-[45%] w-2 h-2 rounded-full bg-amber-200 opacity-70" style={{ animationDelay: '0.8s' }} />
          <span className="celestial-star absolute top-14 left-[58%] w-1.5 h-1.5 rounded-full bg-emerald-300 opacity-50" style={{ animationDelay: '2.1s' }} />
          <span className="celestial-star absolute top-5 right-[24%] w-1 h-1 rounded-full bg-amber-100 opacity-60" style={{ animationDelay: '1.1s' }} />
          <span className="celestial-star absolute top-16 right-[15%] w-2 h-2 rounded-full bg-amber-300 opacity-75" style={{ animationDelay: '2.8s' }} />
          <span className="celestial-star absolute bottom-8 left-[18%] w-1 h-1 rounded-full bg-emerald-200 opacity-40" style={{ animationDelay: '0.5s' }} />
          <span className="celestial-star absolute bottom-12 left-[50%] w-1.5 h-1.5 rounded-full bg-amber-200 opacity-60" style={{ animationDelay: '1.8s' }} />
          <span className="celestial-star absolute bottom-6 right-[30%] w-1 h-1 rounded-full bg-emerald-100 opacity-50" style={{ animationDelay: '2.4s' }} />
          <span className="celestial-star absolute bottom-14 right-[10%] w-1.5 h-1.5 rounded-full bg-amber-300 opacity-70" style={{ animationDelay: '0.3s' }} />
          
          {/* Soft 4-Point Islamic Stars floating near the crescent/moon watermark */}
          <span className="celestial-glow absolute top-8 right-20 text-amber-300/60 text-sm" style={{ animationDelay: '0.7s' }}>✦</span>
          <span className="celestial-glow absolute top-24 right-36 text-emerald-300/50 text-xs" style={{ animationDelay: '2.2s' }}>★</span>
          <span className="celestial-glow absolute bottom-10 right-28 text-amber-200/50 text-base" style={{ animationDelay: '1.5s' }}>✦</span>
          <span className="celestial-glow absolute top-16 left-[38%] text-amber-300/40 text-xs" style={{ animationDelay: '3.0s' }}>✦</span>
        </div>

        <div className="absolute right-0 top-0 opacity-20 pointer-events-none transform translate-x-8 -translate-y-6 w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
          {schoolInfo.logoUrl ? (
            <img src={schoolInfo.logoUrl} alt="Logo Watermark" className="w-full h-full object-contain filter drop-shadow-2xl brightness-125" />
          ) : (
            <span className="text-[220px]">☪</span>
          )}
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-xs font-semibold mb-4">
            <span>✨ Sistem Informasi Sekolah Islam Terpadu</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold font-serif tracking-tight text-white leading-tight">
            Selamat Datang di {schoolInfo.nama}
          </h1>
          <p className="mt-3 text-emerald-100 text-sm sm:text-base font-light leading-relaxed">
            "{schoolInfo.visi}"
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-emerald-200">
            <span className="flex items-center gap-1.5 bg-emerald-900/80 px-3 py-1.5 rounded-lg border border-emerald-700">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              NPSN: {schoolInfo.npsn}
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-900/80 px-3 py-1.5 rounded-lg border border-emerald-700">
              <MapPin className="w-4 h-4 text-amber-400" />
              {schoolInfo.alamat || 'Banyuwangi, Jawa Timur'}
            </span>
          </div>
        </div>
      </div>

      {/* QUICK SYNC / TARIK DATA GOOGLE SHEETS BAR (Hanya Ditampilkan untuk Administrator) */}
      {session?.role === 'admin' && (
        <div className="glass backdrop-blur-xl bg-slate-900/75 rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white font-serif">
                  Sinkronisasi Integrasi Google Sheets
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>{autoSyncStatus?.lastSyncTime ? `Tersinkron: ${autoSyncStatus.lastSyncTime}` : 'Siap Sinkron'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300/90 truncate mt-0.5">
                {autoSyncStatus?.message || 'Semua modul DAPODIK termasuk Prestasi Santri & Asesmen Nilai terhubung 2-arah.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {onTriggerAutoSync && (
              <button
                onClick={handleQuickPull}
                disabled={isSyncChecking}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md border cursor-pointer ${
                  isSyncChecking
                    ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 cursor-wait'
                    : 'bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 border-emerald-300/50 hover:shadow-emerald-500/20'
                }`}
                title="Tarik pembaruan data langsung dari Google Sheets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncChecking ? 'animate-spin text-amber-300' : 'text-slate-950'}`} />
                <span>{isSyncChecking ? 'Menarik Data Sheets...' : 'Tarik Data Terbaru'}</span>
              </button>
            )}

            {onNavigateToSheets && (
              <button
                onClick={onNavigateToSheets}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-colors"
                title="Buka pengaturan dan detail sinkronisasi Google Sheets"
              >
                <span>Detail Sheets</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-serif text-white">
            Ringkasan Statistik Sekolah
          </h2>
          <span className="text-xs text-slate-400 font-mono">Realtime DAPODIK</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {statsCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl hover:border-emerald-400/30 transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                    {card.title}
                  </span>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.color} text-amber-300 shadow-md border border-white/10`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white tracking-tight font-serif">
                    {card.value}
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    {card.unit}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{card.sub}</span>
                  <span className="text-emerald-300 font-semibold bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                    {card.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sambutan Kepala Sekolah & Visi Misi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sambutan Kepsek */}
        <div className="lg:col-span-5 glass backdrop-blur-xl bg-slate-900/70 text-white rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xl border border-emerald-400/40 shadow overflow-hidden shrink-0">
                {schoolInfo.logoUrl ? (
                  <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-cover" />
                ) : (
                  "☪"
                )}
              </div>
              <div>
                <h3 className="font-bold text-base font-serif text-amber-300">
                  {schoolInfo.kepalaSekolah}
                </h3>
                <p className="text-xs text-emerald-300">Kepala Sekolah SMP Islam Al Qomar</p>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed italic border-l-2 border-amber-400 pl-3 my-4">
              "Pendidikan Islam bukan sekadar mentransfer ilmu sains dan matematika, melainkan menanamkan benih iman, adab, serta kecintaan mendalam terhadap Al-Qur'an pada diri setiap santri murid."
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 text-xs text-slate-400 space-y-1">
            <p><strong className="text-slate-300">NIGY:</strong> {schoolInfo.nigyKepalaSekolah || schoolInfo.nipKepalaSekolah}</p>
            <p><strong className="text-slate-300">Tahun Ajaran:</strong> {schoolInfo.tahunAjaran} ({schoolInfo.semesterAktif})</p>
          </div>
        </div>

        {/* Visi & Misi */}
        <div className="lg:col-span-7 glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-400/30">
              Visi Utama Sekolah
            </span>
            <p className="mt-2 text-base font-semibold font-serif text-white border-l-4 border-emerald-400 pl-3 py-1">
              {schoolInfo.visi}
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Misi Pendidikan
            </span>
            <ul className="mt-2 space-y-2">
              {(schoolInfo?.misi || []).map((m, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* Alumni & Tracer Study Section */}
      <div className="glass backdrop-blur-xl bg-slate-900/70 rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Jejak Lulusan & Tracer Study Al-Qomar</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-white">
              Kiprah & Rekam Jejak Alumni Santri
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Melacak kesinambungan studi santriwan dan santriwati SMP Islam Al Qomar ke jenjang SMA, MA, SMK unggulan, dan Pondok Pesantren terpadu.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-emerald-950/80 border border-emerald-500/40 px-4 py-2 rounded-xl text-center shadow-md">
              <div className="text-xl sm:text-2xl font-black font-serif text-amber-300">{alumniStudents.length}</div>
              <div className="text-[10px] font-bold text-emerald-200 uppercase tracking-wide">Santri Lulus</div>
            </div>
            <div className="bg-teal-950/80 border border-teal-500/40 px-4 py-2 rounded-xl text-center shadow-md">
              <div className="text-xl sm:text-2xl font-black font-serif text-emerald-300">100%</div>
              <div className="text-[10px] font-bold text-teal-200 uppercase tracking-wide">Kelulusan</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-400 shrink-0">Angkatan:</span>
            <button
              onClick={() => setAlumniYearFilter('Semua')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                alumniYearFilter === 'Semua'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              Semua Angkatan ({alumniStudents.length})
            </button>
            {alumniYears.map(year => (
              <button
                key={year}
                onClick={() => setAlumniYearFilter(year)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  alumniYearFilter === year
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Angkatan {year}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={alumniSearch}
              onChange={(e) => setAlumniSearch(e.target.value)}
              placeholder="Cari nama santri / sekolah lanjutan..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Alumni Showcase Cards */}
        {alumniStudents.length === 0 ? (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/10 text-slate-300">
            <GraduationCap className="w-10 h-10 text-amber-400/60 mx-auto mb-2" />
            <p className="font-bold text-sm text-white">Pangkalan Data Alumni Sedang Dimutakhirkan</p>
            <p className="text-xs text-slate-400 mt-1">
              Data kelulusan santri dan jejak alumni akan tampil di sini secara otomatis saat santri kelas akhir diluluskan atau ditambahkan manual.
            </p>
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="p-6 text-center bg-white/5 rounded-xl border border-white/10 text-slate-300 text-xs">
            Tidak ditemukan alumni yang sesuai dengan kata kunci pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlumni.map((alumnus) => (
              <div
                key={alumnus.id}
                className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 rounded-2xl p-4.5 transition-all duration-200 flex flex-col justify-between group shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold text-sm shrink-0">
                        {alumnus.gender === 'P' ? '🧕' : '👳'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                          {alumnus.nama}
                        </h4>
                        <span className="text-[10px] text-emerald-300 font-mono">
                          Angkatan Lulus {alumnus.tahunLulus || '2024'}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
                      Alumni
                    </span>
                  </div>

                  {alumnus.sekolahLanjutan ? (
                    <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-xl p-2.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Melanjutkan Ke:
                      </div>
                      <div className="text-xs font-bold text-amber-200 mt-0.5 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="line-clamp-1">{alumnus.sekolahLanjutan}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/40 border border-white/5 rounded-xl p-2.5 text-[11px] text-slate-400 italic">
                      Studi Lanjutan: Dalam Proses Pendataan Tracer
                    </div>
                  )}

                  {alumnus.keteranganLulus && (
                    <p className="text-[11px] text-slate-300 line-clamp-2 italic border-l-2 border-emerald-400/50 pl-2">
                      "{alumnus.keteranganLulus}"
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    Terverifikasi Ijazah Resmi
                  </span>
                  <span>SMP Islam Al Qomar</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Privacy & Tracer Notice Footer */}
        <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Perlindungan Privasi:</strong> Data rahasia (NIK, NISN, nomor ijazah, alamat, & kontak wali) dilindungi dan tidak ditampilkan ke publik.
            </span>
          </div>
          <span className="text-amber-300 font-semibold font-mono text-[10px]">
            Ikatan Santri & Alumni Al-Qomar
          </span>
        </div>
      </div>

      {/* Sarpras Highlight Grid */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold font-serif text-white">
              Fasilitas & Sarana Prasarana Unggulan
            </h3>
            <p className="text-xs text-slate-400">Sarana pembelajaran modern terpadu dalam lingkungan Islami</p>
          </div>
          <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-400/30">
            {(sarpras || []).length} Fasilitas Master
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(sarpras || []).slice(0, 4).map((s) => (
            <div key={s.id} className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-semibold border border-emerald-400/30">
                  {s.kode}
                </span>
                <span className="text-slate-300 font-medium">{s.jumlah} {s.satuan}</span>
              </div>
              <h4 className="font-bold text-sm text-white line-clamp-1">{s.namaBarangRuang}</h4>
              <p className="text-xs text-slate-300 line-clamp-2">{s.keterangan}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Location Footer Box */}
      <div className="glass backdrop-blur-xl bg-slate-900/80 text-white rounded-2xl p-6 border border-white/10 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-1">Alamat Sekolah</span>
            <p className="text-slate-200 leading-relaxed">{schoolInfo.alamat}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-1">Kontak & Telepon</span>
            <p className="text-slate-200">Telepon: {schoolInfo.telepon}</p>
            <p className="text-slate-200 mt-1">Email: {schoolInfo.email}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-1">Website Resmi</span>
            <p className="text-slate-200">{schoolInfo.website}</p>
            <p className="text-emerald-400 mt-1 font-mono font-semibold">DAPODIK ONLINE v2026.a</p>
          </div>
        </div>
      </div>

    </div>
  );
};
