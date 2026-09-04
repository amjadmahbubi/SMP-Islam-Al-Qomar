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
  initialAuditLogs
} from '../data/initialData';
import { StudentAchievement, PpdbRegistration, PpdbSettings, GalleryItem, GradeLockRecord, AuditLog } from '../types';

const KEYS = {
  SESSION: 'alqomar_session',
  SCHOOL: 'alqomar_school_info',
  TEACHERS: 'alqomar_teachers',
  STUDENTS: 'alqomar_students',
  SARPRAS: 'alqomar_sarpras',
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
  getSession: (): UserSession => getStored(KEYS.SESSION, defaultSession),
  setSession: (session: UserSession): void => setStored(KEYS.SESSION, session),

  // School Info (deep merge with initialSchoolInfo to ensure misi is always array)
  getSchoolInfo: (): SchoolInfo => {
    const stored = getStored<Partial<SchoolInfo>>(KEYS.SCHOOL, initialSchoolInfo);
    return {
      ...initialSchoolInfo,
      ...stored,
      misi: Array.isArray(stored.misi) && stored.misi.length ? stored.misi : initialSchoolInfo.misi
    };
  },
  saveSchoolInfo: (data: SchoolInfo): void => setStored(KEYS.SCHOOL, data),
  setSchoolInfo: (data: SchoolInfo): void => setStored(KEYS.SCHOOL, data),

  // Teachers
  getTeachers: (): Teacher[] => {
    const data = getStored(KEYS.TEACHERS, initialTeachers);
    return Array.isArray(data) ? data : initialTeachers;
  },
  saveTeachers: (data: Teacher[]): void => setStored(KEYS.TEACHERS, data),
  setTeachers: (data: Teacher[]): void => setStored(KEYS.TEACHERS, data),

  // Students
  getStudents: (): Student[] => {
    const data = getStored(KEYS.STUDENTS, initialStudents);
    return Array.isArray(data) ? data : initialStudents;
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
    return Array.isArray(data) ? data : initialSchedules;
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
    return {
      ...initialSheetsConfig,
      ...stored,
      webAppUrl: (stored.webAppUrl && stored.webAppUrl.trim() !== '') ? stored.webAppUrl : initialSheetsConfig.webAppUrl,
      autoSyncOnLoad: stored.autoSyncOnLoad !== undefined ? stored.autoSyncOnLoad : true
    };
  },
  saveSheetsConfig: (data: GoogleSheetsConfig): void => setStored(KEYS.SHEETS_CONFIG, data),
  setSheetsConfig: (data: GoogleSheetsConfig): void => setStored(KEYS.SHEETS_CONFIG, data),

  // Achievements
  getAchievements: (): StudentAchievement[] => {
    const data = getStored(KEYS.ACHIEVEMENTS, initialAchievements);
    return Array.isArray(data) ? data : initialAchievements;
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
    const data = getStored(KEYS.CLASSES, ['7A', '7B', '8A', '8B', '9A', '9B']);
    return Array.isArray(data) ? data : ['7A', '7B', '8A', '8B', '9A', '9B'];
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
    const bundle: Record<string, any> = {};
    Object.entries(KEYS).forEach(([name, key]) => {
      if (name !== 'SESSION') {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            bundle[key] = JSON.parse(item);
          } catch {
            bundle[key] = item;
          }
        }
      }
    });
    return JSON.stringify({
      appName: 'DAPODIK SMP Islam Al Qomar',
      exportedAt: new Date().toISOString(),
      data: bundle
    }, null, 2);
  },

  // Import All Local Data from JSON
  importAllDataJSON: (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      const data = parsed.data || parsed;
      Object.keys(data).forEach(key => {
        if (typeof data[key] === 'object') {
          localStorage.setItem(key, JSON.stringify(data[key]));
        } else {
          localStorage.setItem(key, data[key]);
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
