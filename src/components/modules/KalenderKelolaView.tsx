import React, { useState } from 'react';
import { CalendarEvent, AgendaItem, UserSession, Teacher } from '../../types';
import {
  CalendarDays,
  Plus,
  Trash2,
  Edit3,
  X,
  Sparkles,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  BookOpen,
  GraduationCap
} from 'lucide-react';

interface KalenderKelolaViewProps {
  events: CalendarEvent[];
  agendas: AgendaItem[];
  session?: UserSession;
  teachers?: Teacher[];
  onSaveEvents: (events: CalendarEvent[]) => void;
  onSaveAgendas: (agendas: AgendaItem[]) => void;
}

export const KalenderKelolaView: React.FC<KalenderKelolaViewProps> = ({
  events,
  agendas,
  session,
  teachers = [],
  onSaveEvents,
  onSaveAgendas
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'kalender' | 'agenda'>('kalender');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loggedTeacher = teachers.find(
    t => (session?.teacherId && t.id === session.teacherId) || t.nama === session?.name
  );

  const isAdmin = session?.role === 'admin';
  const isKepalaSekolah = !!(
    loggedTeacher &&
    (loggedTeacher.jabatan?.toLowerCase().includes('kepala sekolah') ||
      loggedTeacher.jabatan?.toLowerCase().includes('kepsek'))
  );
  const isWakaKurikulum = !!(
    loggedTeacher &&
    (loggedTeacher.jabatan?.toLowerCase().includes('kurikulum') ||
      loggedTeacher.jabatan?.toLowerCase().includes('kurikuler'))
  );
  const isWakaKesiswaan = !!(
    loggedTeacher &&
    (loggedTeacher.jabatan?.toLowerCase().includes('kesiswaan') ||
      loggedTeacher.jabatan?.toLowerCase().includes('santri'))
  );
  const isKoordinatorUmmi = !!(
    loggedTeacher &&
    (loggedTeacher.jabatan?.toLowerCase().includes('ummi') ||
      loggedTeacher.jabatan?.toLowerCase().includes('tahfidz') ||
      loggedTeacher.jabatan?.toLowerCase().includes('qur') ||
      loggedTeacher.jabatan?.toLowerCase().includes('diniyah'))
  );

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
    penanggungJawab: loggedTeacher?.nama || 'Tim Panitia',
    kategori: isKoordinatorUmmi ? 'Tahfidz & Metode Ummi' : isWakaKesiswaan ? 'Kesiswaan & Ekstrakurikuler' : 'Keagamaan',
    deskripsi: '',
    status: 'Akan Datang'
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    if (activeSubTab === 'kalender') {
      setEventForm({
        tanggalMulai: new Date().toISOString().split('T')[0],
        tanggalSelesai: new Date().toISOString().split('T')[0],
        kegiatan: '',
        kategori: isKoordinatorUmmi ? 'Program & Ujian Metode Ummi / Tahfidz' : isWakaKurikulum ? 'KBM' : 'Kegiatan Ekstrakurikuler',
        deskripsi: '',
        semester: 'Ganjil'
      });
    } else {
      setAgendaForm({
        judul: '',
        tanggal: new Date().toISOString().split('T')[0],
        waktu: '08:00 - 11:30 WIB',
        lokasi: 'Masjid Al Qomar',
        penanggungJawab: loggedTeacher?.nama || 'Tim Panitia',
        kategori: isKoordinatorUmmi ? 'Tahfidz & Metode Ummi' : isWakaKesiswaan ? 'Kesiswaan & Ekstrakurikuler' : 'Keagamaan',
        deskripsi: '',
        status: 'Akan Datang'
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenEditEvent = (event: CalendarEvent) => {
    setEditingId(event.id);
    setEventForm({ ...event });
    setIsModalOpen(true);
  };

  const handleOpenEditAgenda = (agenda: AgendaItem) => {
    setEditingId(agenda.id);
    setAgendaForm({ ...agenda });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus agenda kalender ini?')) {
      onSaveEvents(events.filter(e => e.id !== id));
    }
  };

  const handleDeleteAgenda = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini?')) {
      onSaveAgendas(agendas.filter(a => a.id !== id));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSubTab === 'kalender') {
      if (!eventForm.kegiatan) return;
      if (editingId) {
        const updated = events.map(ev =>
          ev.id === editingId
            ? ({
                ...ev,
                tanggalMulai: eventForm.tanggalMulai || ev.tanggalMulai,
                tanggalSelesai: eventForm.tanggalSelesai || eventForm.tanggalMulai || ev.tanggalSelesai,
                kegiatan: eventForm.kegiatan!,
                kategori: (eventForm.kategori as any) || ev.kategori,
                deskripsi: eventForm.deskripsi || '',
                semester: (eventForm.semester as any) || ev.semester
              } as CalendarEvent)
            : ev
        );
        onSaveEvents(updated);
      } else {
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
      }
    } else {
      if (!agendaForm.judul) return;
      if (editingId) {
        const updated = agendas.map(ag =>
          ag.id === editingId
            ? ({
                ...ag,
                judul: agendaForm.judul!,
                tanggal: agendaForm.tanggal || ag.tanggal,
                waktu: agendaForm.waktu || ag.waktu,
                lokasi: agendaForm.lokasi || ag.lokasi,
                penanggungJawab: agendaForm.penanggungJawab || ag.penanggungJawab,
                kategori: (agendaForm.kategori as any) || ag.kategori,
                deskripsi: agendaForm.deskripsi || '',
                status: (agendaForm.status as any) || ag.status
              } as AgendaItem)
            : ag
        );
        onSaveAgendas(updated);
      } else {
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
    }
    setIsModalOpen(false);
  };

  const filteredEvents = events.filter(e =>
    e.kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.deskripsi && e.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())) ||
    e.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgendas = agendas.filter(a =>
    a.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.deskripsi && a.deskripsi.toLowerCase().includes(searchTerm.toLowerCase())) ||
    a.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.penanggungJawab.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
            <span>Kelola Kalender Akademik & Agenda Kegiatan</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Pengaturan Kalender Efektif & Agenda Sekolah
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Modul penginputan dan penyesuaian jadwal kalender akademik, pekan efektif, serta agenda santri
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{activeSubTab === 'kalender' ? 'Tambah Agenda Kalender' : 'Tambah Agenda Kegiatan'}</span>
        </button>
      </div>

      {/* Role Access Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-white/10 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <span>Hak Akses Pengelolaan:</span>
              <span className="bg-amber-400/20 px-2 py-0.5 rounded text-[11px] font-mono font-bold text-amber-200">
                {isAdmin
                  ? isKepalaSekolah
                    ? 'Kepala Sekolah (Admin Penuh)'
                    : 'Administrator DAPODIK'
                  : isWakaKurikulum
                  ? 'Waka Kurikulum'
                  : isWakaKesiswaan
                  ? 'Waka Kesiswaan'
                  : isKoordinatorUmmi
                  ? 'Koordinator Metode Ummi & Tahfidz'
                  : session?.name || 'Pengajar'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">
              {isKoordinatorUmmi
                ? 'Diberikan akses mengelola agenda kegiatan keagamaan, munaqasyah, dan ujian metode Ummi/Tahfidz.'
                : isWakaKesiswaan
                ? 'Diberikan akses mengelola agenda kegiatan santri, OSIS, PHBI, ekstrakurikuler, dan parenting.'
                : isWakaKurikulum
                ? 'Diberikan akses mengelola kalender akademik, pekan efektif KBM, jadwal asesmen PTS/PAS, dan rapor.'
                : 'Memiliki otoritas penuh menginput, mengedit, dan menghapus seluruh kalender dan agenda sekolah.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-800/80 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-[11px] text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{events.length} Kalender • {agendas.length} Agenda</span>
        </div>
      </div>

      {/* Sub tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveSubTab('kalender');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'kalender' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kalender Akademik ({events.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('agenda');
              setSearchTerm('');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'agenda' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Agenda Kegiatan Santri ({agendas.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Cari ${activeSubTab === 'kalender' ? 'kegiatan kalender...' : 'agenda kegiatan...'}`}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Content Kalender */}
      {activeSubTab === 'kalender' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Tanggal Pelaksanaan</th>
                  <th className="p-3.5">Kegiatan / Peristiwa</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Semester</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono text-emerald-800 font-bold whitespace-nowrap">
                      {e.tanggalMulai} {e.tanggalSelesai && e.tanggalSelesai !== e.tanggalMulai ? `s.d. ${e.tanggalSelesai}` : ''}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 font-serif">
                      <div>{e.kegiatan}</div>
                      {e.deskripsi && <div className="text-[11px] text-slate-500 font-normal mt-0.5">{e.deskripsi}</div>}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-medium text-[11px]">
                        {e.kategori}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-600 whitespace-nowrap">
                      Semester {e.semester}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditEvent(e)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Sunting Kegiatan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(e.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Kegiatan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                      Tidak ada agenda kalender yang sesuai dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Content Agenda */}
      {activeSubTab === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Agenda & Deskripsi</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Waktu & Tanggal</th>
                  <th className="p-3.5">Lokasi & PJ</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAgendas.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 font-serif text-sm">{a.judul}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{a.deskripsi}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-700 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[11px]">
                        {a.kategori}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                      <div className="font-bold text-emerald-900">{a.tanggal}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{a.waktu}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{a.lokasi}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>PJ: {a.penanggungJawab}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-800 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditAgenda(a)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Sunting Agenda"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgenda(a.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Agenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAgendas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                      Tidak ada agenda kegiatan yang sesuai dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold font-serif text-lg text-slate-900">
                {editingId
                  ? activeSubTab === 'kalender'
                    ? 'Sunting Agenda Kalender'
                    : 'Sunting Agenda Kegiatan'
                  : activeSubTab === 'kalender'
                  ? 'Tambah Agenda Kalender'
                  : 'Tambah Agenda Kegiatan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {activeSubTab === 'kalender' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kegiatan / Peristiwa</label>
                    <input
                      type="text"
                      value={eventForm.kegiatan}
                      onChange={(e) => setEventForm({ ...eventForm, kegiatan: e.target.value })}
                      required
                      placeholder="Contoh: Pekan Asesmen Sumatif Akhir Semester (PAS)..."
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
                        required
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
                        <option value="KBM" className="bg-white text-slate-900">KBM & Pekan Efektif</option>
                        <option value="Ujian (PTS/PAS)" className="bg-white text-slate-900">Ujian (PTS / PAS / Asesmen)</option>
                        <option value="Hari Besar Islam (PHBI)" className="bg-white text-slate-900">Hari Besar Islam (PHBI)</option>
                        <option value="Kegiatan Ekstrakurikuler" className="bg-white text-slate-900">Kegiatan Kesiswaan & Ekskul</option>
                        <option value="Program & Ujian Metode Ummi / Tahfidz" className="bg-white text-slate-900">Program Ummi & Tahfidz</option>
                        <option value="Pembagian Rapor" className="bg-white text-slate-900">Pembagian Rapor & Evaluasi</option>
                        <option value="Libur Sekolah" className="bg-white text-slate-900">Libur Sekolah & Nasional</option>
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
                      placeholder="Keterangan tambahan pelaksanaan atau catatan khusus..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Judul Agenda Kegiatan</label>
                    <input
                      type="text"
                      value={agendaForm.judul}
                      onChange={(e) => setAgendaForm({ ...agendaForm, judul: e.target.value })}
                      required
                      placeholder="Contoh: Munaqasyah Tartil & Tahfidz Metode Ummi Juz 30..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Agenda</label>
                      <select
                        value={agendaForm.kategori}
                        onChange={(e) => setAgendaForm({ ...agendaForm, kategori: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Keagamaan" className="bg-white text-slate-900">Keagamaan & Ibadah</option>
                        <option value="Tahfidz & Metode Ummi" className="bg-white text-slate-900">Tahfidz & Metode Ummi</option>
                        <option value="Akademik" className="bg-white text-slate-900">Akademik & Kurikulum</option>
                        <option value="Lomba / Prestasi" className="bg-white text-slate-900">Lomba & Prestasi Santri</option>
                        <option value="Parenting / Kemitraan" className="bg-white text-slate-900">Parenting / Kemitraan Wali Murid</option>
                        <option value="Rapat Guru" className="bg-white text-slate-900">Rapat Guru & Evaluasi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status Kegiatan</label>
                      <select
                        value={agendaForm.status}
                        onChange={(e) => setAgendaForm({ ...agendaForm, status: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Akan Datang" className="bg-white text-slate-900">Akan Datang</option>
                        <option value="Berlangsung" className="bg-white text-slate-900">Sedang Berlangsung</option>
                        <option value="Selesai" className="bg-white text-slate-900">Selesai</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal</label>
                      <input
                        type="date"
                        value={agendaForm.tanggal}
                        onChange={(e) => setAgendaForm({ ...agendaForm, tanggal: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Waktu Pelaksanaan</label>
                      <input
                        type="text"
                        value={agendaForm.waktu}
                        onChange={(e) => setAgendaForm({ ...agendaForm, waktu: e.target.value })}
                        placeholder="Contoh: 08:00 - 11:30 WIB"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Kegiatan</label>
                      <input
                        type="text"
                        value={agendaForm.lokasi}
                        onChange={(e) => setAgendaForm({ ...agendaForm, lokasi: e.target.value })}
                        placeholder="Masjid Al Qomar / Aula Utama..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Penanggung Jawab (PJ)</label>
                      <input
                        type="text"
                        value={agendaForm.penanggungJawab}
                        onChange={(e) => setAgendaForm({ ...agendaForm, penanggungJawab: e.target.value })}
                        placeholder="Nama koordinator atau tim PJ..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Detail Acara</label>
                    <textarea
                      value={agendaForm.deskripsi}
                      onChange={(e) => setAgendaForm({ ...agendaForm, deskripsi: e.target.value })}
                      rows={2}
                      placeholder="Uraian kegiatan, susunan agenda, atau target peserta santri..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  {editingId ? 'Perbarui Data' : 'Simpan Data'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
