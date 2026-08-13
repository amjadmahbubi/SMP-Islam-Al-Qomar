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
  initialGalleryItems,
  initialGradeLocks,
  initialAuditLogs
} from '../data/initialData';
import { StudentAchievement, PpdbRegistration, GalleryItem, GradeLockRecord, AuditLog } from '../types';

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
  GALLERY: 'alqomar_gallery_items',
  GRADE_LOCKS: 'alqomar_grade_locks',
  AUDIT_LOGS: 'alqomar_audit_logs'
};

const defaultSession: UserSession = {
  role: 'public',
  name: 'Umum / Wali Santri'
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
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

  // School Info
  getSchoolInfo: (): SchoolInfo => getStored(KEYS.SCHOOL, initialSchoolInfo),
  saveSchoolInfo: (data: SchoolInfo): void => setStored(KEYS.SCHOOL, data),
  setSchoolInfo: (data: SchoolInfo): void => setStored(KEYS.SCHOOL, data),

  // Teachers
  getTeachers: (): Teacher[] => getStored(KEYS.TEACHERS, initialTeachers),
  saveTeachers: (data: Teacher[]): void => setStored(KEYS.TEACHERS, data),
  setTeachers: (data: Teacher[]): void => setStored(KEYS.TEACHERS, data),

  // Students
  getStudents: (): Student[] => getStored(KEYS.STUDENTS, initialStudents),
  saveStudents: (data: Student[]): void => setStored(KEYS.STUDENTS, data),
  setStudents: (data: Student[]): void => setStored(KEYS.STUDENTS, data),

  // Sarpras
  getSarpras: (): SarprasItem[] => getStored(KEYS.SARPRAS, initialSarpras),
  saveSarpras: (data: SarprasItem[]): void => setStored(KEYS.SARPRAS, data),
  setSarpras: (data: SarprasItem[]): void => setStored(KEYS.SARPRAS, data),

  // Teacher Docs
  getTeacherDocs: (): TeacherDoc[] => getStored(KEYS.TEACHER_DOCS, initialTeacherDocs),
  saveTeacherDocs: (data: TeacherDoc[]): void => setStored(KEYS.TEACHER_DOCS, data),
  setTeacherDocs: (data: TeacherDoc[]): void => setStored(KEYS.TEACHER_DOCS, data),

  // Schedules
  getSchedules: (): ScheduleItem[] => getStored(KEYS.SCHEDULES, initialSchedules),
  saveSchedules: (data: ScheduleItem[]): void => setStored(KEYS.SCHEDULES, data),
  setSchedules: (data: ScheduleItem[]): void => setStored(KEYS.SCHEDULES, data),

  // Calendar
  getCalendarEvents: (): CalendarEvent[] => getStored(KEYS.CALENDAR, initialCalendarEvents),
  saveCalendarEvents: (data: CalendarEvent[]): void => setStored(KEYS.CALENDAR, data),
  setCalendarEvents: (data: CalendarEvent[]): void => setStored(KEYS.CALENDAR, data),

  // Agenda
  getAgendas: (): AgendaItem[] => getStored(KEYS.AGENDA, initialAgendaItems),
  saveAgendas: (data: AgendaItem[]): void => setStored(KEYS.AGENDA, data),
  setAgendas: (data: AgendaItem[]): void => setStored(KEYS.AGENDA, data),

  // Attendance
  getAttendance: (): AttendanceRecord[] => getStored(KEYS.ATTENDANCE, initialAttendanceRecords),
  saveAttendance: (data: AttendanceRecord[]): void => setStored(KEYS.ATTENDANCE, data),
  setAttendance: (data: AttendanceRecord[]): void => setStored(KEYS.ATTENDANCE, data),

  // Grades
  getGrades: (): SubjectGradeRecord[] => getStored(KEYS.GRADES, initialSubjectGradeRecords),
  saveGrades: (data: SubjectGradeRecord[]): void => setStored(KEYS.GRADES, data),
  setGrades: (data: SubjectGradeRecord[]): void => setStored(KEYS.GRADES, data),

  // Google Sheets Config
  getSheetsConfig: (): GoogleSheetsConfig => getStored(KEYS.SHEETS_CONFIG, initialSheetsConfig),
  saveSheetsConfig: (data: GoogleSheetsConfig): void => setStored(KEYS.SHEETS_CONFIG, data),
  setSheetsConfig: (data: GoogleSheetsConfig): void => setStored(KEYS.SHEETS_CONFIG, data),

  // Achievements
  getAchievements: (): StudentAchievement[] => getStored(KEYS.ACHIEVEMENTS, initialAchievements),
  saveAchievements: (data: StudentAchievement[]): void => setStored(KEYS.ACHIEVEMENTS, data),
  setAchievements: (data: StudentAchievement[]): void => setStored(KEYS.ACHIEVEMENTS, data),

  // Theme Preference ('dark' | 'light')
  getTheme: (): 'dark' | 'light' => getStored(KEYS.THEME, 'dark'),
  setTheme: (theme: 'dark' | 'light'): void => setStored(KEYS.THEME, theme),

  // PPDB Registrations
  getPpdbRegistrations: (): PpdbRegistration[] => getStored(KEYS.PPDB, initialPpdbRegistrations),
  savePpdbRegistrations: (data: PpdbRegistration[]): void => setStored(KEYS.PPDB, data),

  // Gallery Items
  getGalleryItems: (): GalleryItem[] => getStored(KEYS.GALLERY, initialGalleryItems),
  saveGalleryItems: (data: GalleryItem[]): void => setStored(KEYS.GALLERY, data),

  // Grade Locks
  getGradeLocks: (): GradeLockRecord[] => getStored(KEYS.GRADE_LOCKS, initialGradeLocks),
  saveGradeLocks: (data: GradeLockRecord[]): void => setStored(KEYS.GRADE_LOCKS, data),

  // Audit Logs
  getAuditLogs: (): AuditLog[] => getStored(KEYS.AUDIT_LOGS, initialAuditLogs),
  saveAuditLogs: (data: AuditLog[]): void => setStored(KEYS.AUDIT_LOGS, data),
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>): void => {
    const existing = getStored<AuditLog[]>(KEYS.AUDIT_LOGS, initialAuditLogs);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newEntry: AuditLog = {
      ...log,
      id: `AUD-${Date.now()}`,
      timestamp: formattedDate
    };
    setStored(KEYS.AUDIT_LOGS, [newEntry, ...existing]);
  },

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
