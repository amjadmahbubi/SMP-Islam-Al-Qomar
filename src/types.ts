export type Role = 'public' | 'guru' | 'admin';

export interface UserSession {
  role: Role;
  name: string;
  email?: string;
  teacherId?: string; // If logged in as specific teacher
}

export interface SchoolInfo {
  nama: string;
  npsn: string;
  akreditasi: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  kepalaSekolah: string;
  nigyKepalaSekolah?: string;
  nipKepalaSekolah?: string; // Legacy compatibility
  visi: string;
  misi: string[];
  tahunAjaran: string;
  semesterAktif?: 'Ganjil' | 'Genap';
  logoUrl?: string;
  kopSuratUrl?: string; // Gambar Banner Kop Surat Resmi Sekolah (sesuai arsip dokumen fisik)
  isLogoLocked?: boolean; // Proteksi permanen logo & kop surat lintas perangkat
}

export interface Teacher {
  id: string;
  nuptk: string;
  nama: string;
  nigy?: string;
  nip?: string; // Legacy compatibility
  gender: 'L' | 'P';
  mapelUtama: string;
  mapelTambahan?: string[]; // Mata pelajaran kedua / tambahan yang diampu
  jabatan: string; // e.g. 'Wali Kelas 7A', 'Guru Mata Pelajaran', 'Waka Kurikulum'
  email: string;
  telepon: string;
  statusPegawai: 'PNS' | 'GTY' | 'GTT' | 'Honor';
  waliKelasDi?: string; // e.g. '7A'
  password?: string;
}

export interface StudentEkskul {
  id?: string;
  nama: string; // e.g. 'Pramuka', 'Seni Hadrah / Banjari', 'PMR', 'Kaligrafi Islam', 'Futsal'
  predikat: string; // 'A (Sangat Baik)' | 'B (Baik)' | 'C (Cukup)' | string
  keterangan: string; // e.g. 'Aktif, disiplin, dan terampil dalam kepramukaan'
}

export interface StudentDiniyahReport {
  tahfidz: string; // e.g. 'Hafal Juz 30 (Lancar & Mutqin)'
  adab: string; // e.g. 'Istiqomah, Santun & Disiplin'
  shalat: string; // e.g. 'Rutin Shalat Dhuha & Dzuhur Berjamaah'
  kokurikuler?: string; // Capaian P5 (Projek Penguatan Profil Pelajar Pancasila) & Diniyah Islamiyyah
  catatanWaliKelas?: string; // Catatan motivasi / perkembangan wali kelas
  tanggapanOrtu?: string; // Catatan/tanggapan orang tua/wali murid
  ekskul?: StudentEkskul[];
}

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  gender: 'L' | 'P';
  kelas: string; // '7A', '7B', '8A', '8B', '9A', '9B'
  tempatLahir: string;
  tanggalLahir: string;
  namaOrangTua: string;
  noHpOrangTua: string;
  alamat: string;
  status: 'Aktif' | 'Lulus' | 'Pindah';
  namaAyah?: string;
  statusAyah?: 'Masih Hidup' | 'Meninggal';
  namaIbu?: string;
  statusIbu?: 'Masih Hidup' | 'Meninggal';
  tahunLulus?: string;
  tanggalLulus?: string;
  nomorIjazah?: string;
  nomorSkl?: string;
  sekolahLanjutan?: string;
  keteranganLulus?: string;
  diniyahReport?: StudentDiniyahReport;
}

export interface SarprasGedung {
  id: string;
  kodeGedung: string; // e.g., 'GD-UTM', 'GD-B'
  namaGedung: string; // e.g., 'Gedung Utama (Abu Bakar Ash-Shiddiq)'
  jumlahLantai: number;
  tahunDibangun?: number | string;
  luasBangunanM2?: number;
  kondisi: 'Sangat Baik' | 'Baik' | 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat';
  penanggungJawab?: string;
  fotoGedung?: string;
  keterangan?: string;
}

export interface SarprasRuang {
  id: string;
  kodeRuang: string; // e.g., 'R-7', 'R-LAB-KOMP', 'R-PERPUS'
  namaRuang: string; // e.g., 'Ruang Kelas 7 (Multimedia)', 'Laboratorium Komputer'
  gedungId: string;  // Relation to SarprasGedung
  namaGedung?: string; // Denormalized building name
  lantai: number;
  jenisRuang: 'Ruang Kelas / Teori' | 'Laboratorium / Praktik' | 'Perpustakaan' | 'Ruang Guru & TU' | 'Ruang Pimpinan' | 'Tempat Ibadah / Musholla' | 'Ruang UKS' | 'Gudang / Servis' | 'Lapangan / Terbuka' | 'Sanitasi / Toilet' | 'Lainnya';
  panjangMeter?: number;
  lebarMeter?: number;
  luasM2?: number;
  kapasitasOrang?: number;
  penanggungJawabRuang?: string;
  kondisiRuang: 'Baik' | 'Rusak Ringan' | 'Rusak Sedang' | 'Rusak Berat';
  keterangan?: string;
  fotoRuang?: string;
}

export interface SarprasItem {
  id: string;
  kode: string;
  namaBarangRuang: string;
  kategori: 'Ruang / Gedung' | 'Peralatan Lab' | 'Elektronik' | 'Mebelair' | 'Olahraga & Seni' | 'Keagamaan' | 'Kendaraan' | 'Lainnya' | string;
  jumlah: number;
  satuan: string;
  kondisiBaik: number;
  kondisiRusakRingan: number;
  kondisiRusakBerat: number;
  lokasi: string;
  keterangan?: string;
  
  // Extended Fields for Integrated Asset Management:
  nomorInventarisResmi?: string; // Standard code, e.g., SMP-IQ/INV/EL/2024/004
  merkModel?: string;            // Merk/Brand, Model, Serial Number/Spesifikasi
  sumberDana?: 'BOS Reguler' | 'BOS Kinerja' | 'Yayasan Al Qomar' | 'Komite / Infaq' | 'Hibah / Donatur' | 'Lainnya' | string;
  tanggalPengadaan?: string;     // Format YYYY-MM-DD
  hargaPerolehan?: number;       // Harga beli per unit (Rp)
  masaManfaatTahun?: number;     // Masa ekonomis (Tahun)
  nilaiResidu?: number;          // Estimasi nilai sisa (Rp)
  penanggungJawab?: string;      // Nama Guru / Pengelola Ruang / Tendik
  statusAset?: 'Aktif Digunakan' | 'Dalam Perawatan' | 'Dipinjam' | 'Rusak Total' | 'Dihapuskan / Mutasi Keluar';
  qrBarcodeToken?: string;
  fotoBarang?: string;           // Base64 data URL or image path for item photo
  gedungId?: string;             // Optional link to Master Gedung
  ruangId?: string;              // Optional link to Master Ruang
}

export interface SarprasMutasi {
  id: string;
  sarprasId: string;
  kodeBarang: string;
  namaBarang: string;
  tanggalMutasi: string;
  lokasiAsal: string;
  lokasiTujuan: string;
  penanggungJawabAsal: string;
  penanggungJawabTujuan: string;
  jenisMutasi: 'Pindah Lokasi' | 'Ganti Penanggung Jawab' | 'Alih Fungsi' | 'Penghapusan Aset' | 'Peminjaman Internal';
  nomorBast?: string; // Berita Acara Serah Terima
  alasan: string;
  dicatatOleh: string;
  status: 'Selesai' | 'Menunggu Konfirmasi';
}

export interface SarprasPerawatan {
  id: string;
  sarprasId: string;
  kodeBarang: string;
  namaBarang: string;
  tanggalPengajuan: string;
  tanggalSelesai?: string;
  jenisPerawatan: 'Pemeliharaan Rutin' | 'Perbaikan Ringan' | 'Perbaikan Berat' | 'Penggantian Komponen';
  deskripsiKerusakan: string;
  tindakan?: string;
  biaya: number;
  sumberBiaya: string;
  teknisiVendor: string;
  status: 'Menunggu Jadwal' | 'Sedang Dikerjakan' | 'Selesai' | 'Dibatalkan';
  pelapor: string;
  catatanPetugas?: string;
  fotoKerusakan?: string;
  fotoPerbaikan?: string;
}

export interface SarprasPerencanaan {
  id: string;
  tahunAnggaran: string;
  namaBarang: string;
  kategori: string;
  spesifikasi?: string;
  jumlah: number;
  satuan: string;
  estimasiHargaSatuan: number;
  estimasiTotal: number;
  sumberDanaUsulan: string;
  alasanKebutuhan: string;
  prioritas: 'Tinggi (Mendesak)' | 'Sedang (Prioritas)' | 'Rendah (Rencana)';
  targetBulan: string;
  status: 'Diajukan' | 'Disetujui' | 'Terealisasi' | 'Ditolak';
  pengusul: string;
  tanggalUsul: string;
  catatanPersetujuan?: string;
}

export interface SarprasAuditLog {
  id: string;
  timestamp: string;
  sarprasId?: string;
  kodeBarang?: string;
  namaBarang?: string;
  aksi: 'TAMBAH_ASET' | 'UBAH_ASET' | 'HAPUS_ASET' | 'MUTASI' | 'PERAWATAN' | 'PERENCANAAN' | 'STATUS_KONDISI' | 'MASTER_GEDUNG' | 'MASTER_RUANG';
  rincian: string;
  pelaku: string;
  role: string;
}

export interface TeacherDoc {
  id: string;
  teacherId: string;
  teacherName: string;
  jenisDokumen: 'Modul Ajar / RPP' | 'Program Tahunan (Prota)' | 'Program Semester (Promes)' | 'Silabus' | 'KKTP / KKM' | 'Bahan Ajar';
  mataPelajaran: string;
  kelas: string;
  tahunAjaran: string;
  judul: string;
  linkFile: string;
  tanggalUpload: string;
  status: 'Draft' | 'Menunggu Verifikasi' | 'Disetujui' | 'Revisi';
  catatanKepsek?: string;
}

export interface ScheduleItem {
  id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  kelas: string;
  jamKe: number;
  waktu: string; // e.g. '07:30 - 08:10'
  mapel: string;
  guruNama: string;
  ruang: string;
}

export interface CalendarEvent {
  id: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  kegiatan: string;
  kategori: 'KBM' | 'Ujian (PTS/PAS)' | 'Libur Sekolah' | 'Hari Besar Islam (PHBI)' | 'Kegiatan Ekstrakurikuler' | 'Pembagian Rapor' | 'Program & Ujian Metode Ummi / Tahfidz';
  deskripsi: string;
  semester: 'Ganjil' | 'Genap';
}

export interface AgendaItem {
  id: string;
  judul: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  penanggungJawab: string;
  kategori: 'Keagamaan' | 'Akademik' | 'Lomba / Prestasi' | 'Rapat Guru' | 'Parenting / Kemitraan' | 'Tahfidz & Metode Ummi' | 'Kesiswaan & Ekstrakurikuler';
  deskripsi: string;
  status: 'Akan Datang' | 'Berlangsung' | 'Selesai';
}

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  status: 'H' | 'I' | 'S' | 'A'; // Hadir, Izin, Sakit, Alpa
  keterangan?: string;
  catatan?: string;
}

export interface AttendanceRecord {
  id: string;
  tanggal: string;
  kelas: string;
  mapel: string;
  teacherId: string;
  teacherName: string;
  entries: AttendanceEntry[];
}

export interface GradeEntry {
  studentId: string;
  studentName: string;
  sumatifScores?: number[]; // Array of up to 10 Sumatif Lingkup Materi scores (TP 1 to TP 10)
  nilaiFormatif1: number;
  nilaiFormatif2: number;
  nilaiSumatifLM: number; // Average Sumatif Lingkup Materi
  nilaiPTS: number; // Penilaian Tengah Semester
  nilaiPAS: number; // Penilaian Akhir Semester / Year
  catatanKompetensi: string;
}

export interface SubjectGradeRecord {
  id: string;
  kelas: string;
  mapel: string;
  semester: 'Ganjil' | 'Genap';
  tahunAjaran: string;
  teacherId: string;
  teacherName: string;
  tpList?: string[]; // Up to 10 Tujuan Pembelajaran (TP) titles from Administrasi / Modul Ajar
  studentGrades: GradeEntry[];
  isLocked?: boolean;
  lockedBy?: string;
  lockedAt?: string;
  deadline?: string;
  lockReason?: string;
}

export interface GradeLockRecord {
  id: string; // Key e.g., "7A-Matematika-Ganjil"
  kelas: string;
  mapel: string;
  semester: 'Ganjil' | 'Genap';
  isLocked: boolean;
  lockedBy: string;
  lockedAt: string;
  deadline?: string;
  catatan?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: 'UPDATE_NILAI' | 'LOCK_DRAFT_NILAI' | 'UNLOCK_DRAFT_NILAI' | 'RESET_NILAI' | 'UPDATE_ADMINISTRASI' | 'SYNC_TAHUN_AJARAN' | 'PERUBAHAN_KEPALA_SEKOLAH' | 'UPDATE_PROFIL_SEKOLAH' | 'KELULUSAN_SISWA' | 'BATALKAN_KELULUSAN' | 'LAINNYA';
  module: string;
  kelas?: string;
  mapel?: string;
  semester?: string;
  details: string;
  previousDataSummary?: string;
  newDataSummary?: string;
}

export interface GoogleSheetsConfig {
  webAppUrl: string; // Apps Script Web App URL
  spreadsheetId: string;
  autoSync: boolean;
  autoSyncOnLoad?: boolean; // Automatic background synchronization on app load
  isLocked?: boolean;
  lastSyncedAt?: string;
  lastPulledAt?: string;
}

export interface StudentAchievement {
  id: string;
  studentId?: string;
  studentName: string;
  kelas: string;
  judulPrestasi: string;
  kategori: "Tahfidz & Al-Qur'an" | 'Akademik' | 'Seni & Kaligrafi' | 'Olahraga' | 'Sains & Teknologi' | 'Bahasa & Pidato';
  tingkat: 'Kecamatan' | 'Kota / Kabupaten' | 'Provinsi' | 'Nasional' | 'Internasional';
  tahun: string;
  penyelenggara: string;
  pembimbing?: string;
  medali: 'Juara 1' | 'Juara 2' | 'Juara 3' | 'Emas' | 'Perak' | 'Perunggu' | 'Harapan 1' | 'Harapan 2';
  deskripsi: string;
}

export interface PpdbProgramUnggulan {
  id: string;
  nama: string;
  kategori: string;
  deskripsi: string;
  target?: string;
  icon?: 'quran' | 'book' | 'star' | 'trophy' | 'building' | 'globe';
}

export interface PpdbGelombang {
  id: string;
  nama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  beasiswaInfo: string;
  status: 'Dibuka' | 'Segera' | 'Ditutup';
}

export interface PpdbContactPerson {
  nama: string;
  jabatan: string;
  noHp: string;
  jamLayanan: string;
  keteranganTambahan?: string;
}

export interface PpdbSettings {
  tahunAjaran?: string; // Optional custom override, otherwise syncs with SchoolInfo.tahunAjaran
  gelombangList: PpdbGelombang[];
  programList: PpdbProgramUnggulan[];
  contactList: PpdbContactPerson[];
  syaratPendaftaran?: string[];
}

export interface PpdbRegistration {
  id: string; // e.g. PPDB-2025-001
  tahunAjaran?: string;
  namaLengkap: string;
  nisn?: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  asalSekolah: string; // SD/MI Asal

  // Data Ayah Kandung
  namaAyah?: string;
  statusAyah?: 'Masih Hidup' | 'Meninggal';
  pekerjaanAyah?: string;
  noHpAyah?: string;
  pendapatanAyah?: string;
  alamatAyah?: string;

  // Data Ibu Kandung
  namaIbu?: string;
  statusIbu?: 'Masih Hidup' | 'Meninggal';
  pekerjaanIbu?: string;
  noHpIbu?: string;
  pendapatanIbu?: string;
  alamatIbu?: string;

  // Data Wali (Opsional)
  namaWali?: string;
  pekerjaanWali?: string;
  noHpWali?: string;
  pendapatanWali?: string;
  hubunganWali?: string;

  // Legacy / General contact & address
  namaOrangTua: string;
  noHpOrtu: string;
  alamat: string;

  pilihanKelas: string;
  tanggalDaftar: string;
  status: 'Menunggu Verifikasi' | 'Lulus Berkas' | 'Diterima' | 'Ditolak';
  catatan?: string;
}

export interface GalleryItem {
  id: string;
  judul: string;
  kategori: 'Kegiatan Santri' | 'Keagamaan' | 'Prestasi & Lomba' | 'Sarana & Fasilitas' | 'Ekstrakurikuler';
  imageUrl: string;
  deskripsi: string;
  tanggal: string;
}

