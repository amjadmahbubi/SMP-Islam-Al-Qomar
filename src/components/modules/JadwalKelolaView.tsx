import React, { useState } from 'react';
import { ScheduleItem, Teacher, Student, SchoolInfo, SarprasItem, UserSession } from '../../types';
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  Sparkles,
  BookOpen,
  Layers,
  Check,
  Settings,
  Building2,
  UserCheck,
  ShieldCheck,
  Calendar,
  Sparkle,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Info
} from 'lucide-react';
import { DEFAULT_MAPEL_LIST, COMMON_SCHEDULE_ACTIVITIES, getAllClasses } from '../../data/constants';
import { KelolaKelasModal } from './KelolaKelasModal';

interface JadwalKelolaViewProps {
  schedules: ScheduleItem[];
  teachers: Teacher[];
  students?: Student[];
  schoolInfo?: SchoolInfo;
  sarpras?: SarprasItem[];
  session?: UserSession;
  onSaveSchedules: (schedules: ScheduleItem[]) => void;
  onSaveStudents?: (students: Student[]) => void;
  onSaveTeachers?: (teachers: Teacher[]) => void;
}

const HOURS = ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];
const BASE_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function parseTimeRange(waktu: string | undefined) {
  if (!waktu) return { startH: '07', startM: '00', endH: '07', endM: '45', isCustom: false };
  const parts = waktu.split(/[-–—]/).map(s => s.trim());
  if (parts.length < 2) return { startH: '07', startM: '00', endH: '07', endM: '45', isCustom: true };

  const mStart = parts[0].match(/^(\d{1,2})[:.](\d{1,2})$/);
  const mEnd = parts[1].match(/^(\d{1,2})[:.](\d{1,2})$/);

  if (!mStart || !mEnd) {
    return { startH: '07', startM: '00', endH: '07', endM: '45', isCustom: true };
  }

  const startH = mStart[1].padStart(2, '0');
  const startM = mStart[2].padStart(2, '0');
  const endH = mEnd[1].padStart(2, '0');
  const endM = mEnd[2].padStart(2, '0');

  return { startH, startM, endH, endM, isCustom: false };
}

export interface ScheduleConflict {
  id: string;
  type: 'guru' | 'ruang' | 'kelas';
  severity: 'error' | 'warning';
  title: string;
  description: string;
  conflictingSchedule: ScheduleItem;
  day: string;
  jamKe: number;
  waktu: string;
}

function parseMinutesRange(waktu: string | undefined): { start: number; end: number } | null {
  if (!waktu) return null;
  const parts = waktu.split(/[-–—]/).map(s => s.trim());
  if (parts.length < 2) return null;
  const mStart = parts[0].match(/^(\d{1,2})[:.](\d{1,2})$/);
  const mEnd = parts[1].match(/^(\d{1,2})[:.](\d{1,2})$/);
  if (!mStart || !mEnd) return null;
  const start = parseInt(mStart[1], 10) * 60 + parseInt(mStart[2], 10);
  const end = parseInt(mEnd[1], 10) * 60 + parseInt(mEnd[2], 10);
  return { start, end };
}

function checkTimeClash(timeA: string, jamKeA: number, timeB: string, jamKeB: number): boolean {
  const rA = parseMinutesRange(timeA);
  const rB = parseMinutesRange(timeB);

  if (rA && rB) {
    return rA.start < rB.end && rB.start < rA.end;
  }
  return jamKeA === jamKeB;
}

function isExemptTeacher(teacherName: string | undefined): boolean {
  if (!teacherName) return true;
  const t = teacherName.trim().toLowerCase();
  if (
    t === 'tim guru' ||
    t === 'tim keagamaan' ||
    t === 'tim kurikulum' ||
    t === 'tim pembiasaan' ||
    t === 'tim wali kelas' ||
    t === '-' ||
    t === ''
  ) {
    return true;
  }
  if (t.startsWith('tim ')) return true;
  return false;
}

function isExemptRoom(roomName: string | undefined): boolean {
  if (!roomName) return true;
  const r = roomName.trim().toLowerCase();
  if (r === 'ruang kelas' || r === 'ruang kelas masing-masing' || r === '-' || r === '') {
    return true;
  }
  return false;
}

function findConflictsForSlot(
  target: {
    id?: string;
    hari: string;
    kelas: string;
    jamKe: number;
    waktu: string;
    mapel: string;
    guruNama: string;
    ruang: string;
  },
  schedules: ScheduleItem[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];
  const cleanGuru = target.guruNama?.trim().toLowerCase() || '';
  const cleanRuang = target.ruang?.trim().toLowerCase() || '';
  const isTeacherExempt = isExemptTeacher(target.guruNama);
  const isRoomExempt = isExemptRoom(target.ruang);

  for (const s of schedules) {
    if (target.id && s.id === target.id) continue;
    if (s.hari !== target.hari) continue;

    const hasClash = checkTimeClash(target.waktu, target.jamKe, s.waktu, s.jamKe);
    if (!hasClash) continue;

    // 1. Teacher Conflict: same teacher, different class
    if (!isTeacherExempt && s.guruNama && s.guruNama.trim().toLowerCase() === cleanGuru && s.kelas !== target.kelas) {
      conflicts.push({
        id: `guru_${s.id}`,
        type: 'guru',
        severity: 'error',
        title: 'Bentrok Guru Pengampu (Mengajar di 2 Kelas Bersamaan)',
        description: `Ustadz/ah ${s.guruNama} sudah dijadwalkan mengajar di Kelas ${s.kelas} pada ${s.hari} ${s.waktu} (Jam Ke-${s.jamKe}) untuk Mapel "${s.mapel}".`,
        conflictingSchedule: s,
        day: s.hari,
        jamKe: s.jamKe,
        waktu: s.waktu
      });
    }

    // 2. Class Conflict: same class has another schedule at this exact period
    if (s.kelas === target.kelas) {
      conflicts.push({
        id: `kelas_${s.id}`,
        type: 'kelas',
        severity: 'error',
        title: 'Bentrok Slot Kelas (Double Booking Jam)',
        description: `Kelas ${target.kelas} pada ${s.hari} Jam Ke-${s.jamKe} (${s.waktu}) sudah terisi jadwal "${s.mapel}" (${s.guruNama || 'Tanpa Guru'}).`,
        conflictingSchedule: s,
        day: s.hari,
        jamKe: s.jamKe,
        waktu: s.waktu
      });
    }

    // 3. Room Conflict: specific facility/room used by another class
    if (!isRoomExempt && s.ruang && s.ruang.trim().toLowerCase() === cleanRuang && s.kelas !== target.kelas) {
      conflicts.push({
        id: `ruang_${s.id}`,
        type: 'ruang',
        severity: 'warning',
        title: 'Bentrok Ruangan / Fasilitas Sarpras',
        description: `Ruangan "${s.ruang}" sudah dialokasikan untuk Kelas ${s.kelas} (${s.mapel} - ${s.guruNama}) pada jam yang sama.`,
        conflictingSchedule: s,
        day: s.hari,
        jamKe: s.jamKe,
        waktu: s.waktu
      });
    }
  }

  return conflicts;
}

export const JadwalKelolaView: React.FC<JadwalKelolaViewProps> = ({
  schedules = [],
  teachers = [],
  students = [],
  schoolInfo,
  sarpras = [],
  session,
  onSaveSchedules,
  onSaveStudents = () => {},
  onSaveTeachers = () => {}
}) => {
  const [classesVersion, setClassesVersion] = useState(0);
  const dynamicClasses = React.useMemo(
    () => getAllClasses(students, schedules, teachers),
    [students, schedules, teachers, classesVersion]
  );
  const formatClassLabel = (c: string) => (c.toLowerCase().startsWith('kelas') ? c : `Kelas ${c}`);

  const [selectedClass, setSelectedClass] = useState<string>(dynamicClasses[0] || '7A');
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassManagerOpen, setIsClassManagerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  // Role detection for Waka Kurikulum & Admin
  const loggedTeacher = teachers.find(
    t => (session?.teacherId && t.id === session.teacherId) || t.nama === session?.name
  );

  const isWakaKurikulum = !!(
    loggedTeacher &&
    (loggedTeacher.jabatan?.toLowerCase().includes('kurikulum') ||
      loggedTeacher.jabatan?.toLowerCase().includes('kurikuler'))
  );

  const isAdmin = session?.role === 'admin';

  // Form State
  const [form, setForm] = useState<Partial<ScheduleItem> & { hariBatch?: string }>({
    hari: 'Senin',
    kelas: '7A',
    jamKe: 1,
    waktu: '07:30 - 08:10',
    mapel: 'Matematika',
    guruNama: teachers[1]?.nama || 'Ustadzah Siti Fatimah, S.Pd.',
    ruang: 'Kelas 7A'
  });

  const [isCustomMapel, setIsCustomMapel] = useState(false);
  const [customMapelInput, setCustomMapelInput] = useState('');
  const [isCustomClassInForm, setIsCustomClassInForm] = useState(false);
  const [customClassInput, setCustomClassInput] = useState('');

  // Dropdown Waktu Pelajaran (Jam & Menit)
  const [isManualTimeInput, setIsManualTimeInput] = useState(false);
  const [timePicker, setTimePicker] = useState({
    startH: '07',
    startM: '30',
    endH: '08',
    endM: '10'
  });

  const handleTimePickerChange = (field: 'startH' | 'startM' | 'endH' | 'endM', val: string) => {
    const next = { ...timePicker, [field]: val };
    setTimePicker(next);
    setForm(prev => ({
      ...prev,
      waktu: `${next.startH}:${next.startM} - ${next.endH}:${next.endM}`
    }));
  };

  const handleApplyDuration = (minutesToAdd: number) => {
    const startTotal = parseInt(timePicker.startH, 10) * 60 + parseInt(timePicker.startM, 10);
    const endTotal = (startTotal + minutesToAdd) % (24 * 60);
    const newEndH = String(Math.floor(endTotal / 60)).padStart(2, '0');
    const newEndM = String(endTotal % 60).padStart(2, '0');
    const next = { ...timePicker, endH: newEndH, endM: newEndM };
    setTimePicker(next);
    setForm(prev => ({
      ...prev,
      waktu: `${next.startH}:${next.startM} - ${newEndH}:${newEndM}`
    }));
  };

  const startMinutesCount = parseInt(timePicker.startH, 10) * 60 + parseInt(timePicker.startM, 10);
  const endMinutesCount = parseInt(timePicker.endH, 10) * 60 + parseInt(timePicker.endM, 10);
  const calculatedDuration = endMinutesCount - startMinutesCount;

  const startMinutesOptions = Array.from(new Set([...BASE_MINUTES, timePicker.startM])).sort();
  const endMinutesOptions = Array.from(new Set([...BASE_MINUTES, timePicker.endM])).sort();

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const daySelectOptions = [
    { value: 'Senin', label: 'Senin (1 Hari)' },
    { value: 'Selasa', label: 'Selasa (1 Hari)' },
    { value: 'Rabu', label: 'Rabu (1 Hari)' },
    { value: 'Kamis', label: 'Kamis (1 Hari)' },
    { value: 'Jumat', label: 'Jumat (1 Hari)' },
    { value: 'Sabtu', label: 'Sabtu (1 Hari)' },
    { value: 'Senin - Jumat', label: '📅 Senin - Jumat (5 Hari Kerja Serentak)' },
    { value: 'Selasa - Kamis', label: '📅 Selasa - Kamis (3 Hari Serentak)' },
    { value: 'Senin - Kamis', label: '📅 Senin - Kamis (4 Hari Serentak)' }
  ];

  // Extract rooms and facilities from Sarpras data
  const sarprasRooms = sarpras.filter(s =>
    s.kategori === 'Ruang / Gedung' ||
    s.kategori === 'Keagamaan' ||
    s.namaBarangRuang.toLowerCase().includes('ruang') ||
    s.namaBarangRuang.toLowerCase().includes('gedung') ||
    s.namaBarangRuang.toLowerCase().includes('lab') ||
    s.namaBarangRuang.toLowerCase().includes('masjid') ||
    s.namaBarangRuang.toLowerCase().includes('lapangan') ||
    s.namaBarangRuang.toLowerCase().includes('perpustakaan') ||
    s.namaBarangRuang.toLowerCase().includes('aula')
  );

  // Audit Modal State & Filter
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditFilterDay, setAuditFilterDay] = useState<string>('Semua');

  // Real-time conflicts for the currently active modal form
  const activeConflicts = React.useMemo(() => {
    if (!isModalOpen) return [];

    const finalMapel = isCustomMapel ? customMapelInput.trim() : (form.mapel?.trim() || '');
    const selectedClassVal = isCustomClassInForm
      ? customClassInput.trim()
      : (form.kelas?.trim() || selectedClass);

    let targetClasses: string[] = [];
    if (selectedClassVal === 'SEMUA_KELAS' || selectedClassVal === 'Semua Kelas') {
      targetClasses = dynamicClasses;
    } else {
      targetClasses = [selectedClassVal];
    }

    let targetDays: string[] = [];
    if (form.hari === 'Senin - Jumat') {
      targetDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    } else if (form.hari === 'Selasa - Kamis') {
      targetDays = ['Selasa', 'Rabu', 'Kamis'];
    } else if (form.hari === 'Senin - Kamis') {
      targetDays = ['Senin', 'Selasa', 'Rabu', 'Kamis'];
    } else {
      targetDays = [(form.hari as string) || selectedDay];
    }

    const currentWaktu = form.waktu || '07:30 - 08:10';
    const currentJamKe = Number(form.jamKe) || 1;
    const currentGuru = form.guruNama || 'Tim Guru';
    const currentRuang = form.ruang || `Kelas ${selectedClassVal}`;

    const conflictsFound: ScheduleConflict[] = [];

    targetClasses.forEach(cls => {
      targetDays.forEach(day => {
        const cList = findConflictsForSlot(
          {
            id: editingItem?.id,
            hari: day,
            kelas: cls,
            jamKe: currentJamKe,
            waktu: currentWaktu,
            mapel: finalMapel,
            guruNama: currentGuru,
            ruang: currentRuang
          },
          schedules
        );
        cList.forEach(c => {
          if (!conflictsFound.some(existing => existing.id === c.id)) {
            conflictsFound.push(c);
          }
        });
      });
    });

    return conflictsFound;
  }, [
    isModalOpen,
    form,
    isCustomMapel,
    customMapelInput,
    isCustomClassInForm,
    customClassInput,
    editingItem,
    selectedClass,
    selectedDay,
    dynamicClasses,
    schedules
  ]);

  // Global schedule conflicts across all classes and days
  const allGlobalConflicts = React.useMemo(() => {
    const list: {
      id: string;
      conflict: ScheduleConflict;
      scheduleA: ScheduleItem;
      scheduleB: ScheduleItem;
    }[] = [];

    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const a = schedules[i];
        const b = schedules[j];
        if (a.hari !== b.hari) continue;
        if (!checkTimeClash(a.waktu, a.jamKe, b.waktu, b.jamKe)) continue;

        // 1. Teacher conflict: same teacher, different class
        if (
          !isExemptTeacher(a.guruNama) &&
          a.guruNama.trim().toLowerCase() === b.guruNama.trim().toLowerCase() &&
          a.kelas !== b.kelas
        ) {
          list.push({
            id: `g_${a.id}_${b.id}`,
            conflict: {
              id: `g_${a.id}_${b.id}`,
              type: 'guru',
              severity: 'error',
              title: `Bentrok Guru: ${a.guruNama}`,
              description: `Mengajar di Kelas ${a.kelas} (${a.mapel}) dan Kelas ${b.kelas} (${b.mapel}) di saat bersamaan (${a.hari} Jam Ke-${a.jamKe}, ${a.waktu}).`,
              conflictingSchedule: b,
              day: a.hari,
              jamKe: a.jamKe,
              waktu: a.waktu
            },
            scheduleA: a,
            scheduleB: b
          });
        }

        // 2. Class conflict (double booking in same class)
        if (a.kelas === b.kelas && a.id !== b.id) {
          list.push({
            id: `c_${a.id}_${b.id}`,
            conflict: {
              id: `c_${a.id}_${b.id}`,
              type: 'kelas',
              severity: 'error',
              title: `Bentrok Kelas ${a.kelas}`,
              description: `Memiliki 2 mata pelajaran di jam yang sama: "${a.mapel}" (${a.guruNama}) dan "${b.mapel}" (${b.guruNama}) pada ${a.hari} Jam Ke-${a.jamKe}.`,
              conflictingSchedule: b,
              day: a.hari,
              jamKe: a.jamKe,
              waktu: a.waktu
            },
            scheduleA: a,
            scheduleB: b
          });
        }

        // 3. Room conflict
        if (
          !isExemptRoom(a.ruang) &&
          a.ruang.trim().toLowerCase() === b.ruang.trim().toLowerCase() &&
          a.kelas !== b.kelas
        ) {
          list.push({
            id: `r_${a.id}_${b.id}`,
            conflict: {
              id: `r_${a.id}_${b.id}`,
              type: 'ruang',
              severity: 'warning',
              title: `Bentrok Ruangan: ${a.ruang}`,
              description: `Digunakan bersamaan oleh Kelas ${a.kelas} (${a.mapel}) dan Kelas ${b.kelas} (${b.mapel}) pada ${a.hari} ${a.waktu}.`,
              conflictingSchedule: b,
              day: a.hari,
              jamKe: a.jamKe,
              waktu: a.waktu
            },
            scheduleA: a,
            scheduleB: b
          });
        }
      }
    }
    return list;
  }, [schedules]);

  // Helper to find conflicts for a specific item in the table
  const getItemConflicts = (item: ScheduleItem) => {
    return allGlobalConflicts.filter(
      c => c.scheduleA.id === item.id || c.scheduleB.id === item.id
    );
  };

  const filtered = schedules
    .filter(s => s.kelas === selectedClass && s.hari === selectedDay)
    .sort((a, b) => a.jamKe - b.jamKe);

  // Helper: Find teacher for given subject
  const findTeacherForMapel = (mapelName: string): Teacher | null => {
    if (!mapelName) return null;
    const clean = mapelName.trim().toLowerCase();

    // 1. Exact match on mapelUtama
    let match = teachers.find(t => t.mapelUtama?.trim().toLowerCase() === clean);
    if (match) return match;

    // 2. Exact match in mapelTambahan
    match = teachers.find(
      t => t.mapelTambahan && t.mapelTambahan.some(m => m.trim().toLowerCase() === clean)
    );
    if (match) return match;

    // 3. Substring match on mapelUtama
    match = teachers.find(
      t =>
        t.mapelUtama?.trim().toLowerCase().includes(clean) ||
        clean.includes(t.mapelUtama?.trim().toLowerCase())
    );
    if (match) return match;

    // 4. Substring match in mapelTambahan
    match = teachers.find(
      t =>
        t.mapelTambahan &&
        t.mapelTambahan.some(
          m =>
            m.trim().toLowerCase().includes(clean) ||
            clean.includes(m.trim().toLowerCase())
        )
    );
    return match || null;
  };

  // Triggered when subject changes to auto-fill teacher and suggest room
  const handleMapelChange = (newMapel: string) => {
    const isActivity = COMMON_SCHEDULE_ACTIVITIES.includes(newMapel);
    let autoGuru = form.guruNama || 'Tim Guru';
    let autoRuang = form.ruang;

    if (isActivity) {
      autoGuru = 'Tim Guru / Pembina';
      if (
        newMapel.toLowerCase().includes('masjid') ||
        newMapel.toLowerCase().includes('shalat') ||
        newMapel.toLowerCase().includes('dhuha') ||
        newMapel.toLowerCase().includes('dzuhur')
      ) {
        const foundMasjid = sarprasRooms.find(r => r.namaBarangRuang.toLowerCase().includes('masjid'));
        autoRuang = foundMasjid ? foundMasjid.namaBarangRuang : 'Masjid Al Qomar';
      } else if (
        newMapel.toLowerCase().includes('upacara') ||
        newMapel.toLowerCase().includes('apel') ||
        newMapel.toLowerCase().includes('senam')
      ) {
        const foundLap = sarprasRooms.find(r => r.namaBarangRuang.toLowerCase().includes('lapangan'));
        autoRuang = foundLap ? foundLap.namaBarangRuang : 'Lapangan Utama Sekolah';
      }
    } else {
      const matchedTeacher = findTeacherForMapel(newMapel);
      if (matchedTeacher) {
        autoGuru = matchedTeacher.nama;
      }

      // Room suggestion based on subject
      if (newMapel.toLowerCase().includes('komputer') || newMapel.toLowerCase().includes('informatika')) {
        const labKomp = sarprasRooms.find(r => r.namaBarangRuang.toLowerCase().includes('komputer'));
        autoRuang = labKomp ? labKomp.namaBarangRuang : 'Laboratorium Komputer & Media Digital';
      } else if (newMapel.toLowerCase().includes('ipa') || newMapel.toLowerCase().includes('sains')) {
        const labIpa = sarprasRooms.find(r => r.namaBarangRuang.toLowerCase().includes('ipa'));
        autoRuang = labIpa ? labIpa.namaBarangRuang : 'Laboratorium IPA';
      } else if (newMapel.toLowerCase().includes('pjok') || newMapel.toLowerCase().includes('olahraga')) {
        const lapangan = sarprasRooms.find(r => r.namaBarangRuang.toLowerCase().includes('lapangan'));
        autoRuang = lapangan ? lapangan.namaBarangRuang : 'Lapangan Olahraga';
      }
    }

    setForm(prev => ({
      ...prev,
      mapel: newMapel,
      guruNama: autoGuru,
      ruang: autoRuang || (form.kelas === 'SEMUA_KELAS' ? 'Ruang Kelas' : `Kelas ${form.kelas || selectedClass}`)
    }));
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsCustomMapel(false);
    setCustomMapelInput('');
    setIsCustomClassInForm(false);
    setCustomClassInput('');

    const nextJam = filtered.length > 0 ? Math.max(...filtered.map(f => f.jamKe)) + 1 : 1;
    const initialMapel = 'Matematika';
    const initialTeacher = findTeacherForMapel(initialMapel)?.nama || teachers[1]?.nama || 'Tim Guru';

    let initialWaktu = nextJam === 1 ? '07:00 - 07:45' : '07:45 - 08:30';
    if (filtered.length > 0) {
      const lastSlot = filtered[filtered.length - 1];
      const parsed = parseTimeRange(lastSlot.waktu);
      if (!parsed.isCustom) {
        const startH = parsed.endH;
        const startM = parsed.endM;
        const endTotal = (parseInt(startH, 10) * 60 + parseInt(startM, 10) + 40) % (24 * 60);
        const endH = String(Math.floor(endTotal / 60)).padStart(2, '0');
        const endM = String(endTotal % 60).padStart(2, '0');
        initialWaktu = `${startH}:${startM} - ${endH}:${endM}`;
      }
    }

    const parsedTime = parseTimeRange(initialWaktu);
    setTimePicker({
      startH: parsedTime.startH,
      startM: parsedTime.startM,
      endH: parsedTime.endH,
      endM: parsedTime.endM
    });
    setIsManualTimeInput(parsedTime.isCustom);

    setForm({
      id: `SCH${Date.now().toString().slice(-4)}`,
      hari: selectedDay as any,
      kelas: selectedClass,
      jamKe: nextJam,
      waktu: initialWaktu,
      mapel: initialMapel,
      guruNama: initialTeacher,
      ruang: `Kelas ${selectedClass}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingItem(item);

    // Check if item's mapel is in standard list
    const isStandard =
      DEFAULT_MAPEL_LIST.includes(item.mapel) || COMMON_SCHEDULE_ACTIVITIES.includes(item.mapel);
    if (!isStandard) {
      setIsCustomMapel(true);
      setCustomMapelInput(item.mapel);
    } else {
      setIsCustomMapel(false);
      setCustomMapelInput('');
    }

    // Check if item's class is in dynamicClasses
    if (!dynamicClasses.includes(item.kelas)) {
      setIsCustomClassInForm(true);
      setCustomClassInput(item.kelas);
    } else {
      setIsCustomClassInForm(false);
      setCustomClassInput('');
    }

    const parsedTime = parseTimeRange(item.waktu);
    setTimePicker({
      startH: parsedTime.startH,
      startM: parsedTime.startM,
      endH: parsedTime.endH,
      endM: parsedTime.endM
    });
    setIsManualTimeInput(parsedTime.isCustom);

    setForm({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus slot jadwal ini?')) {
      onSaveSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalMapel = isCustomMapel ? customMapelInput.trim() : (form.mapel?.trim() || '');
    const selectedClassVal = isCustomClassInForm
      ? customClassInput.trim()
      : (form.kelas?.trim() || selectedClass);

    if (!finalMapel) {
      alert('Silakan pilih atau tulis nama mata pelajaran / kegiatan.');
      return;
    }
    if (!selectedClassVal) {
      alert('Silakan pilih atau tulis nama kelas.');
      return;
    }

    // Determine target classes
    let targetClasses: string[] = [];
    if (selectedClassVal === 'SEMUA_KELAS' || selectedClassVal === 'Semua Kelas') {
      targetClasses = dynamicClasses;
    } else {
      targetClasses = [selectedClassVal];
    }

    // Determine target days
    let targetDays: string[] = [];
    if (form.hari === 'Senin - Jumat') {
      targetDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
    } else if (form.hari === 'Selasa - Kamis') {
      targetDays = ['Selasa', 'Rabu', 'Kamis'];
    } else if (form.hari === 'Senin - Kamis') {
      targetDays = ['Senin', 'Selasa', 'Rabu', 'Kamis'];
    } else {
      targetDays = [(form.hari as string) || selectedDay];
    }

    // Peringatan & Konfirmasi Bentrok Jadwal saat Submit
    if (activeConflicts.length > 0) {
      const summaryList = activeConflicts
        .map((c, i) => `${i + 1}. [${c.type === 'guru' ? 'BENTROK GURU' : c.type === 'kelas' ? 'BENTROK KELAS' : 'BENTROK RUANGAN'}]\n   ${c.description}`)
        .join('\n\n');

      const confirmMsg = `⚠️ PERINGATAN BENTROK JADWAL TERDETEKSI!\n\n${summaryList}\n\nApakah Anda yakin tetap ingin menyimpan slot jadwal ini?\n• Klik "OK" jika jadwal ini disengaja (misal penggabungan kelas/kegiatan bersama).\n• Klik "Cancel" untuk membatalkan dan mengubah jam/guru pengampu.`;

      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    if (editingItem) {
      const updatedItem: ScheduleItem = {
        ...editingItem,
        hari: (form.hari as any) || selectedDay,
        kelas: targetClasses[0] || selectedClass,
        jamKe: Number(form.jamKe) || 1,
        waktu: form.waktu || '07:30 - 08:10',
        mapel: finalMapel,
        guruNama: form.guruNama || 'Tim Guru',
        ruang: form.ruang || `Kelas ${targetClasses[0] || selectedClass}`
      };
      onSaveSchedules(schedules.map(s => (s.id === editingItem.id ? updatedItem : s)));
    } else {
      const newItems: ScheduleItem[] = [];
      targetClasses.forEach(cls => {
        targetDays.forEach(day => {
          let resolvedRuang = form.ruang || `Kelas ${cls}`;
          if (
            form.ruang === 'Ruang Kelas Masing-masing' ||
            form.ruang === 'Ruang Kelas' ||
            !form.ruang
          ) {
            resolvedRuang = `Kelas ${cls}`;
          }

          newItems.push({
            id: `SCH${Date.now().toString().slice(-4)}_${Math.random().toString(36).substr(2, 4)}`,
            hari: day as any,
            kelas: cls,
            jamKe: Number(form.jamKe) || 1,
            waktu: form.waktu || '07:30 - 08:10',
            mapel: finalMapel,
            guruNama: form.guruNama || 'Tim Guru',
            ruang: resolvedRuang
          });
        });
      });
      onSaveSchedules([...schedules, ...newItems]);
    }

    if (targetClasses.length === 1) {
      setSelectedClass(targetClasses[0]);
    }
    if (targetDays.length === 1 && !form.hari?.includes('-')) {
      setSelectedDay(targetDays[0]);
    }
    setIsModalOpen(false);
  };

  const matchedTeacher = findTeacherForMapel(
    isCustomMapel ? customMapelInput : form.mapel || ''
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Manajemen Kelola Jadwal Pelajaran</span>
            </div>

            {isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Akses: Admin DAPODIK</span>
              </span>
            )}

            {isWakaKurikulum && !isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 border border-amber-400 text-xs font-bold">
                <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Akses Khusus: Waka Kurikulum ({loggedTeacher?.nama})</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-md border border-emerald-300 font-mono">
              ⚡ TA: {schoolInfo?.tahunAjaran || '2024/2025'} ({schoolInfo?.semesterAktif || 'Ganjil'})
            </span>
          </div>

          <h2 className="text-xl font-bold font-serif text-slate-900">
            Pengaturan Alokasi Jam & Pengampu Mapel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur jam pelajaran resmi, sinkronisasi guru pengampu otomatis, ruangan fasilitas sarpras, dan batch multi-hari/semua kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Audit Bentrok Jadwal */}
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl border transition-all shadow-sm ${
              allGlobalConflicts.length > 0
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 ring-2 ring-rose-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Periksa apakah ada guru atau ruangan yang bentrok di seluruh kelas"
          >
            {allGlobalConflicts.length > 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                <span>{allGlobalConflicts.length} Bentrok Jadwal</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Cek Bentrok (Bebas)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsClassManagerOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-500/30 transition-colors shadow-sm"
            title="Kelola, tambah, ganti nama, atau hapus kelas"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Kelola Rombel / Kelas</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Slot Jadwal</span>
          </button>
        </div>
      </div>

      {/* School Global Conflict Warning Banner */}
      {allGlobalConflicts.length > 0 && (
        <div className="bg-rose-50/90 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center font-bold shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <p className="font-bold text-rose-900 text-sm">
                Peringatan: Ditemukan {allGlobalConflicts.length} Konflik / Bentrok Jadwal di Sekolah
              </p>
              <p className="text-rose-700 text-xs mt-0.5">
                Terdapat guru atau ruangan fasilitas yang terjadwal di lebih dari 1 kelas pada hari dan jam yang sama.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuditModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shrink-0 shadow-sm flex items-center gap-1.5 self-start sm:self-center"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Rincian & Perbaiki ({allGlobalConflicts.length})</span>
          </button>
        </div>
      )}

      {/* Role Access Banner for Waka Kurikulum */}
      {isWakaKurikulum && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-900">
                Otorisasi Aktif: Waka Kurikulum & Akademik
              </p>
              <p className="text-amber-800 text-[11px]">
                Anda memiliki wewenang penuh menyusun jadwal pelajaran kelas, menetapkan guru pengampu mapel, dan memetakan alokasi ruangan sarpras.
              </p>
            </div>
          </div>
          <span className="bg-amber-200/80 text-amber-950 px-2.5 py-1 rounded-lg font-bold text-[11px] border border-amber-300 shrink-0">
            Akses Kurikulum
          </span>
        </div>
      )}

      {/* Class & Day Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        
        {/* Dynamic Class Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pilih Rombongan Belajar (Kelas):</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {dynamicClasses.map(c => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedClass === c
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {formatClassLabel(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-1">Hari:</span>
          {days.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDay === d
                  ? 'bg-amber-400 text-emerald-950 font-bold shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="font-bold text-slate-900 text-sm flex items-center gap-2 font-serif">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Jadwal Kelas {selectedClass} — Hari {selectedDay}</span>
          </div>
          <span className="text-xs text-slate-500 font-semibold font-mono">
            {filtered.length} Slot Terjadwal
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-3">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              Belum ada slot pelajaran / kegiatan untuk Kelas {selectedClass} pada hari {selectedDay}.
            </p>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Slot Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Jam Ke</th>
                  <th className="p-3.5">Waktu Slot</th>
                  <th className="p-3.5">Mata Pelajaran / Kegiatan</th>
                  <th className="p-3.5">Ustadz / Pembina Pengampu</th>
                  <th className="p-3.5">Ruang / Sarpras Tempat</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => {
                  const isActivity = COMMON_SCHEDULE_ACTIVITIES.includes(s.mapel);
                  const itemConflicts = getItemConflicts(s);
                  const hasConflict = itemConflicts.length > 0;

                  return (
                    <tr
                      key={s.id}
                      className={`transition-colors ${
                        hasConflict
                          ? 'bg-rose-50/50 hover:bg-rose-100/50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="p-3.5 font-bold text-emerald-800 font-mono text-sm">
                        Jam {s.jamKe}
                      </td>
                      <td className="p-3.5 font-mono font-semibold text-slate-700">{s.waktu}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 font-serif text-sm flex items-center gap-2">
                          <span>{s.mapel}</span>
                          {isActivity && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 font-sans font-bold text-[10px] rounded-md border border-amber-200">
                              Kegiatan
                            </span>
                          )}
                          {(s.mapel === 'Bahasa Jawa' || s.mapel === "Imla'") && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-sans font-bold text-[10px] rounded-md border border-emerald-200">
                              Muatan Lokal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-800 font-semibold">
                        <div className="flex flex-col gap-1">
                          <span className={hasConflict ? 'text-rose-950 font-bold' : ''}>{s.guruNama}</span>
                          {hasConflict && (
                            <div className="flex flex-wrap gap-1">
                              {itemConflicts.map((c, idx) => {
                                const otherSchedule = c.scheduleA.id === s.id ? c.scheduleB : c.scheduleA;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      setSelectedClass(otherSchedule.kelas);
                                      setSelectedDay(otherSchedule.hari);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200 transition-colors text-left"
                                    title={`Klik untuk lompat ke Kelas ${otherSchedule.kelas}: ${c.conflict.description}`}
                                  >
                                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                    <span>
                                      {c.conflict.type === 'guru'
                                        ? `Bentrok dg Kelas ${otherSchedule.kelas} (${otherSchedule.mapel})`
                                        : c.conflict.type === 'ruang'
                                        ? `Ruang dipakai Kelas ${otherSchedule.kelas}`
                                        : 'Bentrok slot'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{s.ruang}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Edit Slot Jadwal"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Slot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Schedule Slot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 text-slate-900">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-base text-slate-900">
                    {editingItem ? 'Edit Slot Jadwal Pelajaran' : 'Tambah Slot Jam Pelajaran'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pengaturan jam, mata pelajaran resmi, ruangan sarpras, & guru pengampu otomatis
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Hari & Kelas Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pilihan Hari</span>
                  </label>
                  <select
                    value={form.hari}
                    onChange={(e) => setForm({ ...form, hari: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <optgroup label="-- Hari Tunggal --">
                      {days.map(d => (
                        <option key={d} value={d} className="bg-white text-slate-900">
                          {d}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="-- Batch Multi-Hari (Serentak) --">
                      <option value="Senin - Jumat" className="bg-emerald-50 font-bold text-emerald-950">
                        📅 Senin - Jumat (5 Hari Kerja)
                      </option>
                      <option value="Selasa - Kamis" className="bg-emerald-50 font-bold text-emerald-950">
                        📅 Selasa - Kamis (3 Hari)
                      </option>
                      <option value="Senin - Kamis" className="bg-emerald-50 font-bold text-emerald-950">
                        📅 Senin - Kamis (4 Hari)
                      </option>
                    </optgroup>
                  </select>
                  {form.hari?.includes('-') && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      ⚡ Multi-Hari: Sistem akan otomatis membuat slot untuk semua hari dalam rentang ini.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Kelas Target</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomClassInForm(!isCustomClassInForm)}
                      className="text-[11px] font-bold text-emerald-800 hover:underline"
                    >
                      {isCustomClassInForm ? 'Pilih dari List' : '+ Tulis Kustom'}
                    </button>
                  </div>

                  {isCustomClassInForm ? (
                    <input
                      type="text"
                      required
                      value={customClassInput}
                      onChange={(e) => setCustomClassInput(e.target.value)}
                      placeholder="Ketik nama kelas kustom (misal: 7C, 8-Tahfidz)..."
                      className="w-full px-3 py-2 bg-white border border-emerald-500 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <select
                      value={form.kelas}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomClassInForm(true);
                          setCustomClassInput('');
                        } else {
                          setForm({ ...form, kelas: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <optgroup label="-- Pilihan Kelas --">
                        <option value="SEMUA_KELAS" className="bg-amber-50 font-extrabold text-amber-950">
                          ⭐ Semua Kelas ({dynamicClasses.join(', ')})
                        </option>
                        {dynamicClasses.map(c => (
                          <option key={c} value={c} className="bg-white text-slate-900">
                            {formatClassLabel(c)}
                          </option>
                        ))}
                      </optgroup>
                      <option value="__CUSTOM__" className="bg-emerald-50 text-emerald-950 font-bold">
                        + Tulis Kelas Kustom Baru...
                      </option>
                    </select>
                  )}
                  {form.kelas === 'SEMUA_KELAS' && (
                    <p className="text-[11px] text-amber-800 font-semibold mt-1">
                      ⭐ Multi-Kelas: Slot ini akan dibuat untuk seluruh rombel ({dynamicClasses.join(', ')}).
                    </p>
                  )}
                </div>
              </div>

              {/* Jam Ke & Rentang Waktu */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Ke-</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.jamKe}
                      onChange={(e) => setForm({ ...form, jamKe: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-xs"
                    />
                  </div>

                  <div className="flex-1 pt-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-medium">Preset Jam:</span>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                        <button
                          key={j}
                          type="button"
                          onClick={() => setForm({ ...form, jamKe: j })}
                          className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border transition-colors ${
                            form.jamKe === j
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Ke-{j}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dropdown Rentang Waktu */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Rentang Waktu Pelajaran</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {!isManualTimeInput && (
                        calculatedDuration > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span>⏱️ {calculatedDuration} Menit</span>
                            {calculatedDuration === 40 && <span className="text-emerald-700 font-semibold">• 1 JP</span>}
                            {calculatedDuration === 80 && <span className="text-emerald-700 font-semibold">• 2 JP</span>}
                            {calculatedDuration === 35 && <span className="text-emerald-700 font-semibold">• 1 JP (35m)</span>}
                            {calculatedDuration === 45 && <span className="text-emerald-700 font-semibold">• 1 JP (45m)</span>}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300">
                            ⚠️ Waktu selesai &le; waktu mulai
                          </span>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (isManualTimeInput) {
                            const parsed = parseTimeRange(form.waktu);
                            if (!parsed.isCustom) {
                              setTimePicker({
                                startH: parsed.startH,
                                startM: parsed.startM,
                                endH: parsed.endH,
                                endM: parsed.endM
                              });
                            }
                          }
                          setIsManualTimeInput(!isManualTimeInput);
                        }}
                        className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                      >
                        {isManualTimeInput ? 'Gunakan Dropdown Jam' : 'Mode Ketik Manual'}
                      </button>
                    </div>
                  </div>

                  {!isManualTimeInput ? (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        {/* Waktu Mulai */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                            Waktu Mulai
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1">
                              <label className="text-[9px] text-slate-400 block font-semibold mb-0.5">Jam</label>
                              <select
                                value={timePicker.startH}
                                onChange={(e) => handleTimePickerChange('startH', e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              >
                                {HOURS.map(h => (
                                  <option key={`sh-${h}`} value={h}>{h}</option>
                                ))}
                              </select>
                            </div>
                            <span className="font-bold text-slate-400 self-end pb-2">:</span>
                            <div className="flex-1">
                              <label className="text-[9px] text-slate-400 block font-semibold mb-0.5">Menit</label>
                              <select
                                value={timePicker.startM}
                                onChange={(e) => handleTimePickerChange('startM', e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              >
                                {startMinutesOptions.map(m => (
                                  <option key={`sm-${m}`} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 self-end pb-2 pl-1">WIB</span>
                          </div>
                        </div>

                        {/* Waktu Selesai */}
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                            Waktu Selesai
                          </span>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1">
                              <label className="text-[9px] text-slate-400 block font-semibold mb-0.5">Jam</label>
                              <select
                                value={timePicker.endH}
                                onChange={(e) => handleTimePickerChange('endH', e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              >
                                {HOURS.map(h => (
                                  <option key={`eh-${h}`} value={h}>{h}</option>
                                ))}
                              </select>
                            </div>
                            <span className="font-bold text-slate-400 self-end pb-2">:</span>
                            <div className="flex-1">
                              <label className="text-[9px] text-slate-400 block font-semibold mb-0.5">Menit</label>
                              <select
                                value={timePicker.endM}
                                onChange={(e) => handleTimePickerChange('endM', e.target.value)}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                              >
                                {endMinutesOptions.map(m => (
                                  <option key={`em-${m}`} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 self-end pb-2 pl-1">WIB</span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Durasi Cepat */}
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
                        <span className="text-[10px] font-bold text-slate-500 mr-1">Durasi Cepat:</span>
                        {[
                          { label: '+35 mnt', mins: 35 },
                          { label: '+40 mnt (1 JP)', mins: 40 },
                          { label: '+45 mnt', mins: 45 },
                          { label: '+60 mnt (1 Jam)', mins: 60 },
                          { label: '+80 mnt (2 JP)', mins: 80 },
                          { label: '+90 mnt (1.5 Jam)', mins: 90 }
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => handleApplyDuration(preset.mins)}
                            className="px-2 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 hover:border-emerald-400 rounded-md text-[10px] font-semibold transition-all shadow-2xs hover:scale-[1.02]"
                            title={`Atur waktu selesai menjadi +${preset.mins} menit dari waktu mulai`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center justify-between">
                        <span>Format tersimpan: <strong className="font-mono text-emerald-800">{form.waktu}</strong></span>
                        <span className="text-slate-400">Sinkron otomatis dengan tabel jadwal</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        required
                        value={form.waktu}
                        onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                        placeholder="07:30 - 08:10"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Format standar: <code>07:30 - 08:10</code>. Klik &quot;Gunakan Dropdown Jam&quot; di atas untuk memilih kembali via dropdown.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mata Pelajaran / Kegiatan Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Mata Pelajaran atau Kegiatan</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextMode = !isCustomMapel;
                      setIsCustomMapel(nextMode);
                      if (!isCustomMapel && !customMapelInput) {
                        setCustomMapelInput(form.mapel || '');
                      }
                      if (!nextMode && form.mapel) {
                        handleMapelChange(form.mapel);
                      }
                    }}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{isCustomMapel ? 'Pilih dari Daftar Baku' : '+ Ketik Kustom / Kegiatan Bebas'}</span>
                  </button>
                </div>

                {isCustomMapel ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={customMapelInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomMapelInput(val);
                        handleMapelChange(val);
                      }}
                      placeholder="Ketik nama mapel/kegiatan kustom (misal: Prakarya, Matrikulasi, Praktikum IPA)..."
                      className="w-full px-3 py-2 bg-white border border-emerald-500 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-500">
                      Ketik mapel apa pun; pengampu dan ruangan yang relevan akan terdeteksi otomatis.
                    </p>
                  </div>
                ) : (
                  <select
                    value={form.mapel}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomMapel(true);
                        setCustomMapelInput('');
                      } else {
                        handleMapelChange(e.target.value);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <optgroup label="-- Mata Pelajaran Kurikulum --">
                      {DEFAULT_MAPEL_LIST.map(m => (
                        <option key={m} value={m} className="bg-white text-slate-900">
                          {m} {(m === 'Bahasa Jawa' || m === "Imla'") ? '★' : ''}
                        </option>
                      ))}
                    </optgroup>

                    <optgroup label="-- Kegiatan & Pembiasaan Sekolah --">
                      {COMMON_SCHEDULE_ACTIVITIES.map(a => (
                        <option key={a} value={a} className="bg-white text-slate-900">
                          {a}
                        </option>
                      ))}
                    </optgroup>

                    <option value="__CUSTOM__" className="bg-emerald-50 text-emerald-950 font-bold">
                      + Tulis Pelajaran / Kegiatan Kustom Lainnya...
                    </option>
                  </select>
                )}
              </div>

              {/* Guru / Pengampu (Auto-filled by Mapel selection) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ustadz / Guru Pengampu</span>
                  </label>
                  {matchedTeacher && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Sparkle className="w-3 h-3 text-amber-500" />
                      <span>Otomatis Sesuai Data Guru</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={
                      teachers.some(t => t.nama === form.guruNama) || form.guruNama === 'Tim Guru' || form.guruNama === 'Tim Guru / Pembina'
                        ? form.guruNama
                        : '__CUSTOM__'
                    }
                    onChange={(e) => {
                      if (e.target.value !== '__CUSTOM__') {
                        setForm({ ...form, guruNama: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Tim Guru / Pembina" className="bg-white text-slate-900 font-bold">
                      Tim Guru / Pembina Bersama
                    </option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.nama} className="bg-white text-slate-900">
                        {t.nama} ({t.mapelUtama}{t.mapelTambahan?.length ? `, +${t.mapelTambahan.join(', ')}` : ''})
                      </option>
                    ))}
                    <option value="__CUSTOM__" className="bg-slate-100 font-bold">
                      Ketik Nama Pengampu Manual...
                    </option>
                  </select>

                  <input
                    type="text"
                    value={form.guruNama || ''}
                    onChange={(e) => setForm({ ...form, guruNama: e.target.value })}
                    placeholder="Nama ustadz / pembina..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {matchedTeacher && (
                  <p className="text-[11px] text-emerald-800 font-medium mt-1">
                    ✨ Guru Pengampu terpilih otomatis: <strong>{matchedTeacher.nama}</strong> ({matchedTeacher.mapelUtama})
                  </p>
                )}
              </div>

              {/* Ruangan / Tempat (Synced with Sarpras data) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ruangan / Fasilitas Sarpras</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-500">
                    {sarprasRooms.length} Lokasi Terdaftar di Sarpras
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={
                      sarprasRooms.some(r => r.namaBarangRuang === form.ruang) ||
                      form.ruang === `Kelas ${form.kelas}` ||
                      form.ruang === 'Ruang Kelas' ||
                      form.ruang === 'Masjid Al Qomar'
                        ? form.ruang
                        : '__CUSTOM_RUANG__'
                    }
                    onChange={(e) => {
                      if (e.target.value !== '__CUSTOM_RUANG__') {
                        setForm({ ...form, ruang: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <optgroup label="-- Ruang Kelas Reguler --">
                      <option value={form.kelas === 'SEMUA_KELAS' ? 'Ruang Kelas' : `Kelas ${form.kelas || selectedClass}`}>
                        {form.kelas === 'SEMUA_KELAS' ? 'Ruang Kelas Masing-masing' : `Kelas ${form.kelas || selectedClass}`}
                      </option>
                      {dynamicClasses.map(c => (
                        <option key={c} value={`Kelas ${c}`} className="bg-white text-slate-900">
                          Kelas {c}
                        </option>
                      ))}
                    </optgroup>

                    {sarprasRooms.length > 0 && (
                      <optgroup label="-- Fasilitas & Ruangan dari Sarpras --">
                        {sarprasRooms.map(r => (
                          <option key={r.id} value={r.namaBarangRuang} className="bg-white text-slate-900">
                            {r.namaBarangRuang} ({r.lokasi})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    <optgroup label="-- Fasilitas Umum / Luar Ruangan --">
                      <option value="Masjid Al Qomar">Masjid Al Qomar</option>
                      <option value="Laboratorium Komputer & Media Digital">Laboratorium Komputer & Media Digital</option>
                      <option value="Laboratorium IPA">Laboratorium IPA</option>
                      <option value="Perpustakaan Sekolah">Perpustakaan Sekolah</option>
                      <option value="Lapangan Olahraga">Lapangan Olahraga</option>
                      <option value="Aula Serbaguna">Aula Serbaguna</option>
                    </optgroup>

                    <option value="__CUSTOM_RUANG__" className="bg-slate-100 font-bold">
                      Ketik Nama Ruangan Manual...
                    </option>
                  </select>

                  <input
                    type="text"
                    value={form.ruang || ''}
                    onChange={(e) => setForm({ ...form, ruang: e.target.value })}
                    placeholder="Nama ruangan / fasilitas..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Conflict Alert Box (Peringatan Bentrok Real-Time) */}
              {activeConflicts.length > 0 ? (
                <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-3.5 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>PERINGATAN: Terdeteksi {activeConflicts.length} Potensi Bentrok Jadwal!</span>
                  </div>

                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    Sistem mendeteksi jadwal yang Anda atur ini bertabrakan dengan jadwal lain yang sudah terdaftar di sekolah pada waktu yang sama:
                  </p>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {activeConflicts.map((c, idx) => (
                      <div
                        key={idx}
                        className="bg-white/95 border border-rose-200 rounded-lg p-2.5 text-[11px] text-slate-800 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            c.type === 'guru'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : c.type === 'kelas'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {c.type === 'guru' && '🔴 BENTROK GURU PENGAMPU'}
                            {c.type === 'kelas' && '🟡 BENTROK JAM KELAS (DOUBLE BOOKING)'}
                            {c.type === 'ruang' && '🟠 BENTROK RUANGAN / FASILITAS'}
                          </span>
                          <span className="font-mono font-bold text-slate-500 text-[10px]">
                            {c.day} • Jam Ke-{c.jamKe} ({c.waktu})
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px] leading-snug">
                          {c.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-rose-700 italic">
                    💡 Rekomendasi: Ubah jam pelajaran, pilih waktu lain, atau ganti guru pengampu untuk mencegah tabrakan jam KBM di sekolah.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Jadwal aman! Tidak terdeteksi bentrok waktu dengan guru atau ruangan kelas lain.</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingItem
                      ? 'Simpan Perubahan Slot'
                      : form.hari?.includes('-') || form.kelas === 'SEMUA_KELAS'
                      ? 'Simpan Slot (Batch Serentak)'
                      : 'Simpan Slot Jadwal'}
                  </span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Kelola Kelas Modal */}
      <KelolaKelasModal
        isOpen={isClassManagerOpen}
        onClose={() => setIsClassManagerOpen(false)}
        students={students}
        schedules={schedules}
        teachers={teachers}
        onUpdateStudents={onSaveStudents}
        onUpdateSchedules={onSaveSchedules}
        onUpdateTeachers={onSaveTeachers}
        onClassesChange={() => setClassesVersion(v => v + 1)}
      />

      {/* Modal Audit Bentrok Jadwal Seluruh Kelas */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif flex items-center gap-2">
                    <span>Audit & Deteksi Bentrok Jadwal</span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                      allGlobalConflicts.length > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {allGlobalConflicts.length} Konflik
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Pemeriksaan bentrok otomatis guru pengampu, kelas, dan fasilitas sarpras di semua kelas.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Day Filter inside Audit Modal */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs font-bold text-slate-600 mr-1 shrink-0">Filter Hari:</span>
              {['Semua', ...days].map(d => {
                const countForDay = d === 'Semua'
                  ? allGlobalConflicts.length
                  : allGlobalConflicts.filter(c => c.scheduleA.hari === d).length;
                return (
                  <button
                    key={d}
                    onClick={() => setAuditFilterDay(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      auditFilterDay === d
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <span>{d}</span>
                    {countForDay > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        auditFilterDay === d ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {countForDay}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {allGlobalConflicts.length === 0 ? (
                <div className="p-8 text-center space-y-3 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-950 text-base">Alhamdulillah! Bebas Bentrok Jadwal</h4>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                    Seluruh jadwal KBM di seluruh kelas (7A, 7B, 8A, 8B, 9A, 9B) telah sinkron sempurna. Tidak ditemukan guru atau ruangan yang tumpang tindih waktu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allGlobalConflicts
                    .filter(c => auditFilterDay === 'Semua' || c.scheduleA.hari === auditFilterDay)
                    .map((item, idx) => {
                      return (
                        <div
                          key={idx}
                          className="bg-white border-2 border-rose-200 hover:border-rose-400 rounded-2xl p-4 space-y-3 shadow-xs transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                item.conflict.type === 'guru'
                                  ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                  : item.conflict.type === 'kelas'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-blue-100 text-blue-900 border border-blue-300'
                              }`}>
                                {item.conflict.type === 'guru' ? '🔴 BENTROK GURU' : item.conflict.type === 'kelas' ? '🟡 BENTROK KELAS' : '🟠 BENTROK FASILITAS'}
                              </span>
                              <span className="font-bold text-xs text-slate-800">
                                {item.conflict.title}
                              </span>
                            </div>

                            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {item.scheduleA.hari} • Jam Ke-{item.scheduleA.jamKe} ({item.scheduleA.waktu})
                            </span>
                          </div>

                          <p className="text-xs text-slate-700">
                            {item.conflict.description}
                          </p>

                          {/* Detail Dua Slot yang Bertabrakan */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-emerald-800">Slot A (Kelas {item.scheduleA.kelas})</span>
                                <button
                                  onClick={() => {
                                    setIsAuditModalOpen(false);
                                    setSelectedClass(item.scheduleA.kelas);
                                    setSelectedDay(item.scheduleA.hari);
                                    handleOpenEdit(item.scheduleA);
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit Slot Ini</span>
                                </button>
                              </div>
                              <p className="font-semibold text-slate-800">{item.scheduleA.mapel}</p>
                              <p className="text-[11px] text-slate-500">Guru: {item.scheduleA.guruNama}</p>
                              <p className="text-[11px] text-slate-500">Ruang: {item.scheduleA.ruang}</p>
                            </div>

                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-rose-800">Slot B (Kelas {item.scheduleB.kelas})</span>
                                <button
                                  onClick={() => {
                                    setIsAuditModalOpen(false);
                                    setSelectedClass(item.scheduleB.kelas);
                                    setSelectedDay(item.scheduleB.hari);
                                    handleOpenEdit(item.scheduleB);
                                  }}
                                  className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline flex items-center gap-1"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit Slot Ini</span>
                                </button>
                              </div>
                              <p className="font-semibold text-slate-800">{item.scheduleB.mapel}</p>
                              <p className="text-[11px] text-slate-500">Guru: {item.scheduleB.guruNama}</p>
                              <p className="text-[11px] text-slate-500">Ruang: {item.scheduleB.ruang}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Sistem cerdas mendeteksi irisan menit waktu pelajaran & jam ke- antar kelas.
              </span>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
