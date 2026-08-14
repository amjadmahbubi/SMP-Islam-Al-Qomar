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
  GalleryItem
} from './types';
import { StorageService } from './services/storage';

// Core Layout
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginModal } from './components/LoginModal';

// Public Views
import { PublicStatistik } from './components/public/PublicStatistik';
import { PublicJadwal } from './components/public/PublicJadwal';
import { PublicAgenda } from './components/public/PublicAgenda';
import { PublicKalender } from './components/public/PublicKalender';
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
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(StorageService.getGalleryItems());

  // Save Handlers
  const handleSaveSchoolInfo = (info: SchoolInfo) => {
    setSchoolInfo(info);
    StorageService.setSchoolInfo(info);
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
    const nextNis = `2025${String(students.length + 1).padStart(3, '0')}`;
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
    <div className="min-h-screen bg-slate-950/80 font-sans text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Frosted Glass Radial Gradient Background */}
      <div className="mesh-bg" />
      
      {/* Top Navigation Bar */}
      <Header
        schoolInfo={schoolInfo}
        session={session}
        onOpenLoginModal={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        theme={theme}
        onToggleTheme={handleToggleTheme}
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
                activeTab={activeTab}
                setActiveTab={handleSelectTab}
                onCloseMobile={() => setIsSidebarOpen(false)}
              />
            </div>
          </>
        )}

        {/* Main Content View Switcher */}
        <main className="flex-1 min-w-0">
          
          {/* PWA & Offline Status Banner */}
          <PWAOfflineBanner onNavigateToSheets={() => setActiveTab('google-sheets')} />

          {/* PUBLIC VIEWS */}
          {activeTab === 'statistik' && (
            <PublicStatistik
              schoolInfo={schoolInfo}
              students={students}
              teachers={teachers}
              sarpras={sarpras}
              attendance={attendance}
              grades={grades}
            />
          )}

          {activeTab === 'ppdb' && (
            <PublicPpdb
              registrations={ppdbRegistrations}
              schoolInfo={schoolInfo}
              session={session}
              onSaveRegistrations={handleSavePpdbRegistrations}
              onAddStudentFromPpdb={handleAddStudentFromPpdb}
            />
          )}

          {activeTab === 'galeri' && (
            <PublicGaleri
              galleryItems={galleryItems}
              session={session}
              onSaveGalleryItems={handleSaveGalleryItems}
            />
          )}

          {activeTab === 'prestasi' && (
            <PublicPrestasi
              achievements={achievements}
              students={students}
              session={session}
              onSaveAchievements={handleSaveAchievements}
            />
          )}

          {(activeTab === 'jadwal' || activeTab === 'jadwal-publik') && (
            <PublicJadwal
              schedules={schedules}
              teachers={teachers}
            />
          )}

          {(activeTab === 'agenda' || activeTab === 'agenda-publik') && (
            <PublicAgenda
              agendas={agendas}
            />
          )}

          {(activeTab === 'kalender' || activeTab === 'kalender-publik') && (
            <PublicKalender
              events={events}
              schoolInfo={schoolInfo}
            />
          )}

          {activeTab === 'portal-rapor' && (
            <PublicPortalRapor
              students={students}
              attendance={attendance}
              grades={grades}
              schoolInfo={schoolInfo}
              teachers={teachers}
              onSelectStudentForRapor={handleSelectStudentForRapor}
            />
          )}

          {/* MODULE VIEWS */}
          {activeTab === 'data-sekolah' && (
            <DataSekolahView
              schoolInfo={schoolInfo}
              onSave={handleSaveSchoolInfo}
            />
          )}

          {activeTab === 'data-guru' && (
            <DataGuruView
              teachers={teachers}
              onSaveTeachers={handleSaveTeachers}
            />
          )}

          {activeTab === 'data-siswa' && (
            <DataSiswaView
              students={students}
              onSaveStudents={handleSaveStudents}
            />
          )}

          {activeTab === 'data-sarpras' && (
            <DataSarprasView
              sarpras={sarpras}
              onSaveSarpras={handleSaveSarpras}
            />
          )}

          {activeTab === 'kelola-jadwal' && (
            <JadwalKelolaView
              schedules={schedules}
              teachers={teachers}
              onSaveSchedules={handleSaveSchedules}
            />
          )}

          {activeTab === 'kelola-kalender' && (
            <KalenderKelolaView
              events={events}
              agendas={agendas}
              onSaveEvents={handleSaveEvents}
              onSaveAgendas={handleSaveAgendas}
            />
          )}

          {activeTab === 'administrasi-guru' && (
            <AdministrasiGuruView
              docs={teacherDocs}
              teachers={teachers}
              session={session}
              onSaveDocs={handleSaveDocs}
            />
          )}

          {activeTab === 'absensi-siswa' && (
            <AbsensiSiswaView
              students={students}
              attendance={attendance}
              teachers={teachers}
              session={session}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {activeTab === 'input-nilai' && (
            <InputNilaiView
              students={students}
              grades={grades}
              teachers={teachers}
              session={session}
              onSaveGrades={handleSaveGrades}
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
            />
          )}

          {(activeTab === 'google-sheets' || activeTab === 'sheets') && (
            <GoogleSheetsIntegration
              students={students}
              teachers={teachers}
              sarpras={sarpras}
              attendance={attendance}
              grades={grades}
              schoolInfo={schoolInfo}
              schedules={schedules}
              events={events}
              ppdbRegistrations={ppdbRegistrations}
              onImportStudents={handleSaveStudents}
              onImportTeachers={handleSaveTeachers}
              onImportSarpras={handleSaveSarpras}
              onImportSchedules={handleSaveSchedules}
              onImportEvents={handleSaveEvents}
              onImportPpdb={handleSavePpdbRegistrations}
              onImportSchoolInfo={handleSaveSchoolInfo}
            />
          )}

        </main>

      </div>

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
        <p className="font-serif font-bold text-emerald-400">
          DAPODIK SMP ISLAM AL QOMAR BANYUWANGI
        </p>
        <p className="text-[11px] mt-0.5 text-slate-300">
          Sistem Informasi Data Pokok Pendidikan & Asesmen Raport Kurikulum Merdeka Terintegrasi Google Sheets
        </p>
      </footer>

    </div>
  );
}

export default App;
