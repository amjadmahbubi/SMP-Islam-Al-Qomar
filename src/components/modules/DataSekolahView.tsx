import React, { useState, useEffect } from 'react';
import { SchoolInfo, Teacher } from '../../types';
import { initialSchoolInfo } from '../../data/initialData';
import { Save, School, Check, Upload, Image as ImageIcon, Trash2, Eye, FileText, UserCheck, ShieldCheck, Crown, ArrowRight, Lock } from 'lucide-react';

interface DataSekolahViewProps {
  schoolInfo: SchoolInfo;
  teachers?: Teacher[];
  onSave: (info: SchoolInfo) => void;
  onNavigateToTeachers?: () => void;
}

export const DataSekolahView: React.FC<DataSekolahViewProps> = ({ 
  schoolInfo, 
  teachers = [], 
  onSave,
  onNavigateToTeachers 
}) => {
  // Tetapkan guru Kepala Sekolah resmi langsung dari Master Data Guru
  const officialKepsekTeacher = teachers.find(
    t => t.jabatan === 'Kepala Sekolah' || t.jabatan?.toLowerCase().trim() === 'kepala sekolah'
  ) || teachers.find(
    t => t.nama.trim().toLowerCase() === (schoolInfo.kepalaSekolah || '').trim().toLowerCase()
  );

  const officialKepsekNama = officialKepsekTeacher ? officialKepsekTeacher.nama : schoolInfo.kepalaSekolah;
  const officialKepsekNigy = officialKepsekTeacher 
    ? (officialKepsekTeacher.nigy || officialKepsekTeacher.nip || schoolInfo.nigyKepalaSekolah) 
    : schoolInfo.nigyKepalaSekolah;
  const officialKepsekNuptk = officialKepsekTeacher?.nuptk;

  const [formData, setFormData] = useState<SchoolInfo>(() => ({
    ...schoolInfo,
    misi: Array.isArray(schoolInfo?.misi) && schoolInfo.misi.length > 0 ? schoolInfo.misi : (initialSchoolInfo.misi || []),
    kepalaSekolah: officialKepsekNama,
    nigyKepalaSekolah: officialKepsekNigy,
    nipKepalaSekolah: officialKepsekNigy
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Otomatis sinkronkan formData jika data guru Kepala Sekolah mengalami perubahan
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      misi: Array.isArray(prev.misi) && prev.misi.length > 0 ? prev.misi : (initialSchoolInfo.misi || []),
      kepalaSekolah: officialKepsekNama,
      nigyKepalaSekolah: officialKepsekNigy,
      nipKepalaSekolah: officialKepsekNigy
    }));
  }, [officialKepsekNama, officialKepsekNigy]);

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
    const currentMisi = Array.isArray(formData.misi) ? formData.misi : (initialSchoolInfo.misi || []);
    const updated = [...currentMisi];
    updated[index] = val;
    setFormData(prev => ({ ...prev, misi: updated }));
  };

  const addMisi = () => {
    const currentMisi = Array.isArray(formData.misi) ? formData.misi : (initialSchoolInfo.misi || []);
    setFormData(prev => ({ ...prev, misi: [...currentMisi, ''] }));
  };

  const removeMisi = (index: number) => {
    const currentMisi = Array.isArray(formData.misi) ? formData.misi : (initialSchoolInfo.misi || []);
    setFormData(prev => ({ ...prev, misi: currentMisi.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalizedInfo: SchoolInfo = {
      ...formData,
      kepalaSekolah: officialKepsekNama,
      nigyKepalaSekolah: officialKepsekNigy,
      nipKepalaSekolah: officialKepsekNigy
    };
    onSave(finalizedInfo);
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

            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-300">
                  Tahun Ajaran Aktif (Master TA)
                </label>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  ⚡ Auto-Sync
                </span>
              </div>
              <input
                type="text"
                name="tahunAjaran"
                value={formData.tahunAjaran}
                onChange={handleChange}
                required
                placeholder="Contoh: 2024/2025"
                className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm font-mono"
              />
              <p className="text-[11px] text-emerald-200/90 leading-tight">
                Tersinkronisasi otomatis ke PPDB, Nilai & Rapor, Presensi, dan Jadwal Pelajaran.
              </p>
            </div>

            <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-emerald-300">
                  Semester Aktif
                </label>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  ⚡ Auto-Sync
                </span>
              </div>
              <select
                name="semesterAktif"
                value={formData.semesterAktif}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
              >
                <option value="Ganjil" className="bg-white text-slate-900">Semester Ganjil</option>
                <option value="Genap" className="bg-white text-slate-900">Semester Genap</option>
              </select>
              <p className="text-[11px] text-emerald-200/90 leading-tight">
                Semester aktif yang digunakan di seluruh laporan dan kalkulasi asesmen.
              </p>
            </div>
          </div>

          {/* Real-time Module Sync Indicator Chips */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-emerald-500/25 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-200">
                Status Sinkronisasi Modul dengan TA <span className="text-amber-300 font-mono">[{formData.tahunAjaran}]</span>:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                ✓ PPDB ({formData.tahunAjaran})
              </span>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                ✓ Nilai & Rapor ({formData.tahunAjaran} • Sem. {formData.semesterAktif})
              </span>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                ✓ Presensi Siswa ({formData.tahunAjaran})
              </span>
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                ✓ Jadwal Pelajaran ({formData.tahunAjaran})
              </span>
            </div>
          </div>
        </div>

        {/* Pimpinan & Kontak */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-2 mb-4 gap-2">
            <div>
              <h3 className="text-sm font-bold font-serif text-white">
                2. Pimpinan Sekolah &amp; Kontak Komunikasi
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Identitas pimpinan sekolah ditetapkan secara otomatis &amp; terpusat dari Master Data Guru
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Satu Sumber Data (Master Data Guru)</span>
            </div>
          </div>

          {/* Kartu Khusus Pimpinan (Kepala Sekolah) - Terkunci Otomatis dari Master Data Guru */}
          <div className="mb-5 bg-gradient-to-br from-emerald-950/50 via-slate-900/80 to-slate-950 p-5 rounded-2xl border border-emerald-500/40 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 shadow-inner">
                  <Crown className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
                      Kepala Sekolah Resmi
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-slate-800/90 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Terkunci dari Data Guru</span>
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold font-serif text-white mt-1">
                    {officialKepsekNama || 'Belum Ditentukan di Data Guru'}
                  </h4>
                  <p className="text-xs text-emerald-200/80">
                    Penanggung jawab resmi akademik, legalitas, tanda tangan rapor, dan administrasi sekolah
                  </p>
                </div>
              </div>

              {onNavigateToTeachers && (
                <button
                  type="button"
                  onClick={onNavigateToTeachers}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-bold transition-all shrink-0 hover:scale-[1.02] shadow-sm"
                  title="Buka Data Guru untuk menetapkan atau mengedit identitas Kepala Sekolah"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Ubah / Edit di Data Guru</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">Nama Lengkap &amp; Gelar</span>
                <span className="text-sm font-bold text-white block truncate">{officialKepsekNama}</span>
              </div>
              <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">NIGY / NIP (Tanda Tangan Rapor)</span>
                <span className="text-sm font-bold font-mono text-emerald-300 block">{officialKepsekNigy || '-'}</span>
              </div>
              <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
                <span className="text-[11px] text-slate-400 block mb-0.5 font-medium">NUPTK Nasional</span>
                <span className="text-sm font-bold font-mono text-slate-200 block">{officialKepsekNuptk || '-'}</span>
              </div>
            </div>

            <div className="text-[11px] text-emerald-200/90 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/20 flex items-center gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Nama dan NIGY Kepala Sekolah di atas terkunci otomatis dari guru yang memiliki jabatan <strong>Kepala Sekolah</strong> di menu <strong>Data Guru</strong>. Tidak ada pilihan manual di sini untuk mencegah kesalahan input atau data tertukar.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {(formData.misi || []).map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      value={m}
                      onChange={(e) => handleMisiChange(idx, e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    {(formData.misi || []).length > 1 && (
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
