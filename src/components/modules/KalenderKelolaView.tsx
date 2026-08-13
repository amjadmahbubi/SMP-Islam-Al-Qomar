import React, { useState } from 'react';
import { CalendarEvent, AgendaItem } from '../../types';
import { CalendarDays, Plus, Trash2, X, Sparkles } from 'lucide-react';

interface KalenderKelolaViewProps {
  events: CalendarEvent[];
  agendas: AgendaItem[];
  onSaveEvents: (events: CalendarEvent[]) => void;
  onSaveAgendas: (agendas: AgendaItem[]) => void;
}

export const KalenderKelolaView: React.FC<KalenderKelolaViewProps> = ({
  events,
  agendas,
  onSaveEvents,
  onSaveAgendas
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kalender' | 'agenda'>('kalender');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [eventForm, setEventForm] = useState<Partial<CalendarEvent>>({
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date().toISOString().split('T')[0],
    kegiatan: '',
    kategori: 'KBM',
    deskripsi: '',
    semester: 'Ganjil'
  });

  const [agendaForm, setAgendaForm] = useState<Partial<AgendaItem>>({
    judul: '',
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '08:00 - 11:30 WIB',
    lokasi: 'Masjid Al Qomar',
    penanggungJawab: 'Tim Panitia',
    kategori: 'Keagamaan',
    deskripsi: '',
    status: 'Akan Datang'
  });

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Hapus agenda kalender ini?')) {
      onSaveEvents(events.filter(e => e.id !== id));
    }
  };

  const handleDeleteAgenda = (id: string) => {
    if (window.confirm('Hapus agenda kegiatan ini?')) {
      onSaveAgendas(agendas.filter(a => a.id !== id));
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSubTab === 'kalender') {
      if (!eventForm.kegiatan) return;
      const newEvt: CalendarEvent = {
        id: `CAL${Date.now().toString().slice(-4)}`,
        tanggalMulai: eventForm.tanggalMulai || new Date().toISOString().split('T')[0],
        tanggalSelesai: eventForm.tanggalSelesai || eventForm.tanggalMulai || new Date().toISOString().split('T')[0],
        kegiatan: eventForm.kegiatan!,
        kategori: (eventForm.kategori as any) || 'KBM',
        deskripsi: eventForm.deskripsi || '',
        semester: (eventForm.semester as any) || 'Ganjil'
      };
      onSaveEvents([newEvt, ...events]);
    } else {
      if (!agendaForm.judul) return;
      const newAgd: AgendaItem = {
        id: `AGD${Date.now().toString().slice(-4)}`,
        judul: agendaForm.judul!,
        tanggal: agendaForm.tanggal || new Date().toISOString().split('T')[0],
        waktu: agendaForm.waktu || '08:00 WIB',
        lokasi: agendaForm.lokasi || 'Sekolah',
        penanggungJawab: agendaForm.penanggungJawab || 'Panitia',
        kategori: (agendaForm.kategori as any) || 'Keagamaan',
        deskripsi: agendaForm.deskripsi || '',
        status: (agendaForm.status as any) || 'Akan Datang'
      };
      onSaveAgendas([newAgd, ...agendas]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
            <span>Kelola Kalender Akademik & Agenda</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Pengaturan Kalender Efektif & Agenda Kegiatan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tambah dan sunting peristiwa kalender sekolah, pekan ujian, serta agenda santri
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{activeSubTab === 'kalender' ? 'Tambah Agenda Kalender' : 'Tambah Agenda Kegiatan'}</span>
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('kalender')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'kalender' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Kalender Akademik ({events.length})
        </button>
        <button
          onClick={() => setActiveSubTab('agenda')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'agenda' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600'
          }`}
        >
          Agenda Kegiatan ({agendas.length})
        </button>
      </div>

      {/* Content Kalender */}
      {activeSubTab === 'kalender' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Kegiatan / Peristiwa</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Semester</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.map(e => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-mono text-emerald-800 font-bold">
                    {e.tanggalMulai} {e.tanggalSelesai !== e.tanggalMulai ? `s.d. ${e.tanggalSelesai}` : ''}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900 font-serif">
                    {e.kegiatan}
                    {e.deskripsi && <div className="text-[11px] text-slate-500 font-normal mt-0.5">{e.deskripsi}</div>}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-700">{e.kategori}</td>
                  <td className="p-3.5 font-bold text-slate-600">{e.semester}</td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => handleDeleteEvent(e.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Content Agenda */}
      {activeSubTab === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">Agenda & Deskripsi</th>
                <th className="p-3.5">Waktu & Tanggal</th>
                <th className="p-3.5">Lokasi & PJ</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agendas.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 font-serif text-sm">{a.judul}</div>
                    <div className="text-[11px] text-slate-500">{a.deskripsi}</div>
                  </td>
                  <td className="p-3.5 font-mono text-slate-700">
                    <div>{a.tanggal}</div>
                    <div className="text-slate-400 text-[11px]">{a.waktu}</div>
                  </td>
                  <td className="p-3.5 text-slate-700">
                    <div>{a.lokasi}</div>
                    <div className="text-slate-500 text-[11px]">PJ: {a.penanggungJawab}</div>
                  </td>
                  <td className="p-3.5 font-bold text-emerald-800">{a.status}</td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => handleDeleteAgenda(a.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold font-serif text-lg text-slate-900">
                {activeSubTab === 'kalender' ? 'Tambah Event Kalender' : 'Tambah Agenda Kegiatan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {activeSubTab === 'kalender' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan</label>
                    <input
                      type="text"
                      value={eventForm.kegiatan}
                      onChange={(e) => setEventForm({ ...eventForm, kegiatan: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai</label>
                      <input
                        type="date"
                        value={eventForm.tanggalMulai}
                        onChange={(e) => setEventForm({ ...eventForm, tanggalMulai: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                      <input
                        type="date"
                        value={eventForm.tanggalSelesai}
                        onChange={(e) => setEventForm({ ...eventForm, tanggalSelesai: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                      <select
                        value={eventForm.kategori}
                        onChange={(e) => setEventForm({ ...eventForm, kategori: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="KBM" className="bg-white text-slate-900">KBM</option>
                        <option value="Ujian (PTS/PAS)" className="bg-white text-slate-900">Ujian (PTS/PAS)</option>
                        <option value="Hari Besar Islam (PHBI)" className="bg-white text-slate-900">Hari Besar Islam (PHBI)</option>
                        <option value="Kegiatan Ekstrakurikuler" className="bg-white text-slate-900">Kegiatan Ekstrakurikuler</option>
                        <option value="Pembagian Rapor" className="bg-white text-slate-900">Pembagian Rapor</option>
                        <option value="Libur Sekolah" className="bg-white text-slate-900">Libur Sekolah</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Semester</label>
                      <select
                        value={eventForm.semester}
                        onChange={(e) => setEventForm({ ...eventForm, semester: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Ganjil" className="bg-white text-slate-900">Semester Ganjil</option>
                        <option value="Genap" className="bg-white text-slate-900">Semester Genap</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Ringkas</label>
                    <textarea
                      value={eventForm.deskripsi}
                      onChange={(e) => setEventForm({ ...eventForm, deskripsi: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Judul Agenda</label>
                    <input
                      type="text"
                      value={agendaForm.judul}
                      onChange={(e) => setAgendaForm({ ...agendaForm, judul: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                      <input
                        type="date"
                        value={agendaForm.tanggal}
                        onChange={(e) => setAgendaForm({ ...agendaForm, tanggal: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Waktu</label>
                      <input
                        type="text"
                        value={agendaForm.waktu}
                        onChange={(e) => setAgendaForm({ ...agendaForm, waktu: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi</label>
                      <input
                        type="text"
                        value={agendaForm.lokasi}
                        onChange={(e) => setAgendaForm({ ...agendaForm, lokasi: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab</label>
                      <input
                        type="text"
                        value={agendaForm.penanggungJawab}
                        onChange={(e) => setAgendaForm({ ...agendaForm, penanggungJawab: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
                    <textarea
                      value={agendaForm.deskripsi}
                      onChange={(e) => setAgendaForm({ ...agendaForm, deskripsi: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

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
                  Simpan Agenda
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
