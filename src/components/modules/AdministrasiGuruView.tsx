import React, { useState } from 'react';
import { TeacherDoc, Teacher, UserSession } from '../../types';
import { FolderKanban, Plus, ExternalLink, CheckCircle, Clock, AlertCircle, Edit3, Trash2, X, MessageSquare, FileText } from 'lucide-react';

interface AdministrasiGuruViewProps {
  docs: TeacherDoc[];
  teachers: Teacher[];
  session: UserSession;
  onSaveDocs: (docs: TeacherDoc[]) => void;
}

export const AdministrasiGuruView: React.FC<AdministrasiGuruViewProps> = ({
  docs,
  teachers,
  session,
  onSaveDocs
}) => {
  const [selectedJenis, setSelectedJenis] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TeacherDoc | null>(null);

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

  const loggedTeacher = teachers.find(
    t => (session.teacherId && t.id === session.teacherId) || (session.name && t.nama.toLowerCase() === session.name.toLowerCase())
  );
  const teacherDefaultMapel = loggedTeacher?.mapelUtama || mapelList[0];

  const [form, setForm] = useState<Partial<TeacherDoc>>({
    jenisDokumen: 'Modul Ajar / RPP',
    mataPelajaran: teacherDefaultMapel,
    kelas: '7A',
    tahunAjaran: '2024/2025',
    judul: '',
    linkFile: '',
    status: 'Menunggu Verifikasi'
  });

  const jenisOptions = [
    'Semua',
    'Modul Ajar / RPP',
    'Program Tahunan (Prota)',
    'Program Semester (Promes)',
    'Silabus',
    'KKTP / KKM',
    'Bahan Ajar'
  ];

  const filteredDocs = docs.filter((d) => {
    const matchJenis = selectedJenis === 'Semua' || d.jenisDokumen === selectedJenis;
    if (session.role === 'guru' && session.teacherId) {
      return matchJenis && d.teacherId === session.teacherId;
    }
    return matchJenis;
  });

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setForm({
      id: `DOC${Date.now().toString().slice(-4)}`,
      teacherId: session.teacherId || teachers[0]?.id || 'T002',
      teacherName: session.name || teachers[0]?.nama || 'Ustadzah Siti Fatimah, S.Pd.',
      jenisDokumen: 'Modul Ajar / RPP',
      mataPelajaran: teacherDefaultMapel,
      kelas: '7A',
      tahunAjaran: '2024/2025',
      judul: '',
      linkFile: 'https://docs.google.com/document/d/sample-link',
      status: 'Menunggu Verifikasi'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus berkas administrasi ini?')) {
      const updated = docs.filter(d => d.id !== id);
      onSaveDocs(updated);
    }
  };

  const handleVerifyStatus = (docId: string, newStatus: 'Disetujui' | 'Revisi', catatan?: string) => {
    const updated = docs.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          status: newStatus,
          catatanKepsek: catatan || (newStatus === 'Disetujui' ? 'Sudah disetujui Kepala Sekolah.' : 'Mohon lengkapi ATP dan lembar penilaian.')
        };
      }
      return d;
    });
    onSaveDocs(updated);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul) return;

    if (editingDoc) {
      const updated = docs.map(d => (d.id === editingDoc.id ? (form as TeacherDoc) : d));
      onSaveDocs(updated);
    } else {
      const newDoc: TeacherDoc = {
        id: form.id || `DOC${Date.now().toString().slice(-4)}`,
        teacherId: form.teacherId || 'T002',
        teacherName: form.teacherName || 'Ustadzah Siti Fatimah, S.Pd.',
        jenisDokumen: (form.jenisDokumen as any) || 'Modul Ajar / RPP',
        mataPelajaran: form.mataPelajaran || 'Matematika',
        kelas: form.kelas || '7A',
        tahunAjaran: form.tahunAjaran || '2024/2025',
        judul: form.judul!,
        linkFile: form.linkFile || 'https://drive.google.com',
        tanggalUpload: new Date().toISOString().split('T')[0],
        status: (form.status as any) || 'Menunggu Verifikasi'
      };
      onSaveDocs([newDoc, ...docs]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <FolderKanban className="w-3.5 h-3.5 text-emerald-700" />
            <span>Administrasi Guru & Perangkat Pembelajaran</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-slate-900">
            Kelola Modul Ajar, RPP, Prota, Promes, & Silabus
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Unggah dan periksa dokumen kelengkapan administrasi guru Kurikulum Merdeka
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Unggah Berkas Administrasi</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap gap-1.5">
        {jenisOptions.map((j) => (
          <button
            key={j}
            onClick={() => setSelectedJenis(j)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedJenis === j
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {j}
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                  {doc.jenisDokumen}
                </span>

                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border flex items-center gap-1 ${
                  doc.status === 'Disetujui'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : doc.status === 'Revisi'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {doc.status === 'Disetujui' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                  {doc.status === 'Menunggu Verifikasi' && <Clock className="w-3 h-3 text-blue-600" />}
                  {doc.status === 'Revisi' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                  <span>{doc.status}</span>
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 font-serif leading-snug">
                {doc.judul}
              </h3>

              <div className="mt-2 text-xs text-slate-600 space-y-1">
                <p>👨‍🏫 <strong>Guru:</strong> {doc.teacherName}</p>
                <p>📚 <strong>Mapel & Kelas:</strong> {doc.mataPelajaran} (Kelas {doc.kelas})</p>
                <p>📅 <strong>Tanggal Upload:</strong> {doc.tanggalUpload}</p>
              </div>

              {doc.catatanKepsek && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    Catatan Verifikasi Kepsek:
                  </span>
                  <p className="italic text-slate-600">"{doc.catatanKepsek}"</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <a
                href={doc.linkFile}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Berkas Google Drive</span>
              </a>

              {/* Admin Verification Actions */}
              {session.role === 'admin' ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleVerifyStatus(doc.id, 'Disetujui')}
                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-bold rounded-lg transition-colors"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => handleVerifyStatus(doc.id, 'Revisi')}
                    className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 text-[11px] font-bold rounded-lg transition-colors"
                  >
                    Revisi
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                  title="Hapus berkas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        ))}
      </div>

      {/* Modal Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold font-serif text-lg text-slate-900">
                Unggah Dokumen Perangkat Ajar
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Dokumen / Modul</label>
                <input
                  type="text"
                  value={form.judul}
                  onChange={(e) => setForm({ ...form, judul: e.target.value })}
                  required
                  placeholder="Modul Ajar Matematika BAB 1 Bilangan Bulat..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Dokumen</label>
                  <select
                    value={form.jenisDokumen}
                    onChange={(e) => setForm({ ...form, jenisDokumen: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {jenisOptions.filter(j => j !== 'Semua').map(j => (
                      <option key={j} value={j} className="bg-white text-slate-900">{j}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Guru Pengampu</label>
                  <select
                    value={form.teacherId}
                    onChange={(e) => {
                      const selectedT = teachers.find(t => t.id === e.target.value);
                      setForm({
                        ...form,
                        teacherId: e.target.value,
                        teacherName: selectedT?.nama || '',
                        mataPelajaran: selectedT?.mapelUtama || form.mataPelajaran
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id} className="bg-white text-slate-900">{t.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={form.mataPelajaran}
                    onChange={(e) => setForm({ ...form, mataPelajaran: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {mapelList.map(m => (
                      <option key={m} value={m} className="bg-white text-slate-900">{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sasaran Kelas</label>
                  <select
                    value={form.kelas}
                    onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="7A" className="bg-white text-slate-900">Kelas 7A</option>
                    <option value="7B" className="bg-white text-slate-900">Kelas 7B</option>
                    <option value="8A" className="bg-white text-slate-900">Kelas 8A</option>
                    <option value="8B" className="bg-white text-slate-900">Kelas 8B</option>
                    <option value="9A" className="bg-white text-slate-900">Kelas 9A</option>
                    <option value="9B" className="bg-white text-slate-900">Kelas 9B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tautan File Google Drive / Cloud</label>
                <input
                  type="url"
                  value={form.linkFile}
                  onChange={(e) => setForm({ ...form, linkFile: e.target.value })}
                  required
                  placeholder="https://docs.google.com/document/d/..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                  Kirim Dokumen
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
