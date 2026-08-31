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
  Sparkle
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

export const JadwalKelolaView: React.FC<JadwalKelolaViewProps> = ({
  schedules,
  teachers,
  students = [],
  schoolInfo,
  sarpras = [],
  session,
  onSaveSchedules,
  onSaveStudents = () => {},
  onSaveTeachers = () => {}
}) => {
  const dynamicClasses = getAllClasses(students, schedules, teachers);

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

    setForm({
      id: `SCH${Date.now().toString().slice(-4)}`,
      hari: selectedDay as any,
      kelas: selectedClass,
      jamKe: nextJam,
      waktu: nextJam === 1 ? '07:00 - 07:45' : '07:45 - 08:30',
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
                Kelas {c}
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
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
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
                      <td className="p-3.5 text-slate-800 font-semibold">{s.guruNama}</td>
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
                            Kelas {c}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Ke-</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.jamKe}
                    onChange={(e) => setForm({ ...form, jamKe: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rentang Waktu</label>
                  <input
                    type="text"
                    required
                    value={form.waktu}
                    onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                    placeholder="07:30 - 08:10"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
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
      />

    </div>
  );
};
