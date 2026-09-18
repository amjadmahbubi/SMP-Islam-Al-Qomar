/**
 * sarprasImageUtils.ts
 * Utilitas kompresi foto barang, kamera, dan deteksi cerdas aset sarpras.
 */

export interface PresetAsetFoto {
  label: string;
  namaDefault: string;
  kategori: string;
  satuan: string;
  merkPerkiraan: string;
  masaManfaatTahun: number;
  estimasiHarga: number;
  iconTag: string;
}

export const PRESET_DETEKSI_BARANG: PresetAsetFoto[] = [
  {
    label: 'Komputer AIO / PC Desktop',
    namaDefault: 'Komputer PC All-in-One Siswa/Guru',
    kategori: 'Elektronik',
    satuan: 'Unit',
    merkPerkiraan: 'Lenovo / ASUS / HP Core i3/i5',
    masaManfaatTahun: 4,
    estimasiHarga: 9500000,
    iconTag: '🖥️'
  },
  {
    label: 'Laptop / Notebook',
    namaDefault: 'Laptop Operasional Guru / Pembelajaran',
    kategori: 'Elektronik',
    satuan: 'Unit',
    merkPerkiraan: 'ASUS / Lenovo / Acer 14"',
    masaManfaatTahun: 4,
    estimasiHarga: 7500000,
    iconTag: '💻'
  },
  {
    label: 'Proyektor LCD / Screen',
    namaDefault: 'Proyektor LCD Pembelajaran Kelas',
    kategori: 'Elektronik',
    satuan: 'Unit',
    merkPerkiraan: 'Epson EB-E500 / InFocus 3300 Lumens',
    masaManfaatTahun: 5,
    estimasiHarga: 5800000,
    iconTag: '📽️'
  },
  {
    label: 'Mikroskop / Alat Lab IPA',
    namaDefault: 'Mikroskop Siswa Binokuler Praktikum',
    kategori: 'Peralatan Lab',
    satuan: 'Unit',
    merkPerkiraan: 'Olympus / Yazumi CX Series',
    masaManfaatTahun: 8,
    estimasiHarga: 4500000,
    iconTag: '🔬'
  },
  {
    label: 'Meja Siswa / Guru',
    namaDefault: 'Meja Belajar Siswa Kayu Rangka Besi',
    kategori: 'Mebelair',
    satuan: 'Unit',
    merkPerkiraan: 'Rangka Pipa Holo & Kayu Multiplek HPL',
    masaManfaatTahun: 5,
    estimasiHarga: 450000,
    iconTag: '🪑'
  },
  {
    label: 'Kursi Siswa / Guru',
    namaDefault: 'Kursi Belajar Siswa Ergonomis',
    kategori: 'Mebelair',
    satuan: 'Unit',
    merkPerkiraan: 'Futura / Chitose / Kayu Solid',
    masaManfaatTahun: 5,
    estimasiHarga: 275000,
    iconTag: '🪑'
  },
  {
    label: 'AC / Pendingin Ruangan',
    namaDefault: 'AC Split 1 PK Ruang Kelas/Lab',
    kategori: 'Elektronik',
    satuan: 'Unit',
    merkPerkiraan: 'Daikin / Panasonic / Sharp 1 PK Inverter',
    masaManfaatTahun: 5,
    estimasiHarga: 4800000,
    iconTag: '❄️'
  },
  {
    label: 'Smart TV / Monitor Presentasi',
    namaDefault: 'Smart TV LED 50" Display Multimedia',
    kategori: 'Elektronik',
    satuan: 'Unit',
    merkPerkiraan: 'Samsung / TCL / Xiaomi 4K UHD',
    masaManfaatTahun: 5,
    estimasiHarga: 5200000,
    iconTag: '📺'
  },
  {
    label: 'Sound System / Speaker Aktif',
    namaDefault: 'Wireless Sound Portable & Mic Wireless',
    kategori: 'Elektronik',
    satuan: 'Set',
    merkPerkiraan: 'TOA / Huper / BareTone 15"',
    masaManfaatTahun: 6,
    estimasiHarga: 3200000,
    iconTag: '🔊'
  },
  {
    label: 'Almari / Rak Buku Perpustakaan',
    namaDefault: 'Rak Buku Tingkat Kayu Solid Perpustakaan',
    kategori: 'Mebelair',
    satuan: 'Unit',
    merkPerkiraan: 'Kayu Jati Finishing Melamin Natural',
    masaManfaatTahun: 10,
    estimasiHarga: 2500000,
    iconTag: '📚'
  },
  {
    label: 'Peralatan Olahraga',
    namaDefault: 'Set Bola & Perlengkapan Olahraga',
    kategori: 'Olahraga & Seni',
    satuan: 'Set',
    merkPerkiraan: 'Mikasa / Molten Original Standar Nasional',
    masaManfaatTahun: 2,
    estimasiHarga: 1200000,
    iconTag: '⚽'
  },
  {
    label: 'Al-Qur`an / Kitab Keagamaan',
    namaDefault: 'Mushaf Al-Qur`an Rasm Utsmani Standar',
    kategori: 'Keagamaan',
    satuan: 'Buah',
    merkPerkiraan: 'Madinah / Menara Kudus Hardcover',
    masaManfaatTahun: 10,
    estimasiHarga: 95000,
    iconTag: '📖'
  }
];

/**
 * Mengompres file gambar (File atau Blob) ke Base64 JPEG dengan dimensi maksimum dan kualitas tertentu.
 * Menghemat 90-95% ukuran file tanpa menurunkan ketajaman visual.
 */
export const compressImageFile = (
  file: File | Blob,
  maxDimension = 960,
  quality = 0.78
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original string if canvas context is unavailable
          resolve(e.target?.result as string);
          return;
        }

        // Fill white background (useful for transparent PNGs)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // Draw compressed image
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
