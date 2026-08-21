import React, { useState } from 'react';
import { Student, ScheduleItem, Teacher } from '../../types';
import { Layers, Plus, Edit2, Trash2, Check, X, AlertTriangle, Users, Clock, ShieldAlert, ArrowRight, RotateCcw } from 'lucide-react';
import { getAllClasses, DEFAULT_CLASSES } from '../../data/constants';
import { StorageService } from '../../services/storage';

interface KelolaKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schedules: ScheduleItem[];
  teachers: Teacher[];
  onUpdateStudents: (students: Student[]) => void;
  onUpdateSchedules: (schedules: ScheduleItem[]) => void;
  onUpdateTeachers: (teachers: Teacher[]) => void;
  onClassesChange?: () => void;
}

export const KelolaKelasModal: React.FC<KelolaKelasModalProps> = ({
  isOpen,
  onClose,
  students,
  schedules,
  teachers,
  onUpdateStudents,
  onUpdateSchedules,
  onUpdateTeachers,
  onClassesChange
}) => {
  const [storedClasses, setStoredClasses] = useState<string[]>(() => StorageService.getClasses());
  const [newClassName, setNewClassName] = useState('');
  const [editingClassName, setEditingClassName] = useState<string | null>(null);
  const [editTargetValue, setEditTargetValue] = useState('');
  
  // Delete confirm state
  const [deletingClassName, setDeletingClassName] = useState<string | null>(null);
  const [moveToClass, setMoveToClass] = useState<string>('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentClasses = getAllClasses(students, schedules, teachers, storedClasses);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // Add new class
  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newClassName.trim().toUpperCase();
    if (!trimmed) return;

    if (currentClasses.map(c => c.toUpperCase()).includes(trimmed)) {
      showNotification(`Kelas ${trimmed} sudah ada dalam daftar!`, 'error');
      return;
    }

    const updated = [...storedClasses, trimmed];
    setStoredClasses(updated);
    StorageService.setClasses(updated);
    setNewClassName('');
    showNotification(`Kelas ${trimmed} berhasil ditambahkan.`);
    if (onClassesChange) onClassesChange();
  };

  // Rename class across all students, schedules, teachers
  const handleStartEdit = (cls: string) => {
    setEditingClassName(cls);
    setEditTargetValue(cls);
  };

  const handleSaveRename = (oldName: string) => {
    const newName = editTargetValue.trim();
    if (!newName) {
      setEditingClassName(null);
      return;
    }

    if (newName === oldName) {
      setEditingClassName(null);
      return;
    }

    if (currentClasses.includes(newName)) {
      showNotification(`Nama kelas "${newName}" sudah digunakan!`, 'error');
      return;
    }

    // 1. Update stored classes list
    let updatedClassList = storedClasses.map(c => (c === oldName ? newName : c));
    if (!updatedClassList.includes(newName)) {
      updatedClassList.push(newName);
    }
    setStoredClasses(updatedClassList);
    StorageService.setClasses(updatedClassList);

    // 2. Update all students in oldName to newName
    const updatedStudents = students.map(s => (s.kelas === oldName ? { ...s, kelas: newName } : s));
    onUpdateStudents(updatedStudents);

    // 3. Update all schedules in oldName to newName
    const updatedSchedules = schedules.map(j => (j.kelas === oldName ? { ...j, kelas: newName } : j));
    onUpdateSchedules(updatedSchedules);

    // 4. Update any teacher assigned as homeroom teacher (wali kelas)
    const updatedTeachers = teachers.map(t => (t.waliKelasDi === oldName ? { ...t, waliKelasDi: newName } : t));
    onUpdateTeachers(updatedTeachers);

    StorageService.addAuditLog({
      userName: 'Administrator',
      userRole: 'admin',
      module: 'Data Siswa / Rombel',
      action: 'LAINNYA',
      details: `Mengubah nama kelas dari "${oldName}" menjadi "${newName}" pada data siswa, jadwal, dan guru.`
    });

    setEditingClassName(null);
    showNotification(`Kelas "${oldName}" berhasil diubah menjadi "${newName}" di seluruh data!`);
    if (onClassesChange) onClassesChange();
  };

  // Delete class handler
  const handleOpenDelete = (cls: string) => {
    setDeletingClassName(cls);
    const otherClasses = currentClasses.filter(c => c !== cls);
    setMoveToClass(otherClasses[0] || '');
  };

  const handleConfirmDelete = () => {
    if (!deletingClassName) return;

    const clsToDelete = deletingClassName;
    const studentCount = students.filter(s => s.kelas === clsToDelete).length;
    const scheduleCount = schedules.filter(s => s.kelas === clsToDelete).length;

    // If there are students or schedules, move them or unassign
    if (studentCount > 0 && moveToClass) {
      const updatedStudents = students.map(s => (s.kelas === clsToDelete ? { ...s, kelas: moveToClass } : s));
      onUpdateStudents(updatedStudents);
    } else if (studentCount > 0 && !moveToClass) {
      // Unassign or keep default
      const fallback = currentClasses.find(c => c !== clsToDelete) || '7A';
      const updatedStudents = students.map(s => (s.kelas === clsToDelete ? { ...s, kelas: fallback } : s));
      onUpdateStudents(updatedStudents);
    }

    if (scheduleCount > 0 && moveToClass) {
      const updatedSchedules = schedules.map(j => (j.kelas === clsToDelete ? { ...j, kelas: moveToClass } : j));
      onUpdateSchedules(updatedSchedules);
    } else if (scheduleCount > 0 && !moveToClass) {
      // Remove schedule for deleted class
      const updatedSchedules = schedules.filter(j => j.kelas !== clsToDelete);
      onUpdateSchedules(updatedSchedules);
    }

    // Update teachers wali kelas
    const updatedTeachers = teachers.map(t => (t.waliKelasDi === clsToDelete ? { ...t, waliKelasDi: '-' } : t));
    onUpdateTeachers(updatedTeachers);

    // Update stored classes
    const updatedClassList = storedClasses.filter(c => c !== clsToDelete);
    setStoredClasses(updatedClassList);
    StorageService.setClasses(updatedClassList);

    StorageService.addAuditLog({
      userName: 'Administrator',
      userRole: 'admin',
      module: 'Data Siswa / Rombel',
      action: 'LAINNYA',
      details: `Menghapus kelas "${clsToDelete}" ${studentCount > 0 ? `(memindahkan ${studentCount} siswa ke ${moveToClass || 'kelas lain'})` : ''}.`
    });

    setDeletingClassName(null);
    showNotification(`Kelas "${clsToDelete}" berhasil dihapus.`);
    if (onClassesChange) onClassesChange();
  };

  const handleResetDefaultClasses = () => {
    if (confirm('Kembalikan daftar kelas ke format standar (7A, 7B, 8A, 8B, 9A, 9B)?')) {
      setStoredClasses(DEFAULT_CLASSES);
      StorageService.setClasses(DEFAULT_CLASSES);
      showNotification('Daftar kelas telah direset ke kelas standar.');
      if (onClassesChange) onClassesChange();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass backdrop-blur-2xl bg-slate-900/95 rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white">Kelola Rombongan Belajar (Kelas)</h2>
              <p className="text-xs text-slate-300">Tambah, ganti nama (edit), atau hapus kelas di SMP Islam Al Qomar</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Notification Alert */}
          {message && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
              message.type === 'error'
                ? 'bg-red-500/20 text-red-200 border border-red-400/40'
                : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
            }`}>
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-slate-300 font-bold ml-2">×</button>
            </div>
          )}

          {/* Add New Class Form */}
          <form onSubmit={handleAddClass} className="bg-slate-950/70 p-4 rounded-xl border border-white/10 space-y-3">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              + Tambah Rombel / Kelas Baru
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                placeholder="Contoh: 7C, 8-Tahfidz, 9-Unggulan, VII Putra..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kelas</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Format nama kelas bebas (misal: <strong>7A</strong>, <strong>VII-Tahfidz</strong>, <strong>8-Olimpiade</strong>).
            </p>
          </form>

          {/* Class List Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Daftar Kelas Aktif ({currentClasses.length} Kelas)
              </h3>
              <button
                type="button"
                onClick={handleResetDefaultClasses}
                className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                title="Kembalikan ke 7A - 9B"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Standar (7A-9B)</span>
              </button>
            </div>

            <div className="divide-y divide-white/10 bg-slate-950/40 rounded-xl border border-white/10 overflow-hidden">
              {currentClasses.map((cls) => {
                const studentCount = students.filter(s => s.kelas === cls).length;
                const scheduleCount = schedules.filter(s => s.kelas === cls).length;
                const wali = teachers.find(t => t.waliKelasDi === cls);
                const isEditing = editingClassName === cls;

                return (
                  <div
                    key={cls}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                  >
                    {/* Class Info / Edit Input */}
                    <div className="flex-1 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {cls.slice(0, 3)}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 max-w-xs">
                          <input
                            type="text"
                            value={editTargetValue}
                            onChange={(e) => setEditTargetValue(e.target.value)}
                            autoFocus
                            className="px-2.5 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold w-full border border-emerald-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(cls)}
                            className="p-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors"
                            title="Simpan Perubahan Nama"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingClassName(null)}
                            className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                            title="Batal"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">Kelas {cls}</span>
                            {wali && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30 font-medium">
                                Wali: {wali.nama}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-emerald-400" />
                              <strong>{studentCount}</strong> Siswa
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <strong>{scheduleCount}</strong> Jam Jadwal
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {!isEditing && (
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cls)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-white/10 transition-colors flex items-center gap-1"
                          title="Ganti Nama Kelas"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-300" />
                          <span>Ganti Nama</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDelete(cls)}
                          className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg border border-red-400/30 transition-colors flex items-center gap-1"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          {deletingClassName && (
            <div className="p-4 bg-red-950/70 border border-red-500/40 rounded-xl space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-red-200">
                    Konfirmasi Hapus Kelas {deletingClassName}
                  </h4>
                  <p className="text-xs text-red-300/90 mt-1">
                    {students.filter(s => s.kelas === deletingClassName).length > 0 ? (
                      <>
                        Terdapat <strong>{students.filter(s => s.kelas === deletingClassName).length} siswa</strong> dan <strong>{schedules.filter(s => s.kelas === deletingClassName).length} jadwal</strong> di kelas ini. Pilih kelas baru untuk memindahkan mereka:
                      </>
                    ) : (
                      <>Kelas ini tidak memiliki siswa. Yakin ingin menghapus kelas ini dari daftar?</>
                    )}
                  </p>
                </div>
              </div>

              {students.filter(s => s.kelas === deletingClassName).length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-red-200 mb-1">
                    Pindahkan Siswa & Jadwal Ke Kelas:
                  </label>
                  <select
                    value={moveToClass}
                    onChange={(e) => setMoveToClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 rounded-lg text-xs font-bold border border-red-400 focus:outline-none"
                  >
                    {currentClasses
                      .filter(c => c !== deletingClassName)
                      .map(c => (
                        <option key={c} value={c}>
                          Kelas {c}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-500/20">
                <button
                  type="button"
                  onClick={() => setDeletingClassName(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Kelas Sekarang</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Semua perubahan kelas langsung tersinkron ke modul Siswa, Jadwal, Absensi, dan Rapor.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
