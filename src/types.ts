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
  semesterAktif: 'Ganjil' | 'Genap';
  logoUrl?: string;
}

export interface Teacher {
  id: string;
  nuptk: string;
  nama: string;
  nigy?: string;
  nip?: string; // Legacy compatibility
  gender: 'L' | 'P';
  mapelUtama: string;
  jabatan: string; // e.g. 'Wali Kelas 7A', 'Guru Mata Pelajaran', 'Waka Kurikulum'
  email: string;
  telepon: string;
  statusPegawai: 'PNS' | 'GTY' | 'GTT' | 'Honor';
  waliKelasDi?: string; // e.g. '7A'
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
}

export interface SarprasItem {
  id: string;
  kode: string;
  namaBarangRuang: string;
  kategori: 'Ruang / Gedung' | 'Peralatan Lab' | 'Elektronik' | 'Mebelair' | 'Olahraga & Seni' | 'Keagamaan';
  jumlah: number;
  satuan: string;
  kondisiBaik: number;
  kondisiRusakRingan: number;
  kondisiRusakBerat: number;
  lokasi: string;
  keterangan: string;
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
  kategori: 'KBM' | 'Ujian (PTS/PAS)' | 'Libur Sekolah' | 'Hari Besar Islam (PHBI)' | 'Kegiatan Ekstrakurikuler' | 'Pembagian Rapor';
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
  kategori: 'Keagamaan' | 'Akademik' | 'Lomba / Prestasi' | 'Rapat Guru' | 'Parenting / Kemitraan';
  deskripsi: string;
  status: 'Akan Datang' | 'Berlangsung' | 'Selesai';
}

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  status: 'H' | 'I' | 'S' | 'A'; // Hadir, Izin, Sakit, Alpa
  keterangan?: string;
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
  action: 'UPDATE_NILAI' | 'LOCK_DRAFT_NILAI' | 'UNLOCK_DRAFT_NILAI' | 'RESET_NILAI' | 'UPDATE_ADMINISTRASI' | 'SYNC_TAHUN_AJARAN' | 'LAINNYA';
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
  lastSyncedAt?: string;
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

