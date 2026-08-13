import React, { useState } from 'react';
import { SchoolInfo } from '../../types';
import { Save, School, Check, Upload, Image as ImageIcon, Trash2, Eye, FileText } from 'lucide-react';

interface DataSekolahViewProps {
  schoolInfo: SchoolInfo;
  onSave: (info: SchoolInfo) => void;
}

export const DataSekolahView: React.FC<DataSekolahViewProps> = ({ schoolInfo, onSave }) => {
  const [formData, setFormData] = useState<SchoolInfo>(schoolInfo);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file logo terlalu besar. Maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: undefined }));
  };

  const handleMisiChange = (index: number, val: string) => {
    const updated = [...formData.misi];
    updated[index] = val;
    setFormData(prev => ({ ...prev, misi: updated }));
  };

  const addMisi = () => {
    setFormData(prev => ({ ...prev, misi: [...prev.misi, ''] }));
  };

  const removeMisi = (index: number) => {
    setFormData(prev => ({ ...prev, misi: prev.misi.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
            <School className="w-3.5 h-3.5 text-emerald-400" />
            <span>Master Data Profil Sekolah & Logo</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            Pengaturan Data Utama & Logo SMP Islam Al Qomar
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Kelola logo resmi untuk kop surat, kop rapor, header website, NPSN, akreditasi, serta visi & misi
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-4 py-2 rounded-xl text-xs font-bold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Profil & Logo Berhasil Disimpan!</span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
        
        {/* SECTION 0: UPLOAD LOGO SEKOLAH (KOP SURAT & WEBSITE) */}
        <div className="bg-slate-950/80 rounded-2xl p-5 border border-emerald-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold font-serif text-white">
                Upload & Pengaturan Logo Resmi Sekolah (Kop Surat & Website)
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded">
              ADMIN ONLY
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Upload Controls */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  1. Unggah Gambar Logo (PNG / JPG / SVG)
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all border border-emerald-300/50">
                    <Upload className="w-4 h-4" />
                    <span>Pilih File Logo...</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold px-3 py-2.5 rounded-xl border border-rose-500/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Hapus</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Rekomendasi logo berlatar transparan (PNG) atau persegi/lingkaran (Maks. 2MB).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  2. Atau Masukkan URL Gambar Logo
                </label>
                <input
                  type="text"
                  name="logoUrl"
                  value={formData.logoUrl || ''}
                  onChange={handleChange}
                  placeholder="https://domain.com/logo-sekolah.png"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5">
                  3. Contoh Preset Emblem Islami (Klik untuk Pilih)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=200' }))}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2.5 py-1.5 rounded-lg border border-white/10"
                  >
                    Preset Green Badge
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: 'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&q=80&w=200' }))}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-2.5 py-1.5 rounded-lg border border-white/10"
                  >
                    Preset Mosque Crest
                  </button>
                </div>
              </div>
            </div>

            {/* Live Previews */}
            <div className="lg:col-span-7 space-y-4">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Pratinjau Penggunaan Logo Real-Time</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Preview 1: Header Website */}
                <div className="bg-slate-900/90 rounded-xl p-3 border border-white/15 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                    A. Tampilan Navbar Website
                  </span>
                  <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xl border border-emerald-400/30 overflow-hidden shrink-0">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        "☪"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white font-serif truncate">{formData.nama || 'SMP Islam Al Qomar'}</p>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-400/30">
                        AKREDITASI {formData.akreditasi}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview 2: Kop Surat Rapor */}
                <div className="bg-white rounded-xl p-3 border border-slate-300 text-slate-900 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                    B. Tampilan Kop Surat / Rapor
                  </span>
                  <div className="border-b-2 border-emerald-950 pb-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-900 text-amber-300 font-bold text-sm flex items-center justify-center border border-amber-400 overflow-hidden shrink-0">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Logo Kop" className="w-full h-full object-cover" />
                        ) : (
                          "☪"
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-bold text-amber-700 uppercase font-serif leading-none">YAYASAN AL QOMAR</p>
                        <p className="text-xs font-black text-emerald-950 font-serif leading-tight">{formData.nama || 'SMP ISLAM AL QOMAR'}</p>
                        <p className="text-[8px] text-slate-600 leading-none">NPSN: {formData.npsn} • AKREDITASI {formData.akreditasi}</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Identitas Sekolah */}
        <div>
          <h3 className="text-sm font-bold font-serif text-white border-b border-white/10 pb-2 mb-4">
            1. Identitas & Legalitas Sekolah
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Resmi Sekolah</label>
              <input
                type="text"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">NPSN (Nomor Pokok Sekolah Nasional)</label>
              <input
                type="text"
                name="npsn"
                value={formData.npsn}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Status Akreditasi</label>
              <input
                type="text"
                name="akreditasi"
                value={formData.akreditasi}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tahun Ajaran Aktif</label>
              <input
                type="text"
                name="tahunAjaran"
                value={formData.tahunAjaran}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Semester Aktif</label>
              <select
                name="semesterAktif"
                value={formData.semesterAktif}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Ganjil" className="bg-white text-slate-900">Semester Ganjil</option>
                <option value="Genap" className="bg-white text-slate-900">Semester Genap</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pimpinan & Kontak */}
        <div>
          <h3 className="text-sm font-bold font-serif text-white border-b border-white/10 pb-2 mb-4">
            2. Pimpinan & Kontak Komunikasi
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                name="kepalaSekolah"
                value={formData.kepalaSekolah}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">NIGY Kepala Sekolah (Yayasan)</label>
              <input
                type="text"
                name="nigyKepalaSekolah"
                value={formData.nigyKepalaSekolah || formData.nipKepalaSekolah || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nigyKepalaSekolah: e.target.value, nipKepalaSekolah: e.target.value }))}
                placeholder="Contoh: NIGY.200501.004"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nomor Telepon Sekolah</label>
              <input
                type="text"
                name="telepon"
                value={formData.telepon}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Resmi</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Website Resmi</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-300 mb-1">Alamat Lengkap Sekolah</label>
              <textarea
                name="alamat"
                value={formData.alamat}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Visi & Misi */}
        <div>
          <h3 className="text-sm font-bold font-serif text-white border-b border-white/10 pb-2 mb-4">
            3. Visi & Misi Pendidikan
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Visi Utama Sekolah</label>
              <textarea
                name="visi"
                value={formData.visi}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-serif font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300">Misi Sekolah (Poin-poin)</label>
                <button
                  type="button"
                  onClick={addMisi}
                  className="text-xs font-bold text-emerald-300 hover:underline"
                >
                  + Tambah Misi
                </button>
              </div>

              <div className="space-y-2">
                {formData.misi.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      value={m}
                      onChange={(e) => handleMisiChange(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    {formData.misi.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMisi(idx)}
                        className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 font-bold"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-300/50"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Data Sekolah</span>
          </button>
        </div>

      </form>

    </div>
  );
};
