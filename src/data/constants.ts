import { Student, ScheduleItem, Teacher, UserSession } from '../types';

/**
 * Daftar Urutan Resmi 13 Mata Pelajaran Rapor Kurikulum Merdeka SMP Islam Al Qomar
 * (Sesuai ketetapan acuan Kemendikbudristek BSKAP & Struktur Kurikulum SMP Fase D)
 */
export const OFFICIAL_MAPEL_ORDER = [
  'Pendidikan Agama dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam',
  'Ilmu Pengetahuan Sosial',
  'Bahasa Inggris',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan',
  'Informatika',
  'Seni dan Budaya',
  'Prakarya',
  'Bahasa Jawa',
  'Bahasa Arab'
] as const;

/**
 * Pemetaan Guru Pengampu Resmi untuk 13 Mata Pelajaran SMP Islam Al Qomar
 */
export const OFFICIAL_MAPEL_TEACHERS: Record<string, { teacherName: string; teacherId: string }> = {
  'Pendidikan Agama dan Budi Pekerti': { teacherName: 'Fikriyadi, S.Pd', teacherId: 'T003' },
  'Pendidikan Pancasila': { teacherName: 'Ansorik, S.Sos', teacherId: 'T3337' },
  'Bahasa Indonesia': { teacherName: 'Rizqiyah Wafiroh, S.Pd', teacherId: 'T005' },
  'Matematika': { teacherName: 'Dela Wardani, S.Pd', teacherId: 'T002' },
  'Ilmu Pengetahuan Alam': { teacherName: 'Diah Putriani, S.Pd', teacherId: 'T007' },
  'Ilmu Pengetahuan Sosial': { teacherName: 'Muhammad Bintang Nuriansyah, S.Pi', teacherId: 'T2075' },
  'Bahasa Inggris': { teacherName: 'Amjad Dzulfikar Mahbubie, S.Pd', teacherId: 'T006' },
  'Pendidikan Jasmani, Olahraga, dan Kesehatan': { teacherName: 'Helmi Claresa, S.Pd', teacherId: 'T008' },
  'Informatika': { teacherName: 'Amjad Dzulfikar Mahbubie, S.Pd', teacherId: 'T006' },
  'Seni dan Budaya': { teacherName: 'Muhammad Mahfudz Al-Hafidz', teacherId: 'T4856' },
  'Prakarya': { teacherName: 'Diah Khoirunnisa, S.Pd', teacherId: 'T004' },
  'Bahasa Jawa': { teacherName: 'Muhammad Mahfudz Al-Hafidz', teacherId: 'T4856' },
  'Bahasa Arab': { teacherName: 'Nanda Firdaus, S.Ag', teacherId: 'T3183' }
};

export const DEFAULT_MAPEL_LIST = [
  ...OFFICIAL_MAPEL_ORDER,
  "Al-Qur'an Hadits",
  "Imla'",
  "Tahfidz Al-Qur'an"
];

/**
 * Normalisasi variasi nama mapel (alias lama / singkatan) ke nama baku resmi
 */
export function normalizeMapelName(raw: string): string {
  if (!raw) return '';
  const norm = raw.trim().toLowerCase();
  
  if (norm.includes('agama') || norm === 'pai' || norm.includes('budi pekerti')) return 'Pendidikan Agama dan Budi Pekerti';
  if (norm.includes('pancasila') || norm.includes('ppkn') || norm.includes('pkn')) return 'Pendidikan Pancasila';
  if (norm.includes('indonesia') || norm === 'b.indo' || norm === 'b indonesia' || norm === 'bahasa indonesia') return 'Bahasa Indonesia';
  if (norm.includes('matematika') || norm === 'mtk') return 'Matematika';
  if (norm.includes('alam') || norm.includes('ipa') || norm === 'sains') return 'Ilmu Pengetahuan Alam';
  if (norm.includes('sosial') || norm.includes('ips')) return 'Ilmu Pengetahuan Sosial';
  if (norm.includes('inggris') || norm === 'english' || norm === 'b.inggris' || norm === 'b inggris') return 'Bahasa Inggris';
  if (norm.includes('jasmani') || norm.includes('pjok') || norm.includes('olahraga')) return 'Pendidikan Jasmani, Olahraga, dan Kesehatan';
  if (norm.includes('informatika') || norm.includes('tik') || norm.includes('komputer')) return 'Informatika';
  if (norm.includes('seni') || norm.includes('budaya')) return 'Seni dan Budaya';
  if (norm.includes('prakarya')) return 'Prakarya';
  if (norm.includes('jawa')) return 'Bahasa Jawa';
  if (norm.includes('arab')) return 'Bahasa Arab';
  if (norm.includes('hadits') || norm.includes('hadist') || norm.includes("qur'an hadits")) return "Al-Qur'an Hadits";
  if (norm.includes('imla')) return "Imla'";
  if (norm.includes('tahfidz') || norm.includes('hafalan')) return "Tahfidz Al-Qur'an";
  
  return raw.trim();
}

/**
 * Mendapatkan indeks urutan rapor resmi atau 999 jika di luar daftar pokok
 */
export function getMapelSortIndex(rawName: string): number {
  const normalized = normalizeMapelName(rawName);
  const idx = (DEFAULT_MAPEL_LIST as readonly string[]).indexOf(normalized);
  if (idx !== -1) return idx;

  const partialIdx = (DEFAULT_MAPEL_LIST as readonly string[]).findIndex(m => 
    normalized.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(normalized.toLowerCase())
  );
  return partialIdx !== -1 ? partialIdx : 999;
}

export const COMMON_SCHEDULE_ACTIVITIES = [
  'Upacara Bendera',
  'Sholat Dhuha Bersama',
  'Tahfidz & Murojaah Pagi',
  'Istirahat & Snack Pagi',
  'Sholat Dzuhur Berjamaah',
  'Kajian Keputrian / Keislaman',
  'Muhadharah / Latihan Pidato',
  'Ekstrakurikuler Wajib Pramuka',
  'Bimbingan Konseling (BK)',
  'Literasi & Pojok Baca',
  'Senam Pagi & Kebersihan Lingkungan'
];

export const DEFAULT_CLASSES = ['7', '8', '9'];

export const DEFAULT_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxIVQVvPhAKfPA66gcw2m44tMGzi-ZaZtlRnpbpS5bZsRHqP5qWUZqaqwtaYNrRo6n1SQ/exec';

const INVALID_CLASS_NAMES = ['-', '--', 'none', 'tidak ada', 'null', 'undefined', '7A', '7B', '8A', '8B', '9A', '9B'];

const isValidClass = (val: unknown): boolean => {
  if (val === null || val === undefined) return false;
  const str = String(val).trim();
  if (!str || str === '-' || str === '--') return false;
  return !INVALID_CLASS_NAMES.includes(str);
};

/**
 * Mengambil seluruh daftar rombongan belajar / kelas secara dinamis
 * baik dari data siswa, jadwal pelajaran, guru, maupun kelas kustom yang disimpan.
 */
export function getAllClasses(
  students: Student[] = [],
  schedules: ScheduleItem[] = [],
  teachers: Teacher[] = [],
  customClasses?: string[]
): string[] {
  let baseClasses = customClasses;
  if (!baseClasses || !Array.isArray(baseClasses)) {
    try {
      const stored = localStorage.getItem('alqomar_classes');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          baseClasses = parsed;
        }
      }
    } catch {
      // fallback
    }
  }

  // Filter out any invalid / obsolete template dummy classes
  const cleanBase = Array.isArray(baseClasses)
    ? baseClasses.map(c => String(c).trim()).filter(isValidClass)
    : [];

  const fromStudents = (students || [])
    .map(s => String(s?.kelas || '').trim())
    .filter(isValidClass);
  const fromSchedules = (schedules || [])
    .map(s => String(s?.kelas || '').trim())
    .filter(isValidClass);
  const fromTeachers = (teachers || [])
    .map(t => String(t?.waliKelasDi || '').trim())
    .filter(isValidClass);

  const merged = Array.from(
    new Set([...cleanBase, ...fromStudents, ...fromSchedules, ...fromTeachers])
  );

  if (merged.length === 0) {
    return DEFAULT_CLASSES;
  }

  return merged.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
}

/**
 * Mendapatkan daftar mata pelajaran yang diizinkan untuk dipilih oleh pengguna.
 * Jika login sebagai akun Guru (bukan Admin / Waka Kurikulum), hanya mata pelajaran yang diampu yang ditampilkan.
 */
export function getTeacherAllowedMapelList(
  session: UserSession,
  teachers: Teacher[] = [],
  allMapels: string[] = DEFAULT_MAPEL_LIST
): { allowedMapels: string[]; isRestricted: boolean; loggedTeacher?: Teacher } {
  const loggedTeacher = (teachers || []).find(
    t => (session?.teacherId && t.id === session.teacherId) ||
         (session?.name && t.nama?.toLowerCase() === session.name.toLowerCase()) ||
         (session?.email && t.email && t.email?.toLowerCase() === session.email.toLowerCase())
  );

  const isAdmin = session?.role === 'admin';
  const isWakaKurikulum = Boolean(
    loggedTeacher?.jabatan?.toLowerCase().includes('kurikulum') ||
    session?.name?.toLowerCase().includes('kurikulum')
  );

  // Jika Administrator atau Waka Kurikulum -> Semua mata pelajaran dapat dipilih
  if (isAdmin || isWakaKurikulum || session?.role === 'public') {
    return {
      allowedMapels: allMapels,
      isRestricted: false,
      loggedTeacher
    };
  }

  // Jika login sebagai Guru Reguler -> Hanya mata pelajaran yang diampu (Utama + Tambahan)
  if (session?.role === 'guru' && loggedTeacher?.mapelUtama) {
    const rawMapels: string[] = [
      loggedTeacher.mapelUtama.trim(),
      ...(Array.isArray(loggedTeacher.mapelTambahan)
        ? loggedTeacher.mapelTambahan.map(m => (typeof m === 'string' ? m.trim() : '')).filter(Boolean)
        : [])
    ];

    const resultList: string[] = [];

    rawMapels.forEach(rawMapel => {
      // Cocokkan dengan daftar standar mapel atau gunakan nama mapel langsung
      const matched = allMapels.filter(m => {
        const mLower = m.toLowerCase();
        const rawLower = rawMapel.toLowerCase();
        return (
          mLower === rawLower ||
          rawLower.includes(mLower) ||
          mLower.includes(rawLower)
        );
      });

      if (matched.length > 0) {
        matched.forEach(m => {
          if (!resultList.includes(m)) resultList.push(m);
        });
      } else if (!resultList.includes(rawMapel)) {
        resultList.push(rawMapel);
      }
    });

    return {
      allowedMapels: resultList.length > 0 ? resultList : [loggedTeacher.mapelUtama],
      isRestricted: true,
      loggedTeacher
    };
  }

  return {
    allowedMapels: allMapels,
    isRestricted: false,
    loggedTeacher
  };
}

