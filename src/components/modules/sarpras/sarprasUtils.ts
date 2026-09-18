import { SarprasItem } from '../../../types';

export const KATEGORI_OPTIONS = [
  'Ruang / Gedung',
  'Peralatan Lab',
  'Elektronik',
  'Mebelair',
  'Olahraga & Seni',
  'Keagamaan',
  'Kendaraan',
  'Lainnya'
];

export const SUMBER_DANA_OPTIONS = [
  'BOS Reguler',
  'BOS Kinerja',
  'Yayasan Al Qomar',
  'Komite / Infaq',
  'Hibah / Donatur',
  'Swadana Sekolah',
  'Lainnya'
];

export const SATUAN_OPTIONS = [
  'Unit',
  'Ruang',
  'Set',
  'Buah',
  'Pack',
  'Pcs',
  'Lusin',
  'Kardus / Dus',
  'Lembar',
  'Meter',
  'Area',
  'Bangunan'
];

export const LOKASI_PRESETS = [
  'Lantai 1 Gedung Utama',
  'Lantai 2 Gedung Utama',
  'Lantai 1 Gedung B',
  'Lantai 2 Gedung B',
  'Lab Komputer',
  'Laboratorium IPA Terpadu',
  'Perpustakaan Al-Hikmah',
  'Masjid Al Qomar',
  'Ruang Guru & Tata Usaha',
  'Ruang Kepala Sekolah',
  'Ruang Bimbingan Konseling (BK)',
  'Ruang UKS',
  'Ruang OSIS / Ekstrakurikuler',
  'Halaman Utama',
  'Gudang Sarpras'
];

export const formatRupiah = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return 'Rp 0';
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
};

export const getPrefixByKategori = (kategori: string): string => {
  if (kategori === 'Ruang / Gedung') return 'R';
  if (kategori === 'Keagamaan') return 'AG';
  if (kategori === 'Peralatan Lab') return 'LAB';
  if (kategori === 'Elektronik') return 'EL';
  if (kategori === 'Mebelair') return 'MB';
  if (kategori === 'Olahraga & Seni') return 'OR';
  if (kategori === 'Kendaraan') return 'KD';
  return 'SRP';
};

/**
 * Generator nomor inventaris resmi terstandar:
 * Format: SMP-IQ/INV/[KATEGORI]/[TAHUN]/[NOMOR_URUT]
 * Contoh: SMP-IQ/INV/EL/2024/001
 */
export const generateNomorInventaris = (
  kategori: string,
  tanggalOrTahun: string | number,
  existingList: SarprasItem[],
  prefixSchool: string = 'SMP-IQ'
): string => {
  const catCode = getPrefixByKategori(kategori);
  let year = new Date().getFullYear();
  if (typeof tanggalOrTahun === 'number') {
    year = tanggalOrTahun;
  } else if (typeof tanggalOrTahun === 'string' && tanggalOrTahun.trim()) {
    const parsed = new Date(tanggalOrTahun).getFullYear();
    if (!isNaN(parsed) && parsed > 1900) {
      year = parsed;
    }
  }

  // Cari nomor urut terbesar untuk kategori & tahun ini
  let maxSeq = 0;
  const searchPattern = `${prefixSchool}/INV/${catCode}/${year}/`;
  const legacyPattern = `${catCode}-`;

  existingList.forEach(item => {
    if (item.nomorInventarisResmi && item.nomorInventarisResmi.includes(searchPattern)) {
      const parts = item.nomorInventarisResmi.split('/');
      const last = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(last) && last > maxSeq) maxSeq = last;
    } else if (item.kode && item.kode.toUpperCase().startsWith(legacyPattern)) {
      const parts = item.kode.split('-');
      if (parts.length >= 2) {
        const num = parseInt(parts[1], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefixSchool}/INV/${catCode}/${year}/${nextSeq}`;
};

export interface DepresiasiCalculation {
  hargaPerolehan: number;
  nilaiResidu: number;
  masaManfaatTahun: number;
  bulanBerlalu: number;
  tahunBerlalu: number;
  penyusutanPerTahun: number;
  penyusutanPerBulan: number;
  akumulasiDepresiasi: number;
  nilaiBukuSaatIni: number;
  persentaseDepresiasi: number;
  isExpired: boolean;
  sisaBulanManfaat: number;
}

/**
 * Kalkulasi Depresiasi Real-Time berbasis Metode Garis Lurus (Straight-Line Depreciation)
 */
export const calculateDepresiasi = (
  item: SarprasItem,
  asOfDate: Date = new Date()
): DepresiasiCalculation => {
  const hargaPerolehan = Number(item.hargaPerolehan) || 0;
  const nilaiResidu = Number(item.nilaiResidu) || 0;
  const masaManfaatTahun = Number(item.masaManfaatTahun) || (item.kategori === 'Ruang / Gedung' ? 20 : 5);
  const totalMasaBulan = Math.max(1, masaManfaatTahun * 12);

  // Jika harga perolehan 0, tidak ada depresiasi terhitung
  if (hargaPerolehan <= 0) {
    return {
      hargaPerolehan: 0,
      nilaiResidu: 0,
      masaManfaatTahun,
      bulanBerlalu: 0,
      tahunBerlalu: 0,
      penyusutanPerTahun: 0,
      penyusutanPerBulan: 0,
      akumulasiDepresiasi: 0,
      nilaiBukuSaatIni: 0,
      persentaseDepresiasi: 0,
      isExpired: false,
      sisaBulanManfaat: totalMasaBulan
    };
  }

  // Tentukan tanggal mulai pengadaan
  let startDate = new Date();
  if (item.tanggalPengadaan) {
    const parsed = new Date(item.tanggalPengadaan);
    if (!isNaN(parsed.getTime())) {
      startDate = parsed;
    }
  }

  // Hitung selisih bulan secara presisi
  const diffYears = asOfDate.getFullYear() - startDate.getFullYear();
  const diffMonths = asOfDate.getMonth() - startDate.getMonth();
  const rawMonths = diffYears * 12 + diffMonths + (asOfDate.getDate() >= startDate.getDate() ? 0 : -1);
  const bulanBerlalu = Math.max(0, rawMonths);
  const tahunBerlalu = +(bulanBerlalu / 12).toFixed(1);

  // Nilai yang dapat disusutkan (Depreciable Base)
  const dasarPenyusutan = Math.max(0, hargaPerolehan - nilaiResidu);
  const penyusutanPerTahun = +(dasarPenyusutan / masaManfaatTahun).toFixed(0);
  const penyusutanPerBulan = +(dasarPenyusutan / totalMasaBulan).toFixed(0);

  // Akumulasi penyusutan dibatasi maksimal dasar penyusutan
  const akumulasiDepresiasi = Math.min(dasarPenyusutan, bulanBerlalu * penyusutanPerBulan);
  const nilaiBukuSaatIni = Math.max(nilaiResidu, hargaPerolehan - akumulasiDepresiasi);

  const persentaseDepresiasi = dasarPenyusutan > 0
    ? Math.min(100, +((akumulasiDepresiasi / dasarPenyusutan) * 100).toFixed(1))
    : 100;

  const isExpired = bulanBerlalu >= totalMasaBulan;
  const sisaBulanManfaat = Math.max(0, totalMasaBulan - bulanBerlalu);

  return {
    hargaPerolehan,
    nilaiResidu,
    masaManfaatTahun,
    bulanBerlalu,
    tahunBerlalu,
    penyusutanPerTahun,
    penyusutanPerBulan,
    akumulasiDepresiasi,
    nilaiBukuSaatIni,
    persentaseDepresiasi,
    isExpired,
    sisaBulanManfaat
  };
};
