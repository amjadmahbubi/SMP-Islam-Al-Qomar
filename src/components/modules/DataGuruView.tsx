import React, { useState } from 'react';
import { Teacher, Student, ScheduleItem } from '../../types';
import { exportToCSV } from '../../services/storage';
import { GraduationCap, Plus, Search, Download, Edit3, Trash2, X, Check, Filter, Key, ShieldCheck, Lock, AlertCircle, Sparkles, BookOpen } from 'lucide-react';
import { DEFAULT_MAPEL_LIST, getAllClasses } from '../../data/constants';

interface DataGuruViewProps {
  teachers: Teacher[];
  students?: Student[];
  schedules?: ScheduleItem[];
  onSaveTeachers: (teachers: Teacher[]) => void;
}

export const DataGuruView: React.FC<DataGuruViewProps> = ({
  teachers,
  students = [],
  schedules = [],
  onSaveTeachers
}) => {
  const dynamicClasses = getAllClasses(students, schedules, teachers);
  const formatClassLabel = (c: string) => (c.toLowerCase().startsWith('kelas') ? c : `Kelas ${c}`);
  const mapelList = DEFAULT_MAPEL_LIST;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Custom Mapel State
  const [isCustomMapel, setIsCustomMapel] = useState(false);
  const [customMapelInput, setCustomMapelInput] = useState('');

  // Additional Mapel State for Form
  const [newAdditionalMapelSelect, setNewAdditionalMapelSelect] = useState('');
  const [isCustomAdditionalMapel, setIsCustomAdditionalMapel] = useState(false);
  const [customAdditionalInput, setCustomAdditionalInput] = useState('');

  // Reset Password State
  const [resetTeacher, setResetTeacher] = useState<Teacher | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  const [form, setForm] = useState<Partial<Teacher>>({
    nuptk: '',
    nama: '',
    nip: '',
    gender: 'L',
    mapelUtama: 'Matematika',
    mapelTambahan: [],
    jabatan: 'Guru Mata Pelajaran',
    email: '',
    telepon: '',
    statusPegawai: 'GTY',
    waliKelasDi: ''
  });

  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.mapelUtama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.mapelTambahan && t.mapelTambahan.some(m => m.toLowerCase().includes(searchTerm.toLowerCase()))) ||
      t.nuptk.includes(searchTerm) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Semua' || t.statusPegawai === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setIsCustomMapel(false);
    setCustomMapelInput('');
    setNewAdditionalMapelSelect('');
    setIsCustomAdditionalMapel(false);
    setCustomAdditionalInput('');
    setForm({
      id: `T${Date.now().toString().slice(-4)}`,
      nuptk: '',
      nama: '',
      nip: '',
      gender: 'L',
      mapelUtama: 'Bahasa Jawa',
      mapelTambahan: [],
      jabatan: 'Guru Mata Pelajaran',
      email: '',
      telepon: '',
      statusPegawai: 'GTY',
      waliKelasDi: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    if (!mapelList.includes(teacher.mapelUtama)) {
      setIsCustomMapel(true);
      setCustomMapelInput(teacher.mapelUtama);
    } else {
      setIsCustomMapel(false);
      setCustomMapelInput('');
    }
    setNewAdditionalMapelSelect('');
    setIsCustomAdditionalMapel(false);
    setCustomAdditionalInput('');
    setForm({
      ...teacher,
      mapelTambahan: Array.isArray(teacher.mapelTambahan) ? [...teacher.mapelTambahan] : []
    });
    setIsModalOpen(true);
  };

  const handleAddAdditionalMapel = (mapelToAdd: string) => {
    const trimmed = mapelToAdd.trim();
    if (!trimmed) return;

    const currentList = form.mapelTambahan || [];
    if (currentList.includes(trimmed) || form.mapelUtama === trimmed) return;

    setForm({
      ...form,
      mapelTambahan: [...currentList, trimmed]
    });
    setNewAdditionalMapelSelect('');
    setCustomAdditionalInput('');
    setIsCustomAdditionalMapel(false);
  };

  const handleRemoveAdditionalMapel = (indexToRemove: number) => {
    const currentList = form.mapelTambahan || [];
    setForm({
      ...form,
      mapelTambahan: currentList.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
      const updated = teachers.filter(t => t.id !== id);
      onSaveTeachers(updated);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalMapel = isCustomMapel ? (customMapelInput.trim() || 'Bahasa Jawa') : (form.mapelUtama || 'Bahasa Jawa');

    if (!form.nama || !finalMapel) return;

    // Filter out duplicate or mapelUtama from mapelTambahan
    const cleanedAdditionalMapels = (form.mapelTambahan || []).filter(
      m => m && m.trim().toLowerCase() !== finalMapel.trim().toLowerCase()
    );

    if (editingTeacher) {
      const updated = teachers.map(t =>
        t.id === editingTeacher.id
          ? ({
              ...(form as Teacher),
              mapelUtama: finalMapel,
              mapelTambahan: cleanedAdditionalMapels
            } as Teacher)
          : t
      );
      onSaveTeachers(updated);
    } else {
      const newTeacher: Teacher = {
        id: form.id || `T${Date.now().toString().slice(-4)}`,
        nuptk: form.nuptk || '1234567890123456',
        nama: form.nama!,
        nip: form.nip,
        gender: (form.gender as 'L' | 'P') || 'L',
        mapelUtama: finalMapel,
        mapelTambahan: cleanedAdditionalMapels,
        jabatan: form.jabatan || 'Guru Mata Pelajaran',
        email: form.email || `${form.nama.toLowerCase().replace(/\s+/g, '')}@alqomar.sch.id`,
        telepon: form.telepon || '081234567890',
        statusPegawai: (form.statusPegawai as any) || 'GTY',
        waliKelasDi: form.waliKelasDi
      };
      onSaveTeachers([...teachers, newTeacher]);
    }

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const csvData = teachers.map(t => ({
      ID: t.id,
      NUPTK: t.nuptk,
      NIGY: t.nigy || t.nip || '-',
      Nama: t.nama,
      Gender: t.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
      Mata_Pelajaran_Utama: t.mapelUtama,
      Mata_Pelajaran_Tambahan: (t.mapelTambahan || []).join('; '),
      Jabatan: t.jabatan,
      Status_Pegawai: t.statusPegawai,
      Wali_Kelas: t.waliKelasDi || '-',
      Email: t.email,
      Telepon: t.telepon
    }));
    exportToCSV('Data_Guru_SMP_Islam_Al_Qomar.csv', csvData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
            <span>Master Data Guru & Tendik</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Kelola Data Tenaga Pendidik (Ustadz & Ustadzah)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data NUPTK, mata pelajaran diampu, wali kelas, status kepegawaian, dan kontak
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-slate-300 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari NUPTK, nama guru, mapel..."
            className="w-full px-3 py-2 pl-9 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-700 font-bold whitespace-nowrap">Status Pegawai:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="Semua" className="bg-white text-slate-900">Semua Status</option>
            <option value="PNS" className="bg-white text-slate-900">PNS</option>
            <option value="GTY" className="bg-white text-slate-900">GTY (Guru Tetap Yayasan)</option>
            <option value="GTT" className="bg-white text-slate-900">GTT (Guru Tidak Tetap)</option>
            <option value="Honor" className="bg-white text-slate-900">Honor</option>
          </select>
        </div>

      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">Nama & NUPTK</th>
                <th className="p-3.5">Mata Pelajaran Diampu</th>
                <th className="p-3.5">Jabatan / Wali Kelas</th>
                <th className="p-3.5">Status Pegawai</th>
                <th className="p-3.5">Kontak & Email</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 font-serif text-sm">{teacher.nama}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      NUPTK: {teacher.nuptk} {(teacher.nigy || teacher.nip) ? `| NIGY: ${teacher.nigy || teacher.nip}` : ''}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-emerald-900 flex items-center gap-1.5 flex-wrap">
                      <span>{teacher.mapelUtama}</span>
                      {teacher.mapelTambahan && teacher.mapelTambahan.length > 0 && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-300">
                          Mapel 1
                        </span>
                      )}
                    </div>
                    {teacher.mapelTambahan && teacher.mapelTambahan.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {teacher.mapelTambahan.map((m, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 bg-sky-50 text-sky-900 text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-200 shadow-2xs"
                          >
                            <span>+ {m}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 text-slate-700">
                    <div>{teacher.jabatan}</div>
                    {teacher.waliKelasDi && (
                      <span className="inline-block mt-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] px-2 py-0.5 rounded border border-amber-300">
                        Wali Kelas {teacher.waliKelasDi}
                      </span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                      teacher.statusPegawai === 'PNS'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {teacher.statusPegawai}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 space-y-0.5">
                    <div className="text-[11px] font-mono">{teacher.email}</div>
                    <div className="text-[11px] text-slate-500">{teacher.telepon}</div>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setResetTeacher(teacher);
                          setNewPassword('');
                          setResetSuccessMessage('');
                        }}
                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Atur Ulang Kata Sandi (Reset Password)"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(teacher)}
                        className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Guru"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold font-serif text-lg text-slate-900">
                {editingTeacher ? 'Edit Data Tenaga Pendidik' : 'Tambah Tenaga Pendidik Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                  placeholder="Ustadz / Ustadzah..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NUPTK</label>
                  <input
                    type="text"
                    value={form.nuptk}
                    onChange={(e) => setForm({ ...form, nuptk: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIGY / NIP (Yayasan)</label>
                  <input
                    type="text"
                    value={form.nigy || form.nip || ''}
                    onChange={(e) => setForm({ ...form, nigy: e.target.value, nip: e.target.value })}
                    placeholder="Contoh: NIGY.201001.018"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Mata Pelajaran Utama</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomMapel(!isCustomMapel)}
                      className="text-[11px] font-bold text-emerald-800 hover:underline"
                    >
                      {isCustomMapel ? 'Daftar' : '+ Kustom'}
                    </button>
                  </div>
                  {isCustomMapel ? (
                    <input
                      type="text"
                      required
                      value={customMapelInput}
                      onChange={(e) => setCustomMapelInput(e.target.value)}
                      placeholder="Ketik nama mapel kustom..."
                      className="w-full px-3 py-2 bg-white border border-emerald-500 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <select
                      value={form.mapelUtama}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCustomMapel(true);
                          setCustomMapelInput('');
                        } else {
                          setForm({ ...form, mapelUtama: e.target.value });
                        }
                      }}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {mapelList.map(m => (
                        <option key={m} value={m} className="bg-white text-slate-900">
                          {m} {(m === 'Bahasa Jawa' || m === "Imla'") ? '★' : ''}
                        </option>
                      ))}
                      <option value="__CUSTOM__" className="bg-emerald-50 text-emerald-950 font-bold">
                        + Ketik Mapel Kustom...
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Kepegawaian</label>
                  <select
                    value={form.statusPegawai}
                    onChange={(e) => setForm({ ...form, statusPegawai: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="GTY" className="bg-white text-slate-900">GTY (Guru Tetap Yayasan)</option>
                    <option value="PNS" className="bg-white text-slate-900">PNS</option>
                    <option value="GTT" className="bg-white text-slate-900">GTT (Guru Tidak Tetap)</option>
                    <option value="Honor" className="bg-white text-slate-900">Honor</option>
                  </select>
                </div>
              </div>

              {/* Mata Pelajaran Tambahan / Ke-2 (Opsional) */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-700" />
                    <label className="text-xs font-bold text-emerald-950">
                      Mata Pelajaran Tambahan / Ke-2 (Opsional)
                    </label>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-medium bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                    Untuk Guru 2 Mapel
                  </span>
                </div>

                {/* List of currently assigned additional mapels */}
                {form.mapelTambahan && form.mapelTambahan.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 py-1">
                    {form.mapelTambahan.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-white text-emerald-950 border border-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold shadow-2xs"
                      >
                        <span>{m}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalMapel(idx)}
                          className="text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors"
                          title="Hapus mata pelajaran tambahan ini"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-900/80 italic">
                    Belum ada mata pelajaran tambahan. Tambahkan jika guru ini mengampu 2 mata pelajaran atau lebih.
                  </p>
                )}

                {/* Add Additional Mapel Control */}
                <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60">
                  {isCustomAdditionalMapel ? (
                    <div className="flex-1 flex gap-1.5">
                      <input
                        type="text"
                        value={customAdditionalInput}
                        onChange={(e) => setCustomAdditionalInput(e.target.value)}
                        placeholder="Nama mapel tambahan kustom..."
                        className="flex-1 px-3 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customAdditionalInput.trim()) {
                            handleAddAdditionalMapel(customAdditionalInput.trim());
                          }
                        }}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Tambah
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCustomAdditionalMapel(false)}
                        className="px-2.5 py-1.5 text-xs text-slate-600 hover:bg-white/60 rounded-lg"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 flex gap-1.5">
                      <select
                        value={newAdditionalMapelSelect}
                        onChange={(e) => {
                          if (e.target.value === '__CUSTOM_ADDITIONAL__') {
                            setIsCustomAdditionalMapel(true);
                            setCustomAdditionalInput('');
                          } else if (e.target.value) {
                            handleAddAdditionalMapel(e.target.value);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="" className="bg-white text-slate-900">
                          + Pilih Tambah Mata Pelajaran...
                        </option>
                        {mapelList
                          .filter(
                            m =>
                              m !== form.mapelUtama &&
                              !(form.mapelTambahan || []).includes(m)
                          )
                          .map(m => (
                            <option key={m} value={m} className="bg-white text-slate-900">
                              {m}
                            </option>
                          ))}
                        <option value="__CUSTOM_ADDITIONAL__" className="bg-emerald-50 text-emerald-950 font-bold">
                          + Ketik Nama Mapel Tambahan Lain...
                        </option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan Tambahan</label>
                  <input
                    type="text"
                    value={form.jabatan}
                    onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Wali Kelas Di (Opsional)</label>
                  <select
                    value={form.waliKelasDi || ''}
                    onChange={(e) => setForm({ ...form, waliKelasDi: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="" className="bg-white text-slate-900">-- Bukan Wali Kelas --</option>
                    {dynamicClasses.map(c => (
                      <option key={c} value={c} className="bg-white text-slate-900">
                        {formatClassLabel(c)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / Whatsapp</label>
                  <input
                    type="text"
                    value={form.telepon}
                    onChange={(e) => setForm({ ...form, telepon: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Simpan Data
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Key className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold font-serif text-base text-slate-900">
                    Atur Ulang Kata Sandi Akun
                  </h3>
                  <p className="text-xs text-slate-500">
                    Administrator DAPODIK Security Panel
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResetTeacher(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Guru:</span>
                <span className="font-bold text-slate-900">{resetTeacher.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Akun:</span>
                <span className="font-mono text-slate-800">{resetTeacher.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mapel / Jabatan:</span>
                <span className="font-semibold text-emerald-800">{resetTeacher.mapelUtama}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-blue-950 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Prinsip Keamanan Sandi</span>
              </div>
              <p>
                Sesuai standar keamanan data, kata sandi lama <strong>tidak dapat dilihat secara mentah (plain-text)</strong> demi melindungi privasi guru. Admin hanya dapat memasukkan kata sandi sementara baru jika guru lupa sandinya.
              </p>
            </div>

            {resetSuccessMessage ? (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{resetSuccessMessage}</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newPassword.trim()) return;
                  setResetSuccessMessage(`Kata sandi baru untuk ${resetTeacher.nama} berhasil diperbarui! Silakan beritahukan sandi sementara ini kepada beliau.`);
                  setTimeout(() => {
                    setResetTeacher(null);
                    setResetSuccessMessage('');
                  }, 2500);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Masukkan Kata Sandi Baru (Sementara)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter..."
                      className="w-full px-3 py-2 pl-9 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetTeacher(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                  >
                    <Key className="w-4 h-4" />
                    <span>Simpan Kata Sandi Baru</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
