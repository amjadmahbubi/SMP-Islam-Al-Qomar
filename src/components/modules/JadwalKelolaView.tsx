import React, { useState } from 'react';
import { ScheduleItem, Teacher } from '../../types';
import { Clock, Plus, Edit3, Trash2, X, Save } from 'lucide-react';

interface JadwalKelolaViewProps {
  schedules: ScheduleItem[];
  teachers: Teacher[];
  onSaveSchedules: (schedules: ScheduleItem[]) => void;
}

export const JadwalKelolaView: React.FC<JadwalKelolaViewProps> = ({
  schedules,
  teachers,
  onSaveSchedules
}) => {
  const [selectedClass, setSelectedClass] = useState('7A');
  const [selectedDay, setSelectedDay] = useState('Senin');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  const [form, setForm] = useState<Partial<ScheduleItem>>({
    hari: 'Senin',
    kelas: '7A',
    jamKe: 1,
    waktu: '07:30 - 08:10',
    mapel: 'Matematika',
    guruNama: teachers[1]?.nama || 'Ustadzah Siti Fatimah, S.Pd.',
    ruang: 'Kelas 7A'
  });

  const mapelList = [
    'Pendidikan Agama Islam',
    'Al-Qur\'an Hadits',
    'Bahasa Arab',
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

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const classes = ['7A', '7B', '8A', '8B', '9A', '9B'];

  const filtered = schedules.filter(
    s => s.kelas === selectedClass && s.hari === selectedDay
  ).sort((a, b) => a.jamKe - b.jamKe);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      id: `SCH${Date.now().toString().slice(-4)}`,
      hari: selectedDay as any,
      kelas: selectedClass,
      jamKe: filtered.length + 1,
      waktu: '08:00 - 08:40',
      mapel: 'PAI & Al-Qur\'an',
      guruNama: teachers[0]?.nama || 'Tim Guru',
      ruang: `Kelas ${selectedClass}`
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus slot jadwal ini?')) {
      onSaveSchedules(schedules.filter(s => s.id !== id));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mapel) return;

    if (editingItem) {
      onSaveSchedules(schedules.map(s => (s.id === editingItem.id ? (form as ScheduleItem) : s)));
    } else {
      const newItem: ScheduleItem = {
        id: form.id || `SCH${Date.now().toString().slice(-4)}`,
        hari: (form.hari as any) || 'Senin',
        kelas: form.kelas || '7A',
        jamKe: Number(form.jamKe) || 1,
        waktu: form.waktu || '07:30 - 08:10',
        mapel: form.mapel!,
        guruNama: form.guruNama || 'Tim Guru',
        ruang: form.ruang || 'Kelas'
      };
      onSaveSchedules([...schedules, newItem]);
    }

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
            Atur jam pelajaran, mata pelajaran, ustadz pengampu, dan ruang per kelas
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Slot Jam</span>
        </button>
      </div>

      {/* Class & Day Selector */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas:</span>
          {classes.map(c => (
            <button
              key={c}
              onClick={() => setSelectedClass(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedClass === c ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hari:</span>
          {days.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDay === d ? 'bg-amber-400 text-emerald-950 font-bold' : 'bg-slate-50 text-slate-600 border'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <th className="p-3.5">Jam Ke</th>
              <th className="p-3.5">Waktu Slot</th>
              <th className="p-3.5">Mata Pelajaran</th>
              <th className="p-3.5">Ustadz / Guru Pengampu</th>
              <th className="p-3.5">Ruang</th>
              <th className="p-3.5 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="p-3.5 font-bold text-emerald-800 font-mono">
                  Jam {s.jamKe}
                </td>
                <td className="p-3.5 font-mono text-slate-600">{s.waktu}</td>
                <td className="p-3.5 font-bold text-slate-900 font-serif">{s.mapel}</td>
                <td className="p-3.5 text-slate-700 font-medium">{s.guruNama}</td>
                <td className="p-3.5 text-slate-600">{s.ruang}</td>
                <td className="p-3.5 text-center">
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold font-serif text-lg text-slate-900">
                Tambah Slot Jam Pelajaran
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hari</label>
                  <select
                    value={form.hari}
                    onChange={(e) => setForm({ ...form, hari: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {days.map(d => <option key={d} value={d} className="bg-white text-slate-900">{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kelas Target</label>
                  <select
                    value={form.kelas}
                    onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {classes.map(c => <option key={c} value={c} className="bg-white text-slate-900">Kelas {c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Ke-</label>
                  <input
                    type="number"
                    min="1"
                    value={form.jamKe}
                    onChange={(e) => setForm({ ...form, jamKe: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rentang Waktu</label>
                  <input
                    type="text"
                    value={form.waktu}
                    onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                    placeholder="07:30 - 08:10"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                <select
                  value={form.mapel}
                  onChange={(e) => setForm({ ...form, mapel: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {mapelList.map(m => (
                    <option key={m} value={m} className="bg-white text-slate-900">{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={form.guruNama}
                  onChange={(e) => setForm({ ...form, guruNama: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Tim Guru" className="bg-white text-slate-900">Tim Guru</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.nama} className="bg-white text-slate-900">{t.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ruangan</label>
                <input
                  type="text"
                  value={form.ruang}
                  onChange={(e) => setForm({ ...form, ruang: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold shadow"
                >
                  Simpan Slot
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
