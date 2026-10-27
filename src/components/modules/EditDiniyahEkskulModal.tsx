import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentDiniyahReport, StudentEkskul, SubjectGradeRecord, AttendanceRecord } from '../../types';
import {
  X,
  Save,
  BookOpen,
  Heart,
  Compass,
  Trophy,
  Plus,
  Trash2,
  Sparkles,
  Users,
  CheckCircle2,
  HelpCircle,
  Copy,
  Wand2,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export interface BatchApplyScope {
  applyKokurikuler: boolean;
  applyEkskul: boolean;
  applyDiniyah: boolean;
  applyCatatan: boolean;
}

interface EditDiniyahEkskulModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentStudentId: string;
  onSelectStudentId: (id: string) => void;
  onSaveStudentDiniyah: (
    studentId: string,
    diniyah: StudentDiniyahReport,
    applyToAllInClass?: boolean,
    batchScope?: BatchApplyScope
  ) => void;
  grades?: SubjectGradeRecord[];
  attendance?: AttendanceRecord[];
}

const DEFAULT_TAHFIDZ_PRESETS = [
  "Hafal Juz 30 (Lancar & Mutqin)",
  "Hafal Juz 30 & Surah Al-Mulk",
  "Menuntaskan Juz 29 & Juz 30 Mutqin",
  "Ziyadah Juz 1 & Penguatan Juz 30",
  "Tahsin Metode Ummi Jilid 5 & Ziyadah Juz 30",
  "Hafal Surah-Surat Pilihan (Al-Waqi'ah, Al-Mulk, Ar-Rahman)"
];

const DEFAULT_ADAB_PRESETS = [
  "Istiqomah, Santun & Disiplin",
  "Berakhlakul karimah, santun kepada asatidz & rukun dengan teman",
  "Tertib berpakaian rapi, tawadhu', dan menjaga tutur kata",
  "Menunjukkan kepedulian tinggi, amanah, dan aktif membantu sesama santri",
  "Disiplin dalam peraturan madrasah dan antusias dalam pembelajaran"
];

const DEFAULT_SHALAT_PRESETS = [
  "Rutin Shalat Dhuha & Dzuhur Berjamaah di Musholla",
  "Tertib Shalat Berjamaah tepat waktu & istiqomah dzikir ba'da shalat",
  "Disiplin dalam pembiasaan Shalat Sunnah Rawatib dan Shalat Fardhu",
  "Menjaga shaf pertama, tertib wudhu, dan khusyuk dalam ibadah"
];

const DEFAULT_KOKURIKULER_PRESETS = [
  {
    tema: "Bangunlah Jiwa dan Raganya",
    deskripsi: "Mengikuti Projek Penguatan Profil Pelajar Pancasila (P5) dengan tema 'Bangunlah Jiwa dan Raganya' serta pembiasaan karakter Diniyah Islamiyyah: Tahfidz Al-Qur'an, Adab & Akhlaqul Karimah, serta Kedisiplinan Shalat Berjamaah."
  },
  {
    tema: "Kearifan Lokal",
    deskripsi: "Mengikuti Projek P5 bertema 'Kearifan Lokal'. Mampu mengeksplorasi dan melestarikan tradisi keilmuan pesantren dan seni budaya Islam nusantara dengan penuh kebanggaan dan nalar kritis."
  },
  {
    tema: "Gaya Hidup Berkelanjutan",
    deskripsi: "Mengikuti Projek P5 bertema 'Gaya Hidup Berkelanjutan'. Berperan aktif dalam program Madrasah Hijau (Eco-Pesantren), kebersihan lingkungan, pemilahan sampah, dan hemat energi."
  },
  {
    tema: "Kewirausahaan Santri",
    deskripsi: "Mengikuti Projek P5 bertema 'Kewirausahaan'. Menunjukkan kreativitas, kerja sama tim, kemandirian, dan kejujuran dalam merancang produk karya santri pada pameran karya madrasah."
  },
  {
    tema: "Bhinneka Tunggal Ika",
    deskripsi: "Mengikuti Projek P5 bertema 'Bhinneka Tunggal Ika'. Memahami nilai-nilai toleransi, ukhuwah islamiyyah, dan persaudaraan kebangsaan dalam kehidupan madrasah yang harmonis."
  }
];

const COMMON_EKSKUL_SUGGESTIONS = [
  { nama: 'Praja Muda Karana (Pramuka)', predikat: 'A (Sangat Baik)', keterangan: 'Aktif, disiplin, dan terampil dalam kepramukaan serta pionering.' },
  { nama: 'Seni Hadrah & Banjari Al-Qomar', predikat: 'A (Sangat Baik)', keterangan: 'Terampil memainkan ketukan terbang rebana dan melantunkan shalawat merdu.' },
  { nama: 'Palang Merah Remaja (PMR)', predikat: 'B (Baik)', keterangan: 'Tanggap dalam pertolongan pertama dan berjiwa sosial kemanusiaan tinggi.' },
  { nama: 'Seni Kaligrafi Islam (Khat)', predikat: 'B (Baik)', keterangan: 'Mampu menggoreskan kaidah khat Naskhi dan Tsuluts dengan rapi dan estetis.' },
  { nama: 'Futsal & Olahraga Santri', predikat: 'A (Sangat Baik)', keterangan: 'Memiliki kebugaran jasmani prima dan menjunjung sportivitas tim.' },
  { nama: 'Muhadharah / Khitobah (Pidato 3 Bahasa)', predikat: 'A (Sangat Baik)', keterangan: 'Percaya diri tampil berorasi dalam Bahasa Arab dan Indonesia di hadapan publik.' },
  { nama: 'Robotika & IT Multimedia', predikat: 'B (Baik)', keterangan: 'Kreatif dalam pengenalan dasar robotika dan media presentasi digital.' }
];

export const getAutomaticEkskulDescription = (namaEkskul: string, predikat: string): string => {
  const norm = (namaEkskul || '').toLowerCase().trim();
  const isA = predikat.startsWith('A') || predikat.toLowerCase().includes('sangat');
  const isC = predikat.startsWith('C') || predikat.toLowerCase().includes('cukup');

  if (norm.includes('pramuka')) {
    if (isA) return "Sangat aktif, berdedikasi tinggi, dan terampil dalam kepramukaan, pionering tali-temali, serta baris-berbaris.";
    if (isC) return "Cukup aktif mengikuti latihan kepramukaan, perlu meningkatkan kedisiplinan dan keikutsertaan dalam kegiatan lapangan.";
    return "Aktif, disiplin, dan terampil dalam kepramukaan dasar serta menunjukkan jiwa kepanduan yang baik.";
  }
  if (norm.includes('hadrah') || norm.includes('banjari')) {
    if (isA) return "Sangat mahir menguasai variasi pukulan terbang rebana dan vokal lantunan shalawat dengan penuh penghayatan.";
    if (isC) return "Cukup mampu mengikuti ritme hadrah dasar, perlu terus melatih tempo pukulan terbang rebana.";
    return "Terampil memainkan ketukan terbang rebana dan aktif melantunkan shalawat merdu dengan baik.";
  }
  if (norm.includes('kaligrafi') || norm.includes('khat')) {
    if (isA) return "Sangat terampil dan teliti dalam menggoreskan kaidah khat Naskhi dan Tsuluts dengan estetika dan kebersihan tinggi.";
    if (isC) return "Cukup mengenal bentuk huruf berkaidah khat, perlu lebih teliti dalam proporsi tebal-tipis goresan pena kalam.";
    return "Mampu menulis kaidah khat dasar dengan rapi, tertib, dan menunjukkan perkembangan goresan yang baik.";
  }
  if (norm.includes('futsal') || norm.includes('sepak') || norm.includes('olahraga')) {
    if (isA) return "Memiliki kebugaran jasmani prima, teknik mengolah bola sangat baik, dan menunjukkan jiwa kepemimpinan serta sportivitas tim.";
    if (isC) return "Cukup berpartisipasi dalam latihan fisik, perlu meningkatkan daya tahan stamina dan kerja sama dalam tim.";
    return "Memiliki kebugaran jasmani yang baik, aktif dalam permainan tim, dan menjunjung tinggi sportivitas olahraga santri.";
  }
  if (norm.includes('pmr') || norm.includes('palang merah')) {
    if (isA) return "Sangat tanggap, terampil dalam teknik pertolongan pertama (P3K), dan memiliki empati kemanusiaan sosial yang tinggi.";
    if (isC) return "Cukup memahami materi dasar P3K, diharapkan lebih aktif dalam simulasi praktik penanganan medis darurat.";
    return "Tanggap dalam pertolongan pertama dasar dan berjiwa sosial kemanusiaan tinggi dalam setiap kegiatan bakti madrasah.";
  }
  if (norm.includes('khitobah') || norm.includes('muhadharah') || norm.includes('pidato')) {
    if (isA) return "Sangat percaya diri tampil berorasi, artikulasi jelas, dan intonasi memukau dalam Bahasa Arab dan Indonesia di hadapan publik.";
    if (isC) return "Cukup berani tampil berbicara di depan forum, perlu meningkatkan kelancaran pelafalan dan penguasaan naskah pidato.";
    return "Percaya diri tampil berorasi dalam pidato multi-bahasa dan mampu menyampaikan gagasan dengan santun dan runtut.";
  }
  if (norm.includes('robotika') || norm.includes('it') || norm.includes('komputer')) {
    if (isA) return "Sangat kreatif dan terampil dalam logika pemrograman dasar, perakitan mikrokontroler, serta presentasi konten digital.";
    if (isC) return "Cukup tertarik mengenal modul teknologi, perlu bimbingan lanjutan dalam pengoperasian perangkat teknis.";
    return "Kreatif dalam pengenalan dasar robotika dan terampil menyelesaikan proyek modul digital dengan baik.";
  }
  if (norm.includes('tahfidz') || norm.includes('qur')) {
    if (isA) return "Sangat tekun dan istiqomah dalam ziyadah maupun muroja'ah hafalan Al-Qur'an dengan kaidah tajwid dan makhraj yang mutqin.";
    if (isC) return "Cukup lancar membaca ayat Al-Qur'an, perlu menambah alokasi waktu muroja'ah mandiri agar hafalan semakin kokoh.";
    return "Tekun menambah hafalan dan istiqomah dalam muroja'ah harian dengan tajwid yang baik.";
  }

  // Generic fallback
  const label = namaEkskul ? `kegiatan ${namaEkskul}` : 'kegiatan ekstrakurikuler';
  if (isA) return `Menunjukkan antusiasme luar biasa, penguasaan keterampilan tingkat mahir, dan disiplin tinggi dalam ${label}.`;
  if (isC) return `Cukup berpartisipasi dalam ${label}, diharapkan lebih aktif dan konsisten dalam meningkatkan kehadiran serta keterampilannya.`;
  return `Aktif mengikuti ${label} secara konsisten dan menunjukkan perkembangan keterampilan yang baik.`;
};

const DEFAULT_CATATAN_PRESETS = [
  {
    label: "Prestasi Tinggi & Teladan",
    generate: (sName: string, kelas: string, tahfidz: string) => 
      `Alhamdulillah, Ananda ${sName} menunjukkan prestasi akademik dan keteladanan akhlak yang sangat membanggakan di kelas ${kelas}. Pertahankan semangat belajar yang tinggi, tingkatkan kemutqinan hafalan Al-Qur'an (${tahfidz}), dan teruslah menjadi inspirasi kebaikan bagi sesama teman.`
  },
  {
    label: "Baik, Santun & Konsisten",
    generate: (sName: string) => 
      `Ananda ${sName} memiliki sikap santun, tekun, dan menunjukkan perkembangan belajar yang positif selama semester ini. Terus tingkatkan rasa percaya diri, ketelitian dalam memahami materi, dan pertahankan kedisiplinan ibadah.`
  },
  {
    label: "Perlu Penguatan Fokus Belajar",
    generate: (sName: string) => 
      `Ananda ${sName} adalah anak yang berbakat dan santun. Diperlukan peningkatan konsentrasi di kelas dan alokasi waktu belajar mandiri di rumah untuk memperdalam mata pelajaran yang dirasa cukup menantang.`
  },
  {
    label: "Perhatian Khusus Kehadiran",
    generate: (sName: string) => 
      `Ananda ${sName} memiliki potensi belajar yang baik. Mohon kerja sama dan motivasi dari orang tua untuk lebih menjaga kedisiplinan kehadiran di madrasah serta kesehatan fisik agar ananda tidak tertinggal materi pelajaran.`
  },
  {
    label: "Penguatan Ibadah & Tahfidz",
    generate: (sName: string) => 
      `Ananda ${sName} menunjukkan kesungguhan yang baik. Tingkatkan kontinuitas muroja'ah hafalan Al-Qur'an di rumah dan pembiasaan shalat berjamaah tepat waktu sebagai pondasi keberkahan ilmu dan budi pekerti.`
  }
];

export const EditDiniyahEkskulModal: React.FC<EditDiniyahEkskulModalProps> = ({
  isOpen,
  onClose,
  students,
  currentStudentId,
  onSelectStudentId,
  onSaveStudentDiniyah,
  grades,
  attendance
}) => {
  const student = students.find(s => s.id === currentStudentId) || students[0];

  const [tahfidz, setTahfidz] = useState<string>('');
  const [adab, setAdab] = useState<string>('');
  const [shalat, setShalat] = useState<string>('');
  const [kokurikuler, setKokurikuler] = useState<string>('');
  const [catatanWaliKelas, setCatatanWaliKelas] = useState<string>('');
  const [tanggapanOrtu, setTanggapanOrtu] = useState<string>('');
  const [ekskulList, setEkskulList] = useState<StudentEkskul[]>([]);
  const [applyToClass, setApplyToClass] = useState<boolean>(false);
  const [applyKokurikuler, setApplyKokurikuler] = useState<boolean>(true);
  const [applyEkskul, setApplyEkskul] = useState<boolean>(true);
  const [applyDiniyah, setApplyDiniyah] = useState<boolean>(false);
  const [applyCatatan, setApplyCatatan] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize from student data
  useEffect(() => {
    if (student) {
      const rep = student.diniyahReport;
      const defaultTahfidz = rep?.tahfidz || "Hafal Juz 30 (Lancar & Mutqin)";
      const defaultAdab = rep?.adab || "Istiqomah, Santun & Disiplin";
      const defaultShalat = rep?.shalat || "Rutin Shalat Dhuha & Dzuhur Berjamaah";
      
      setTahfidz(defaultTahfidz);
      setAdab(defaultAdab);
      setShalat(defaultShalat);
      setKokurikuler(
        rep?.kokurikuler ||
        `Mengikuti Projek Penguatan Profil Pelajar Pancasila (P5) dengan tema 'Bangunlah Jiwa dan Raganya' serta pembiasaan karakter Diniyah Islamiyyah: Tahfidz Al-Qur'an (${defaultTahfidz}), Adab & Akhlaqul Karimah (${defaultAdab}), dan Kedisiplinan Shalat (${defaultShalat}).`
      );
      setCatatanWaliKelas(rep?.catatanWaliKelas || "Ananda menunjukkan kesungguhan belajar yang baik, pertahankan kedisiplinan dan terus istiqomah dalam ibadah serta hafalan Al-Qur'an.");
      setTanggapanOrtu(rep?.tanggapanOrtu || "");
      
      if (rep?.ekskul && rep.ekskul.length > 0) {
        setEkskulList([...rep.ekskul]);
      } else {
        setEkskulList([
          {
            nama: 'Praja Muda Karana (Pramuka)',
            predikat: 'A (Sangat Baik)',
            keterangan: 'Aktif, disiplin, dan terampil dalam kepramukaan serta pionering.'
          }
        ]);
      }
      setApplyToClass(false);
    }
  }, [student?.id, isOpen]);

  if (!isOpen || !student) return null;

  // Calculate real student metrics from grades & attendance
  const studentMetrics = useMemo(() => {
    if (!student) return { avgScore: 82, attendanceStats: { hadir: 0, izin: 0, sakit: 0, alpa: 0 }, topSubjects: [], weakSubjects: [] };

    let hadir = 0, izin = 0, sakit = 0, alpa = 0;
    if (attendance) {
      attendance.forEach(rec => {
        const entry = rec.entries.find(e => e.studentId === student.id);
        if (entry) {
          if (entry.status === 'H') hadir++;
          else if (entry.status === 'I') izin++;
          else if (entry.status === 'S') sakit++;
          else if (entry.status === 'A') alpa++;
        }
      });
    }

    const subjectScores: { mapel: string; score: number }[] = [];
    if (grades) {
      grades.forEach(g => {
        const entry = g.studentGrades.find(e => e.studentId === student.id);
        if (entry) {
          const avgF = Math.round((entry.nilaiFormatif1 + entry.nilaiFormatif2) / 2);
          const akhir = Math.round((avgF * 0.4) + (entry.nilaiPTS * 0.3) + (entry.nilaiPAS * 0.3));
          if (akhir > 0) {
            subjectScores.push({ mapel: g.mapel, score: akhir });
          }
        }
      });
    }

    const avgScore = subjectScores.length > 0 
      ? Math.round(subjectScores.reduce((acc, curr) => acc + curr.score, 0) / subjectScores.length)
      : 80;

    subjectScores.sort((a, b) => b.score - a.score);
    const topSubjects = subjectScores.slice(0, 2).filter(s => s.score >= 85).map(s => s.mapel);
    const weakSubjects = subjectScores.filter(s => s.score < 75).map(s => s.mapel);

    return {
      avgScore,
      attendanceStats: { hadir, izin, sakit, alpa },
      topSubjects,
      weakSubjects
    };
  }, [student?.id, grades, attendance]);

  const handleGenerateAutomaticCatatan = () => {
    if (!student) return;
    const { avgScore, attendanceStats, topSubjects, weakSubjects } = studentMetrics;
    const sName = student.nama;
    const hasAbsence = attendanceStats.alpa > 0 || (attendanceStats.sakit + attendanceStats.izin > 5);

    let generated = '';
    if (avgScore >= 85 && !hasAbsence) {
      const sub = topSubjects.length > 0 ? ` terutama pada mata pelajaran ${topSubjects.join(' dan ')}` : '';
      generated = `Alhamdulillah, Ananda ${sName} menunjukkan prestasi akademik yang sangat membanggakan di kelas ${student.kelas}${sub}. Ananda sangat santun, tertib, dan aktif dalam pembelajaran. Pertahankan semangat belajar yang tinggi dan istiqomah dalam ibadah serta hafalan Al-Qur'an (${tahfidz}).`;
    } else if (avgScore >= 85 && hasAbsence) {
      generated = `Ananda ${sName} memiliki potensi dan daya tangkap akademik yang luar biasa. Mohon bantuan orang tua untuk terus menjaga kebugaran dan memotivasi kedisiplinan kehadiran di madrasah agar prestasinya semakin optimal.`;
    } else if (avgScore >= 75 && !hasAbsence) {
      generated = `Ananda ${sName} memiliki kesungguhan belajar yang baik, berakhlak mulia, dan konsisten dalam mematuhi tata tertib madrasah. Tingkatkan ketelitian dalam menyelesaikan tugas dan terus kembangkan potensi diri agar capaian berikutnya semakin meningkat.`;
    } else if (hasAbsence) {
      generated = `Ananda ${sName} memiliki potensi belajar yang baik dan berbakat. Diperlukan perhatian khusus terkait kedisiplinan kehadiran serta pendampingan belajar mandiri di rumah agar ananda tidak tertinggal materi pembelajaran madrasah.`;
    } else if (weakSubjects.length > 0) {
      generated = `Ananda ${sName} menunjukkan sikap yang santun dan antusiasme belajar yang positif. Diperlukan penguatan fokus dan alokasi waktu belajar mandiri di rumah, khususnya untuk materi ${weakSubjects.join(', ')}, serta istiqomah dalam pembiasaan shalat dan muroja'ah.`;
    } else {
      generated = `Ananda ${sName} menunjukkan perkembangan yang baik dalam sikap dan kemandirian. Tingkatkan ketekunan dalam belajar dan teruslah bersemangat meraih cita-cita mulia dengan iringan doa dan ibadah.`;
    }

    setCatatanWaliKelas(generated);
  };

  const handleAddEkskul = (preset?: typeof COMMON_EKSKUL_SUGGESTIONS[0]) => {
    if (preset) {
      setEkskulList(prev => [...prev, { ...preset }]);
    } else {
      const defaultPred = 'A (Sangat Baik)';
      const defaultName = 'Seni Hadrah & Banjari';
      setEkskulList(prev => [
        ...prev,
        {
          nama: defaultName,
          predikat: defaultPred,
          keterangan: getAutomaticEkskulDescription(defaultName, defaultPred)
        }
      ]);
    }
  };

  const handleRemoveEkskul = (index: number) => {
    setEkskulList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEkskul = (index: number, field: keyof StudentEkskul, value: string) => {
    setEkskulList(prev => {
      const updated = [...prev];
      const currentItem = updated[index];
      if (field === 'predikat') {
        const autoDesc = getAutomaticEkskulDescription(currentItem.nama, value);
        updated[index] = { ...currentItem, predikat: value, keterangan: autoDesc };
      } else if (field === 'nama') {
        const autoDesc = getAutomaticEkskulDescription(value, currentItem.predikat);
        updated[index] = { ...currentItem, nama: value, keterangan: autoDesc };
      } else {
        updated[index] = { ...currentItem, [field]: value };
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const report: StudentDiniyahReport = {
      tahfidz: tahfidz.trim() || "Hafal Juz 30 (Lancar & Mutqin)",
      adab: adab.trim() || "Istiqomah, Santun & Disiplin",
      shalat: shalat.trim() || "Rutin Shalat Dhuha & Dzuhur Berjamaah",
      kokurikuler: kokurikuler.trim(),
      catatanWaliKelas: catatanWaliKelas.trim(),
      tanggapanOrtu: tanggapanOrtu.trim(),
      ekskul: ekskulList.filter(ek => ek.nama.trim().length > 0)
    };

    onSaveStudentDiniyah(student.id, report, applyToClass, {
      applyKokurikuler,
      applyEkskul,
      applyDiniyah,
      applyCatatan
    });
    setToastMessage(`Format Rapor Kurikulum Merdeka untuk ${student.nama} berhasil disimpan!`);
    setTimeout(() => {
      setToastMessage(null);
      onClose();
    }, 900);
  };

  // Class peers for quick navigation
  const classPeers = students.filter(s => s.kelas === student.kelas);
  const currentIndex = classPeers.findIndex(s => s.id === student.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl max-w-4xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
                <span>Sesuaikan Capaian Kokurikuler (P5), Diniyah &amp; Ekstrakurikuler</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-300 font-sans border border-amber-400/30">
                  Kelas {student.kelas}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Sesuaikan narasi Kokurikuler (P5), Tahfidz, Adab, Shalat, Ekstrakurikuler, dan Catatan Rapor santri
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Selector Bar & Navigation */}
        <div className="px-5 py-3 bg-slate-950/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="font-bold text-slate-300 shrink-0">Pilih Santri:</span>
            <select
              value={student.id}
              onChange={(e) => onSelectStudentId(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
            >
              {classPeers.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  {idx + 1}. {s.nama} ({s.nisn})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400">
            <button
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => {
                if (currentIndex > 0) onSelectStudentId(classPeers[currentIndex - 1].id);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              ◀ Santri Sebelumnya
            </button>
            <span className="text-[11px] font-mono px-1">
              {currentIndex + 1} / {classPeers.length}
            </span>
            <button
              type="button"
              disabled={currentIndex >= classPeers.length - 1}
              onClick={() => {
                if (currentIndex < classPeers.length - 1) onSelectStudentId(classPeers[currentIndex + 1].id);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              Santri Berikutnya ▶
            </button>
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Section B: Capaian Diniyah Islamiyyah */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="text-sm font-bold font-serif text-emerald-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>B. Capaian Character &amp; Diniyah Islamiyyah</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Poin penilaian di Rapor Digital SMP Islam Al Qomar
              </span>
            </div>

            {/* 1. Tahfidz Al-Qur'an */}
            <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-white/5">
              <label className="block text-xs font-bold text-slate-200">
                • Tahfidz Al-Qur'an (Target Capaian &amp; Hafalan Santri):
              </label>
              <input
                type="text"
                value={tahfidz}
                onChange={(e) => setTahfidz(e.target.value)}
                placeholder="Contoh: Hafal Juz 30 (Lancar & Mutqin) atau Surah Al-Mulk"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Pilih Cepat Preset:</span>
                {DEFAULT_TAHFIDZ_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTahfidz(p)}
                    className="text-[10px] bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 px-2 py-0.5 rounded border border-white/5 transition-colors"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Adab & Akhlaq */}
            <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-white/5">
              <label className="block text-xs font-bold text-slate-200">
                • Adab &amp; Akhlaqul Karimah:
              </label>
              <input
                type="text"
                value={adab}
                onChange={(e) => setAdab(e.target.value)}
                placeholder="Contoh: Istiqomah, Santun & Disiplin"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Pilih Cepat Preset:</span>
                {DEFAULT_ADAB_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAdab(p)}
                    className="text-[10px] bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 px-2 py-0.5 rounded border border-white/5 transition-colors"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Kedisiplinan Shalat */}
            <div className="space-y-2 bg-slate-950/50 p-4 rounded-xl border border-white/5">
              <label className="block text-xs font-bold text-slate-200">
                • Kedisiplinan Shalat &amp; Ibadah Amaliyah:
              </label>
              <input
                type="text"
                value={shalat}
                onChange={(e) => setShalat(e.target.value)}
                placeholder="Contoh: Rutin Shalat Dhuha & Dzuhur Berjamaah di Musholla"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold">Pilih Cepat Preset:</span>
                {DEFAULT_SHALAT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setShalat(p)}
                    className="text-[10px] bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 px-2 py-0.5 rounded border border-white/5 transition-colors"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Kokurikuler (P5 & Diniyah Islamiyyah) */}
            <div className="space-y-3 bg-gradient-to-r from-emerald-950/40 to-slate-950/60 p-4 rounded-xl border border-emerald-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    P5
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-300">
                      • Narasi Kokurikuler (Projek P5 &amp; Karakter Diniyah):
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Tampil di kotak "Kokurikuler" pada lembar Rapor Kurikulum Merdeka
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setKokurikuler(
                      `Mengikuti Projek Penguatan Profil Pelajar Pancasila (P5) dengan tema 'Bangunlah Jiwa dan Raganya' serta pembiasaan karakter Diniyah Islamiyyah: Tahfidz Al-Qur'an (${tahfidz}), Adab & Akhlaqul Karimah (${adab}), dan Kedisiplinan Shalat (${shalat}).`
                    );
                  }}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Auto-Sinkronkan dengan Hafalan &amp; Adab di atas</span>
                </button>
              </div>

              {/* Tema P5 Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300">
                    Pilih Tema Projek P5 Cepat:
                  </span>
                  <span className="text-[10px] text-slate-400 italic">
                    (Klik salah satu untuk mengisi narasi otomatis)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_KOKURIKULER_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setKokurikuler(p.deskripsi)}
                      className="text-[10px] bg-slate-800 hover:bg-emerald-900 hover:text-emerald-200 text-slate-300 px-2.5 py-1 rounded-lg border border-white/10 transition-all font-medium cursor-pointer"
                      title={p.deskripsi}
                    >
                      ★ {p.tema}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={kokurikuler}
                onChange={(e) => setKokurikuler(e.target.value)}
                placeholder="Deskripsi pencapaian projek profil pelajar pancasila dan pembiasaan karakter islami santri..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Catatan Khusus Wali Kelas */}
            <div className="space-y-2.5 bg-slate-950/50 p-4 rounded-xl border border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold text-slate-200">
                      • Catatan Khusus Wali Kelas:
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                      Rata-rata Nilai: {studentMetrics.avgScore}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Kehadiran: {studentMetrics.attendanceStats.hadir} Hadir | {studentMetrics.attendanceStats.sakit} Sakit | {studentMetrics.attendanceStats.izin} Izin | {studentMetrics.attendanceStats.alpa} Alpa
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAutomaticCatatan}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg shadow transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  title="Susun narasi catatan wali kelas otomatis berdasarkan rata-rata nilai, kehadiran, dan target hafalan santri ini"
                >
                  <Wand2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>⚡ Buat Catatan Otomatis Sesuai Nilai Siswa</span>
                </button>
              </div>

              {/* Preset Pilihan Cepat Catatan */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Pilih Preset Catatan Berdasarkan Karakter Murid:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_CATATAN_PRESETS.map((cp, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => setCatatanWaliKelas(cp.generate(student.nama, student.kelas, tahfidz))}
                      className="text-[10px] bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 px-2 py-0.5 rounded border border-white/5 transition-colors cursor-pointer"
                    >
                      + {cp.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                value={catatanWaliKelas}
                onChange={(e) => setCatatanWaliKelas(e.target.value)}
                placeholder="Tulis pesan penyemangat atau catatan kemajuan santri untuk wali murid..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Tanggapan Orang Tua (Opsional) */}
            <div className="space-y-1.5 bg-slate-950/50 p-4 rounded-xl border border-white/5">
              <label className="block text-xs font-bold text-slate-200">
                • Tanggapan Orang Tua / Wali Murid (Opsional / Ruang Cetak Manual):
              </label>
              <textarea
                rows={2}
                value={tanggapanOrtu}
                onChange={(e) => setTanggapanOrtu(e.target.value)}
                placeholder="Biarkan kosong jika ingin diisi tulis tangan oleh orang tua santri saat rapor dikembalikan..."
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Section C: Pengembangan Diri & Ekstrakurikuler */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div>
                <h4 className="text-sm font-bold font-serif text-amber-300 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>C. Pengembangan Diri &amp; Ekstrakurikuler</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Kegiatan ekstrakurikuler wajib (Pramuka) dan pilihan santri beserta narasi deskripsi capaiannya
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddEkskul()}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ekskul Lain</span>
              </button>
            </div>

            {/* Info Banner Kurikulum Merdeka */}
            <div className="bg-amber-500/10 border border-amber-400/20 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Format Resmi Kurikulum Merdeka (Kemendikbudristek):</strong>
                <p className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                  Memilih <strong>Predikat (A / B / C)</strong> di bawah ini otomatis merangkai kalimat <strong>Keterangan Deskripsi</strong> secara instan. Pada lembar rapor fisik yang dicetak, label predikat disembunyikan dan hanya nama ekstrakurikuler serta narasi deskripsinya yang dicetak resmi sesuai regulasi.
                </p>
              </div>
            </div>

            {/* Quick Add Preset Buttons */}
            <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5 space-y-1.5">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Tambah Cepat Pilihan Ekstrakurikuler Populer SMP Islam Al Qomar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_EKSKUL_SUGGESTIONS.map((sug, sIdx) => {
                  const isAlreadyAdded = ekskulList.some(
                    e => e.nama.toLowerCase().includes(sug.nama.split(' ')[0].toLowerCase())
                  );
                  return (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => handleAddEkskul(sug)}
                      disabled={isAlreadyAdded}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                        isAlreadyAdded
                          ? 'bg-slate-800/40 text-slate-500 border-transparent cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-amber-950/70 hover:text-amber-300 text-slate-200 border-white/10'
                      }`}
                    >
                      + {sug.nama}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ekskul List Inputs */}
            {ekskulList.length > 0 ? (
              <div className="space-y-3">
                {ekskulList.map((ek, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-white/10 space-y-2.5 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        Ekstrakurikuler #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEkskul(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Hapus ekstrakurikuler ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                      <div className="md:col-span-8 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Nama Kegiatan Ekstrakurikuler:
                        </label>
                        <input
                          type="text"
                          value={ek.nama}
                          onChange={(e) => handleUpdateEkskul(idx, 'nama', e.target.value)}
                          placeholder="e.g. Praja Muda Karana (Pramuka)"
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                        />
                      </div>

                      <div className="md:col-span-4 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-300">
                          Predikat Capaian:
                        </label>
                        <select
                          value={ek.predikat}
                          onChange={(e) => handleUpdateEkskul(idx, 'predikat', e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-bold"
                        >
                          <option value="A (Sangat Baik)">A (Sangat Baik)</option>
                          <option value="B (Baik)">B (Baik)</option>
                          <option value="C (Cukup)">C (Cukup)</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                        </select>
                      </div>

                      <div className="md:col-span-12 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-semibold text-slate-300">
                            Keterangan / Deskripsi Capaian (Dicetak di Lembar Rapor):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const autoDesc = getAutomaticEkskulDescription(ek.nama, ek.predikat);
                              handleUpdateEkskul(idx, 'keterangan', autoDesc);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1 cursor-pointer"
                            title="Regenerasi kalimat deskripsi sesuai nama & predikat di atas"
                          >
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Auto-Generate Ulang Sesuai Predikat</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          value={ek.keterangan}
                          onChange={(e) => handleUpdateEkskul(idx, 'keterangan', e.target.value)}
                          placeholder="Deskripsi keaktifan dan keterampilan yang dicapai santri..."
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                Belum ada kegiatan ekstrakurikuler yang ditambahkan. Klik tombol "Tambah Ekskul" atau pilih salah satu rekomendasi di atas.
              </div>
            )}
          </div>

          {/* Batch Option */}
          <div className="p-4 bg-emerald-500/10 border border-emerald-400/20 rounded-xl space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="applyToClass"
                checked={applyToClass}
                onChange={(e) => setApplyToClass(e.target.checked)}
                className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="applyToClass" className="text-xs text-slate-200 cursor-pointer">
                <strong className="text-emerald-300 font-bold">Terapkan juga ke seluruh santri di Kelas {student.kelas}?</strong>
                <span className="block text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  Otomatis menduplikasi tema Projek P5 dan kegiatan Ekstrakurikuler ke seluruh santri di rombel ini secara serentak.
                </span>
              </label>
            </div>

            {applyToClass && (
              <div className="ml-7 pt-2.5 border-t border-emerald-400/20 space-y-2 animate-in fade-in duration-200">
                <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pilih komponen yang disalin serentak ke seluruh kelas:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Kokurikuler P5 (Checked by default) */}
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-emerald-500/30 cursor-pointer hover:bg-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={applyKokurikuler}
                      onChange={(e) => setApplyKokurikuler(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                    />
                    <span className="text-slate-200 font-medium">Tema Projek P5 / Kokurikuler</span>
                  </label>

                  {/* Ekstrakurikuler (Checked by default) */}
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-emerald-500/30 cursor-pointer hover:bg-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={applyEkskul}
                      onChange={(e) => setApplyEkskul(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                    />
                    <span className="text-slate-200 font-medium">Daftar Ekstrakurikuler (Pramuka, dll)</span>
                  </label>

                  {/* Target Diniyah Tahfidz (Unchecked by default to protect individual Quran achievements) */}
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-white/10 cursor-pointer hover:bg-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={applyDiniyah}
                      onChange={(e) => setApplyDiniyah(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <div className="leading-tight">
                      <span className="text-slate-200 font-medium block">Target Diniyah (Tahfidz/Adab/Shalat)</span>
                      <span className="text-[10px] text-amber-300/80">Biarkan mati agar hafalan riil santri tidak tertimpa</span>
                    </div>
                  </label>

                  {/* Catatan Wali Kelas (Unchecked by default to keep personal notes) */}
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/80 border border-white/10 cursor-pointer hover:bg-slate-900 transition-colors">
                    <input
                      type="checkbox"
                      checked={applyCatatan}
                      onChange={(e) => setApplyCatatan(e.target.checked)}
                      className="rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                    />
                    <div className="leading-tight">
                      <span className="text-slate-200 font-medium block">Catatan Khusus Wali Kelas</span>
                      <span className="text-[10px] text-slate-400">Biarkan mati jika catatan murid berbeda-beda</span>
                    </div>
                  </label>
                </div>

                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-400/20 text-[10.5px] text-emerald-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Hafalan Al-Qur'an Santri Terlindungi:</strong> Capaian Tahfidz individual (Juz 30, Juz 29, Surah Al-Mulk, dll.) santri lain tetap aman dan tidak tertimpa.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            {toastMessage ? (
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400">
                Data tersimpan otomatis untuk pencetakan Rapor &amp; Portal Publik Wali Santri.
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg flex items-center gap-2 border border-emerald-300/40"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
