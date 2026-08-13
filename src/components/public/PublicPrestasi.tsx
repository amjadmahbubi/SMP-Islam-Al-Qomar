import React, { useState } from 'react';
import { StudentAchievement, Student, UserSession } from '../../types';
import {
  Trophy,
  Award,
  Medal,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Sparkles,
  Star,
  CheckCircle2,
  X,
  UserCheck
} from 'lucide-react';

interface PublicPrestasiProps {
  achievements: StudentAchievement[];
  students: Student[];
  session: UserSession;
  onSaveAchievements: (updated: StudentAchievement[]) => void;
}

export const PublicPrestasi: React.FC<PublicPrestasiProps> = ({
  achievements,
  students,
  session,
  onSaveAchievements
}) => {
  const isAuthorized = session.role === 'admin' || session.role === 'guru';

  // Filters
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedTingkat, setSelectedTingkat] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<StudentAchievement, 'id'>>({
    studentName: '',
    kelas: '7A',
    judulPrestasi: '',
    kategori: "Tahfidz & Al-Qur'an",
    tingkat: 'Provinsi',
    tahun: '2024',
    penyelenggara: '',
    pembimbing: '',
    medali: 'Juara 1',
    deskripsi: ''
  });

  const categories = [
    'Semua',
    "Tahfidz & Al-Qur'an",
    'Akademik',
    'Seni & Kaligrafi',
    'Olahraga',
    'Sains & Teknologi',
    'Bahasa & Pidato'
  ];

  const levels = ['Semua', 'Kecamatan', 'Kota / Kabupaten', 'Provinsi', 'Nasional', 'Internasional'];

  // Filtered achievements
  const filteredAchievements = achievements.filter((item) => {
    const matchCategory = selectedKategori === 'Semua' || item.kategori === selectedKategori;
    const matchLevel = selectedTingkat === 'Semua' || item.tingkat === selectedTingkat;
    const matchSearch =
      item.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.judulPrestasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.penyelenggara.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchLevel && matchSearch;
  });

  // Stats
  const totalPrestasi = achievements.length;
  const totalNasional = achievements.filter((a) => a.tingkat === 'Nasional' || a.tingkat === 'Internasional').length;
  const totalProvinsi = achievements.filter((a) => a.tingkat === 'Provinsi').length;
  const totalTahfidz = achievements.filter((a) => a.kategori === "Tahfidz & Al-Qur'an").length;

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      studentName: '',
      kelas: '7A',
      judulPrestasi: '',
      kategori: "Tahfidz & Al-Qur'an",
      tingkat: 'Provinsi',
      tahun: '2024',
      penyelenggara: '',
      pembimbing: '',
      medali: 'Juara 1',
      deskripsi: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ach: StudentAchievement) => {
    setEditingId(ach.id);
    setFormData({
      studentName: ach.studentName,
      kelas: ach.kelas,
      judulPrestasi: ach.judulPrestasi,
      kategori: ach.kategori,
      tingkat: ach.tingkat,
      tahun: ach.tahun,
      penyelenggara: ach.penyelenggara,
      pembimbing: ach.pembimbing || '',
      medali: ach.medali,
      deskripsi: ach.deskripsi
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan prestasi ini?')) {
      const updated = achievements.filter((a) => a.id !== id);
      onSaveAchievements(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.judulPrestasi || !formData.penyelenggara) {
      alert('Harap lengkapi nama siswa, judul prestasi, dan penyelenggara!');
      return;
    }

    if (editingId) {
      const updated = achievements.map((a) => (a.id === editingId ? { ...formData, id: editingId } : a));
      onSaveAchievements(updated);
    } else {
      const newAch: StudentAchievement = {
        ...formData,
        id: `ACH_${Date.now()}`
      };
      onSaveAchievements([newAch, ...achievements]);
    }

    setIsModalOpen(false);
  };

  const getMedalBadge = (medali: StudentAchievement['medali']) => {
    switch (medali) {
      case 'Juara 1':
      case 'Emas':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
          icon: <Trophy className="w-4 h-4 text-amber-400" />,
          text: 'Emas / Juara 1'
        };
      case 'Juara 2':
      case 'Perak':
        return {
          bg: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
          icon: <Medal className="w-4 h-4 text-slate-300" />,
          text: 'Perak / Juara 2'
        };
      case 'Juara 3':
      case 'Perunggu':
        return {
          bg: 'bg-amber-700/30 text-amber-200 border-amber-600/40',
          icon: <Award className="w-4 h-4 text-amber-500" />,
          text: 'Perunggu / Juara 3'
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
          icon: <Star className="w-4 h-4 text-emerald-400" />,
          text: medali
        };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Direktori Prestasi Murid SMP Islam Al Qomar</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            Galeri Penghargaan & Prestasi Santri
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Rekam jejak kebanggaan prestasi akademik, tahfidz Al-Qur'an, sains, kebahasaan, dan olahraga
          </p>
        </div>

        {isAuthorized && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all border border-emerald-300/50 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Prestasi Murid</span>
          </button>
        )}
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-white/10 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black font-serif text-white">{totalPrestasi}</span>
            <span className="block text-[11px] font-medium text-slate-300">Total Prestasi</span>
          </div>
        </div>

        <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-white/10 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black font-serif text-white">{totalTahfidz}</span>
            <span className="block text-[11px] font-medium text-slate-300">Tahfidz & Qur'an</span>
          </div>
        </div>

        <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-white/10 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black font-serif text-white">{totalProvinsi}</span>
            <span className="block text-[11px] font-medium text-slate-300">Tingkat Provinsi</span>
          </div>
        </div>

        <div className="glass backdrop-blur-xl bg-slate-900/60 p-4 rounded-2xl border border-white/10 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-black font-serif text-white">{totalNasional}</span>
            <span className="block text-[11px] font-medium text-slate-300">Tingkat Nasional</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
        {/* Category Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Kategori Kejuaraan
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedKategori(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedKategori === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold shadow'
                    : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Level & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 border-t border-white/10">
          <div className="md:col-span-6 flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Tingkat:
            </span>
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedTingkat(lvl)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedTingkat === lvl
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold'
                    : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="md:col-span-6 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama siswa, judul kejuaraan, penyelenggara..."
              className="w-full px-4 py-2 pl-10 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Achievements Cards Grid */}
      {filteredAchievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((item) => {
            const badge = getMedalBadge(item.medali);
            return (
              <div
                key={item.id}
                className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl border border-white/10 shadow-xl hover:border-amber-400/40 transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Top Badge Row */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${badge.bg}`}>
                      {badge.icon}
                      <span>{badge.text}</span>
                    </span>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-950/60 text-amber-300 border border-white/10">
                      {item.tingkat}
                    </span>
                  </div>

                  {/* Title & Student */}
                  <h3 className="font-bold text-base text-white font-serif leading-snug group-hover:text-amber-300 transition-colors">
                    {item.judulPrestasi}
                  </h3>

                  <div className="mt-3 bg-slate-950/50 p-3 rounded-xl border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {item.studentName}
                      </span>
                      <span className="text-xs font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                        Kelas {item.kelas}
                      </span>
                    </div>

                    {item.pembimbing && (
                      <p className="text-[11px] text-slate-400">
                        Pembimbing: <span className="text-slate-300">{item.pembimbing}</span>
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    "{item.deskripsi}"
                  </p>
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="truncate max-w-[180px]">
                    Organisasi: <strong className="text-slate-200">{item.penyelenggara}</strong>
                  </div>
                  <span className="font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-400/20">
                    Tahun {item.tahun}
                  </span>
                </div>

                {/* Admin Action Buttons */}
                {isAuthorized && (
                  <div className="mt-3 pt-2 border-t border-white/5 flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-amber-300 hover:bg-amber-500/20 rounded-lg transition-colors"
                      title="Edit Prestasi"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="Hapus Prestasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-10 border border-white/10 text-center space-y-3">
          <Trophy className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Tidak ditemukan data prestasi murid</h3>
          <p className="text-xs text-slate-300">
            Coba sesuaikan kata kunci pencarian atau ganti filter kategori/tingkat kejuaraan.
          </p>
        </div>
      )}

      {/* Modal Form Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="glass bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-base font-serif text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>{editingId ? 'Edit Data Prestasi Santri' : 'Tambah Catatan Prestasi Murid'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-200 font-bold mb-1">Pilih / Ketik Nama Siswa</label>
                <input
                  type="text"
                  list="studentList"
                  value={formData.studentName}
                  onChange={(e) => {
                    const val = e.target.value;
                    const found = students.find((s) => s.nama.toLowerCase() === val.toLowerCase());
                    setFormData({
                      ...formData,
                      studentName: val,
                      kelas: found ? found.kelas : formData.kelas
                    });
                  }}
                  placeholder="Ketik nama santri/siswa..."
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
                />
                <datalist id="studentList">
                  {students.map((s) => (
                    <option key={s.id} value={s.nama}>
                      {s.nama} (Kelas {s.kelas})
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-bold mb-1">Kelas</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="7A" className="bg-white text-slate-900">7A</option>
                    <option value="7B" className="bg-white text-slate-900">7B</option>
                    <option value="8A" className="bg-white text-slate-900">8A</option>
                    <option value="8B" className="bg-white text-slate-900">8B</option>
                    <option value="9A" className="bg-white text-slate-900">9A</option>
                    <option value="9B" className="bg-white text-slate-900">9B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-200 font-bold mb-1">Tahun Kejuaraan</label>
                  <input
                    type="text"
                    value={formData.tahun}
                    onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">Judul Kejuaraan / Prestasi</label>
                <input
                  type="text"
                  value={formData.judulPrestasi}
                  onChange={(e) => setFormData({ ...formData, judulPrestasi: e.target.value })}
                  placeholder="Contoh: Juara 1 Musabaqah Hifdzil Qur'an 5 Juz"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-bold mb-1">Kategori</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Tahfidz & Al-Qur'an" className="bg-white text-slate-900">Tahfidz & Al-Qur'an</option>
                    <option value="Akademik" className="bg-white text-slate-900">Akademik</option>
                    <option value="Seni & Kaligrafi" className="bg-white text-slate-900">Seni & Kaligrafi</option>
                    <option value="Olahraga" className="bg-white text-slate-900">Olahraga</option>
                    <option value="Sains & Teknologi" className="bg-white text-slate-900">Sains & Teknologi</option>
                    <option value="Bahasa & Pidato" className="bg-white text-slate-900">Bahasa & Pidato</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-200 font-bold mb-1">Tingkat Wilayah</label>
                  <select
                    value={formData.tingkat}
                    onChange={(e) => setFormData({ ...formData, tingkat: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Kecamatan" className="bg-white text-slate-900">Kecamatan</option>
                    <option value="Kota / Kabupaten" className="bg-white text-slate-900">Kota / Kabupaten</option>
                    <option value="Provinsi" className="bg-white text-slate-900">Provinsi</option>
                    <option value="Nasional" className="bg-white text-slate-900">Nasional</option>
                    <option value="Internasional" className="bg-white text-slate-900">Internasional</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-200 font-bold mb-1">Predikat / Medali</label>
                  <select
                    value={formData.medali}
                    onChange={(e) => setFormData({ ...formData, medali: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Juara 1" className="bg-white text-slate-900">Juara 1</option>
                    <option value="Juara 2" className="bg-white text-slate-900">Juara 2</option>
                    <option value="Juara 3" className="bg-white text-slate-900">Juara 3</option>
                    <option value="Emas" className="bg-white text-slate-900">Emas</option>
                    <option value="Perak" className="bg-white text-slate-900">Perak</option>
                    <option value="Perunggu" className="bg-white text-slate-900">Perunggu</option>
                    <option value="Harapan 1" className="bg-white text-slate-900">Harapan 1</option>
                    <option value="Harapan 2" className="bg-white text-slate-900">Harapan 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-200 font-bold mb-1">Penyelenggara</label>
                  <input
                    type="text"
                    value={formData.penyelenggara}
                    onChange={(e) => setFormData({ ...formData, penyelenggara: e.target.value })}
                    placeholder="Contoh: Kemenag Kab. Banyuwangi"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">Guru Pembimbing (Opsional)</label>
                <input
                  type="text"
                  value={formData.pembimbing}
                  onChange={(e) => setFormData({ ...formData, pembimbing: e.target.value })}
                  placeholder="Nama ustadz/ustadzah pembimbing..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-200 font-bold mb-1">Deskripsi Singkat / Catatan</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  rows={2}
                  placeholder="Keterangan singkat mengenai lomba dan capaian..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/10 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow-lg border border-emerald-300/50"
                >
                  Simpan Prestasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
