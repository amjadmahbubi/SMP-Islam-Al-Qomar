import React, { useMemo } from 'react';
import { SchoolInfo, Student, Teacher, SarprasItem, ScheduleItem, AttendanceRecord, SubjectGradeRecord } from '../../types';
import { getAllClasses } from '../../data/constants';
import { Users, GraduationCap, Building2, Award, BookOpen, HeartHandshake, CheckCircle, MapPin, Phone, Mail, Globe, ShieldCheck } from 'lucide-react';

interface PublicStatistikProps {
  schoolInfo: SchoolInfo;
  students: Student[];
  teachers: Teacher[];
  sarpras: SarprasItem[];
  schedules?: ScheduleItem[];
  attendance?: AttendanceRecord[];
  grades?: SubjectGradeRecord[];
}

export const PublicStatistik: React.FC<PublicStatistikProps> = ({
  schoolInfo,
  students,
  teachers,
  sarpras,
  schedules = []
}) => {
  const activeStudents = students.filter(s => s.status === 'Aktif');

  const dynamicClasses = useMemo(
    () => getAllClasses(students, schedules, teachers),
    [students, schedules, teachers]
  );
  const formatClassLabel = (c: string) => (c.toLowerCase().startsWith('kelas') ? c : `Kelas ${c}`);

  const rombelSubText = dynamicClasses.length > 0 
    ? dynamicClasses.map(c => formatClassLabel(c)).join(', ') 
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
      title: 'Status Akreditasi BAN-S/M',
      value: schoolInfo.akreditasi,
      unit: 'Nilai 96',
      sub: 'Surat Keputusan BAN-S/M',
      icon: Award,
      color: 'from-emerald-900 to-emerald-800',
      badge: 'Sangat Baik'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Islamic Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white p-6 sm:p-10 shadow-xl overflow-hidden border border-emerald-800/80">
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
              Banyuwangi, Jawa Timur
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-serif text-white">
            Ringkasan Statistik Sekolah
          </h2>
          <span className="text-xs text-slate-400 font-mono">Realtime DAPODIK</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
