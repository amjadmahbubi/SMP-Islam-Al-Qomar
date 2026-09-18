import React, { useState } from 'react';
import { SarprasItem, SarprasMutasi, SarprasPerawatan, SarprasPerencanaan, SchoolInfo, Teacher } from '../../../types';
import { calculateDepresiasi, formatRupiah, KATEGORI_OPTIONS } from './sarprasUtils';
import {
  FileText,
  Printer,
  Download,
  Building2,
  Barcode,
  Layers,
  CheckCircle2,
  Calendar,
  Sparkles,
  MapPin,
  DollarSign
} from 'lucide-react';

interface SarprasLaporanTabProps {
  sarpras: SarprasItem[];
  mutasiList: SarprasMutasi[];
  perawatanList: SarprasPerawatan[];
  perencanaanList: SarprasPerencanaan[];
  schoolInfo?: SchoolInfo;
  teachers?: Teacher[];
}

export const SarprasLaporanTab: React.FC<SarprasLaporanTabProps> = ({
  sarpras,
  mutasiList,
  perawatanList,
  perencanaanList,
  schoolInfo,
  teachers = []
}) => {
  const [activeReport, setActiveReport] = useState<'KIR' | 'STIKER' | 'REKAP_NILAI'>('KIR');

  // KIR state
  const availableRooms = Array.from(new Set(sarpras.map(s => s.lokasi).filter(Boolean)));
  const [selectedRoom, setSelectedRoom] = useState(availableRooms[0] || 'Lab Komputer');

  // Filtered assets for selected room
  const roomAssets = sarpras.filter(s => s.lokasi === selectedRoom);
  const roomPIC = roomAssets.find(s => s.penanggungJawab)?.penanggungJawab || teachers[0]?.nama || 'Penanggung Jawab Ruang';

  // Category recap data
  const recapByCategory = KATEGORI_OPTIONS.map(cat => {
    const items = sarpras.filter(s => s.kategori === cat);
    const totalUnit = items.reduce((acc, curr) => acc + (Number(curr.jumlah) || 1), 0);
    const totalPerolehan = items.reduce((acc, curr) => {
      return acc + ((Number(curr.hargaPerolehan) || 0) * (Number(curr.jumlah) || 1));
    }, 0);
    const totalNilaiBuku = items.reduce((acc, curr) => {
      const dep = calculateDepresiasi(curr);
      return acc + (dep.nilaiBukuSaatIni * (Number(curr.jumlah) || 1));
    }, 0);
    const totalAkumulasiDep = Math.max(0, totalPerolehan - totalNilaiBuku);

    return {
      kategori: cat,
      itemCount: items.length,
      totalUnit,
      totalPerolehan,
      totalAkumulasiDep,
      totalNilaiBuku
    };
  }).filter(r => r.itemCount > 0);

  const grandTotalPerolehan = recapByCategory.reduce((a, b) => a + b.totalPerolehan, 0);
  const grandTotalDepresiasi = recapByCategory.reduce((a, b) => a + b.totalAkumulasiDep, 0);
  const grandTotalNilaiBuku = recapByCategory.reduce((a, b) => a + b.totalNilaiBuku, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sub-Tabs Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveReport('KIR')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeReport === 'KIR'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Kartu Inventaris Ruang (KIR)</span>
          </button>

          <button
            onClick={() => setActiveReport('STIKER')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeReport === 'STIKER'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Barcode className="w-4 h-4" />
            <span>Stiker Label Inventaris (QR Sheet)</span>
          </button>

          <button
            onClick={() => setActiveReport('REKAP_NILAI')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeReport === 'REKAP_NILAI'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Rekapitulasi Nilai & Depresiasi</span>
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Dokumen Ini</span>
        </button>
      </div>

      {/* 1. KARTU INVENTARIS RUANG (KIR) */}
      {activeReport === 'KIR' && (
        <div className="space-y-4">
          {/* Room Filter Selector */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-slate-300 font-semibold">Pilih Ruangan:</label>
              <select
                value={selectedRoom}
                onChange={e => setSelectedRoom(e.target.value)}
                className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
              >
                {availableRooms.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <p className="text-slate-400">
              Menampilkan <strong className="text-white">{roomAssets.length}</strong> aset yang ditempatkan di <strong>{selectedRoom}</strong>
            </p>
          </div>

          {/* Printable KIR Canvas */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 space-y-6 print:m-0 print:p-0 print:border-none print:shadow-none">
            {/* Header Sekolah */}
            <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">
                {schoolInfo?.nama || 'SMP ISLAM AL QOMAR'}
              </h2>
              <p className="text-xs text-slate-600">
                NPSN: {schoolInfo?.npsn || '70004839'} &bull; Akreditasi: {schoolInfo?.akreditasi || 'A (Unggul)'}
              </p>
              <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
                {schoolInfo?.alamat || 'Jl. Kemuning, Watubuncul, Boyolangu, Giri, Banyuwangi'}
              </p>
              <h3 className="text-sm font-bold uppercase tracking-widest pt-2 text-slate-800 underline">
                KARTU INVENTARIS RUANG (KIR)
              </h3>
            </div>

            {/* Room Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p><span className="text-slate-500 font-medium">Nama Ruang:</span> <strong>{selectedRoom}</strong></p>
                <p><span className="text-slate-500 font-medium">Unit Kerja:</span> Sarana & Prasarana</p>
              </div>
              <div className="text-right">
                <p><span className="text-slate-500 font-medium">Tahun Ajaran:</span> 2025/2026</p>
                <p><span className="text-slate-500 font-medium">Penanggung Jawab:</span> <strong>{roomPIC}</strong></p>
              </div>
            </div>

            {/* Assets Table */}
            <table className="w-full text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300 text-center w-10">No</th>
                  <th className="p-2 border-r border-slate-300 text-left">No. Inventaris Resmi</th>
                  <th className="p-2 border-r border-slate-300 text-left">Nama Barang / Ruang</th>
                  <th className="p-2 border-r border-slate-300 text-left">Merk / Spesifikasi</th>
                  <th className="p-2 border-r border-slate-300 text-center">Jml</th>
                  <th className="p-2 border-r border-slate-300 text-center" colSpan={3}>Kondisi (B/RR/RB)</th>
                  <th className="p-2 text-left">Keterangan</th>
                </tr>
                <tr className="bg-slate-50 text-[9px] border-b border-slate-300 text-center">
                  <th className="p-1 border-r border-slate-300" colSpan={5}></th>
                  <th className="p-1 border-r border-slate-300 w-8 text-emerald-700">B</th>
                  <th className="p-1 border-r border-slate-300 w-8 text-amber-700">RR</th>
                  <th className="p-1 border-r border-slate-300 w-8 text-rose-700">RB</th>
                  <th className="p-1"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {roomAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-6 text-slate-400">
                      Belum ada aset yang tercatat di ruangan ini.
                    </td>
                  </tr>
                ) : (
                  roomAssets.map((asset, idx) => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-mono font-medium">{asset.nomorInventarisResmi || asset.kode}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold">{asset.namaBarangRuang}</td>
                      <td className="p-2 border-r border-slate-200 text-slate-600">{asset.merkModel || '-'}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">{asset.jumlah} {asset.satuan}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-semibold text-emerald-700">{asset.kondisiBaik}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-semibold text-amber-700">{asset.kondisiRusakRingan}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-semibold text-rose-700">{asset.kondisiRusakBerat}</td>
                      <td className="p-2 text-slate-600">{asset.keterangan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-8 text-xs pt-8">
              <div className="text-center space-y-16">
                <p>Mengetahui,<br />Kepala SMP Islam Al Qomar</p>
                <div>
                  <p className="font-bold underline uppercase">Bustanul Arifin, S.Pd</p>
                  <p className="text-[10px] text-slate-500">NIP / NPY: 198204122010011005</p>
                </div>
              </div>

              <div className="text-center space-y-16">
                <p>Banyuwangi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />Penanggung Jawab Ruangan</p>
                <div>
                  <p className="font-bold underline uppercase">{roomPIC}</p>
                  <p className="text-[10px] text-slate-500">Petugas Sarana & Prasarana</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. STIKER LABEL INVENTARIS ASET (QR / BARCODE SHEET) */}
      {activeReport === 'STIKER' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs text-slate-300">
            <div>
              <p className="font-bold text-white">Lembar Stiker Label Inventaris Siap Cetak</p>
              <p className="text-slate-400">
                Tempelkan label ini pada fisik barang/peralatan. Ukuran standar stiker inventaris sekolah.
              </p>
            </div>
            <span className="font-mono bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-xl border border-emerald-400/30">
              {sarpras.length} Label Aset
            </span>
          </div>

          {/* Printable Sticker Grid */}
          <div className="p-6 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 print:m-0 print:p-0 print:border-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sarpras.map(item => (
                <div
                  key={item.id}
                  className="p-3.5 border-2 border-slate-800 rounded-xl bg-white flex flex-col justify-between space-y-2 shadow-sm relative overflow-hidden"
                >
                  {/* Watermark Tag */}
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-[9px]">
                        IQ
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-800">
                        SMP ISLAM AL QOMAR
                      </span>
                    </div>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                      ASET RESMI
                    </span>
                  </div>

                  {/* Asset Details */}
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1" title={item.namaBarangRuang}>
                      {item.namaBarangRuang}
                    </h4>
                    <p className="text-[10px] text-slate-600 line-clamp-1">
                      {item.merkModel || item.kategori}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-1">
                      Lokasi: <strong>{item.lokasi}</strong>
                    </p>
                  </div>

                  {/* Barcode / Code Token Bottom */}
                  <div className="pt-2 border-t border-dashed border-slate-300 flex items-center justify-between">
                    <div>
                      <p className="text-[7px] text-slate-500 uppercase tracking-wider">No. Inventaris</p>
                      <p className="font-mono font-bold text-[10px] text-emerald-800 tracking-tight">
                        {item.nomorInventarisResmi || item.kode}
                      </p>
                    </div>

                    {/* Simulated Clean Vector Barcode */}
                    <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded border border-slate-200">
                      <div className="w-0.5 h-6 bg-slate-900" />
                      <div className="w-1 h-6 bg-slate-900" />
                      <div className="w-0.5 h-6 bg-slate-900" />
                      <div className="w-1.5 h-6 bg-slate-900" />
                      <div className="w-0.5 h-6 bg-slate-900" />
                      <div className="w-1 h-6 bg-slate-900" />
                      <div className="w-0.5 h-6 bg-slate-900" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. REKAPITULASI NILAI & DEPRESIASI */}
      {activeReport === 'REKAP_NILAI' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 space-y-6 print:m-0 print:p-0 print:border-none">
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider">
              {schoolInfo?.nama || 'SMP ISLAM AL QOMAR'}
            </h2>
            <p className="text-xs text-slate-600">
              LAPORAN REKAPITULASI VALUASI ASET & DEPRESIASI AKUNTANSI
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              Per Tanggal: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Table */}
          <table className="w-full text-xs border border-slate-300">
            <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-300">
              <tr>
                <th className="p-2.5 border-r border-slate-300 text-center w-10">No</th>
                <th className="p-2.5 border-r border-slate-300 text-left">Kategori Sarana & Prasarana</th>
                <th className="p-2.5 border-r border-slate-300 text-center">Item</th>
                <th className="p-2.5 border-r border-slate-300 text-center">Total Unit</th>
                <th className="p-2.5 border-r border-slate-300 text-right">Nilai Perolehan Historis</th>
                <th className="p-2.5 border-r border-slate-300 text-right">Akumulasi Depresiasi</th>
                <th className="p-2.5 text-right font-bold">Nilai Buku Terkini (NBV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recapByCategory.map((row, idx) => (
                <tr key={row.kategori} className="hover:bg-slate-50">
                  <td className="p-2.5 border-r border-slate-200 text-center">{idx + 1}</td>
                  <td className="p-2.5 border-r border-slate-200 font-bold">{row.kategori}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-mono">{row.itemCount}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-mono">{row.totalUnit}</td>
                  <td className="p-2.5 border-r border-slate-200 text-right font-mono">{formatRupiah(row.totalPerolehan)}</td>
                  <td className="p-2.5 border-r border-slate-200 text-right font-mono text-rose-700">-{formatRupiah(row.totalAkumulasiDep)}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-800">{formatRupiah(row.totalNilaiBuku)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-xs border-t-2 border-slate-400">
              <tr>
                <td colSpan={4} className="p-3 text-center uppercase">Total Seluruh Aset Sekolah</td>
                <td className="p-3 text-right font-mono">{formatRupiah(grandTotalPerolehan)}</td>
                <td className="p-3 text-right font-mono text-rose-700">-{formatRupiah(grandTotalDepresiasi)}</td>
                <td className="p-3 text-right font-mono font-black text-emerald-800 text-sm">{formatRupiah(grandTotalNilaiBuku)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Signature Block */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-8">
            <div className="text-center space-y-16">
              <p>Mengetahui,<br />Kepala SMP Islam Al Qomar</p>
              <div>
                <p className="font-bold underline uppercase">Bustanul Arifin, S.Pd</p>
                <p className="text-[10px] text-slate-500">NIP / NPY: 198204122010011005</p>
              </div>
            </div>

            <div className="text-center space-y-16">
              <p>Banyuwangi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />Wakil Kepala Urusan Sarpras</p>
              <div>
                <p className="font-bold underline uppercase">Amjad Dzulfikar Mahbubie, S.Pd</p>
                <p className="text-[10px] text-slate-500">Staf Pengelola Inventaris & Aset</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
