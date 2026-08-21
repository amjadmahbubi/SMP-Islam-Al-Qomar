import React, { useState } from 'react';
import { ScheduleItem, Teacher, Student } from '../../types';
import { Clock, Plus, Edit3, Trash2, X, Save, Sparkles, BookOpen, Layers, Check, Settings } from 'lucide-react';
import { DEFAULT_MAPEL_LIST, COMMON_SCHEDULE_ACTIVITIES, getAllClasses } from '../../data/constants';
import { KelolaKelasModal } from './KelolaKelasModal';

interface JadwalKelolaViewProps {
  schedules: ScheduleItem[];
  teachers: Teacher[];
  students?: Student[];
  onSaveSchedules: (schedules: ScheduleItem[]) => void;
  onSaveStudents?: (students: Student[]) => void;
  onSaveTeachers?: (teachers: Teacher[]) => void;
}

export const JadwalKelolaView: React.FC<JadwalKelolaViewProps> = ({
  schedules,
  teachers,
  students = [],
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

  // Form State
  const [form, setForm] = useState<Partial<ScheduleItem>>({
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

  const filtered = schedules.filter(
    s => s.kelas === selectedClass && s.hari === selectedDay
  ).sort((a, b) => a.jamKe - b.jamKe);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsCustomMapel(false);
    setCustomMapelInput('');
    setIsCustomClassInForm(false);
    setCustomClassInput('');

    const nextJam = filtered.length > 0 ? Math.max(...filtered.map(f => f.jamKe)) + 1 : 1;

    setForm({
      id: `SCH${Date.now().toString().slice(-4)}`,
      hari: selectedDay as any,
      kelas: selectedClass,
      jamKe: nextJam,
      waktu: nextJam === 1 ? '07:00 - 07:45' : '07:45 - 08:30',
      mapel: 'Bahasa Jawa',
      guruNama: teachers[0]?.nama || 'Tim Guru',
      ruang: `Kelas ${selectedClass}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    
    // Check if item's mapel is in standard list
    const isStandard = DEFAULT_MAPEL_LIST.includes(item.mapel) || COMMON_SCHEDULE_ACTIVITIES.includes(item.mapel);
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
    const finalClass = isCustomClassInForm ? customClassInput.trim() : (form.kelas?.trim() || selectedClass);

    if (!finalMapel) {
      alert('Silakan pilih atau tulis nama mata pelajaran / kegiatan.');
      return;
    }
    if (!finalClass) {
      alert('Silakan pilih atau tulis nama kelas.');
      return;
    }

    if (editingItem) {
      const updatedItem: ScheduleItem = {
        ...editingItem,
        hari: (form.hari as any) || selectedDay,
        kelas: finalClass,
        jamKe: Number(form.jamKe) || 1,
        waktu: form.waktu || '07:30 - 08:10',
        mapel: finalMapel,
        guruNama: form.guruNama || 'Tim Guru',
        ruang: form.ruang || `Kelas ${finalClass}`
      };
      onSaveSchedules(schedules.map(s => (s.id === editingItem.id ? updatedItem : s)));
    } else {
      const newItem: ScheduleItem = {
        id: form.id || `SCH${Date.now().toString().slice(-4)}`,
        hari: (form.hari as any) || (selectedDay as any),
        kelas: finalClass,
        jamKe: Number(form.jamKe) || 1,
        waktu: form.waktu || '07:30 - 08:10',
        mapel: finalMapel,
        guruNama: form.guruNama || 'Tim Guru',
        ruang: form.ruang || `Kelas ${finalClass}`
      };
      onSaveSchedules([...schedules, newItem]);
    }

    setSelectedClass(finalClass);
    if (form.hari) setSelectedDay(form.hari);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <Clock className="w-3.5 h-3.5 text-emerald-700" />
            <span>Manajemen Kelola Jadwal Pelajaran</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Pengaturan Alokasi Jam & Pengampu Mapel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur jam pelajaran resmi (termasuk Bahasa Jawa & Imla'), pembiasaan santri, dan kegiatan kustom per kelas
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
                  <th className="p-3.5">Ruang / Tempat</th>
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
                              Muatan Lokal / Agama
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-semibold">{s.guruNama}</td>
                      <td className="p-3.5 text-slate-600">{s.ruang}</td>
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
                    Pengaturan jam, mata pelajaran resmi, atau kegiatan sekolah
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
              
              {/* Hari & Kelas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={form.hari}
                    onChange={(e) => setForm({ ...form, hari: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {days.map(d => <option key={d} value={d} className="bg-white text-slate-900">{d}</option>)}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Kelas Target</label>
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
                      {dynamicClasses.map(c => (
                        <option key={c} value={c} className="bg-white text-slate-900">
                          Kelas {c}
                        </option>
                      ))}
                      <option value="__CUSTOM__" className="bg-emerald-50 text-emerald-950 font-bold">
                        + Tulis Kelas Kustom Baru...
                      </option>
                    </select>
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

              {/* Mata Pelajaran / Kegiatan Kustom Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Mata Pelajaran atau Kegiatan</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMapel(!isCustomMapel);
                      if (!isCustomMapel && !customMapelInput) {
                        setCustomMapelInput(form.mapel || '');
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
                      onChange={(e) => setCustomMapelInput(e.target.value)}
                      placeholder="Ketik nama mapel/kegiatan kustom (misal: Matrikulasi Bahasa, Khitobah, Praktikum)..."
                      className="w-full px-3 py-2 bg-white border border-emerald-500 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-500">
                      Mode Kustom: Anda bebas menulis nama kegiatan atau materi apa pun di luar daftar baku.
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
                        setForm({ ...form, mapel: e.target.value });
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

              {/* Guru / Pengampu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ustadz / Guru Pengampu / Pembina</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={teachers.some(t => t.nama === form.guruNama) || form.guruNama === 'Tim Guru' ? form.guruNama : '__CUSTOM__'}
                    onChange={(e) => {
                      if (e.target.value !== '__CUSTOM__') {
                        setForm({ ...form, guruNama: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Tim Guru" className="bg-white text-slate-900">Tim Guru / Pembina</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.nama} className="bg-white text-slate-900">
                        {t.nama} ({t.mapelUtama || 'Guru'})
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
              </div>

              {/* Ruangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ruangan / Tempat</label>
                <input
                  type="text"
                  value={form.ruang || ''}
                  onChange={(e) => setForm({ ...form, ruang: e.target.value })}
                  placeholder="Contoh: Kelas 7A, Masjid Sekolah, Lab Komputer, Lapangan Olahraga..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
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
                  <span>{editingItem ? 'Simpan Perubahan Slot' : 'Simpan Slot Jadwal'}</span>
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
