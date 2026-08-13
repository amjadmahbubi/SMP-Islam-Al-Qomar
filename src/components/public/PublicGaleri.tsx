import React, { useState } from 'react';
import { GalleryItem, UserSession } from '../../types';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Calendar,
  Search,
  Filter,
  Upload,
  Sparkles,
  Maximize2,
  Check,
  Tag
} from 'lucide-react';

interface PublicGaleriProps {
  galleryItems: GalleryItem[];
  session: UserSession;
  onSaveGalleryItems: (items: GalleryItem[]) => void;
}

export const PublicGaleri: React.FC<PublicGaleriProps> = ({
  galleryItems,
  session,
  onSaveGalleryItems
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lightbox modal state
  const [activeLightboxItem, setActiveLightboxItem] = useState<GalleryItem | null>(null);

  // Add/Edit photo modal state (Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  const [formData, setFormData] = useState<{
    judul: string;
    kategori: GalleryItem['kategori'];
    imageUrl: string;
    deskripsi: string;
    tanggal: string;
  }>({
    judul: '',
    kategori: 'Kegiatan Santri',
    imageUrl: '',
    deskripsi: '',
    tanggal: new Date().toISOString().split('T')[0]
  });

  const categories: string[] = [
    'Semua',
    'Kegiatan Santri',
    'Keagamaan',
    'Prestasi & Lomba',
    'Sarana & Fasilitas',
    'Ekstrakurikuler'
  ];

  // Filter items
  const filteredItems = galleryItems.filter(item => {
    const matchesCat = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    const matchesSearch =
      item.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Handle image upload from file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert('Ukuran file foto terlalu besar. Maksimal 4MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      judul: '',
      kategori: 'Kegiatan Santri',
      imageUrl: '',
      deskripsi: '',
      tanggal: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: GalleryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormData({
      judul: item.judul,
      kategori: item.kategori,
      imageUrl: item.imageUrl,
      deskripsi: item.deskripsi,
      tanggal: item.tanggal
    });
    setIsModalOpen(true);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Apakah Anda yakin ingin menghapus foto kegiatan ini dari galeri?')) {
      const updated = galleryItems.filter(i => i.id !== id);
      onSaveGalleryItems(updated);
      if (activeLightboxItem?.id === id) {
        setActiveLightboxItem(null);
      }
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl.trim()) {
      alert('Harap unggah gambar atau masukkan URL gambar foto kegiatan.');
      return;
    }

    if (editingItem) {
      const updated = galleryItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            judul: formData.judul,
            kategori: formData.kategori,
            imageUrl: formData.imageUrl,
            deskripsi: formData.deskripsi,
            tanggal: formData.tanggal
          };
        }
        return item;
      });
      onSaveGalleryItems(updated);
    } else {
      const newItem: GalleryItem = {
        id: `GAL-${Date.now()}`,
        judul: formData.judul,
        kategori: formData.kategori,
        imageUrl: formData.imageUrl,
        deskripsi: formData.deskripsi,
        tanggal: formData.tanggal
      };
      onSaveGalleryItems([newItem, ...galleryItems]);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dokumentasi & Galeri Kegiatan Santri</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            Galeri Foto & Aktivitas SMP Islam Al Qomar
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Kumpulan momen pembiasaan Al-Qur'an, praktikum sains, kegiatan ekskul, serta sarana prasarana sekolah
          </p>
        </div>

        {(session.role === 'admin' || session.role === 'guru') && (
          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-300/50 shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Foto Galeri Baru</span>
          </button>
        )}
      </div>

      {/* Filter Category & Search Bar */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-4 border border-white/10 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Category Pill Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-md border border-emerald-400'
                  : 'bg-slate-950/50 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari momen kegiatan..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

      </div>

      {/* Gallery Cards Grid */}
      {filteredItems.length === 0 ? (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-12 text-center border border-white/10 space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white font-serif">Belum Ada Foto untuk Kategori Ini</h3>
          <p className="text-xs text-slate-400">Coba pilih kategori lain atau gunakan kata kunci pencarian yang berbeda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => setActiveLightboxItem(item)}
              className="group glass backdrop-blur-xl bg-slate-900/70 rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-400/40 shadow-xl transition-all hover:-translate-y-1 cursor-pointer flex flex-col"
            >
              {/* Image Container with Hover Effect */}
              <div className="relative h-52 w-full overflow-hidden bg-slate-950">
                <img
                  src={item.imageUrl}
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Top Badge: Category */}
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  <Tag className="w-3 h-3 text-emerald-400" />
                  <span>{item.kategori}</span>
                </div>

                {/* Top Right: Admin Action Buttons */}
                {(session.role === 'admin' || session.role === 'guru') && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(item, e)}
                      className="p-1.5 bg-slate-900/80 hover:bg-emerald-600 text-white rounded-lg border border-white/20 transition-all text-xs"
                      title="Edit Foto"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      className="p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-lg border border-white/20 transition-all text-xs"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Bottom Overlay: Zoom Icon */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-slate-950 p-2 rounded-xl shadow-lg">
                  <Maximize2 className="w-4 h-4" />
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3 className="text-sm font-bold font-serif text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                    {item.judul}
                  </h3>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                    {item.deskripsi}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.tanggal}</span>
                  </span>
                  <span className="text-emerald-400 font-bold hover:underline">
                    Lihat Foto Full &rarr;
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {activeLightboxItem && (
        <div
          onClick={() => setActiveLightboxItem(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass backdrop-blur-2xl bg-slate-900 border border-white/15 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-0 text-white"
          >
            {/* Header Bar */}
            <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  {activeLightboxItem.kategori}
                </span>
                <span className="text-xs text-slate-400 font-mono">{activeLightboxItem.tanggal}</span>
              </div>
              <button
                onClick={() => setActiveLightboxItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Container */}
            <div className="max-h-[60vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={activeLightboxItem.imageUrl}
                alt={activeLightboxItem.judul}
                className="max-h-[60vh] w-auto object-contain mx-auto"
              />
            </div>

            {/* Description Footer */}
            <div className="p-6 space-y-2 bg-slate-900">
              <h3 className="text-lg font-bold font-serif text-white">
                {activeLightboxItem.judul}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeLightboxItem.deskripsi}
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL (ADMIN) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="glass backdrop-blur-xl bg-slate-900 border border-white/15 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold font-serif text-white">
                {editingItem ? 'Edit Foto Galeri' : 'Tambah Foto Galeri Kegiatan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Judul / Nama Momen Kegiatan *</label>
                <input
                  type="text"
                  value={formData.judul}
                  onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                  required
                  placeholder="Contoh: Wisuda Tahfidz Qur'an 30 Juz"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori Galeri *</label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Kegiatan Santri">Kegiatan Santri</option>
                    <option value="Keagamaan">Keagamaan</option>
                    <option value="Prestasi & Lomba">Prestasi & Lomba</option>
                    <option value="Sarana & Fasilitas">Sarana & Fasilitas</option>
                    <option value="Ekstrakurikuler">Ekstrakurikuler</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tanggal Momen *</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Upload or URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Gambar Foto Kegiatan *</label>
                
                <div className="space-y-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow transition-all">
                    <Upload className="w-4 h-4" />
                    <span>Upload Foto dari Perangkat...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="text-[11px] text-slate-400">Atau masukkan URL gambar foto:</div>
                  
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {formData.imageUrl && (
                  <div className="mt-2 h-32 rounded-xl overflow-hidden bg-slate-950 border border-white/10">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Deskripsi & Keterangan Momen *</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  required
                  rows={3}
                  placeholder="Ceritakan gambaran singkat kegiatan ini..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 py-2 rounded-xl shadow border border-emerald-300/50"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Foto Galeri'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
