import { Student, ScheduleItem, Teacher, UserSession } from '../types';

export const DEFAULT_MAPEL_LIST = [
  'Pendidikan Agama Islam',
  "Al-Qur'an Hadits",
  'Bahasa Arab',
  'Bahasa Jawa',
  "Imla'",
  'Tahfidz Al-Qur\'an',
  'Pancasila / PPKn',
  'Bahasa Indonesia',
  'Matematika',
  'IPA Terpadu',
  'IPS Terpadu',
  'Bahasa Inggris',
  'Seni Budaya',
  'PJOK',
  'Informatika / TIK',
  'Prakarya / Skill'
];

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

export const DEFAULT_CLASSES = ['7A', '7B', '8A', '8B', '9A', '9B'];

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

  if (!baseClasses || !Array.isArray(baseClasses) || baseClasses.length === 0) {
    baseClasses = DEFAULT_CLASSES;
  }

  const fromStudents = (students || []).map(s => s?.kelas?.trim()).filter(Boolean);
  const fromSchedules = (schedules || []).map(s => s?.kelas?.trim()).filter(Boolean);
  const fromTeachers = (teachers || []).map(t => t?.waliKelasDi?.trim()).filter(Boolean);

  const merged = Array.from(
    new Set([...baseClasses, ...fromStudents, ...fromSchedules, ...fromTeachers])
  );

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

