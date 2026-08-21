import { Student, ScheduleItem, Teacher } from '../types';

export const DEFAULT_MAPEL_LIST = [
  'Pendidikan Agama Islam',
  "Al-Qur'an Hadits",
  'Akidah Akhlak',
  'Fiqih',
  'Sejarah Kebudayaan Islam (SKI)',
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
 * baik dari data siswa, jadwal pelajaran, maupun kelas default.
 */
export function getAllClasses(
  students: Student[] = [],
  schedules: ScheduleItem[] = [],
  teachers: Teacher[] = []
): string[] {
  const fromStudents = students.map(s => s.kelas?.trim()).filter(Boolean);
  const fromSchedules = schedules.map(s => s.kelas?.trim()).filter(Boolean);
  const fromTeachers = teachers.map(t => t.waliKelasDi?.trim()).filter(Boolean);

  const merged = Array.from(
    new Set([...DEFAULT_CLASSES, ...fromStudents, ...fromSchedules, ...fromTeachers])
  );

  return merged.sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );
}
