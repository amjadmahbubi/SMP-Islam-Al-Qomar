import React, { useState } from 'react';
import { SarprasItem } from '../../../types';
import { calculateDepresiasi, formatRupiah, KATEGORI_OPTIONS } from './sarprasUtils';
import {
  TrendingDown,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator
} from 'lucide-react';

interface SarprasDepresiasiTabProps {
  sarpras: SarprasItem[];
}

export const SarprasDepresiasiTab: React.FC<SarprasDepresiasiTabProps> = ({ sarpras }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [statusMasaFilter, setStatusMasaFilter] = useState<'Semua' | 'Aktif' | 'Habis'>('Semua');

  // Interactive Simulation Drawer / State
  const [showSimulasi, setShowSimulasi] = useState(false);
  const [simHarga, setSimHarga] = useState(15000000);
  const [simMasaTahun, setSimMasaTahun] = useState(5);
  const [simResidu, setSimResidu] = useState(1500000);

  // Compute depreciation for all assets
  const assetDepList = sarpras.map(item => {
    const dep = calculateDepresiasi(item);
    return {
      item,
      ...dep
    };
  });

  // Aggregates
  const totalPerolehan = assetDepList.reduce((acc, curr) => acc + (curr.hargaPerolehan * (Number(curr.item.jumlah) || 1)), 0);
  const totalAkumulasiDepresiasi = assetDepList.reduce((acc, curr) => acc + (curr.akumulasiDepresiasi * (Number(curr.item.jumlah) || 1)), 0);
  const totalNilaiBuku = assetDepList.reduce((acc, curr) => acc + (curr.nilaiBukuSaatIni * (Number(curr.item.jumlah) || 1)), 0);
  const expiredCount = assetDepList.filter(d => d.isExpired && d.hargaPerolehan > 0).length;

  const overallDepPercent = totalPerolehan > 0
    ? Math.min(100, +((totalAkumulasiDepresiasi / totalPerolehan) * 100).toFixed(1))
    : 0;

  // Filter list
  const filteredList = assetDepList.filter(({ item, isExpired }) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      item.namaBarangRuang.toLowerCase().includes(q) ||
      (item.nomorInventarisResmi && item.nomorInventarisResmi.toLowerCase().includes(q)) ||
      (item.kode && item.kode.toLowerCase().includes(q));

    const matchCat = kategoriFilter === 'Semua' || item.kategori === kategoriFilter;
    const matchStatus =
      statusMasaFilter === 'Semua' ||
      (statusMasaFilter === 'Aktif' && !isExpired) ||
      (statusMasaFilter === 'Habis' && isExpired);

    return matchSearch && matchCat && matchStatus;
  });

  // Export CSV Kertas Kerja
  const handleExportDepresiasiCSV = () => {
    const headers = [
      'No Inventaris Resmi',
      'Nama Barang',
      'Kategori',
      'Tgl Pengadaan',
      'Jumlah',
      'Harga Perolehan Satuan (Rp)',
      'Total Perolehan (Rp)',
      'Masa Manfaat (Thn)',
      'Tahun Berlalu',
      'Bulan Berlalu',
      'Penyusutan per Tahun (Rp)',
      'Penyusutan per Bulan (Rp)',
      'Akumulasi Depresiasi (Rp)',
      'Nilai Buku Terkini Satuan (Rp)',
      'Total Nilai Buku (Rp)',
      '% Terdepresiasi',
      'Status Masa Manfaat'
    ];

    const rows = filteredList.map(({ item, ...dep }) => {
      const qty = Number(item.jumlah) || 1;
      return [
        `"${item.nomorInventarisResmi || item.kode}"`,
        `"${item.namaBarangRuang}"`,
        `"${item.kategori}"`,
        `"${item.tanggalPengadaan || ''}"`,
        qty,
        dep.hargaPerolehan,
        dep.hargaPerolehan * qty,
        dep.masaManfaatTahun,
        dep.tahunBerlalu,
        dep.bulanBerlalu,
        dep.penyusutanPerTahun,
        dep.penyusutanPerBulan,
        dep.akumulasiDepresiasi * qty,
        dep.nilaiBukuSaatIni,
        dep.nilaiBukuSaatIni * qty,
        `${dep.persentaseDepresiasi}%`,
        dep.isExpired ? '"Habis Masa Manfaat"' : '"Masih Masa Manfaat"'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kertas_Kerja_Depresiasi_Aset_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Nilai Perolehan Historis</span>
            <DollarSign className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-white font-mono truncate" title={formatRupiah(totalPerolehan)}>
            {formatRupiah(totalPerolehan)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Biaya awal pengadaan seluruh aset
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Akumulasi Penyusutan</span>
            <TrendingDown className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-bold text-rose-400 font-mono truncate" title={formatRupiah(totalAkumulasiDepresiasi)}>
            -{formatRupiah(totalAkumulasiDepresiasi)}
          </p>
          <p className="text-[11px] text-rose-400/90 mt-1">
            {overallDepPercent}% telah tersusutkan
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 shadow-lg bg-gradient-to-b from-emerald-950/20 to-slate-900/80">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
            <span className="font-semibold">Nilai Buku Terkini (NBV)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-300 font-mono truncate" title={formatRupiah(totalNilaiBuku)}>
            {formatRupiah(totalNilaiBuku)}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-1">
            Valuasi aset riil per hari ini
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Habis Masa Manfaat</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-300 font-mono">
            {expiredCount} <span className="text-xs text-slate-400 font-normal">aset</span>
          </p>
          <p className="text-[11px] text-amber-400/90 mt-1">
            Perlu evaluasi peremajaan / replacement
          </p>
        </div>
      </div>

      {/* Depreciation Method Info & Simulation Toggle */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-white">Metode Penyusutan: Garis Lurus (Straight-Line Method)</p>
            <p className="text-slate-400 text-[11px]">
              Rumus: (Harga Perolehan - Nilai Residu) / Masa Manfaat. Depresiasi dihitung otomatis per bulan berlalu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSimulasi(!showSimulasi)}
            className="px-3 py-1.5 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            {showSimulasi ? 'Tutup Kalkulator' : 'Kalkulator Simulasi'}
          </button>
          <button
            onClick={handleExportDepresiasiCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Kertas Kerja</span>
          </button>
        </div>
      </div>

      {/* Interactive Simulation Calculator Box */}
      {showSimulasi && (
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 shadow-2xl space-y-4">
          <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Simulasi Penyusutan Calon Aset Baru
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Rencana Harga Pengadaan (Rp):</label>
              <input
                type="number"
                min="0"
                step="500000"
                value={simHarga}
                onChange={e => setSimHarga(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Estimasi Masa Manfaat (Tahun):</label>
              <input
                type="number"
                min="1"
                max="50"
                value={simMasaTahun}
                onChange={e => setSimMasaTahun(Number(e.target.value) || 1)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Estimasi Nilai Residu / Akhir (Rp):</label>
              <input
                type="number"
                min="0"
                step="100000"
                value={simResidu}
                onChange={e => setSimResidu(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          {/* Simulation Output */}
          {(() => {
            const dasarPenyusutan = Math.max(0, simHarga - simResidu);
            const perTahun = +(dasarPenyusutan / Math.max(1, simMasaTahun)).toFixed(0);
            const perBulan = +(perTahun / 12).toFixed(0);
            return (
              <div className="p-3 rounded-xl bg-slate-900 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Beban Susut / Tahun</span>
                  <span className="font-mono font-bold text-white">{formatRupiah(perTahun)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Beban Susut / Bulan</span>
                  <span className="font-mono font-bold text-sky-400">{formatRupiah(perBulan)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Terdepresiasi</span>
                  <span className="font-mono font-bold text-amber-400">{formatRupiah(dasarPenyusutan)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nilai Akhir / Residu</span>
                  <span className="font-mono font-bold text-emerald-400">{formatRupiah(simResidu)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aset di kertas kerja depresiasi..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950/60 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={kategoriFilter}
              onChange={e => setKategoriFilter(e.target.value)}
              className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="Semua">Semua Kategori</option>
              {KATEGORI_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={statusMasaFilter}
              onChange={e => setStatusMasaFilter(e.target.value as any)}
              className="bg-slate-950/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="Semua">Semua Masa Manfaat</option>
              <option value="Aktif">Masih Aktif Menyusut</option>
              <option value="Habis">Habis Masa Manfaat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Depreciation Table */}
      <div className="overflow-x-auto rounded-2xl bg-slate-900/90 border border-white/10 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
            <tr>
              <th className="py-3 px-3">No. Inventaris</th>
              <th className="py-3 px-3">Nama Barang</th>
              <th className="py-3 px-3 text-center">Tgl Pengadaan & Usia</th>
              <th className="py-3 px-3 text-right">Harga Perolehan</th>
              <th className="py-3 px-3 text-right">Susut / Tahun</th>
              <th className="py-3 px-3 text-right">Akumulasi Susut</th>
              <th className="py-3 px-3 text-right">Nilai Buku Terkini</th>
              <th className="py-3 px-3 text-center">% Susut</th>
              <th className="py-3 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-slate-400">
                  Tidak ada aset yang sesuai kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredList.map(({ item, ...dep }) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3 font-mono text-emerald-300 font-medium">
                    {item.nomorInventarisResmi || item.kode}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-white truncate max-w-[200px]" title={item.namaBarangRuang}>
                      {item.namaBarangRuang}
                    </p>
                    <p className="text-[11px] text-slate-400">{item.kategori}</p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <p className="text-slate-300">{item.tanggalPengadaan || '-'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {dep.tahunBerlalu} thn ({dep.bulanBerlalu} bln)
                    </p>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-200">
                    {formatRupiah(dep.hargaPerolehan)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">
                    {formatRupiah(dep.penyusutanPerTahun)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-rose-400 font-medium">
                    {formatRupiah(dep.akumulasiDepresiasi)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-300 font-bold">
                    {formatRupiah(dep.nilaiBukuSaatIni)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <div className="w-16 mx-auto">
                      <div className="text-[10px] font-mono text-slate-300 mb-0.5">
                        {dep.persentaseDepresiasi}%
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            dep.persentaseDepresiasi > 80
                              ? 'bg-rose-500'
                              : dep.persentaseDepresiasi > 50
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{ width: `${dep.persentaseDepresiasi}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    {dep.isExpired ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                        Habis Masa
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Aktif ({dep.sisaBulanManfaat} bln)
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
