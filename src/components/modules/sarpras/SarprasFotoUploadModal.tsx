import React, { useState, useRef, useEffect, useId } from 'react';
import { SarprasItem, SarprasRuang, SarprasGedung, Teacher } from '../../../types';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  Image as ImageIcon,
  Boxes,
  Building2,
  RefreshCw,
  Video,
  VideoOff,
  Sliders,
  DollarSign,
  Tag
} from 'lucide-react';
import { compressImageFile, PRESET_DETEKSI_BARANG, PresetAsetFoto } from './sarprasImageUtils';
import { KATEGORI_OPTIONS, SATUAN_OPTIONS, SUMBER_DANA_OPTIONS } from './sarprasUtils';

interface SarprasFotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruangList: SarprasRuang[];
  gedungList: SarprasGedung[];
  teachers?: Teacher[];
  existingSarprasCount?: number;
  sarpras?: SarprasItem[];
  onSaveAsset: (newAsset: SarprasItem) => void;
}

export const SarprasFotoUploadModal: React.FC<SarprasFotoUploadModalProps> = ({
  isOpen,
  onClose,
  ruangList,
  gedungList,
  teachers = [],
  existingSarprasCount,
  sarpras = [],
  onSaveAsset
}) => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Form states for the new asset
  const [namaBarang, setNamaBarang] = useState('');
  const [kategori, setKategori] = useState('Elektronik');
  const [merkModel, setMerkModel] = useState('');
  const [jumlah, setJumlah] = useState<number>(1);
  const [satuan, setSatuan] = useState('Unit');
  const [kondisiBaik, setKondisiBaik] = useState<number>(1);
  const [kondisiRusakRingan, setKondisiRusakRingan] = useState<number>(0);
  const [kondisiRusakBerat, setKondisiRusakBerat] = useState<number>(0);
  const [ruangId, setRuangId] = useState<string>(ruangList[0]?.id || '');
  const [sumberDana, setSumberDana] = useState('BOS Reguler');
  const [hargaPerolehan, setHargaPerolehan] = useState<number>(0);
  const [masaManfaatTahun, setMasaManfaatTahun] = useState<number>(5);
  const [penanggungJawab, setPenanggungJawab] = useState(teachers[0]?.nama || '');
  const [keterangan, setKeterangan] = useState('Ditambahkan via pemindaian foto barang');

  // Input IDs for form labels
  const namaBarangInputId = useId();
  const kategoriInputId = useId();
  const merkModelInputId = useId();
  const jumlahInputId = useId();
  const satuanInputId = useId();
  const ruangInputId = useId();
  const pjInputId = useId();
  const sumberDanaInputId = useId();
  const hargaInputId = useId();
  const masaManfaatInputId = useId();
  const keteranganInputId = useId();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhotoDataUrl('');
      setNamaBarang('');
      setKategori('Elektronik');
      setMerkModel('');
      setJumlah(1);
      setSatuan('Unit');
      setKondisiBaik(1);
      setKondisiRusakRingan(0);
      setKondisiRusakBerat(0);
      setRuangId(ruangList[0]?.id || '');
      setHargaPerolehan(0);
      setMasaManfaatTahun(5);
      setPenanggungJawab(teachers[0]?.nama || '');
      setKeterangan('Ditambahkan melalui foto barang');
      setIsCameraActive(false);
      setCameraError('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, ruangList, teachers]);

  // Start live camera stream
  const startCamera = async () => {
    try {
      setCameraError('');
      if (streamRef.current) {
        stopCamera();
      }
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
      setIsCameraActive(true);
    } catch (err: unknown) {
      console.error('Gagal mengakses kamera:', err);
      const errMsg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
      setCameraError(`Kamera tidak dapat diakses (${errMsg}). Anda tetap dapat mengunggah file foto dari perangkat.`);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture snapshot from live video stream
  const captureSnapshot = async () => {
    if (!videoRef.current) return;
    try {
      setIsCompressing(true);
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 960;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoDataUrl(dataUrl);
      }
      stopCamera();
    } catch (err) {
      console.error('Error capturing snapshot:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Switch between front/back cameras
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  };

  // Handle uploaded file
  const handleFileUpload = async (file: File) => {
    try {
      setIsCompressing(true);
      const compressedData = await compressImageFile(file, 960, 0.78);
      setPhotoDataUrl(compressedData);
      stopCamera();
    } catch (err) {
      console.error('Gagal memproses file foto:', err);
      alert('Gagal memproses foto. Pastikan format JPG, PNG, atau WEBP.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Apply a smart detection preset
  const handleApplyPreset = (preset: PresetAsetFoto) => {
    setNamaBarang(preset.namaDefault);
    setKategori(preset.kategori);
    setSatuan(preset.satuan);
    setMerkModel(preset.merkPerkiraan);
    setMasaManfaatTahun(preset.masaManfaatTahun);
    if (preset.estimasiHarga > 0) {
      setHargaPerolehan(preset.estimasiHarga);
    }
  };

  // Submit asset
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) {
      alert('Mohon isi nama barang aset.');
      return;
    }

    const selectedRuang = ruangList.find(r => r.id === ruangId);
    const selectedGedung = gedungList.find(g => g.id === selectedRuang?.gedungId);

    const year = new Date().getFullYear();
    const count = existingSarprasCount ?? sarpras.length;
    const nextNum = count + 1;
    const catCode = kategori.substring(0, 2).toUpperCase();
    const nomorInv = `SMP-IQ/INV/${catCode}/${year}/${String(nextNum).padStart(3, '0')}`;
    const kodeItem = `SRP-${Date.now().toString().slice(-4)}`;

    const newAsset: SarprasItem = {
      id: `SRP-${Date.now()}`,
      kode: kodeItem,
      nomorInventarisResmi: nomorInv,
      namaBarangRuang: namaBarang,
      kategori,
      merkModel: merkModel || undefined,
      jumlah: Number(jumlah) || 1,
      satuan: satuan || 'Unit',
      kondisiBaik: Number(kondisiBaik) || 0,
      kondisiRusakRingan: Number(kondisiRusakRingan) || 0,
      kondisiRusakBerat: Number(kondisiRusakBerat) || 0,
      lokasi: selectedRuang ? selectedRuang.namaRuang : 'Gudang Sarpras',
      gedungId: selectedGedung?.id,
      ruangId: selectedRuang?.id,
      penanggungJawab: penanggungJawab || selectedRuang?.penanggungJawabRuang,
      sumberDana,
      hargaPerolehan: Number(hargaPerolehan) || 0,
      masaManfaatTahun: Number(masaManfaatTahun) || 5,
      nilaiResidu: Math.round((Number(hargaPerolehan) || 0) * 0.1),
      statusAset: 'Aktif Digunakan',
      tanggalPengadaan: new Date().toISOString().split('T')[0],
      keterangan,
      fotoBarang: photoDataUrl || undefined
    };

    onSaveAsset(newAsset);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-2xl p-5 sm:p-6 my-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Tambah Aset via Foto Barang</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  Cerdas & Cepat
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ambil foto menggunakan kamera atau unggah berkas gambar barang untuk pendataan instan.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: PHOTO CAPTURE & PREVIEW AREA */}
        <div className="space-y-3">
          <div className="relative w-full rounded-2xl bg-slate-950 border border-white/10 overflow-hidden min-h-[220px] flex flex-col items-center justify-center">
            
            {/* 1. Live Camera Stream */}
            {isCameraActive && (
              <div className="relative w-full h-[260px] bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Camera Overlay Controls */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md text-white hover:bg-white/20 transition-all text-xs flex items-center gap-1 border border-white/20"
                    title="Putar Kamera Depan/Belakang"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-2 rounded-xl bg-rose-950/80 backdrop-blur-md text-rose-300 hover:bg-rose-900 transition-all text-xs border border-rose-500/30"
                    title="Matikan Kamera"
                  >
                    <VideoOff className="w-4 h-4" />
                  </button>
                </div>

                {/* Shutter Button */}
                <div className="absolute bottom-4 inset-x-0 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    disabled={isCompressing}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Jepret Foto Barang</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Photo Captured Preview */}
            {!isCameraActive && photoDataUrl && (
              <div className="relative w-full h-[260px] bg-slate-950 flex items-center justify-center">
                <img
                  src={photoDataUrl}
                  alt="Foto Barang Terpilih"
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-emerald-500/90 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Foto Barang Siap Digunakan</span>
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoDataUrl('')}
                    className="p-1.5 rounded-lg bg-black/70 text-rose-300 hover:text-white transition-all text-xs border border-white/10"
                    title="Hapus / Ambil Ulang"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Empty State / Choose Method */}
            {!isCameraActive && !photoDataUrl && (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Ambil atau Unggah Foto Barang</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Gunakan kamera ponsel/laptop atau pilih gambar dari galeri perangkat.
                  </p>
                </div>

                {cameraError && (
                  <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl max-w-md mx-auto">
                    {cameraError}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Buka Kamera Langsung</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Pilih Berkas Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick preset tags for fast categorization */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Pilih Cepat / Deteksi Jenis Barang:</span>
              </span>
              <span className="text-[11px] text-slate-500">Klik untuk isi otomatis</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 rounded-xl bg-slate-950/40 border border-white/5">
              {PRESET_DETEKSI_BARANG.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400/40 border border-white/10 text-[11px] text-slate-300 transition-all cursor-pointer"
                >
                  <span>{preset.iconTag}</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 2: ASSET DETAILS FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={namaBarangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Barang Inventaris *
              </label>
              <input
                id={namaBarangInputId}
                type="text"
                required
                placeholder="Contoh: Komputer Lenovo AIO 24 Inch"
                value={namaBarang}
                onChange={e => setNamaBarang(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label htmlFor={kategoriInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                Kategori Sarpras *
              </label>
              <select
                id={kategoriInputId}
                value={kategori}
                onChange={e => setKategori(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
              >
                {KATEGORI_OPTIONS.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor={merkModelInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                Merk / Spesifikasi / Model
              </label>
              <input
                id={merkModelInputId}
                type="text"
                placeholder="Contoh: Intel Core i5 / RAM 16GB / SSD 512GB"
                value={merkModel}
                onChange={e => setMerkModel(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor={jumlahInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                  Jumlah
                </label>
                <input
                  id={jumlahInputId}
                  type="number"
                  min="1"
                  value={jumlah}
                  onChange={e => {
                    const j = Number(e.target.value) || 1;
                    setJumlah(j);
                    setKondisiBaik(j);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500 font-bold text-center"
                />
              </div>

              <div>
                <label htmlFor={satuanInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                  Satuan
                </label>
                <select
                  id={satuanInputId}
                  value={satuan}
                  onChange={e => setSatuan(e.target.value)}
                  className="w-full px-2 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
                >
                  {SATUAN_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lokasi Ruang (Integrated with Master Ruang) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={ruangInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                Lokasi Ruangan (Master Ruang) *
              </label>
              <select
                id={ruangInputId}
                required
                value={ruangId}
                onChange={e => {
                  setRuangId(e.target.value);
                  const selectedR = ruangList.find(r => r.id === e.target.value);
                  if (selectedR?.penanggungJawabRuang) {
                    setPenanggungJawab(selectedR.penanggungJawabRuang);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {ruangList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.namaRuang} ({r.namaGedung || 'Gedung'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={pjInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                Penanggung Jawab Aset
              </label>
              <select
                id={pjInputId}
                value={penanggungJawab}
                onChange={e => setPenanggungJawab(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Pilih Guru / PJ --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.nama}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor={sumberDanaInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                Sumber Dana
              </label>
              <select
                id={sumberDanaInputId}
                value={sumberDana}
                onChange={e => setSumberDana(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
              >
                {SUMBER_DANA_OPTIONS.map(sd => (
                  <option key={sd} value={sd}>
                    {sd}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor={hargaInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                Harga Perolehan (Rp / Unit)
              </label>
              <input
                id={hargaInputId}
                type="number"
                placeholder="0"
                value={hargaPerolehan || ''}
                onChange={e => setHargaPerolehan(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label htmlFor={masaManfaatInputId} className="block text-xs font-semibold text-slate-300 mb-1">
                Masa Manfaat (Tahun)
              </label>
              <input
                id={masaManfaatInputId}
                type="number"
                min="1"
                value={masaManfaatTahun}
                onChange={e => setMasaManfaatTahun(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor={keteranganInputId} className="block text-xs font-semibold text-slate-300 mb-1">
              Catatan Inventaris
            </label>
            <input
              id={keteranganInputId}
              type="text"
              placeholder="Catatan kondisi fisik atau kelengkapan..."
              value={keterangan}
              onChange={e => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-800 border border-white/10 text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-4 py-2 text-xs rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Aset ke Database</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
