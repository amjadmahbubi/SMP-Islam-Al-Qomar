import React, { useState, useRef } from 'react';
import { SarprasItem, SarprasPerawatan, Teacher, UserSession } from '../../../types';
import { formatRupiah, SUMBER_DANA_OPTIONS } from './sarprasUtils';
import { compressImageFile } from './sarprasImageUtils';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  X,
  Trash2,
  Edit3,
  Check,
  Camera,
  Upload,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  Eye,
  AlertCircle
} from 'lucide-react';

interface SarprasPerawatanTabProps {
  sarpras: SarprasItem[];
  perawatanList: SarprasPerawatan[];
  onSavePerawatan: (list: SarprasPerawatan[]) => void;
  onUpdateSarprasItem: (updatedItem: SarprasItem) => void;
  teachers?: Teacher[];
  session?: UserSession;
  canEdit: boolean;
  onAddAuditLog: (action: 'PERAWATAN', detail: string) => void;
  preselectedItem?: SarprasItem | null;
  onClearPreselected?: () => void;
}

export const SarprasPerawatanTab: React.FC<SarprasPerawatanTabProps> = ({
  sarpras,
  perawatanList,
  onSavePerawatan,
  onUpdateSarprasItem,
  teachers = [],
  session,
  canEdit,
  onAddAuditLog,
  preselectedItem,
  onClearPreselected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerawatan, setEditingPerawatan] = useState<SarprasPerawatan | null>(null);

  // Form state
  const [selectedSarprasId, setSelectedSarprasId] = useState(preselectedItem?.id || '');
  const [jenisPerawatan, setJenisPerawatan] = useState<SarprasPerawatan['jenisPerawatan']>('Perbaikan Ringan');
  const [deskripsiKerusakan, setDeskripsiKerusakan] = useState('');
  const [tindakan, setTindakan] = useState('');
  const [biaya, setBiaya] = useState(0);
  const [sumberBiaya, setSumberBiaya] = useState('BOS Reguler');
  const [teknisiVendor, setTeknisiVendor] = useState('');
  const [status, setStatus] = useState<SarprasPerawatan['status']>('Sedang Dikerjakan');
  const [tanggalPengajuan, setTanggalPengajuan] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [pelapor, setPelapor] = useState(session?.name || teachers[0]?.nama || '');
  const [catatanPetugas, setCatatanPetugas] = useState('');

  // Photo states (Before & After)
  const [fotoKerusakan, setFotoKerusakan] = useState<string | undefined>();
  const [fotoPerbaikan, setFotoPerbaikan] = useState<string | undefined>();
  const [isCompressingKerusakan, setIsCompressingKerusakan] = useState(false);
  const [isCompressingPerbaikan, setIsCompressingPerbaikan] = useState(false);

  // Live Camera state
  const [activeCameraTarget, setActiveCameraTarget] = useState<'kerusakan' | 'perbaikan' | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File input refs
  const fileInputKerusakanRef = useRef<HTMLInputElement | null>(null);
  const fileInputPerbaikanRef = useRef<HTMLInputElement | null>(null);

  // Lightbox modal state
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    title: string;
    src: string;
    subtitle?: string;
    type?: 'kerusakan' | 'perbaikan';
  } | null>(null);

  // Handle preselected item
  React.useEffect(() => {
    if (preselectedItem) {
      setSelectedSarprasId(preselectedItem.id);
      setIsModalOpen(true);
    }
  }, [preselectedItem]);

  // Clean up camera stream when modal closes or unmounts
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const selectedItem = sarpras.find(s => s.id === selectedSarprasId);

  // Aggregates
  const totalBiayaPerawatan = perawatanList.reduce((acc, curr) => acc + (Number(curr.biaya) || 0), 0);
  const activeCount = perawatanList.filter(p => p.status === 'Sedang Dikerjakan' || p.status === 'Menunggu Jadwal').length;
  const selesaiCount = perawatanList.filter(p => p.status === 'Selesai').length;

  const handleOpenAdd = () => {
    const defaultItem = sarpras[0];
    setEditingPerawatan(null);
    setSelectedSarprasId(defaultItem ? defaultItem.id : '');
    setJenisPerawatan('Perbaikan Ringan');
    setDeskripsiKerusakan('');
    setTindakan('');
    setBiaya(0);
    setSumberBiaya('BOS Reguler');
    setTeknisiVendor('Teknisi Internal Sekolah');
    setStatus('Sedang Dikerjakan');
    setTanggalPengajuan(new Date().toISOString().split('T')[0]);
    setTanggalSelesai('');
    setPelapor(session?.name || teachers[0]?.nama || '');
    setCatatanPetugas('');
    setFotoKerusakan(undefined);
    setFotoPerbaikan(undefined);
    stopCamera();
    setIsModalOpen(true);
  };

  const handleOpenAddViaPhoto = () => {
    handleOpenAdd();
    // Prompt photo upload or camera for quick reporting
    setTimeout(() => {
      fileInputKerusakanRef.current?.click();
    }, 250);
  };

  const handleOpenEdit = (prw: SarprasPerawatan) => {
    setEditingPerawatan(prw);
    setSelectedSarprasId(prw.sarprasId);
    setJenisPerawatan(prw.jenisPerawatan);
    setDeskripsiKerusakan(prw.deskripsiKerusakan);
    setTindakan(prw.tindakan || '');
    setBiaya(prw.biaya || 0);
    setSumberBiaya(prw.sumberBiaya || 'BOS Reguler');
    setTeknisiVendor(prw.teknisiVendor || '');
    setStatus(prw.status);
    setTanggalPengajuan(prw.tanggalPengajuan);
    setTanggalSelesai(prw.tanggalSelesai || '');
    setPelapor(prw.pelapor);
    setCatatanPetugas(prw.catatanPetugas || '');
    setFotoKerusakan(prw.fotoKerusakan);
    setFotoPerbaikan(prw.fotoPerbaikan);
    stopCamera();
    setIsModalOpen(true);
  };

  // Camera Management
  const startCamera = async (target: 'kerusakan' | 'perbaikan') => {
    try {
      setCameraError('');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      setActiveCameraTarget(target);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: unknown) {
      console.error('Kamera gagal diakses:', err);
      const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
      setCameraError(`Kamera tidak dapat dibuka (${msg}). Silakan gunakan opsi Unggah File.`);
      setActiveCameraTarget(null);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setActiveCameraTarget(null);
    setCameraError('');
  };

  const flipCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (activeCameraTarget) {
      await startCamera(activeCameraTarget);
    }
  };

  const captureSnapshot = async () => {
    if (!videoRef.current || !activeCameraTarget) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 960;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (activeCameraTarget === 'kerusakan') {
          setFotoKerusakan(dataUrl);
        } else {
          setFotoPerbaikan(dataUrl);
        }
      }
      stopCamera();
    } catch (err) {
      console.error('Gagal mengambil foto snapshot:', err);
    }
  };

  // File Upload Handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'kerusakan' | 'perbaikan') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (target === 'kerusakan') setIsCompressingKerusakan(true);
      else setIsCompressingPerbaikan(true);

      const compressedBase64 = await compressImageFile(file, 960, 0.78);
      if (target === 'kerusakan') {
        setFotoKerusakan(compressedBase64);
      } else {
        setFotoPerbaikan(compressedBase64);
      }
    } catch (err) {
      console.error('Gagal memproses gambar:', err);
      alert('Gagal memproses file foto. Pastikan format file adalah gambar (JPG/PNG/WEBP).');
    } finally {
      if (target === 'kerusakan') setIsCompressingKerusakan(false);
      else setIsCompressingPerbaikan(false);
      e.target.value = '';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('Pilih aset yang perlu dirawat / diservis');
      return;
    }

    if (editingPerawatan) {
      const updated = perawatanList.map(p => {
        if (p.id === editingPerawatan.id) {
          return {
            ...p,
            sarprasId: selectedItem.id,
            kodeBarang: selectedItem.nomorInventarisResmi || selectedItem.kode,
            namaBarang: selectedItem.namaBarangRuang,
            jenisPerawatan,
            deskripsiKerusakan,
            tindakan,
            biaya: Number(biaya) || 0,
            sumberBiaya,
            teknisiVendor,
            status,
            tanggalPengajuan,
            tanggalSelesai: status === 'Selesai' && !tanggalSelesai ? new Date().toISOString().split('T')[0] : tanggalSelesai,
            pelapor,
            catatanPetugas,
            fotoKerusakan,
            fotoPerbaikan
          };
        }
        return p;
      });
      onSavePerawatan(updated);
      onAddAuditLog('PERAWATAN', `Update data perawatan ${selectedItem.namaBarangRuang} - Status: ${status}`);
    } else {
      const newEntry: SarprasPerawatan = {
        id: `PRW-${Date.now()}`,
        sarprasId: selectedItem.id,
        kodeBarang: selectedItem.nomorInventarisResmi || selectedItem.kode,
        namaBarang: selectedItem.namaBarangRuang,
        tanggalPengajuan,
        tanggalSelesai: status === 'Selesai' ? (tanggalSelesai || new Date().toISOString().split('T')[0]) : undefined,
        jenisPerawatan,
        deskripsiKerusakan,
        tindakan,
        biaya: Number(biaya) || 0,
        sumberBiaya,
        teknisiVendor,
        status,
        pelapor,
        catatanPetugas,
        fotoKerusakan,
        fotoPerbaikan
      };

      // Set asset status to 'Dalam Perawatan' if active
      if (status === 'Sedang Dikerjakan' || status === 'Menunggu Jadwal') {
        onUpdateSarprasItem({
          ...selectedItem,
          statusAset: 'Dalam Perawatan'
        });
      }

      onSavePerawatan([newEntry, ...perawatanList]);
      onAddAuditLog(
        'PERAWATAN',
        `Pencatatan perawatan ${selectedItem.namaBarangRuang} (${jenisPerawatan}) biaya ${formatRupiah(biaya)}${fotoKerusakan ? ' [disertai foto kerusakan]' : ''}`
      );
    }

    stopCamera();
    setIsModalOpen(false);
    if (onClearPreselected) onClearPreselected();
  };

  // Quick action to mark as Completed
  const handleCompletePerawatan = (prw: SarprasPerawatan) => {
    const asset = sarpras.find(s => s.id === prw.sarprasId);
    if (confirm(`Tandai perawatan "${prw.namaBarang}" telah SELESAI dan kembalikan kondisi aset menjadi Baik?`)) {
      const updatedList = perawatanList.map(p => {
        if (p.id === prw.id) {
          return {
            ...p,
            status: 'Selesai' as const,
            tanggalSelesai: new Date().toISOString().split('T')[0]
          };
        }
        return p;
      });
      onSavePerawatan(updatedList);

      // Restore asset condition to good
      if (asset) {
        onUpdateSarprasItem({
          ...asset,
          kondisiBaik: Number(asset.jumlah) || 1,
          kondisiRusakRingan: 0,
          kondisiRusakBerat: 0,
          statusAset: 'Aktif Digunakan'
        });
      }

      onAddAuditLog('PERAWATAN', `Perawatan selesai: ${prw.namaBarang} - Kondisi aset dipulihkan ke BAIK`);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus riwayat perawatan ini?')) {
      onSavePerawatan(perawatanList.filter(p => p.id !== id));
    }
  };

  const filtered = perawatanList.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.namaBarang.toLowerCase().includes(q) ||
      p.kodeBarang.toLowerCase().includes(q) ||
      p.deskripsiKerusakan.toLowerCase().includes(q) ||
      p.teknisiVendor.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'Semua' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Dalam Pengerjaan</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-300 font-mono">
            {activeCount} <span className="text-xs text-slate-400 font-normal">unit aktif servis</span>
          </p>
          <p className="text-[11px] text-amber-400/80 mt-1">
            Menunggu selesai uji operasional
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Servis Selesai</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">
            {selesaiCount} <span className="text-xs text-slate-400 font-normal">telah diperbaiki</span>
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">
            Kembali berfungsi optimal
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Biaya Pemeliharaan</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-white font-mono truncate" title={formatRupiah(totalBiayaPerawatan)}>
            {formatRupiah(totalBiayaPerawatan)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            BOS & Dana Sarpras Sekolah
          </p>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari perawatan (nama aset, kode, keluhan, teknisi)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu Jadwal">Menunggu Jadwal</option>
            <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
            <option value="Selesai">Selesai</option>
          </select>

          {canEdit && (
            <>
              {/* Tambah Servis via Foto */}
              <button
                onClick={handleOpenAddViaPhoto}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 rounded-xl transition-all cursor-pointer shrink-0 shadow-sm"
                title="Catat perawatan langsung dengan memotret atau mengunggah foto kerusakan barang"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Catat via Foto Kerusakan</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Servis Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* List Perawatan */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-white/10 text-center text-slate-400">
            <Wrench className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm">Tidak ada riwayat perawatan atau servis yang cocok.</p>
          </div>
        ) : (
          filtered.map(prw => {
            const asset = sarpras.find(s => s.id === prw.sarprasId);
            return (
              <div
                key={prw.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-md hover:border-emerald-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      prw.status === 'Selesai'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                        : prw.status === 'Sedang Dikerjakan'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/30 animate-pulse'
                        : 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                    }`}>
                      {prw.status}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/10">
                      {prw.jenisPerawatan}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Diajukan: {prw.tanggalPengajuan}
                      {prw.tanggalSelesai && ` | Selesai: ${prw.tanggalSelesai}`}
                    </span>
                    {asset?.lokasi && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-emerald-400 border border-emerald-500/20 font-medium">
                        📍 {asset.lokasi}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2 flex-wrap">
                    {prw.namaBarang}
                    <span className="text-xs font-normal text-slate-400 font-mono">
                      ({prw.kodeBarang})
                    </span>
                  </h4>

                  <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 space-y-1">
                    <div>
                      <strong className="text-amber-400">Kerusakan:</strong> {prw.deskripsiKerusakan}
                    </div>
                    {prw.tindakan && (
                      <div>
                        <strong className="text-emerald-400">Tindakan:</strong> {prw.tindakan}
                      </div>
                    )}
                  </div>

                  {/* Foto Dokumentasi Perawatan (Kerusakan & Hasil Selesai) */}
                  {(prw.fotoKerusakan || prw.fotoPerbaikan || asset?.fotoBarang) && (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {prw.fotoKerusakan && (
                        <div
                          onClick={() =>
                            setLightboxPhoto({
                              title: `Foto Kondisi Rusak: ${prw.namaBarang}`,
                              src: prw.fotoKerusakan!,
                              subtitle: `Keluhan: ${prw.deskripsiKerusakan}`,
                              type: 'kerusakan'
                            })
                          }
                          className="group relative cursor-pointer flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 transition-all"
                        >
                          <img
                            src={prw.fotoKerusakan}
                            alt="Foto Kerusakan"
                            className="w-10 h-10 object-cover rounded-lg border border-white/10"
                          />
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-rose-300 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Foto Kerusakan
                            </span>
                            <span className="text-[9px] text-slate-400 group-hover:text-white flex items-center gap-0.5">
                              <Eye className="w-2.5 h-2.5" /> Klik lihat
                            </span>
                          </div>
                        </div>
                      )}

                      {prw.fotoPerbaikan && (
                        <div
                          onClick={() =>
                            setLightboxPhoto({
                              title: `Foto Hasil Servis: ${prw.namaBarang}`,
                              src: prw.fotoPerbaikan!,
                              subtitle: `Tindakan: ${prw.tindakan || 'Perbaikan selesai dan berfungsi normal'}`,
                              type: 'perbaikan'
                            })
                          }
                          className="group relative cursor-pointer flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all"
                        >
                          <img
                            src={prw.fotoPerbaikan}
                            alt="Foto Hasil Servis"
                            className="w-10 h-10 object-cover rounded-lg border border-white/10"
                          />
                          <div className="text-left">
                            <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Bukti Selesai
                            </span>
                            <span className="text-[9px] text-slate-400 group-hover:text-white flex items-center gap-0.5">
                              <Eye className="w-2.5 h-2.5" /> Klik lihat
                            </span>
                          </div>
                        </div>
                      )}

                      {!prw.fotoKerusakan && !prw.fotoPerbaikan && asset?.fotoBarang && (
                        <div
                          onClick={() =>
                            setLightboxPhoto({
                              title: `Katalog Aset: ${asset.namaBarangRuang}`,
                              src: asset.fotoBarang!,
                              subtitle: `Kode: ${asset.nomorInventarisResmi || asset.kode} | Ruang: ${asset.lokasi}`
                            })
                          }
                          className="cursor-pointer flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-white/20 transition-all"
                        >
                          <img
                            src={asset.fotoBarang}
                            alt="Katalog Aset"
                            className="w-9 h-9 object-cover rounded-lg border border-white/10"
                          />
                          <span className="text-[10px] text-slate-400">Foto Master Aset</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>Teknisi / Vendor: <strong className="text-slate-200">{prw.teknisiVendor}</strong></span>
                    <span>Biaya: <strong className="text-emerald-400 font-mono font-bold">{formatRupiah(prw.biaya)}</strong> ({prw.sumberBiaya})</span>
                    <span>Pelapor: <strong className="text-slate-200">{prw.pelapor}</strong></span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  {canEdit && prw.status !== 'Selesai' && (
                    <button
                      onClick={() => handleCompletePerawatan(prw)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow transition-all cursor-pointer"
                      title="Tandai perbaikan selesai dan kembalikan kondisi aset ke Baik"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Selesai Servis</span>
                    </button>
                  )}

                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(prw)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Edit data / lampirkan foto perbaikan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(prw.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Hapus riwayat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* LIGHTBOX PHOTO PREVIEW */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  {lightboxPhoto.title}
                </h4>
                {lightboxPhoto.subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{lightboxPhoto.subtitle}</p>
                )}
              </div>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950/90 max-h-[75vh]">
              <img
                src={lightboxPhoto.src}
                alt={lightboxPhoto.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-lg border border-white/10"
              />
            </div>
            <div className="p-3 bg-slate-900 border-t border-white/10 text-center text-xs text-slate-400">
              Dokumentasi Foto Fisik Sarana & Prasarana SMP Islam Al Qomar
            </div>
          </div>
        </div>
      )}

      {/* MODAL CATAT PERAWATAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-400/30">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingPerawatan ? 'Edit & Dokumentasi Servis' : 'Pencatatan Servis & Pemeliharaan'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pencatatan kerusakan fisik, foto bukti, pengerjaan teknisi, dan biaya
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setIsModalOpen(false);
                  if (onClearPreselected) onClearPreselected();
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm">
              {/* Asset Selector */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Pilih Aset yang Dirawat / Rusak *</label>
                <select
                  required
                  value={selectedSarprasId}
                  onChange={e => setSelectedSarprasId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {sarpras.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nomorInventarisResmi || s.kode} - {s.namaBarangRuang} ({s.lokasi})
                    </option>
                  ))}
                </select>

                {selectedItem && (
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      {selectedItem.fotoBarang ? (
                        <img
                          src={selectedItem.fotoBarang}
                          alt={selectedItem.namaBarangRuang}
                          className="w-8 h-8 rounded object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-500">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="font-semibold text-white block">{selectedItem.namaBarangRuang}</span>
                        <span>Lokasi: {selectedItem.lokasi} | Kategori: {selectedItem.kategori}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Kondisi saat ini: {selectedItem.kondisiRusakBerat > 0 ? 'Rusak Berat' : selectedItem.kondisiRusakRingan > 0 ? 'Rusak Ringan' : 'Baik'}
                    </span>
                  </div>
                )}
              </div>

              {/* DOKUMENTASI FOTO SEBELUM & SESUDAH SERVIS */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Dokumentasi Foto Fisik Aset</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Foto dikompresi otomatis &lt;100KB</span>
                </div>

                {/* LIVE CAMERA STREAM (Jika Sedang Aktif) */}
                {activeCameraTarget && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 animate-pulse" />
                        Kamera Aktif: Foto {activeCameraTarget === 'kerusakan' ? 'Kerusakan' : 'Hasil Servis'}
                      </span>
                      <button
                        type="button"
                        onClick={flipCamera}
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-lg"
                      >
                        <RefreshCw className="w-3 h-3" /> Putar Kamera
                      </button>
                    </div>

                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video flex items-center justify-center">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={captureSnapshot}
                        className="px-5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
                      >
                        <Camera className="w-4 h-4" />
                        Ambil Jepretan
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                      >
                        Tutup Kamera
                      </button>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    {cameraError}
                  </div>
                )}

                {/* Grid 2 Kolom Foto: Kerusakan (Sebelum) dan Hasil Servis (Setelah) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto 1: Kerusakan */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-rose-300">
                      1. Foto Kerusakan / Kendala (Sebelum Servis)
                    </label>

                    {fotoKerusakan ? (
                      <div className="relative rounded-xl overflow-hidden border border-rose-500/30 bg-slate-900 group">
                        <img
                          src={fotoKerusakan}
                          alt="Foto Kerusakan"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxPhoto({
                                title: 'Foto Kerusakan Aset',
                                src: fotoKerusakan,
                                subtitle: 'Kondisi barang saat dilaporkan'
                              })
                            }
                            className="p-1.5 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
                            title="Perbesar"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFotoKerusakan(undefined)}
                            className="p-1.5 bg-rose-600 rounded-lg text-white hover:bg-rose-500"
                            title="Hapus foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-rose-300 font-mono">
                          Tersimpan
                        </span>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-white/10 hover:border-rose-500/40 rounded-xl p-3 text-center bg-slate-900/50">
                        <input
                          ref={fileInputKerusakanRef}
                          type="file"
                          accept="image/*"
                          onChange={e => handlePhotoUpload(e, 'kerusakan')}
                          className="hidden"
                        />
                        <AlertCircle className="w-6 h-6 mx-auto text-rose-400 mb-1" />
                        <p className="text-[11px] text-slate-300 mb-2">Potret atau unggah bukti fisik kerusakan</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => startCamera('kerusakan')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                          >
                            <Camera className="w-3 h-3 text-rose-400" /> Kamera
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputKerusakanRef.current?.click()}
                            disabled={isCompressingKerusakan}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3 text-rose-400" />
                            {isCompressingKerusakan ? 'Memproses...' : 'Pilih File'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Foto 2: Bukti Selesai */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-emerald-300">
                      2. Foto Hasil Servis (Setelah Selesai)
                    </label>

                    {fotoPerbaikan ? (
                      <div className="relative rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900 group">
                        <img
                          src={fotoPerbaikan}
                          alt="Foto Hasil Servis"
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxPhoto({
                                title: 'Foto Hasil Servis & Uji Operasi',
                                src: fotoPerbaikan,
                                subtitle: 'Bukti fisik barang telah diperbaiki'
                              })
                            }
                            className="p-1.5 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
                            title="Perbesar"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFotoPerbaikan(undefined)}
                            className="p-1.5 bg-rose-600 rounded-lg text-white hover:bg-rose-500"
                            title="Hapus foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-2 text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-emerald-300 font-mono">
                          Tersimpan
                        </span>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl p-3 text-center bg-slate-900/50">
                        <input
                          ref={fileInputPerbaikanRef}
                          type="file"
                          accept="image/*"
                          onChange={e => handlePhotoUpload(e, 'perbaikan')}
                          className="hidden"
                        />
                        <CheckCircle className="w-6 h-6 mx-auto text-emerald-400 mb-1" />
                        <p className="text-[11px] text-slate-300 mb-2">Foto barang sesudah diservis / sparepart diganti</p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => startCamera('perbaikan')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                          >
                            <Camera className="w-3 h-3 text-emerald-400" /> Kamera
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputPerbaikanRef.current?.click()}
                            disabled={isCompressingPerbaikan}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                          >
                            <Upload className="w-3 h-3 text-emerald-400" />
                            {isCompressingPerbaikan ? 'Memproses...' : 'Pilih File'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Jenis & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jenis Perawatan</label>
                  <select
                    value={jenisPerawatan}
                    onChange={e => setJenisPerawatan(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Pemeliharaan Rutin">Pemeliharaan Rutin</option>
                    <option value="Perbaikan Ringan">Perbaikan Ringan</option>
                    <option value="Perbaikan Sedang">Perbaikan Sedang</option>
                    <option value="Perbaikan Berat">Perbaikan Berat</option>
                    <option value="Penggantian Komponen">Penggantian Komponen / Sparepart</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status Pengerjaan</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Menunggu Jadwal">Menunggu Jadwal</option>
                    <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              {/* Deskripsi & Solusi */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Keluhan / Deskripsi Kerusakan Fisik *</label>
                <textarea
                  rows={2}
                  required
                  value={deskripsiKerusakan}
                  onChange={e => setDeskripsiKerusakan(e.target.value)}
                  placeholder="Contoh: Kipas pendingin bising, layar bergaris atau tombol power macet..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tindakan / Solusi Teknisi</label>
                <textarea
                  rows={2}
                  value={tindakan}
                  onChange={e => setTindakan(e.target.value)}
                  placeholder="Contoh: Pembersihan debu filter, penggantian modul inverter, uji operasional normal..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Biaya, Sumber, Teknisi */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Biaya Servis (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={biaya}
                    onChange={e => setBiaya(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sumber Biaya</label>
                  <select
                    value={sumberBiaya}
                    onChange={e => setSumberBiaya(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SUMBER_DANA_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Teknisi / Vendor</label>
                  <input
                    type="text"
                    value={teknisiVendor}
                    onChange={e => setTeknisiVendor(e.target.value)}
                    placeholder="Contoh: CV Banyuwangi IT / Teknisi Sekolah"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Tanggal & Pelapor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Diajukan</label>
                  <input
                    type="date"
                    value={tanggalPengajuan}
                    onChange={e => setTanggalPengajuan(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pelapor / Penanggung Jawab</label>
                  <input
                    type="text"
                    value={pelapor}
                    onChange={e => setPelapor(e.target.value)}
                    placeholder="Nama guru / petugas pelapor"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsModalOpen(false);
                    if (onClearPreselected) onClearPreselected();
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all"
                >
                  Simpan Riwayat Perawatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

