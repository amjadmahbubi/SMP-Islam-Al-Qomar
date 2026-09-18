import React, { useState } from 'react';
import { SarprasItem, SarprasMutasi, SarprasRuang, Teacher, UserSession } from '../../../types';
import { LOKASI_PRESETS } from './sarprasUtils';
import {
  ArrowRightLeft,
  Plus,
  Search,
  FileText,
  MapPin,
  UserCheck,
  Calendar,
  CheckCircle,
  X,
  Printer,
  Trash2,
  ShieldCheck,
  ArrowRight,
  Building2
} from 'lucide-react';

interface SarprasMutasiTabProps {
  sarpras: SarprasItem[];
  mutasiList: SarprasMutasi[];
  ruangList?: SarprasRuang[];
  onSaveMutasi: (list: SarprasMutasi[]) => void;
  onUpdateSarprasItem: (updatedItem: SarprasItem) => void;
  teachers?: Teacher[];
  session?: UserSession;
  canEdit: boolean;
  onAddAuditLog: (action: 'MUTASI', detail: string) => void;
  preselectedItem?: SarprasItem | null;
  onClearPreselected?: () => void;
}

export const SarprasMutasiTab: React.FC<SarprasMutasiTabProps> = ({
  sarpras,
  mutasiList,
  ruangList = [],
  onSaveMutasi,
  onUpdateSarprasItem,
  teachers = [],
  session,
  canEdit,
  onAddAuditLog,
  preselectedItem,
  onClearPreselected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBastModal, setActiveBastModal] = useState<SarprasMutasi | null>(null);

  // Form state
  const [selectedSarprasId, setSelectedSarprasId] = useState(preselectedItem?.id || '');
  const [jenisMutasi, setJenisMutasi] = useState<'Pindah Lokasi' | 'Ganti Penanggung Jawab' | 'Peminjaman Internal' | 'Alih Fungsi' | 'Penghapusan Aset'>('Pindah Lokasi');
  const [lokasiTujuan, setLokasiTujuan] = useState(LOKASI_PRESETS[0]);
  const [selectedRuangId, setSelectedRuangId] = useState<string>('');
  const [pjTujuan, setPjTujuan] = useState('');
  const [tanggalMutasi, setTanggalMutasi] = useState(new Date().toISOString().split('T')[0]);
  const [nomorBast, setNomorBast] = useState('');
  const [alasan, setAlasan] = useState('');

  // When preselectedItem arrives, open modal
  React.useEffect(() => {
    if (preselectedItem) {
      setSelectedSarprasId(preselectedItem.id);
      setNomorBast(`BAST/SARPRAS/${new Date().getFullYear()}/${String(mutasiList.length + 1).padStart(3, '0')}`);
      setIsModalOpen(true);
    }
  }, [preselectedItem]);

  const selectedItem = sarpras.find(s => s.id === selectedSarprasId);

  const handleOpenAdd = () => {
    const defaultItem = sarpras[0];
    setSelectedSarprasId(defaultItem ? defaultItem.id : '');
    setJenisMutasi('Pindah Lokasi');
    setLokasiTujuan(defaultItem?.lokasi || LOKASI_PRESETS[0]);
    setPjTujuan(defaultItem?.penanggungJawab || teachers[0]?.nama || '');
    setTanggalMutasi(new Date().toISOString().split('T')[0]);
    setNomorBast(`BAST/SARPRAS/${new Date().getFullYear()}/${String(mutasiList.length + 1).padStart(3, '0')}`);
    setAlasan('');
    setIsModalOpen(true);
  };

  const handleSaveMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) {
      alert('Pilih aset yang ingin dimutasikan');
      return;
    }

    const newMutasi: SarprasMutasi = {
      id: `MUT-${Date.now()}`,
      sarprasId: selectedItem.id,
      kodeBarang: selectedItem.nomorInventarisResmi || selectedItem.kode,
      namaBarang: selectedItem.namaBarangRuang,
      tanggalMutasi,
      lokasiAsal: selectedItem.lokasi,
      lokasiTujuan: jenisMutasi === 'Ganti Penanggung Jawab' ? selectedItem.lokasi : lokasiTujuan,
      penanggungJawabAsal: selectedItem.penanggungJawab || '-',
      penanggungJawabTujuan: pjTujuan || selectedItem.penanggungJawab || '-',
      jenisMutasi,
      nomorBast: nomorBast || `BAST-${Date.now()}`,
      alasan: alasan || 'Mutasi operasional sekolah',
      dicatatOleh: session?.name || 'Petugas Sarpras',
      status: 'Selesai'
    };

    // Update the asset's location and/or PIC
    const targetRuang = ruangList.find(r => r.id === selectedRuangId);
    const updatedSarprasItem: SarprasItem = {
      ...selectedItem,
      lokasi: jenisMutasi === 'Ganti Penanggung Jawab' ? selectedItem.lokasi : lokasiTujuan,
      penanggungJawab: pjTujuan || selectedItem.penanggungJawab,
      ruangId: targetRuang ? targetRuang.id : selectedItem.ruangId,
      gedungId: targetRuang ? targetRuang.gedungId : selectedItem.gedungId,
      statusAset: jenisMutasi === 'Penghapusan Aset' ? 'Dihapuskan / Mutasi Keluar' : (selectedItem.statusAset || 'Aktif Digunakan')
    };

    onUpdateSarprasItem(updatedSarprasItem);
    onSaveMutasi([newMutasi, ...mutasiList]);
    onAddAuditLog(
      'MUTASI',
      `Mutasi ${selectedItem.namaBarangRuang} (${newMutasi.kodeBarang}): ${selectedItem.lokasi} -> ${newMutasi.lokasiTujuan}, PJ: ${newMutasi.penanggungJawabTujuan}`
    );

    setIsModalOpen(false);
    if (onClearPreselected) onClearPreselected();
  };

  const handleDeleteMutasi = (id: string) => {
    if (confirm('Hapus riwayat mutasi ini?')) {
      onSaveMutasi(mutasiList.filter(m => m.id !== id));
    }
  };

  const filteredMutasi = mutasiList.filter(m => {
    const q = searchTerm.toLowerCase();
    return (
      m.namaBarang.toLowerCase().includes(q) ||
      m.kodeBarang.toLowerCase().includes(q) ||
      m.nomorBast.toLowerCase().includes(q) ||
      m.lokasiTujuan.toLowerCase().includes(q) ||
      m.penanggungJawabTujuan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari riwayat mutasi (nama aset, no BAST, lokasi, penanggung jawab)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Mutasi Baru</span>
          </button>
        )}
      </div>

      {/* List Mutasi */}
      <div className="space-y-3">
        {filteredMutasi.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/50 border border-white/10 text-center text-slate-400">
            <ArrowRightLeft className="w-8 h-8 mx-auto mb-2 text-slate-500" />
            <p className="text-sm">Belum ada riwayat mutasi aset tercatat.</p>
          </div>
        ) : (
          filteredMutasi.map(mutasi => (
            <div
              key={mutasi.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-md hover:border-emerald-500/30 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-400/20">
                    {mutasi.nomorBast}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-400/20">
                    {mutasi.jenisMutasi}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {mutasi.tanggalMutasi}
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm sm:text-base">
                  {mutasi.namaBarang}
                  <span className="text-xs font-normal text-slate-400 font-mono ml-2">
                    ({mutasi.kodeBarang})
                  </span>
                </h4>

                {/* Transition Route */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 block">Perpindahan Lokasi</span>
                      <span className="line-through text-slate-400 mr-1">{mutasi.lokasiAsal}</span>
                      <ArrowRight className="inline w-3 h-3 text-emerald-400 mx-1" />
                      <span className="text-white font-semibold">{mutasi.lokasiTujuan}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                    <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-slate-500 block">Penanggung Jawab</span>
                      <span className="text-slate-400 mr-1">{mutasi.penanggungJawabAsal}</span>
                      <ArrowRight className="inline w-3 h-3 text-emerald-400 mx-1" />
                      <span className="text-white font-semibold">{mutasi.penanggungJawabTujuan}</span>
                    </div>
                  </div>
                </div>

                {mutasi.alasan && (
                  <p className="text-xs text-slate-400 italic pt-1">
                    "{mutasi.alasan}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setActiveBastModal(mutasi)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cetak BAST</span>
                </button>

                {canEdit && (
                  <button
                    onClick={() => handleDeleteMutasi(mutasi.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Hapus riwayat mutasi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FORM MUTASI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 border border-sky-400/30">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Pencatatan Mutasi Aset</h3>
                  <p className="text-xs text-slate-400">Perpindahan fisik dan serah terima penanggung jawab</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (onClearPreselected) onClearPreselected();
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMutasi} className="p-6 space-y-4 text-xs sm:text-sm">
              {/* Asset Selector */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">Pilih Aset yang Dimutasikan *</label>
                <select
                  required
                  value={selectedSarprasId}
                  onChange={e => {
                    setSelectedSarprasId(e.target.value);
                    const item = sarpras.find(s => s.id === e.target.value);
                    if (item) {
                      setLokasiTujuan(item.lokasi);
                      setPjTujuan(item.penanggungJawab || '');
                    }
                  }}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {sarpras.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.nomorInventarisResmi || s.kode} - {s.namaBarangRuang} ({s.lokasi})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Info preview */}
              {selectedItem && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Lokasi Saat Ini:</span>
                    <span className="text-white font-medium">{selectedItem.lokasi}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Penanggung Jawab Saat Ini:</span>
                    <span className="text-white font-medium">{selectedItem.penanggungJawab || '-'}</span>
                  </div>
                </div>
              )}

              {/* Jenis Mutasi & Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jenis Mutasi</label>
                  <select
                    value={jenisMutasi}
                    onChange={e => setJenisMutasi(e.target.value as any)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Pindah Lokasi">Pindah Lokasi Fisik</option>
                    <option value="Ganti Penanggung Jawab">Ganti Penanggung Jawab</option>
                    <option value="Peminjaman Internal">Peminjaman Internal Kegiatan</option>
                    <option value="Alih Fungsi">Alih Fungsi Ruang / Peralatan</option>
                    <option value="Penghapusan Aset">Penghapusan / Disposal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tanggal Mutasi</label>
                  <input
                    type="date"
                    required
                    value={tanggalMutasi}
                    onChange={e => setTanggalMutasi(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Master Ruang & Gedung Tujuan */}
              {ruangList.length > 0 && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1 text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pilih dari Master Gedung & Ruang (Opsional)</span>
                  </label>
                  <select
                    value={selectedRuangId}
                    onChange={e => {
                      const rId = e.target.value;
                      setSelectedRuangId(rId);
                      const targetR = ruangList.find(r => r.id === rId);
                      if (targetR) {
                        setLokasiTujuan(targetR.namaRuang);
                        if (targetR.penanggungJawabRuang) {
                          setPjTujuan(targetR.penanggungJawabRuang);
                        }
                      }
                    }}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="">-- Pilih dari Master Gedung & Ruang --</option>
                    {ruangList.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.namaRuang} ({r.namaGedung || 'Gedung'}) {r.penanggungJawabRuang ? `• PJ: ${r.penanggungJawabRuang}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Lokasi Tujuan & PJ Tujuan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Lokasi Tujuan Baru *</label>
                  <input
                    type="text"
                    list="lokasi-presets"
                    required
                    value={lokasiTujuan}
                    onChange={e => {
                      setLokasiTujuan(e.target.value);
                      setSelectedRuangId('');
                    }}
                    placeholder="Pilih atau ketik ruangan tujuan"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                  <datalist id="lokasi-presets">
                    {LOKASI_PRESETS.map(l => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Penanggung Jawab Baru *</label>
                  <select
                    required
                    value={pjTujuan}
                    onChange={e => setPjTujuan(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Pilih Guru / Tendik --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.nama}>
                        {t.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nomor BAST & Alasan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nomor BAST Resmi</label>
                  <input
                    type="text"
                    value={nomorBast}
                    onChange={e => setNomorBast(e.target.value)}
                    placeholder="Contoh: BAST/SARPRAS/2026/001"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Alasan Mutasi</label>
                  <input
                    type="text"
                    value={alasan}
                    onChange={e => setAlasan(e.target.value)}
                    placeholder="Contoh: Kebutuhan ujian asesmen lab komputer"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
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
                  Simpan & Update Lokasi Aset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRINT BAST */}
      {activeBastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-wide">SMP ISLAM AL QOMAR</h2>
                <h3 className="text-sm font-semibold text-slate-600">BERITA ACARA SERAH TERIMA (BAST) SARANA & PRASARANA</h3>
                <p className="text-xs font-mono text-slate-500 mt-1">Nomor: {activeBastModal.nomorBast}</p>
              </div>
              <button
                onClick={() => setActiveBastModal(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs leading-relaxed text-slate-700">
              Pada hari ini, tanggal <strong>{activeBastModal.tanggalMutasi}</strong>, telah dilaksanakan serah terima sarana dan prasarana sekolah dengan rincian sebagai berikut:
            </p>

            <table className="w-full text-xs border border-slate-300">
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-semibold bg-slate-50 w-40">Nama Barang / Aset</td>
                  <td className="p-2 font-bold">{activeBastModal.namaBarang}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-semibold bg-slate-50">Nomor Inventaris</td>
                  <td className="p-2 font-mono">{activeBastModal.kodeBarang}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-semibold bg-slate-50">Jenis Mutasi</td>
                  <td className="p-2">{activeBastModal.jenisMutasi}</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-semibold bg-slate-50">Lokasi Asal &rarr; Baru</td>
                  <td className="p-2">{activeBastModal.lokasiAsal} &rarr; <strong>{activeBastModal.lokasiTujuan}</strong></td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-semibold bg-slate-50">Alasan Mutasi</td>
                  <td className="p-2">{activeBastModal.alasan}</td>
                </tr>
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-8 text-xs pt-4">
              <div className="text-center space-y-12">
                <p>Pihak Yang Menyerahkan,</p>
                <div>
                  <p className="font-bold underline">{activeBastModal.penanggungJawabAsal}</p>
                  <p className="text-[10px] text-slate-500">Penanggung Jawab Lama</p>
                </div>
              </div>

              <div className="text-center space-y-12">
                <p>Pihak Yang Menerima,</p>
                <div>
                  <p className="font-bold underline">{activeBastModal.penanggungJawabTujuan}</p>
                  <p className="text-[10px] text-slate-500">Penanggung Jawab Baru</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t print:hidden">
              <button
                onClick={() => setActiveBastModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Tutup
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar BAST</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
