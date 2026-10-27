import React, { useState, useEffect } from 'react';
import {
  UserSession,
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
  StudentAchievement,
  PpdbRegistration,
  GalleryItem,
  PpdbSettings,
  GoogleSheetsConfig
} from './types';
import { StorageService } from './services/storage';
import { initialSchoolInfo } from './data/initialData';
import { fetchFromGoogleSheets, validateSheetsUrl } from './services/sheetsSyncService';
import { DEFAULT_SHEETS_WEB_APP_URL } from './data/constants';
import { RefreshCw, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';

// Core Layout
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';

// Public Views
import { PublicStatistik } from './components/public/PublicStatistik';
import { PublicJadwal } from './components/public/PublicJadwal';
import { PublicAgenda } from './components/public/PublicAgenda';
import { PublicKalender } from './components/public/PublicKalender';
import { PublicKalenderAgenda } from './components/public/PublicKalenderAgenda';
import { PublicPortalRapor } from './components/public/PublicPortalRapor';
import { PublicPrestasi } from './components/public/PublicPrestasi';
import { PublicPpdb } from './components/public/PublicPpdb';
import { PublicGaleri } from './components/public/PublicGaleri';

// Management Views
import { DataSekolahView } from './components/modules/DataSekolahView';
import { DataGuruView } from './components/modules/DataGuruView';
import { DataSiswaView } from './components/modules/DataSiswaView';
import { DataSarprasView } from './components/modules/DataSarprasView';
import { AdministrasiGuruView } from './components/modules/AdministrasiGuruView';
import { JadwalKelolaView } from './components/modules/JadwalKelolaView';
import { KalenderKelolaView } from './components/modules/KalenderKelolaView';
import { AbsensiSiswaView } from './components/modules/AbsensiSiswaView';
import { InputNilaiView } from './components/modules/InputNilaiView';
import { LaporanRaporView } from './components/modules/LaporanRaporView';
import { GoogleSheetsIntegration } from './components/modules/GoogleSheetsIntegration';
import { WAGatewayModal } from './components/modules/WAGatewayModal';
import { PWAOfflineBanner } from './components/PWAOfflineBanner';

export function App() {
  // Session State
  const [session, setSession] = useState<UserSession>(StorageService.getSession());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isWAModalOpen, setIsWAModalOpen] = useState(false);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => StorageService.getTheme());

  useEffect(() => {
    StorageService.setTheme(theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sidebar Visibility State (Hamburger menu)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Active Tab Navigation
  const [activeTab, setActiveTab] = useState<string>('statistik');
  const [selectedRaporStudent, setSelectedRaporStudent] = useState<Student | null>(null);

  // Application Data States
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(StorageService.getSchoolInfo());
  const [teachers, setTeachers] = useState<Teacher[]>(StorageService.getTeachers());
  const [students, setStudents] = useState<Student[]>(StorageService.getStudents());
  const [sarpras, setSarpras] = useState<SarprasItem[]>(StorageService.getSarpras());
  const [teacherDocs, setTeacherDocs] = useState<TeacherDoc[]>(StorageService.getTeacherDocs());
  const [schedules, setSchedules] = useState<ScheduleItem[]>(StorageService.getSchedules());
  const [events, setEvents] = useState<CalendarEvent[]>(StorageService.getCalendarEvents());
  const [agendas, setAgendas] = useState<AgendaItem[]>(StorageService.getAgendas());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(StorageService.getAttendance());
  const [grades, setGrades] = useState<SubjectGradeRecord[]>(StorageService.getGrades());
  const [achievements, setAchievements] = useState<StudentAchievement[]>(StorageService.getAchievements());
  const [ppdbRegistrations, setPpdbRegistrations] = useState<PpdbRegistration[]>(StorageService.getPpdbRegistrations());
  const [ppdbSettings, setPpdbSettings] = useState<PpdbSettings>(StorageService.getPpdbSettings());
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(StorageService.getGalleryItems());
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(() => StorageService.getSheetsConfig());
  const [hasSheetsMismatch, setHasSheetsMismatch] = useState<boolean>(false);

  // Pastikan identitas Kepala Sekolah di Profil Sekolah selalu 100% selaras dengan guru berjabatan 'Kepala Sekolah'
  useEffect(() => {
    const kepsek = teachers.find(
      t => t.jabatan === 'Kepala Sekolah' || t.jabatan?.toLowerCase().trim() === 'kepala sekolah'
    );
    if (kepsek) {
      const expectedNigy = kepsek.nigy || kepsek.nip || schoolInfo.nigyKepalaSekolah;
      if (
        schoolInfo.kepalaSekolah !== kepsek.nama ||
        schoolInfo.nigyKepalaSekolah !== expectedNigy ||
        schoolInfo.nipKepalaSekolah !== expectedNigy
      ) {
        const synced: SchoolInfo = {
          ...schoolInfo,
          misi: Array.isArray(schoolInfo.misi) && schoolInfo.misi.length > 0 ? schoolInfo.misi : initialSchoolInfo.misi,
          kepalaSekolah: kepsek.nama,
          nigyKepalaSekolah: expectedNigy,
          nipKepalaSekolah: expectedNigy
        };
        setSchoolInfo(synced);
        StorageService.setSchoolInfo(synced);
      }
    }
  }, [teachers]);

  // Save Handlers
  const handleSaveSchoolInfo = (info: SchoolInfo) => {
    const oldTa = schoolInfo.tahunAjaran;
    const oldSem = schoolInfo.semesterAktif;
    const isTaChanged = oldTa !== info.tahunAjaran;
    const isSemChanged = oldSem !== info.semesterAktif;

    // Tetapkan identitas Kepala Sekolah resmi dari Master Data Guru
    const officialKepsek = teachers.find(
      t => t.jabatan === 'Kepala Sekolah' || t.jabatan?.toLowerCase().trim() === 'kepala sekolah'
    );
    const finalizedInfo: SchoolInfo = {
      ...schoolInfo,
      ...info,
      misi: Array.isArray(info.misi) && info.misi.length > 0
        ? info.misi
        : (Array.isArray(schoolInfo.misi) && schoolInfo.misi.length > 0 ? schoolInfo.misi : initialSchoolInfo.misi),
      kepalaSekolah: officialKepsek ? officialKepsek.nama : (info.kepalaSekolah || schoolInfo.kepalaSekolah),
      nigyKepalaSekolah: officialKepsek ? (officialKepsek.nigy || officialKepsek.nip || info.nigyKepalaSekolah) : (info.nigyKepalaSekolah || schoolInfo.nigyKepalaSekolah),
      nipKepalaSekolah: officialKepsek ? (officialKepsek.nip || officialKepsek.nigy || info.nipKepalaSekolah) : (info.nipKepalaSekolah || schoolInfo.nipKepalaSekolah),
    };

    const isKepsekChanged =
      schoolInfo.kepalaSekolah !== finalizedInfo.kepalaSekolah ||
      schoolInfo.nigyKepalaSekolah !== finalizedInfo.nigyKepalaSekolah ||
      schoolInfo.nipKepalaSekolah !== finalizedInfo.nipKepalaSekolah;

    setSchoolInfo(finalizedInfo);
    StorageService.setSchoolInfo(finalizedInfo);

    // Auto-synchronize Kepala Sekolah to Data Guru
    if (isKepsekChanged && info.kepalaSekolah) {
      const cleanKepsekName = info.kepalaSekolah.trim().toLowerCase();
      let teacherUpdated = false;

      let updatedTeachers = teachers.map(t => {
        const matchName = t.nama.trim().toLowerCase() === cleanKepsekName;
        if (matchName) {
          teacherUpdated = true;
          return {
            ...t,
            jabatan: 'Kepala Sekolah',
            nigy: info.nigyKepalaSekolah || info.nipKepalaSekolah || t.nigy,
            nip: info.nipKepalaSekolah || info.nigyKepalaSekolah || t.nip
          };
        }
        // If someone else was previous Kepala Sekolah, revert their jabatan to 'Guru Mata Pelajaran'
        if (t.jabatan === 'Kepala Sekolah' && !matchName) {
          return {
            ...t,
            jabatan: 'Guru Mata Pelajaran'
          };
        }
        return t;
      });

      // If no teacher matched by name, but we have a teacher with jabatan === 'Kepala Sekolah', update that teacher's name
      if (!teacherUpdated) {
        const existingKepsekIdx = teachers.findIndex(t => t.jabatan === 'Kepala Sekolah');
        if (existingKepsekIdx >= 0) {
          updatedTeachers = updatedTeachers.map((t, idx) => {
            if (idx === existingKepsekIdx) {
              return {
                ...t,
                nama: info.kepalaSekolah,
                nigy: info.nigyKepalaSekolah || info.nipKepalaSekolah || t.nigy,
                nip: info.nipKepalaSekolah || info.nigyKepalaSekolah || t.nip
              };
            }
            return t;
          });
        }
      }

      setTeachers(updatedTeachers);
      StorageService.setTeachers(updatedTeachers);
    }

    // Auto-synchronize dependent modules when Master Tahun Ajaran or Semester is updated
    if (isTaChanged || isSemChanged) {
      // 1. Synchronize Grades (Nilai & Asesmen)
      const updatedGrades = grades.map(g => ({
        ...g,
        tahunAjaran: isTaChanged ? info.tahunAjaran : g.tahunAjaran,
        semester: isSemChanged ? (info.semesterAktif as 'Ganjil' | 'Genap') : g.semester
      }));
      setGrades(updatedGrades);
      StorageService.setGrades(updatedGrades);

      // 2. Synchronize Teacher Administration Docs (Modul Ajar, Prota, Promes)
      const updatedDocs = teacherDocs.map(d => ({
        ...d,
        tahunAjaran: isTaChanged ? info.tahunAjaran : d.tahunAjaran
      }));
      setTeacherDocs(updatedDocs);
      StorageService.setTeacherDocs(updatedDocs);

      // 3. Synchronize PPDB Settings
      if (isTaChanged) {
        const currentPpdb = StorageService.getPpdbSettings();
        const updatedPpdb = { ...currentPpdb, tahunAjaran: info.tahunAjaran };
        setPpdbSettings(updatedPpdb);
        StorageService.savePpdbSettings(updatedPpdb);
      }

      // 4. Log Audit Trail Tahun Ajaran
      StorageService.addAuditLog({
        userName: session.name || 'Admin DAPODIK',
        userRole: session.role === 'admin' ? 'Administrator' : 'Kepala Sekolah',
        action: 'SYNC_TAHUN_AJARAN',
        module: 'Data Profil Sekolah (Master TA)',
        details: `Otomatis menyinkronkan Tahun Ajaran Master ke seluruh modul (PPDB, Nilai & Rapor, Presensi Siswa, Administrasi Guru, Jadwal Pelajaran).`,
        previousDataSummary: `TA Sebelumnya: ${oldTa} (${oldSem})`,
        newDataSummary: `TA Baru: ${info.tahunAjaran} (${info.semesterAktif})`
      });
    }

    // 5. Log Audit Trail Perubahan Kepala Sekolah
    if (isKepsekChanged) {
      StorageService.addAuditLog({
        userName: session.name || 'Admin DAPODIK',
        userRole: session.role === 'admin' ? 'Administrator' : 'Kepala Sekolah',
        action: 'PERUBAHAN_KEPALA_SEKOLAH',
        module: 'Data Profil Sekolah (Identitas Kepsek)',
        details: `Perubahan data pejabat Kepala Sekolah resmi dan sinkronisasi ke Master Data Guru: ${schoolInfo.kepalaSekolah || '-'} ➔ ${finalizedInfo.kepalaSekolah}.`,
        previousDataSummary: `Kepala Sekolah: ${schoolInfo.kepalaSekolah || '-'} (NIGY: ${schoolInfo.nigyKepalaSekolah || '-'})`,
        newDataSummary: `Kepala Sekolah: ${finalizedInfo.kepalaSekolah} (NIGY: ${finalizedInfo.nigyKepalaSekolah || '-'})`
      });
    }

    // 6. Log Audit Trail Pembaruan Profil Sekolah Umum
    const isProfileMetaChanged =
      schoolInfo.nama !== finalizedInfo.nama ||
      schoolInfo.npsn !== finalizedInfo.npsn ||
      schoolInfo.akreditasi !== finalizedInfo.akreditasi ||
      schoolInfo.visi !== finalizedInfo.visi ||
      schoolInfo.logoUrl !== finalizedInfo.logoUrl ||
      schoolInfo.alamat !== finalizedInfo.alamat ||
      schoolInfo.telepon !== finalizedInfo.telepon ||
      schoolInfo.email !== finalizedInfo.email;

    if (isProfileMetaChanged && !isTaChanged && !isSemChanged && !isKepsekChanged) {
      StorageService.addAuditLog({
        userName: session.name || 'Admin DAPODIK',
        userRole: session.role === 'admin' ? 'Administrator' : 'Admin',
        action: 'UPDATE_PROFIL_SEKOLAH',
        module: 'Data Profil Sekolah',
        details: `Pembaruan data profil, identitas, kontak, dan visi-misi sekolah.`,
        previousDataSummary: `Nama: ${schoolInfo.nama}, NPSN: ${schoolInfo.npsn}, Akreditasi: ${schoolInfo.akreditasi}`,
        newDataSummary: `Nama: ${finalizedInfo.nama}, NPSN: ${finalizedInfo.npsn}, Akreditasi: ${finalizedInfo.akreditasi}`
      });
    }
  };

  const handleSavePpdbSettings = (updated: PpdbSettings) => {
    setPpdbSettings(updated);
    StorageService.savePpdbSettings(updated);
  };

  const handleSavePpdbRegistrations = (updated: PpdbRegistration[]) => {
    setPpdbRegistrations(updated);
    StorageService.savePpdbRegistrations(updated);
  };

  const handleSaveGalleryItems = (updated: GalleryItem[]) => {
    setGalleryItems(updated);
    StorageService.saveGalleryItems(updated);
  };

  const handleAddStudentFromPpdb = (newStudentData: Omit<Student, 'id' | 'nis'>) => {
    const nextId = `S${String(students.length + 1).padStart(3, '0')}`;
    const nextNis = `${new Date().getFullYear()}${String(students.length + 1).padStart(3, '0')}`;
    const newStudent: Student = {
      ...newStudentData,
      id: nextId,
      nis: nextNis
    };
    const updated = [...students, newStudent];
    setStudents(updated);
    StorageService.setStudents(updated);
  };

  const handleSaveTeachers = (updated: Teacher[]) => {
    setTeachers(updated);
    StorageService.setTeachers(updated);

    // Synchronize Kepala Sekolah from Data Guru to School Info
    const kepsekTeacher = updated.find(
      t => t.jabatan === 'Kepala Sekolah' || t.jabatan.toLowerCase().trim() === 'kepala sekolah'
    );
    if (kepsekTeacher) {
      const isKepsekDifferent =
        schoolInfo.kepalaSekolah !== kepsekTeacher.nama ||
        (kepsekTeacher.nigy && schoolInfo.nigyKepalaSekolah !== kepsekTeacher.nigy) ||
        (kepsekTeacher.nip && schoolInfo.nipKepalaSekolah !== kepsekTeacher.nip);

      if (isKepsekDifferent) {
        const updatedSchoolInfo: SchoolInfo = {
          ...schoolInfo,
          kepalaSekolah: kepsekTeacher.nama,
          nigyKepalaSekolah: kepsekTeacher.nigy || kepsekTeacher.nip || schoolInfo.nigyKepalaSekolah,
          nipKepalaSekolah: kepsekTeacher.nip || kepsekTeacher.nigy || schoolInfo.nipKepalaSekolah
        };
        setSchoolInfo(updatedSchoolInfo);
        StorageService.setSchoolInfo(updatedSchoolInfo);
      }
    }
  };

  const handleSaveStudents = (updated: Student[]) => {
    setStudents(updated);
    StorageService.setStudents(updated);
  };

  const handleSaveSarpras = (updated: SarprasItem[]) => {
    setSarpras(updated);
    StorageService.setSarpras(updated);
  };

  const handleSaveDocs = (updated: TeacherDoc[]) => {
    setTeacherDocs(updated);
    StorageService.setTeacherDocs(updated);
  };

  const handleSaveSchedules = (updated: ScheduleItem[]) => {
    setSchedules(updated);
    StorageService.setSchedules(updated);
  };

  const handleSaveEvents = (updated: CalendarEvent[]) => {
    setEvents(updated);
    StorageService.setCalendarEvents(updated);
  };

  const handleSaveAgendas = (updated: AgendaItem[]) => {
    setAgendas(updated);
    StorageService.setAgendas(updated);
  };

  const handleSaveAttendance = (updated: AttendanceRecord[]) => {
    setAttendance(updated);
    StorageService.setAttendance(updated);
  };

  const handleSaveGrades = (updated: SubjectGradeRecord[]) => {
    setGrades(updated);
    StorageService.setGrades(updated);
  };

  const handleSaveAchievements = (updated: StudentAchievement[]) => {
    setAchievements(updated);
    StorageService.setAchievements(updated);
  };

  const handleSaveSheetsConfig = (updated: GoogleSheetsConfig) => {
    setSheetsConfig(updated);
    setHasSheetsMismatch(false);
    StorageService.setSheetsConfig(updated);
  };

  const handleRefreshAllData = () => {
    setSchoolInfo(StorageService.getSchoolInfo());
    setTeachers(StorageService.getTeachers());
    setStudents(StorageService.getStudents());
    setSarpras(StorageService.getSarpras());
    setTeacherDocs(StorageService.getTeacherDocs());
    setSchedules(StorageService.getSchedules());
    setEvents(StorageService.getCalendarEvents());
    setAgendas(StorageService.getAgendas());
    setAttendance(StorageService.getAttendance());
    setGrades(StorageService.getGrades());
    setAchievements(StorageService.getAchievements());
    setPpdbRegistrations(StorageService.getPpdbRegistrations());
    setPpdbSettings(StorageService.getPpdbSettings());
    setGalleryItems(StorageService.getGalleryItems());
    setSheetsConfig(StorageService.getSheetsConfig());
  };

  // Auto-Sync on Load: State & Background Engine
  const [autoSyncStatus, setAutoSyncStatus] = useState<{
    status: 'idle' | 'checking' | 'synced' | 'offline';
    lastSyncTime?: string;
    message?: string;
  }>({
    status: 'idle',
    lastSyncTime: sheetsConfig.lastPulledAt
  });

  const [autoSyncToast, setAutoSyncToast] = useState<{
    show: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // Deteksi tautan konfigurasi otomatis dari URL query (?sheetUrl=... atau ?scriptUrl=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedUrl = params.get('sheetUrl') || params.get('scriptUrl');
      if (sharedUrl && sharedUrl.startsWith('https://script.google.com/') && sharedUrl.includes('/exec')) {
        const cleanUrl = sharedUrl.trim();
        const currentCfg = StorageService.getSheetsConfig();
        const updatedCfg: GoogleSheetsConfig = {
          ...currentCfg,
          webAppUrl: cleanUrl,
          isLocked: true
        };
        StorageService.saveSheetsConfig(updatedCfg);
        setSheetsConfig(updatedCfg);
        setAutoSyncToast({
          show: true,
          message: 'URL Google Apps Script Berhasil Diterapkan!',
          details: 'Perangkat ini kini otomatis terhubung ke database Google Sheets sekolah tanpa mengetik ulang.'
        });
        setTimeout(() => setAutoSyncToast(null), 6000);

        // Hapus query params dari address bar tanpa reload browser
        const cleanPath = window.location.pathname + (window.location.hash || '');
        window.history.replaceState({}, document.title, cleanPath);
      }
    } catch (err) {
      console.warn('Gagal memproses parameter sinkronisasi URL:', err);
    }
  }, []);

  // Core auto-pull application helper
  const applyPulledSheetsData = (data: any, isSimulated = false) => {
    const updatedItems: string[] = [];

    if (Array.isArray(data.classes) && data.classes.length > 0) {
      const cleanClasses = data.classes
        .map((c: any) => String(c).trim())
        .filter((c: string) => Boolean(c) && !['7A', '7B', '8A', '8B', '9A', '9B'].includes(c));
      if (cleanClasses.length > 0) {
        StorageService.setClasses(cleanClasses);
      }
    }
    if (Array.isArray(data.schedules) && data.schedules.length > 0) {
      handleSaveSchedules(data.schedules);
      updatedItems.push(`${data.schedules.length} Jadwal Pelajaran`);
    }
    if (Array.isArray(data.events) && data.events.length > 0) {
      handleSaveEvents(data.events);
      updatedItems.push(`${data.events.length} Agenda Kalender`);
    }
    if (Array.isArray(data.teachers) && data.teachers.length > 0) {
      handleSaveTeachers(data.teachers);
      updatedItems.push(`${data.teachers.length} Data Guru`);
    }
    if (Array.isArray(data.students) && data.students.length > 0) {
      handleSaveStudents(data.students);
      updatedItems.push(`${data.students.length} Data Siswa`);
    }
    if (Array.isArray(data.sarpras) && data.sarpras.length > 0) {
      handleSaveSarpras(data.sarpras);
      updatedItems.push(`${data.sarpras.length} Sarpras`);
    }
    if (Array.isArray(data.ppdbRegistrations) && data.ppdbRegistrations.length > 0) {
      handleSavePpdbRegistrations(data.ppdbRegistrations);
      updatedItems.push(`${data.ppdbRegistrations.length} Data PPDB`);
    }
    if (Array.isArray(data.achievements) && data.achievements.length > 0) {
      handleSaveAchievements(data.achievements);
      updatedItems.push(`${data.achievements.length} Prestasi Siswa`);
    }
    if (Array.isArray(data.grades) && data.grades.length > 0) {
      handleSaveGrades(data.grades);
      updatedItems.push(`${data.grades.length} Rekap Nilai Asesmen`);
    }
    if (Array.isArray(data.attendance) && data.attendance.length > 0) {
      handleSaveAttendance(data.attendance);
      updatedItems.push(`${data.attendance.length} Jurnal Presensi`);
    }
    if (data.schoolInfo && data.schoolInfo.nama) {
      let normalizedMisi = Array.isArray(schoolInfo.misi) && schoolInfo.misi.length > 0 ? schoolInfo.misi : initialSchoolInfo.misi;
      if (Array.isArray(data.schoolInfo.misi) && data.schoolInfo.misi.length > 0) {
        normalizedMisi = data.schoolInfo.misi;
      } else if (typeof data.schoolInfo.misi === 'string' && data.schoolInfo.misi.trim()) {
        normalizedMisi = data.schoolInfo.misi.split(/[\r\n]+/).map((m: string) => m.replace(/^[0-9]+[.)-]\s*/, '').trim()).filter(Boolean);
      }

      handleSaveSchoolInfo({
        ...data.schoolInfo,
        misi: normalizedMisi
      });
      updatedItems.push('Profil Sekolah');
    }

    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const updatedConfig: GoogleSheetsConfig = {
      ...sheetsConfig,
      lastPulledAt: nowTime
    };
    setSheetsConfig(updatedConfig);
    StorageService.setSheetsConfig(updatedConfig);

    setAutoSyncStatus({
      status: 'synced',
      lastSyncTime: nowTime,
      message: updatedItems.length > 0 ? `Sinkron otomatis: ${updatedItems.join(', ')}` : 'Data Sheets termutakhir'
    });

    // Sinkronisasi otomatis berjalan hening di latar; toast hanya untuk simulasi uji manual admin
    if (isSimulated) {
      setAutoSyncToast({
        show: true,
        message: 'Simulasi Auto-Sync Berhasil Diterapkan',
        details: updatedItems.length > 0 ? updatedItems.join(' • ') : 'Data terbaru telah aktif di HP Anda'
      });
      setTimeout(() => {
        setAutoSyncToast(null);
      }, 4000);
    }
  };

  // Manual or Test Trigger for Auto-Sync
  const triggerManualAutoSync = async (simulatedData?: any) => {
    if (simulatedData) {
      setAutoSyncStatus(prev => ({ ...prev, status: 'checking' }));
      setTimeout(() => {
        applyPulledSheetsData(simulatedData, true);
      }, 600);
      return;
    }

    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_WEB_APP_URL;
    setAutoSyncStatus(prev => ({ ...prev, status: 'checking' }));

    const res = await fetchFromGoogleSheets(targetUrl, 7000);
    if (res.success && res.data) {
      applyPulledSheetsData(res.data);
    } else {
      setAutoSyncStatus({
        status: 'offline',
        lastSyncTime: sheetsConfig.lastPulledAt,
        message: res.error || 'Gagal sinkron dengan Google Sheets. Periksa koneksi internet.'
      });
    }
  };

  // Run Auto-Sync on app mount, tab focus, and periodic silent background checks
  useEffect(() => {
    if (sheetsConfig.autoSyncOnLoad === false) return;

    const targetUrl = sheetsConfig.webAppUrl || DEFAULT_SHEETS_WEB_APP_URL;
    const validation = validateSheetsUrl(targetUrl);
    if (!validation.isValid) return;

    let isMounted = true;
    let lastFetchTimestamp = 0;

    const performSilentFetch = () => {
      if (!isMounted) return;
      if (!navigator.onLine) {
        setAutoSyncStatus(prev => ({
          ...prev,
          status: 'offline',
          message: 'Perangkat offline (tidak ada sinyal internet)'
        }));
        return;
      }

      const now = Date.now();
      // Throttle: hindari pemanggilan beruntun jika jarak kurang dari 30 detik
      if (now - lastFetchTimestamp < 30000) return;
      lastFetchTimestamp = now;

      setAutoSyncStatus(prev => ({ ...prev, status: 'checking' }));

      fetchFromGoogleSheets(targetUrl, 7000)
        .then(res => {
          if (!isMounted) return;
          if (res.success && res.data) {
            applyPulledSheetsData(res.data);
          } else {
            setAutoSyncStatus({
              status: 'offline',
              lastSyncTime: sheetsConfig.lastPulledAt,
              message: res.error || 'Google Sheets tidak merespons (periksa koneksi)'
            });
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setAutoSyncStatus({
            status: 'offline',
            lastSyncTime: sheetsConfig.lastPulledAt,
            message: 'Koneksi terputus / gagal menjangkau Google Sheets'
          });
        });
    };

    // 1. Jalankan hening saat aplikasi pertama kali dibuka (on load)
    performSilentFetch();

    // 2. Jalankan otomatis saat pengguna kembali membuka tab ini (tab focus / visibilitychange)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSilentFetch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Deteksi status jaringan internet perangkat (Offline / Online)
    const handleNetworkOffline = () => {
      setAutoSyncStatus(prev => ({
        ...prev,
        status: 'offline',
        message: 'Perangkat offline (tidak ada koneksi internet)'
      }));
    };
    const handleNetworkOnline = () => {
      performSilentFetch();
    };
    window.addEventListener('offline', handleNetworkOffline);
    window.addEventListener('online', handleNetworkOnline);

    // 4. Polling hening berkala setiap 3 menit untuk mendeteksi perubahan dari Google Sheets
    const intervalTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        performSilentFetch();
      }
    }, 180000); // 3 menit

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offline', handleNetworkOffline);
      window.removeEventListener('online', handleNetworkOnline);
      clearInterval(intervalTimer);
    };
  }, [sheetsConfig.webAppUrl, sheetsConfig.autoSyncOnLoad]);

  // Login / Logout Handlers
  const handleLogin = (user: UserSession) => {
    setSession(user);
    StorageService.setSession(user);

    // Redirect to default tab for user role
    if (user.role === 'admin') {
      setActiveTab('data-sekolah');
    } else if (user.role === 'guru') {
      setActiveTab('administrasi-guru');
    } else {
      setActiveTab('statistik');
    }
  };

  const handleLogout = () => {
    const publicUser: UserSession = { role: 'public', name: 'Umum / Wali Santri' };
    setSession(publicUser);
    StorageService.setSession(publicUser);
    setActiveTab('statistik');
  };

  const handleSelectStudentForRapor = (student: Student) => {
    setSelectedRaporStudent(student);
    setActiveTab('laporan-rapor');
  };

  // Tab selector handler
  const handleSelectTab = (tab: string) => {
    if (tab === 'wa-gateway') {
      setIsWAModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950/80 font-sans text-slate-100 flex flex-col relative overflow-x-clip">
      {/* Frosted Glass Radial Gradient Background */}
      <div className="mesh-bg" />
      
      {/* Top Navigation Bar */}
      <Header
        schoolInfo={schoolInfo}
        session={session}
        teachers={teachers}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        sheetsConfig={sheetsConfig}
        hasSheetsMismatch={hasSheetsMismatch}
        autoSyncStatus={autoSyncStatus}
        onTriggerAutoSync={triggerManualAutoSync}
      />

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6 relative">
        
        {/* Sidebar Navigation */}
        {isSidebarOpen && (
          <>
            {/* Mobile Backdrop for drawer overlay */}
            <div 
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
            />

            {/* Sidebar Drawer Container */}
            <div className="fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto w-72 lg:w-64 shrink-0 p-4 lg:p-0 bg-slate-950/95 lg:bg-transparent overflow-y-auto lg:overflow-visible transition-all duration-300">
              <Sidebar
                session={session}
                teachers={teachers}
                activeTab={activeTab}
                setActiveTab={handleSelectTab}
                onCloseMobile={() => setIsSidebarOpen(false)}
                onOpenLoginModal={() => setIsLoginOpen(true)}
                onLogout={handleLogout}
              />
            </div>
          </>
        )}

        {/* Main Content View Switcher */}
        <main className="flex-1 min-w-0">
          
          {/* PWA & Offline Status Banner */}
          <PWAOfflineBanner
            onNavigateToSheets={session.role === 'admin' ? () => setActiveTab('google-sheets') : undefined}
            schoolInfo={schoolInfo}
            session={session}
          />

          <div key={activeTab} className="page-transition">
            {/* PUBLIC VIEWS */}
            {activeTab === 'statistik' && (
            <PublicStatistik
              schoolInfo={schoolInfo}
              students={students}
              teachers={teachers}
              schedules={schedules}
              sarpras={sarpras}
              attendance={attendance}
              grades={grades}
              achievements={achievements}
              session={session}
              autoSyncStatus={autoSyncStatus}
              onTriggerAutoSync={session.role === 'admin' ? triggerManualAutoSync : undefined}
              onNavigateToSheets={session.role === 'admin' ? () => setActiveTab('google-sheets') : undefined}
            />
          )}

          {activeTab === 'ppdb' && (
            <PublicPpdb
              registrations={ppdbRegistrations}
              schoolInfo={schoolInfo}
              session={session}
              onSaveRegistrations={handleSavePpdbRegistrations}
              onAddStudentFromPpdb={handleAddStudentFromPpdb}
              settings={ppdbSettings}
              onSaveSettings={handleSavePpdbSettings}
            />
          )}

          {activeTab === 'galeri' && (
            <PublicGaleri
              galleryItems={galleryItems}
              session={session}
              onSaveGalleryItems={handleSaveGalleryItems}
              schoolInfo={schoolInfo}
            />
          )}

          {activeTab === 'prestasi' && (
            <PublicPrestasi
              achievements={achievements}
              students={students}
              schedules={schedules}
              teachers={teachers}
              session={session}
              onSaveAchievements={handleSaveAchievements}
              autoSyncStatus={autoSyncStatus}
              onTriggerAutoSync={session.role === 'admin' ? triggerManualAutoSync : undefined}
              onNavigateToSheets={session.role === 'admin' ? () => setActiveTab('google-sheets') : undefined}
              schoolInfo={schoolInfo}
            />
          )}

          {(activeTab === 'jadwal' || activeTab === 'jadwal-publik') && (
            <PublicJadwal
              schedules={schedules}
              teachers={teachers}
              students={students}
              schoolInfo={schoolInfo}
            />
          )}

          {(activeTab === 'agenda' || activeTab === 'agenda-publik' || activeTab === 'kalender' || activeTab === 'kalender-publik' || activeTab === 'agenda-kalender') && (
            <PublicKalenderAgenda
              events={events}
              agendas={agendas}
              schoolInfo={schoolInfo}
              defaultView={activeTab === 'agenda' || activeTab === 'agenda-publik' ? 'agenda' : 'kalender'}
            />
          )}

          {activeTab === 'portal-rapor' && (
            <PublicPortalRapor
              students={students}
              attendance={attendance}
              grades={grades}
              schoolInfo={schoolInfo}
              teachers={teachers}
              session={session}
              onSelectStudentForRapor={handleSelectStudentForRapor}
            />
          )}

          {/* MODULE VIEWS */}
          {activeTab === 'data-sekolah' && (
            <DataSekolahView
              schoolInfo={schoolInfo}
              teachers={teachers}
              session={session}
              onSave={handleSaveSchoolInfo}
              onNavigateToTeachers={() => setActiveTab('data-guru')}
            />
          )}

          {activeTab === 'data-guru' && (
            <DataGuruView
              teachers={teachers}
              students={students}
              schedules={schedules}
              schoolInfo={schoolInfo}
              onSaveTeachers={handleSaveTeachers}
            />
          )}

          {activeTab === 'data-siswa' && (
            <DataSiswaView
              students={students}
              onSaveStudents={handleSaveStudents}
              schedules={schedules}
              onSaveSchedules={handleSaveSchedules}
              teachers={teachers}
              onSaveTeachers={handleSaveTeachers}
              schoolInfo={schoolInfo}
              session={session}
            />
          )}

          {activeTab === 'data-sarpras' && (
            <DataSarprasView
              sarpras={sarpras}
              onSaveSarpras={handleSaveSarpras}
              session={session}
              teachers={teachers}
              schoolInfo={schoolInfo}
            />
          )}

          {activeTab === 'kelola-jadwal' && (
            <JadwalKelolaView
              schedules={schedules}
              teachers={teachers}
              students={students}
              schoolInfo={schoolInfo}
              sarpras={sarpras}
              session={session}
              onSaveSchedules={handleSaveSchedules}
              onSaveStudents={handleSaveStudents}
              onSaveTeachers={handleSaveTeachers}
            />
          )}

          {activeTab === 'kelola-kalender' && (
            <KalenderKelolaView
              events={events}
              agendas={agendas}
              session={session}
              teachers={teachers}
              onSaveEvents={handleSaveEvents}
              onSaveAgendas={handleSaveAgendas}
            />
          )}

          {activeTab === 'administrasi-guru' && (
            <AdministrasiGuruView
              docs={teacherDocs}
              teachers={teachers}
              session={session}
              schoolInfo={schoolInfo}
              onSaveDocs={handleSaveDocs}
            />
          )}

          {activeTab === 'absensi-siswa' && (
            <AbsensiSiswaView
              students={students}
              attendance={attendance}
              teachers={teachers}
              session={session}
              schoolInfo={schoolInfo}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {activeTab === 'input-nilai' && (
            <InputNilaiView
              students={students}
              grades={grades}
              teachers={teachers}
              session={session}
              schoolInfo={schoolInfo}
              onSaveGrades={handleSaveGrades}
              sheetsConfig={sheetsConfig}
            />
          )}

          {activeTab === 'laporan-rapor' && (
            <LaporanRaporView
              students={students}
              grades={grades}
              attendance={attendance}
              schoolInfo={schoolInfo}
              teachers={teachers}
              initialSelectedStudent={selectedRaporStudent}
              onBack={() => setActiveTab('statistik')}
              onSaveStudents={handleSaveStudents}
            />
          )}

          {(activeTab === 'google-sheets' || activeTab === 'sheets' || activeTab === 'master-backup' || activeTab === 'backup') && (
            session.role === 'admin' ? (
              <GoogleSheetsIntegration
                session={session}
                students={students}
                teachers={teachers}
                sarpras={sarpras}
                attendance={attendance}
                grades={grades}
                achievements={achievements}
                schoolInfo={schoolInfo}
                schedules={schedules}
                events={events}
                ppdbRegistrations={ppdbRegistrations}
                sheetsConfig={sheetsConfig}
                onSaveSheetsConfig={handleSaveSheetsConfig}
                onUrlDraftChange={setHasSheetsMismatch}
                onImportStudents={handleSaveStudents}
                onImportTeachers={handleSaveTeachers}
                onImportSarpras={handleSaveSarpras}
                onImportSchedules={handleSaveSchedules}
                onImportEvents={handleSaveEvents}
                onImportPpdb={handleSavePpdbRegistrations}
                onImportSchoolInfo={handleSaveSchoolInfo}
                onImportGrades={handleSaveGrades}
                onImportAttendance={handleSaveAttendance}
                onImportAchievements={handleSaveAchievements}
                autoSyncStatus={autoSyncStatus}
                onTriggerAutoSync={triggerManualAutoSync}
                initialSubTab={activeTab === 'master-backup' || activeTab === 'backup' ? 'backup' : 'sheets'}
                onRefreshAllData={handleRefreshAllData}
              />
            ) : (
              <div className="glass backdrop-blur-xl bg-slate-900/80 border border-white/10 rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white font-serif">Akses Khusus Administrator</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Halaman Integrasi Google Sheets &amp; Database Cadangan dikhususkan untuk Administrator SIM DAPODIK. Silakan masuk dengan akun Admin untuk mengelola data sinkronisasi.
                </p>
                <button
                  onClick={() => setActiveTab('statistik')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Kembali ke Beranda
                </button>
              </div>
            )
          )}
          </div>

        </main>

      </div>

      {/* Auto-Sync Live Toast Notification */}
      {autoSyncToast && autoSyncToast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900/95 border border-emerald-500/50 shadow-2xl rounded-2xl p-4 text-white backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/40 mt-0.5">
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <h4 className="text-xs font-bold text-emerald-300">{autoSyncToast.message}</h4>
              </div>
              {autoSyncToast.details && (
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{autoSyncToast.details}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setAutoSyncToast(null)}
              className="text-slate-400 hover:text-white text-xs p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Tutup notifikasi"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
        teachers={teachers}
        schoolInfo={schoolInfo}
      />

      {/* WhatsApp Gateway Modal */}
      <WAGatewayModal
        isOpen={isWAModalOpen}
        onClose={() => setIsWAModalOpen(false)}
        schoolName={schoolInfo.nama}
      />

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-white/10 glass backdrop-blur-xl bg-slate-900/60 py-4 text-center text-xs text-slate-400">
        <p className="font-serif font-bold text-emerald-400 uppercase">
          {schoolInfo.nama || 'SMP PLUS DAARUL MUTTAQIEN'}
        </p>
        <p className="text-[11px] mt-0.5 text-slate-300">
          Sistem Informasi Data Pokok Pendidikan &amp; Asesmen Rapor Kurikulum Merdeka Terintegrasi Google Sheets
        </p>
      </footer>

    </div>
  );
}

export default App;
