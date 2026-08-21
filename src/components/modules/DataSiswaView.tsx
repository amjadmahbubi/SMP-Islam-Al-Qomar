import React, { useState } from 'react';
import { Student, ScheduleItem, Teacher } from '../../types';
import { exportToCSV } from '../../services/storage';
import { Users, Plus, Search, Download, Edit3, Trash2, X, Filter, Layers, Settings } from 'lucide-react';
import { getAllClasses } from '../../data/constants';
import { KelolaKelasModal } from './KelolaKelasModal';

interface DataSiswaViewProps {
  students: Student[];
  onSaveStudents: (students: Student[]) => void;
  schedules?: ScheduleItem[];
  onSaveSchedules?: (schedules: ScheduleItem[]) => void;
  teachers?: Teacher[];
  onSaveTeachers?: (teachers: Teacher[]) => void;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  students,
  onSaveStudents,
  schedules = [],
  onSaveSchedules = () => {},
  teachers = [],
  onSaveTeachers = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Aktif');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [isCustomClass, setIsCustomClass] = useState(false);
  const [customClassInput, setCustomClassInput] = useState('');

  const [form, setForm] = useState<Partial<Student>>({
    nisn: '',
    nis: '',
    nama: '',
    gender: 'L',
    kelas: '7A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2011-01-01',
    namaOrangTua: '',
    noHpOrangTua: '',
    alamat: '',
    status: 'Aktif'
  });

  const classes = getAllClasses(students);

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nisn.includes(searchTerm) ||
      s.nis.includes(searchTerm) ||
      s.namaOrangTua.toLowerCase().includes(searchTerm.toLowerCase());
    const matchClass = classFilter === 'Semua' || s.kelas === classFilter;
    const matchStatus = statusFilter === 'Semua' || s.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setIsCustomClass(false);
    setCustomClassInput('');
    setForm({
      id: `S${Date.now().toString().slice(-4)}`,
      nisn: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      nis: `2407${Math.floor(100 + Math.random() * 899)}`,
      nama: '',
      gender: 'L',
      kelas: classes[0] || '7A',
      tempatLahir: 'Banyuwangi',
      tanggalLahir: '2011-05-15',
      namaOrangTua: '',
      noHpOrangTua: '',
      alamat: '',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    if (!classes.includes(student.kelas)) {
      setIsCustomClass(true);
      setCustomClassInput(student.kelas);
    } else {
      setIsCustomClass(false);
      setCustomClassInput('');
    }
    setForm({ ...student });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) {
      const updated = students.filter(s => s.id !== id);
      onSaveStudents(updated);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.nisn) return;

    const finalKelas = isCustomClass ? (customClassInput.trim() || '7A') : (form.kelas || '7A');

    if (editingStudent) {
      const updated = students.map(s => (s.id === editingStudent.id ? ({ ...(form as Student), kelas: finalKelas } as Student) : s));
      onSaveStudents(updated);
    } else {
      const newStudent: Student = {
        id: form.id || `S${Date.now().toString().slice(-4)}`,
        nisn: form.nisn!,
        nis: form.nis || '2407000',
        nama: form.nama!,
        gender: (form.gender as 'L' | 'P') || 'L',
        kelas: finalKelas,
        tempatLahir: form.tempatLahir || 'Banyuwangi',
        tanggalLahir: form.tanggalLahir || '2011-01-01',
        namaOrangTua: form.namaOrangTua || 'Orang Tua Siswa',
        noHpOrangTua: form.noHpOrangTua || '08123456789',
        alamat: form.alamat || 'Banyuwangi',
        status: (form.status as any) || 'Aktif'
      };
      onSaveStudents([...students, newStudent]);
    }

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const csvData = students.map(s => ({
      ID: s.id,
      NISN: s.nisn,
      NIS: s.nis,
      Nama: s.nama,
      Gender: s.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
      Kelas: s.kelas,
      Tempat_Lahir: s.tempatLahir,
      Tanggal_Lahir: s.tanggalLahir,
      Orang_Tua: s.namaOrangTua,
      No_HP_Orang_Tua: s.noHpOrangTua,
      Alamat: s.alamat,
      Status: s.status
    }));
    exportToCSV('Data_Siswa_SMP_Islam_Al_Qomar.csv', csvData);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>Master Data Peserta Didik</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Kelola Data Siswa & Santri SMP Islam Al Qomar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Induk data NISN, NIS, rombel kelas, orang tua/wali, serta status keaktifan santri
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsClassModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-emerald-500/30 transition-colors shadow-sm"
            title="Kelola, tambah, ganti nama, atau hapus kelas"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Kelola Rombel / Kelas</span>
          </button>

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
            <span>Tambah Siswa</span>
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
            placeholder="Cari NISN, nama siswa, wali..."
            className="w-full px-3 py-2 pl-9 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-700 font-bold">Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua" className="bg-white text-slate-900">Semua Kelas</option>
              {classes.map(c => <option key={c} value={c} className="bg-white text-slate-900">Kelas {c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-700 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua" className="bg-white text-slate-900">Semua</option>
              <option value="Aktif" className="bg-white text-slate-900">Aktif</option>
              <option value="Lulus" className="bg-white text-slate-900">Lulus</option>
              <option value="Pindah" className="bg-white text-slate-900">Pindah</option>
            </select>
          </div>
        </div>

      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="p-3.5">Nama & NISN</th>
                <th className="p-3.5">Rombel / Kelas</th>
                <th className="p-3.5">L/P</th>
                <th className="p-3.5">Tempat & Tgl Lahir</th>
                <th className="p-3.5">Orang Tua / Wali</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 font-serif text-sm">{student.nama}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      NISN: {student.nisn} | NIS: {student.nis}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200">
                      Kelas {student.kelas}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold text-slate-700">
                    {student.gender}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    <div>{student.tempatLahir}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{student.tanggalLahir}</div>
                  </td>
                  <td className="p-3.5 text-slate-700">
                    <div className="font-semibold">{student.namaOrangTua}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{student.noHpOrangTua}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      student.status === 'Aktif'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(student)}
                        className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Data Siswa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Siswa"
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
                {editingStudent ? 'Edit Data Santri / Siswa' : 'Tambah Santri / Siswa Baru'}
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    value={form.nisn}
                    onChange={(e) => setForm({ ...form, nisn: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIS Lokal</label>
                  <input
                    type="text"
                    value={form.nis}
                    onChange={(e) => setForm({ ...form, nis: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Rombel / Kelas</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomClass(!isCustomClass)}
                    className="text-[11px] font-bold text-emerald-800 hover:underline"
                  >
                    {isCustomClass ? 'Pilih dari List' : '+ Tulis Kustom'}
                  </button>
                </div>
                {isCustomClass ? (
                  <input
                    type="text"
                    required
                    value={customClassInput}
                    onChange={(e) => setCustomClassInput(e.target.value)}
                    placeholder="Contoh: 7C, 8-Tahfidz, VII Putri..."
                    className="w-full px-3 py-2 bg-white border border-emerald-500 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <select
                    value={form.kelas}
                    onChange={(e) => {
                      if (e.target.value === '__CUSTOM__') {
                        setIsCustomClass(true);
                        setCustomClassInput('');
                      } else {
                        setForm({ ...form, kelas: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {classes.map(c => <option key={c} value={c} className="bg-white text-slate-900">Kelas {c}</option>)}
                    <option value="__CUSTOM__" className="bg-emerald-50 text-emerald-950 font-bold">
                      + Tulis Kelas Kustom Baru...
                    </option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="L" className="bg-white text-slate-900">Laki-Laki</option>
                    <option value="P" className="bg-white text-slate-900">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Aktif" className="bg-white text-slate-900">Aktif</option>
                    <option value="Lulus" className="bg-white text-slate-900">Lulus</option>
                    <option value="Pindah" className="bg-white text-slate-900">Pindah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={form.tempatLahir}
                    onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={form.tanggalLahir}
                    onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Orang Tua / Wali</label>
                  <input
                    type="text"
                    value={form.namaOrangTua}
                    onChange={(e) => setForm({ ...form, namaOrangTua: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. HP Orang Tua</label>
                  <input
                    type="text"
                    value={form.noHpOrangTua}
                    onChange={(e) => setForm({ ...form, noHpOrangTua: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                <textarea
                  value={form.alamat}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
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
                  Simpan Data Siswa
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Kelola Kelas Modal */}
      <KelolaKelasModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
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
