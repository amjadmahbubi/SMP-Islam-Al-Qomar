import {
  SchoolInfo,
  Teacher,
  Student,
  SarprasItem,
  TeacherDoc,
  ScheduleItem,
  CalendarEvent,
  AgendaItem,
  AttendanceRecord,
  SubjectGradeRecord,
  GoogleSheetsConfig,
  UserSession
} from '../types';

import {
  initialSchoolInfo,
  initialTeachers,
  initialStudents,
  initialSarpras,
  initialSchedules,
  initialCalendarEvents,
  initialAgendaItems,
  initialTeacherDocs,
  initialAttendanceRecords,
  initialSubjectGradeRecords,
  initialSheetsConfig,
  initialAchievements,
  initialPpdbRegistrations,
  initialPpdbSettings,
  initialGalleryItems,
  initialGradeLocks,
  initialAuditLogs,
  initialSarprasMutasi,
  initialSarprasPerawatan,
  initialSarprasPerencanaan,
  initialSarprasAuditLogs,
  initialSarprasGedung,
  initialSarprasRuang
} from '../data/initialData';
import {
  StudentAchievement,
  PpdbRegistration,
  PpdbSettings,
  GalleryItem,
  GradeLockRecord,
  AuditLog,
  SarprasMutasi,
  SarprasPerawatan,
  SarprasPerencanaan,
  SarprasAuditLog,
  SarprasGedung,
  SarprasRuang
} from '../types';

import { DEFAULT_SHEETS_WEB_APP_URL, normalizeMapelName } from '../data/constants';

const KEYS = {
  SESSION: 'alqomar_session',
  SCHOOL: 'alqomar_school_info',
  TEACHERS: 'alqomar_teachers',
  STUDENTS: 'alqomar_students',
  SARPRAS: 'alqomar_sarpras',
  SARPRAS_GEDUNG: 'alqomar_sarpras_gedung',
  SARPRAS_RUANG: 'alqomar_sarpras_ruang',
  SARPRAS_MUTASI: 'alqomar_sarpras_mutasi',
  SARPRAS_PERAWATAN: 'alqomar_sarpras_perawatan',
  SARPRAS_PERENCANAAN: 'alqomar_sarpras_perencanaan',
  SARPRAS_AUDIT: 'alqomar_sarpras_audit',
  TEACHER_DOCS: 'alqomar_teacher_docs',
  SCHEDULES: 'alqomar_schedules',
  CALENDAR: 'alqomar_calendar',
  AGENDA: 'alqomar_agenda',
  ATTENDANCE: 'alqomar_attendance',
  GRADES: 'alqomar_grades',
  SHEETS_CONFIG: 'alqomar_sheets_config',
  ACHIEVEMENTS: 'alqomar_achievements',
  THEME: 'alqomar_theme',
  PPDB: 'alqomar_ppdb_registrations',
  PPDB_SETTINGS: 'alqomar_ppdb_settings',
  GALLERY: 'alqomar_gallery_items',
  GRADE_LOCKS: 'alqomar_grade_locks',
  AUDIT_LOGS: 'alqomar_audit_logs',
  CLASSES: 'alqomar_classes'
};

const defaultSession: UserSession = {
  role: 'public',
  name: 'Umum / Wali Santri'
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return fallback;
    
    // If fallback is array, ensure parsed is also array
    if (Array.isArray(fallback) && !Array.isArray(parsed)) {
      return fallback;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to read from localStorage:', key, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to write to localStorage:', key, e);
  }
}

export const StorageService = {
  // Session
  getSession: (): UserSession => {
    const session = getStored(KEYS.SESSION, defaultSession);
    if (!session || typeof session !== 'object' || !session.role) {
      return defaultSession;
    }
    return session;
  },
  setSession: (session: UserSession): void => setStored(KEYS.SESSION, session),

  // School Info
  getSchoolInfo: (): SchoolInfo => {
    const stored = getStored<Partial<SchoolInfo>>(KEYS.SCHOOL, initialSchoolInfo);
    const validLogo = stored.logoUrl && stored.logoUrl.trim() && !stored.logoUrl.includes('unsplash')
      ? stored.logoUrl
      : initialSchoolInfo.logoUrl;
    const validKop = stored.kopSuratUrl && stored.kopSuratUrl.trim() && !stored.kopSuratUrl.includes('image_ffaabd05')
      ? stored.kopSuratUrl
      : initialSchoolInfo.kopSuratUrl;
    return {
      ...initialSchoolInfo,
      ...stored,
      logoUrl: validLogo,
      kopSuratUrl: validKop,
      isLogoLocked: stored.isLogoLocked !== undefined ? stored.isLogoLocked : initialSchoolInfo.isLogoLocked,
      misi: Array.isArray(stored.misi) && stored.misi.length ? stored.misi : initialSchoolInfo.misi
    };
  },
  saveSchoolInfo: (data: SchoolInfo): void => setStored(KEYS.SCHOOL, data),
  setSchoolInfo: (data: SchoolInfo): void => setStored(KEYS.SCHOOL, data),

  // Teachers
  getTeachers: (): Teacher[] => {
    const data = getStored(KEYS.TEACHERS, initialTeachers);
    const rawTeachers = Array.isArray(data) && data.length > 0 ? data : initialTeachers;
    return rawTeachers.map(t => {
      const normalizedMapel = normalizeMapelName(t.mapelUtama);
      let mapelTambahan = t.mapelTambahan;
      if (t.id === 'T006' && (!mapelTambahan || mapelTambahan.includes('-'))) {
        mapelTambahan = ['Informatika'];
      } else if (t.id === 'T4856' && (!mapelTambahan || mapelTambahan.includes('-'))) {
        mapelTambahan = ['Seni dan Budaya'];
      }
      return {
        ...t,
        mapelUtama: normalizedMapel || t.mapelUtama,
        mapelTambahan
      };
    });
  },
  saveTeachers: (data: Teacher[]): void => setStored(KEYS.TEACHERS, data),
  setTeachers: (data: Teacher[]): void => setStored(KEYS.TEACHERS, data),

  // Students
  getStudents: (): Student[] => {
    const data = getStored(KEYS.STUDENTS, initialStudents);
    return Array.isArray(data) && data.length > 0 ? data : initialStudents;
  },
  saveStudents: (data: Student[]): void => setStored(KEYS.STUDENTS, data),
  setStudents: (data: Student[]): void => setStored(KEYS.STUDENTS, data),

  // Sarpras
  getSarpras: (): SarprasItem[] => {
    const data = getStored(KEYS.SARPRAS, initialSarpras);
    return Array.isArray(data) ? data : initialSarpras;
  },
  saveSarpras: (data: SarprasItem[]): void => setStored(KEYS.SARPRAS, data),
  setSarpras: (data: SarprasItem[]): void => setStored(KEYS.SARPRAS, data),

  // Sarpras Master Gedung
  getSarprasGedung: (): SarprasGedung[] => {
    const data = getStored(KEYS.SARPRAS_GEDUNG, initialSarprasGedung);
    return Array.isArray(data) && data.length > 0 ? data : initialSarprasGedung;
  },
  saveSarprasGedung: (data: SarprasGedung[]): void => setStored(KEYS.SARPRAS_GEDUNG, data),

  // Sarpras Master Ruang
  getSarprasRuang: (): SarprasRuang[] => {
    const data = getStored(KEYS.SARPRAS_RUANG, initialSarprasRuang);
    return Array.isArray(data) && data.length > 0 ? data : initialSarprasRuang;
  },
  saveSarprasRuang: (data: SarprasRuang[]): void => setStored(KEYS.SARPRAS_RUANG, data),

  // Sarpras Mutasi
  getSarprasMutasi: (): SarprasMutasi[] => {
    const data = getStored(KEYS.SARPRAS_MUTASI, initialSarprasMutasi);
    return Array.isArray(data) ? data : initialSarprasMutasi;
  },
  saveSarprasMutasi: (data: SarprasMutasi[]): void => setStored(KEYS.SARPRAS_MUTASI, data),

  // Sarpras Perawatan
  getSarprasPerawatan: (): SarprasPerawatan[] => {
    const data = getStored(KEYS.SARPRAS_PERAWATAN, initialSarprasPerawatan);
    return Array.isArray(data) ? data : initialSarprasPerawatan;
  },
  saveSarprasPerawatan: (data: SarprasPerawatan[]): void => setStored(KEYS.SARPRAS_PERAWATAN, data),

  // Sarpras Perencanaan
  getSarprasPerencanaan: (): SarprasPerencanaan[] => {
    const data = getStored(KEYS.SARPRAS_PERENCANAAN, initialSarprasPerencanaan);
    return Array.isArray(data) ? data : initialSarprasPerencanaan;
  },
  saveSarprasPerencanaan: (data: SarprasPerencanaan[]): void => setStored(KEYS.SARPRAS_PERENCANAAN, data),

  // Sarpras Audit Trail
  getSarprasAuditLogs: (): SarprasAuditLog[] => {
    const data = getStored(KEYS.SARPRAS_AUDIT, initialSarprasAuditLogs);
    return Array.isArray(data) ? data : initialSarprasAuditLogs;
  },
  saveSarprasAuditLogs: (data: SarprasAuditLog[]): void => setStored(KEYS.SARPRAS_AUDIT, data),
  addSarprasAuditLog: (entry: Omit<SarprasAuditLog, 'id' | 'timestamp'>): void => {
    const logs = StorageService.getSarprasAuditLogs();
    const newLog: SarprasAuditLog = {
      id: `AUD-SRP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    StorageService.saveSarprasAuditLogs([newLog, ...logs].slice(0, 300));
  },

  // Teacher Docs
  getTeacherDocs: (): TeacherDoc[] => {
    const data = getStored(KEYS.TEACHER_DOCS, initialTeacherDocs);
    return Array.isArray(data) ? data : initialTeacherDocs;
  },
  saveTeacherDocs: (data: TeacherDoc[]): void => setStored(KEYS.TEACHER_DOCS, data),
  setTeacherDocs: (data: TeacherDoc[]): void => setStored(KEYS.TEACHER_DOCS, data),

  // Schedules
  getSchedules: (): ScheduleItem[] => {
    const data = getStored(KEYS.SCHEDULES, initialSchedules);
    return Array.isArray(data) && data.length > 0 ? data : initialSchedules;
  },
  saveSchedules: (data: ScheduleItem[]): void => setStored(KEYS.SCHEDULES, data),
  setSchedules: (data: ScheduleItem[]): void => setStored(KEYS.SCHEDULES, data),

  // Calendar
  getCalendarEvents: (): CalendarEvent[] => {
    const data = getStored(KEYS.CALENDAR, initialCalendarEvents);
    return Array.isArray(data) ? data : initialCalendarEvents;
  },
  saveCalendarEvents: (data: CalendarEvent[]): void => setStored(KEYS.CALENDAR, data),
  setCalendarEvents: (data: CalendarEvent[]): void => setStored(KEYS.CALENDAR, data),

  // Agenda
  getAgendas: (): AgendaItem[] => {
    const data = getStored(KEYS.AGENDA, initialAgendaItems);
    return Array.isArray(data) ? data : initialAgendaItems;
  },
  saveAgendas: (data: AgendaItem[]): void => setStored(KEYS.AGENDA, data),
  setAgendas: (data: AgendaItem[]): void => setStored(KEYS.AGENDA, data),

  // Attendance
  getAttendance: (): AttendanceRecord[] => {
    const data = getStored(KEYS.ATTENDANCE, initialAttendanceRecords);
    return Array.isArray(data) ? data : initialAttendanceRecords;
  },
  saveAttendance: (data: AttendanceRecord[]): void => setStored(KEYS.ATTENDANCE, data),
  setAttendance: (data: AttendanceRecord[]): void => setStored(KEYS.ATTENDANCE, data),

  // Grades
  getGrades: (): SubjectGradeRecord[] => {
    const data = getStored(KEYS.GRADES, initialSubjectGradeRecords);
    return Array.isArray(data) ? data : initialSubjectGradeRecords;
  },
  saveGrades: (data: SubjectGradeRecord[]): void => setStored(KEYS.GRADES, data),
  setGrades: (data: SubjectGradeRecord[]): void => setStored(KEYS.GRADES, data),

  // Google Sheets Config
  getSheetsConfig: (): GoogleSheetsConfig => {
    const stored = getStored<Partial<GoogleSheetsConfig>>(KEYS.SHEETS_CONFIG, initialSheetsConfig);
    const isOldPlaceholder = stored.webAppUrl && (
      stored.webAppUrl.includes('AKfycbx-SMP-Islam-Al-Qomar') ||
      stored.webAppUrl.includes('placeholder')
    );
    const isValidUrl = stored.webAppUrl &&
      !isOldPlaceholder &&
      stored.webAppUrl.trim().startsWith('https://script.google.com/') &&
      stored.webAppUrl.includes('/exec');
    return {
      ...initialSheetsConfig,
      ...stored,
      webAppUrl: isValidUrl ? stored.webAppUrl!.trim() : DEFAULT_SHEETS_WEB_APP_URL,
      isLocked: stored.isLocked !== undefined ? stored.isLocked : false,
      autoSyncOnLoad: stored.autoSyncOnLoad !== undefined ? stored.autoSyncOnLoad : true
    };
  },
  saveSheetsConfig: (data: GoogleSheetsConfig): void => setStored(KEYS.SHEETS_CONFIG, data),
  setSheetsConfig: (data: GoogleSheetsConfig): void => setStored(KEYS.SHEETS_CONFIG, data),

  // Achievements
  getAchievements: (): StudentAchievement[] => {
    const data = getStored(KEYS.ACHIEVEMENTS, initialAchievements);
    return Array.isArray(data) && data.length > 0 ? data : initialAchievements;
  },
  saveAchievements: (data: StudentAchievement[]): void => setStored(KEYS.ACHIEVEMENTS, data),
  setAchievements: (data: StudentAchievement[]): void => setStored(KEYS.ACHIEVEMENTS, data),

  // Theme Preference ('dark' | 'light')
  getTheme: (): 'dark' | 'light' => getStored(KEYS.THEME, 'dark'),
  setTheme: (theme: 'dark' | 'light'): void => setStored(KEYS.THEME, theme),

  // PPDB Registrations
  getPpdbRegistrations: (): PpdbRegistration[] => {
    const data = getStored(KEYS.PPDB, initialPpdbRegistrations);
    return Array.isArray(data) ? data : initialPpdbRegistrations;
  },
  savePpdbRegistrations: (data: PpdbRegistration[]): void => setStored(KEYS.PPDB, data),

  // PPDB Settings (Gelombang, Program Unggulan, Contact Persons, Syarat)
  getPpdbSettings: (): PpdbSettings => {
    const stored = getStored<Partial<PpdbSettings>>(KEYS.PPDB_SETTINGS, initialPpdbSettings);
    return {
      ...initialPpdbSettings,
      ...stored,
      gelombangList: Array.isArray(stored.gelombangList) ? stored.gelombangList : initialPpdbSettings.gelombangList,
      programList: Array.isArray(stored.programList) ? stored.programList : initialPpdbSettings.programList,
      contactList: Array.isArray(stored.contactList) ? stored.contactList : initialPpdbSettings.contactList,
      syaratPendaftaran: Array.isArray(stored.syaratPendaftaran) ? stored.syaratPendaftaran : initialPpdbSettings.syaratPendaftaran
    };
  },
  savePpdbSettings: (data: PpdbSettings): void => setStored(KEYS.PPDB_SETTINGS, data),
  setPpdbSettings: (data: PpdbSettings): void => setStored(KEYS.PPDB_SETTINGS, data),

  // Gallery Items
  getGalleryItems: (): GalleryItem[] => {
    const data = getStored(KEYS.GALLERY, initialGalleryItems);
    return Array.isArray(data) ? data : initialGalleryItems;
  },
  saveGalleryItems: (data: GalleryItem[]): void => setStored(KEYS.GALLERY, data),

  // Grade Locks
  getGradeLocks: (): GradeLockRecord[] => {
    const data = getStored(KEYS.GRADE_LOCKS, initialGradeLocks);
    return Array.isArray(data) ? data : initialGradeLocks;
  },
  saveGradeLocks: (data: GradeLockRecord[]): void => setStored(KEYS.GRADE_LOCKS, data),

  // Audit Logs
  getAuditLogs: (): AuditLog[] => {
    const data = getStored(KEYS.AUDIT_LOGS, initialAuditLogs);
    return Array.isArray(data) ? data : initialAuditLogs;
  },
  saveAuditLogs: (data: AuditLog[]): void => setStored(KEYS.AUDIT_LOGS, data),
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>): void => {
    const existing = StorageService.getAuditLogs();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newEntry: AuditLog = {
      ...log,
      id: `AUD-${Date.now()}`,
      timestamp: formattedDate
    };
    setStored(KEYS.AUDIT_LOGS, [newEntry, ...existing]);
  },

  // Custom & Active Classes
  getClasses: (): string[] => {
    const data = getStored(KEYS.CLASSES, ['7', '8', '9']);
    const invalid = ['-', '--', 'none', 'tidak ada', 'null', 'undefined', '7A', '7B', '8A', '8B', '9A', '9B'];
    if (Array.isArray(data)) {
      const cleaned = data
        .map(c => String(c).trim())
        .filter(c => Boolean(c) && !invalid.includes(c));
      return cleaned.length > 0 ? cleaned : ['7', '8', '9'];
    }
    return ['7', '8', '9'];
  },
  saveClasses: (data: string[]): void => setStored(KEYS.CLASSES, data),
  setClasses: (data: string[]): void => setStored(KEYS.CLASSES, data),

  // Reset to initial sample data
  resetAllToDefault: (): void => {
    localStorage.removeItem(KEYS.SESSION);
    localStorage.removeItem(KEYS.SCHOOL);
    localStorage.removeItem(KEYS.TEACHERS);
    localStorage.removeItem(KEYS.STUDENTS);
    localStorage.removeItem(KEYS.SARPRAS);
    localStorage.removeItem(KEYS.SARPRAS_MUTASI);
    localStorage.removeItem(KEYS.SARPRAS_PERAWATAN);
    localStorage.removeItem(KEYS.SARPRAS_PERENCANAAN);
    localStorage.removeItem(KEYS.SARPRAS_AUDIT);
    localStorage.removeItem(KEYS.TEACHER_DOCS);
    localStorage.removeItem(KEYS.SCHEDULES);
    localStorage.removeItem(KEYS.CALENDAR);
    localStorage.removeItem(KEYS.AGENDA);
    localStorage.removeItem(KEYS.ATTENDANCE);
    localStorage.removeItem(KEYS.GRADES);
    localStorage.removeItem(KEYS.SHEETS_CONFIG);
    localStorage.removeItem(KEYS.ACHIEVEMENTS);
    localStorage.removeItem(KEYS.PPDB);
    localStorage.removeItem(KEYS.GALLERY);
    localStorage.removeItem(KEYS.GRADE_LOCKS);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.CLASSES);
  },

  // Export All Local Data to JSON (Backup / Transfer to another device like HP)
  exportAllDataJSON: (): string => {
    return JSON.stringify({
      appName: 'DAPODIK SMP Islam Al Qomar',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      schoolInfo: StorageService.getSchoolInfo(),
      teachers: StorageService.getTeachers(),
      students: StorageService.getStudents(),
      schedules: StorageService.getSchedules(),
      sarpras: StorageService.getSarpras(),
      sarprasMutasi: StorageService.getSarprasMutasi(),
      sarprasPerawatan: StorageService.getSarprasPerawatan(),
      sarprasPerencanaan: StorageService.getSarprasPerencanaan(),
      sarprasAuditLogs: StorageService.getSarprasAuditLogs(),
      teacherDocs: StorageService.getTeacherDocs(),
      calendar: StorageService.getCalendarEvents(),
      agenda: StorageService.getAgendas(),
      attendance: StorageService.getAttendance(),
      grades: StorageService.getGrades(),
      achievements: StorageService.getAchievements(),
      ppdbRegistrations: StorageService.getPpdbRegistrations(),
      ppdbSettings: StorageService.getPpdbSettings(),
      galleryItems: StorageService.getGalleryItems(),
      sheetsConfig: StorageService.getSheetsConfig()
    }, null, 2);
  },

  // Import All Local Data from JSON
  importAllDataJSON: (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.data || parsed;
      if (data.schoolInfo) setStored(KEYS.SCHOOL, data.schoolInfo);
      if (data.teachers && Array.isArray(data.teachers)) setStored(KEYS.TEACHERS, data.teachers);
      if (data.students && Array.isArray(data.students)) setStored(KEYS.STUDENTS, data.students);
      if (data.schedules && Array.isArray(data.schedules)) setStored(KEYS.SCHEDULES, data.schedules);
      if (data.sarpras && Array.isArray(data.sarpras)) setStored(KEYS.SARPRAS, data.sarpras);
      if (data.sarprasMutasi && Array.isArray(data.sarprasMutasi)) setStored(KEYS.SARPRAS_MUTASI, data.sarprasMutasi);
      if (data.sarprasPerawatan && Array.isArray(data.sarprasPerawatan)) setStored(KEYS.SARPRAS_PERAWATAN, data.sarprasPerawatan);
      if (data.sarprasPerencanaan && Array.isArray(data.sarprasPerencanaan)) setStored(KEYS.SARPRAS_PERENCANAAN, data.sarprasPerencanaan);
      if (data.sarprasAuditLogs && Array.isArray(data.sarprasAuditLogs)) setStored(KEYS.SARPRAS_AUDIT, data.sarprasAuditLogs);
      if (data.teacherDocs && Array.isArray(data.teacherDocs)) setStored(KEYS.TEACHER_DOCS, data.teacherDocs);
      if (data.calendar && Array.isArray(data.calendar)) setStored(KEYS.CALENDAR, data.calendar);
      if (data.agenda && Array.isArray(data.agenda)) setStored(KEYS.AGENDA, data.agenda);
      if (data.attendance && Array.isArray(data.attendance)) setStored(KEYS.ATTENDANCE, data.attendance);
      if (data.grades && Array.isArray(data.grades)) setStored(KEYS.GRADES, data.grades);
      if (data.achievements && Array.isArray(data.achievements)) setStored(KEYS.ACHIEVEMENTS, data.achievements);
      if (data.ppdbRegistrations && Array.isArray(data.ppdbRegistrations)) setStored(KEYS.PPDB, data.ppdbRegistrations);
      if (data.ppdbSettings) setStored(KEYS.PPDB_SETTINGS, data.ppdbSettings);
      if (data.galleryItems && Array.isArray(data.galleryItems)) setStored(KEYS.GALLERY, data.galleryItems);
      if (data.sheetsConfig) setStored(KEYS.SHEETS_CONFIG, data.sheetsConfig);

      // Support legacy format with raw keys (e.g. alqomar_students)
      Object.keys(data).forEach(key => {
        if (key.startsWith('alqomar_')) {
          if (typeof data[key] === 'object') {
            localStorage.setItem(key, JSON.stringify(data[key]));
          } else {
            localStorage.setItem(key, data[key]);
          }
        }
      });
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }
};


// CSV Export Helper for Google Sheets compatibility
export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers
        .map(fieldName => {
          const val = row[fieldName] ?? '';
          const escaped = ('' + val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
