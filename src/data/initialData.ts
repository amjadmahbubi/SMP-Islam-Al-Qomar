import {
  SchoolInfo,
  Teacher,
  Student,
  SarprasItem,
  TeacherDoc,
  ScheduleItem,
  CalendarEvent,
  AgendaItem,
  AttendanceRecord,
  SubjectGradeRecord,
  GoogleSheetsConfig,
  StudentAchievement,
  PpdbRegistration,
  PpdbSettings,
  GalleryItem,
  GradeLockRecord,
  AuditLog
} from '../types';

const currentCalendarYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();
const dynamicCurrentTA = currentMonth >= 6
  ? `${currentCalendarYear}/${currentCalendarYear + 1}`
  : `${currentCalendarYear - 1}/${currentCalendarYear}`;

export const initialSchoolInfo: SchoolInfo = {
  nama: 'SMP Islam Al Qomar',
  npsn: '20348912',
  akreditasi: 'A (Unggul)',
  alamat: 'Jl. Raya Masjid Al Qomar No. 45, Kecamatan Giri, Kabupaten Banyuwangi, Jawa Timur 68411',
  telepon: '(0333) 8291045',
  email: 'info@smpislamalqomar.sch.id',
  website: 'https://smpislamalqomar.sch.id',
  kepalaSekolah: 'Ustadz H. Ahmad Basuki, M.Pd.',
  nigyKepalaSekolah: 'NIGY.200501.004',
  nipKepalaSekolah: 'NIGY.200501.004',
  visi: "Terwujudnya Generasi Qur'ani, Berakhlak Mulia, Berprestasi Akademik, dan Berwawasan Global.",
  misi: [
    "Menyelenggarakan pendidikan berbasis Al-Qur'an, Hadits, dan Budi Pekerti Islam.",
    "Mengembangkan potensi sains, teknologi, dan kebahasaan (Indonesia, Arab, Inggris) siswa.",
    "Membentuk karakter disiplin, jujur, peduli lingkungan, dan berjiwa kepemimpinan.",
    "Menyediakan sarana pembelajaran modern berpadu dengan tradisi keislaman yang sejuk."
  ],
  tahunAjaran: dynamicCurrentTA,
  semesterAktif: currentMonth >= 6 && currentMonth <= 11 ? 'Ganjil' : 'Genap'
};

export const initialTeachers: Teacher[] = [
  {
    id: 'T001',
    nuptk: '8439752104839210',
    nama: 'Ustadz H. Ahmad Basuki, M.Pd.',
    nigy: 'NIGY.200501.004',
    nip: 'NIGY.200501.004',
    gender: 'L',
    mapelUtama: 'Pendidikan Agama Islam & Al-Qur\'an',
    jabatan: 'Kepala Sekolah',
    email: 'admin@alqomar.sch.id',
    telepon: '081234567801',
    statusPegawai: 'PNS'
  },
  {
    id: 'T002',
    nuptk: '1284950392817492',
    nama: 'Ustadzah Siti Fatimah, S.Pd.',
    nigy: 'NIGY.201001.018',
    nip: 'NIGY.201001.018',
    gender: 'P',
    mapelUtama: 'Matematika',
    jabatan: 'Wali Kelas 7A',
    email: 'guru@alqomar.sch.id',
    telepon: '081234567802',
    statusPegawai: 'PNS',
    waliKelasDi: '7A'
  },
  {
    id: 'T003',
    nuptk: '5920194830192847',
    nama: 'Ustadz Muhammad Ridwan, Lc., M.A.',
    gender: 'L',
    mapelUtama: 'Bahasa Arab & Tahfidz',
    jabatan: 'Wali Kelas 8A & Koordinator Tahfidz',
    email: 'ridwan@alqomar.sch.id',
    telepon: '081234567803',
    statusPegawai: 'GTY',
    waliKelasDi: '8A'
  },
  {
    id: 'T004',
    nuptk: '9301847502918374',
    nama: 'Ustadzah Dewi Rahmawati, M.Si.',
    gender: 'P',
    mapelUtama: 'Ilmu Pengetahuan Alam (IPA)',
    jabatan: 'Wali Kelas 9A & Kepala Lab IPA',
    email: 'dewi@alqomar.sch.id',
    telepon: '081234567804',
    statusPegawai: 'GTY',
    waliKelasDi: '9A'
  },
  {
    id: 'T005',
    nuptk: '3049582710394857',
    nama: 'Ustadz Nur Hidayat, S.Hum.',
    gender: 'L',
    mapelUtama: 'Bahasa Indonesia',
    jabatan: 'Waka Kurikulum',
    email: 'hidayat@alqomar.sch.id',
    telepon: '081234567805',
    statusPegawai: 'GTY'
  },
  {
    id: 'T006',
    nuptk: '7103948275019283',
    nama: 'Ustadzah Nurul Ain, M.Ed.',
    gender: 'P',
    mapelUtama: 'Bahasa Inggris',
    jabatan: 'Guru Mata Pelajaran',
    email: 'nurulain@alqomar.sch.id',
    telepon: '081234567806',
    statusPegawai: 'GTY'
  },
  {
    id: 'T007',
    nuptk: '4839201948273641',
    nama: 'Ustadz Faisal Rahman, S.Pd.',
    gender: 'L',
    mapelUtama: 'PJOK & Ekstrakurikuler',
    jabatan: 'Waka Kesiswaan',
    email: 'faisal@alqomar.sch.id',
    telepon: '081234567807',
    statusPegawai: 'GTY'
  },
  {
    id: 'T008',
    nuptk: '8201948372615243',
    nama: 'Ustadz Arif Budiman, S.Kom.',
    gender: 'L',
    mapelUtama: 'Informatika & Media',
    jabatan: 'Kepala Lab Komputer & IT',
    email: 'arif@alqomar.sch.id',
    telepon: '081234567808',
    statusPegawai: 'GTT'
  }
];

export const initialStudents: Student[] = [
  {
    id: 'S001',
    nisn: '0098234101',
    nis: '2407001',
    nama: 'Ahmad Zaki Mubarak',
    gender: 'L',
    kelas: '7A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2011-04-12',
    namaOrangTua: 'Bapak Hendra Mubarak',
    noHpOrangTua: '081398765001',
    alamat: 'Jl. Ahmad Yani No. 12, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S002',
    nisn: '0098234102',
    nis: '2407002',
    nama: 'Aisyah Humaira Azzahra',
    gender: 'P',
    kelas: '7A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2011-08-23',
    namaOrangTua: 'Bapak M. Syukri',
    noHpOrangTua: '081398765002',
    alamat: 'Perumahan Giri Indah B-4, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S003',
    nisn: '0098234103',
    nis: '2407003',
    nama: 'Bilal Hafizh Al-Ghazali',
    gender: 'L',
    kelas: '7A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2011-01-15',
    namaOrangTua: 'Bapak Dr. Lukman Hakim',
    noHpOrangTua: '081398765003',
    alamat: 'Jl. Brawijaya II No. 8, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S004',
    nisn: '0098234104',
    nis: '2407004',
    nama: 'Fatima Nabila Husna',
    gender: 'P',
    kelas: '7A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2011-11-03',
    namaOrangTua: 'Bapak Ir. Agus Widodo',
    noHpOrangTua: '081398765004',
    alamat: 'Jl. Gajah Mada No. 19, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S005',
    nisn: '0087123901',
    nis: '2308001',
    nama: 'Fathan Al-Farisi',
    gender: 'L',
    kelas: '8A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2010-06-18',
    namaOrangTua: 'Bapak H. Nur Kholis',
    noHpOrangTua: '081398765005',
    alamat: 'Jl. Santoso No. 44, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S006',
    nisn: '0087123902',
    nis: '2308002',
    nama: 'Khadijah Maryam As-Segaf',
    gender: 'P',
    kelas: '8A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2010-09-09',
    namaOrangTua: 'Bapak Habib Ali As-Segaf',
    noHpOrangTua: '081398765006',
    alamat: 'Jl. KH Agus Salim No. 15, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S007',
    nisn: '0087123903',
    nis: '2308003',
    nama: 'Muhammad Rayhan Syahputra',
    gender: 'L',
    kelas: '8A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2010-03-30',
    namaOrangTua: 'Bapak Rudi Syahputra',
    noHpOrangTua: '081398765007',
    alamat: 'Jl. Yos Sudarso No. 88, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S008',
    nisn: '0076239101',
    nis: '2209001',
    nama: 'Nabila Syifa Az-Zahra',
    gender: 'P',
    kelas: '9A',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2009-02-14',
    namaOrangTua: 'Bapak H. Ahmad Dahlan',
    noHpOrangTua: '081398765008',
    alamat: 'Jl. Banyuwangi Indah No. 27, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S009',
    nisn: '0076239102',
    nis: '2209002',
    nama: 'Umar Khalid Al-Bintani',
    gender: 'L',
    kelas: '9A',
    tempatLahir: 'Malang',
    tanggalLahir: '2009-07-21',
    namaOrangTua: 'Bapak Drs. Bambang',
    noHpOrangTua: '081398765009',
    alamat: 'Jl. Kutai No. 10, Banyuwangi',
    status: 'Aktif'
  },
  {
    id: 'S010',
    nisn: '0098234105',
    nis: '2407005',
    nama: 'Zahra Annisa Rahmah',
    gender: 'P',
    kelas: '7B',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2011-05-19',
    namaOrangTua: 'Bapak Rahmad Hidayat',
    noHpOrangTua: '081398765010',
    alamat: 'Jl. Giri Indah III No. 5, Banyuwangi',
    status: 'Aktif'
  }
];

export const initialSarpras: SarprasItem[] = [
  {
    id: 'SRP001',
    kode: 'R-7A',
    namaBarangRuang: 'Gedung Ruang Kelas 7A (Multimedia)',
    kategori: 'Ruang / Gedung',
    jumlah: 1,
    satuan: 'Ruang',
    kondisiBaik: 1,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    lokasi: 'Lantai 1 Gedung Utama',
    keterangan: 'Dilengkapi Proyektor LCD, Smart TV 55", AC 2 PK, & Meja Kursi Ergonomis'
  },
  {
    id: 'SRP002',
    kode: 'R-LAB-KOMP',
    namaBarangRuang: 'Laboratorium Komputer & Media Digital',
    kategori: 'Ruang / Gedung',
    jumlah: 1,
    satuan: 'Ruang',
    kondisiBaik: 1,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    lokasi: 'Lantai 2 Gedung B',
    keterangan: '32 Unit PC Core i5, Fiber Optic Internet 200 Mbps, AC Central'
  },
  {
    id: 'SRP003',
    kode: 'M-MSJD',
    namaBarangRuang: 'Masjid Al Qomar (Kapasitas 600 Jamaah)',
    kategori: 'Keagamaan',
    jumlah: 1,
    satuan: 'Bangunan',
    kondisiBaik: 1,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    lokasi: 'Kompleks Tengah Sekolah',
    keterangan: 'Pusat Kegiatan Shalat Berjamaah, Tahfidz Qur\'an, & Kajian Islam'
  },
  {
    id: 'SRP004',
    kode: 'P-KOMP-32',
    namaBarangRuang: 'Komputer Client All-in-One Lenovo',
    kategori: 'Elektronik',
    jumlah: 32,
    satuan: 'Unit',
    kondisiBaik: 30,
    kondisiRusakRingan: 2,
    kondisiRusakBerat: 0,
    lokasi: 'Lab Komputer',
    keterangan: '2 unit perlu perawatan rutin sistem pendingin'
  },
  {
    id: 'SRP005',
    kode: 'R-LAB-IPA',
    namaBarangRuang: 'Laboratorium IPA Terpadu',
    kategori: 'Peralatan Lab',
    jumlah: 1,
    satuan: 'Ruang',
    kondisiBaik: 1,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    lokasi: 'Lantai 2 Gedung Utama',
    keterangan: 'Lengkap dengan Mikroskop Binokuler, Alat Pratikum Fisika & Kimia Dasar'
  },
  {
    id: 'SRP006',
    kode: 'B-PERPUS',
    namaBarangRuang: 'Perpustakaan Al-Hikmah & Digital Learning',
    kategori: 'Ruang / Gedung',
    jumlah: 1,
    satuan: 'Ruang',
    kondisiBaik: 1,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    lokasi: 'Lantai 1 Gedung B',
    keterangan: 'Koleksi 4.500+ Buku Agama, Sains, Ensiklopedia & e-Book Kemenag/Kemdikbud'
  },
  {
    id: 'SRP007',
    kode: 'L-LAP-SBRG',
    namaBarangRuang: 'Lapangan Olahraga Serbaguna (Futsal, Basket, Voli)',
    kategori: 'Olahraga & Seni',
    jumlah: 1,
    satuan: 'Lapangan',
    kondisiBaik: 1,
    kondisiRusakRingan: 0,
    kondisiRusakBerat: 0,
    lokasi: 'Halaman Utama',
    keterangan: 'Lantai Interlock Outdoor & Ring Basket Standar'
  },
  {
    id: 'SRP008',
    kode: 'E-PROY-LCD',
    namaBarangRuang: 'Proyektor EPSON EB-E500 3300 Lumens',
    kategori: 'Elektronik',
    jumlah: 8,
    satuan: 'Unit',
    kondisiBaik: 7,
    kondisiRusakRingan: 1,
    kondisiRusakBerat: 0,
    lokasi: 'Seluruh Ruang Kelas & Ruang Rapat',
    keterangan: '1 unit di R-8B penggantian lampu proyektor'
  }
];

export const initialSchedules: ScheduleItem[] = [
  // SENIN - Kelas 7A
  { id: 'SCH001', hari: 'Senin', kelas: '7A', jamKe: 1, waktu: '07:00 - 07:40', mapel: 'Upacara Bendera & Pembiasaan Al-Qur\'an', guruNama: 'Tim Guru', ruang: 'Masjid Al Qomar' },
  { id: 'SCH002', hari: 'Senin', kelas: '7A', jamKe: 2, waktu: '07:40 - 08:20', mapel: 'Tahfidz & Halqah Qur\'an', guruNama: 'Ustadz Muhammad Ridwan, Lc., M.A.', ruang: 'Kelas 7A' },
  { id: 'SCH003', hari: 'Senin', kelas: '7A', jamKe: 3, waktu: '08:20 - 09:00', mapel: 'Matematika', guruNama: 'Ustadzah Siti Fatimah, S.Pd.', ruang: 'Kelas 7A' },
  { id: 'SCH004', hari: 'Senin', kelas: '7A', jamKe: 4, waktu: '09:15 - 09:55', mapel: 'Matematika', guruNama: 'Ustadzah Siti Fatimah, S.Pd.', ruang: 'Kelas 7A' },
  { id: 'SCH005', hari: 'Senin', kelas: '7A', jamKe: 5, waktu: '09:55 - 10:35', mapel: 'PAI & Akidah Akhlak', guruNama: 'Ustadz H. Ahmad Basuki, M.Pd.', ruang: 'Kelas 7A' },
  { id: 'SCH006', hari: 'Senin', kelas: '7A', jamKe: 6, waktu: '10:35 - 11:15', mapel: 'Bahasa Indonesia', guruNama: 'Ustadz Nur Hidayat, S.Hum.', ruang: 'Kelas 7A' },
  
  // SELASA - Kelas 7A
  { id: 'SCH007', hari: 'Selasa', kelas: '7A', jamKe: 1, waktu: '07:15 - 07:55', mapel: 'Shalat Duha & Tahfidz Morning', guruNama: 'Ustadz Muhammad Ridwan, Lc., M.A.', ruang: 'Masjid' },
  { id: 'SCH008', hari: 'Selasa', kelas: '7A', jamKe: 2, waktu: '07:55 - 08:35', mapel: 'Bahasa Arab', guruNama: 'Ustadz Muhammad Ridwan, Lc., M.A.', ruang: 'Kelas 7A' },
  { id: 'SCH009', hari: 'Selasa', kelas: '7A', jamKe: 3, waktu: '08:35 - 09:15', mapel: 'Bahasa Arab', guruNama: 'Ustadz Muhammad Ridwan, Lc., M.A.', ruang: 'Kelas 7A' },
  { id: 'SCH010', hari: 'Selasa', kelas: '7A', jamKe: 4, waktu: '09:30 - 10:10', mapel: 'IPA Terpadu', guruNama: 'Ustadzah Dewi Rahmawati, M.Si.', ruang: 'Lab IPA' },
  { id: 'SCH011', hari: 'Selasa', kelas: '7A', jamKe: 5, waktu: '10:10 - 10:50', mapel: 'IPA Terpadu', guruNama: 'Ustadzah Dewi Rahmawati, M.Si.', ruang: 'Lab IPA' },

  // RABU - Kelas 7A
  { id: 'SCH012', hari: 'Rabu', kelas: '7A', jamKe: 1, waktu: '07:15 - 07:55', mapel: 'Tahfidz & Zikir Pagi', guruNama: 'Ustadz Muhammad Ridwan, Lc., M.A.', ruang: 'Masjid' },
  { id: 'SCH013', hari: 'Rabu', kelas: '7A', jamKe: 2, waktu: '07:55 - 08:35', mapel: 'Bahasa Inggris', guruNama: 'Ustadzah Nurul Ain, M.Ed.', ruang: 'Kelas 7A' },
  { id: 'SCH014', hari: 'Rabu', kelas: '7A', jamKe: 3, waktu: '08:35 - 09:15', mapel: 'Informatika', guruNama: 'Ustadz Arif Budiman, S.Kom.', ruang: 'Lab Komputer' },
  { id: 'SCH015', hari: 'Rabu', kelas: '7A', jamKe: 4, waktu: '09:30 - 10:10', mapel: 'Informatika', guruNama: 'Ustadz Arif Budiman, S.Kom.', ruang: 'Lab Komputer' },

  // KAMIS - Kelas 7A
  { id: 'SCH016', hari: 'Kamis', kelas: '7A', jamKe: 1, waktu: '07:15 - 07:55', mapel: 'Kultum Siswa & Zikir', guruNama: 'Ustadz Faisal Rahman, S.Pd.', ruang: 'Masjid' },
  { id: 'SCH017', hari: 'Kamis', kelas: '7A', jamKe: 2, waktu: '07:55 - 08:35', mapel: 'PJOK / Olahraga', guruNama: 'Ustadz Faisal Rahman, S.Pd.', ruang: 'Lapangan' },
  { id: 'SCH018', hari: 'Kamis', kelas: '7A', jamKe: 3, waktu: '08:35 - 09:15', mapel: 'PJOK / Olahraga', guruNama: 'Ustadz Faisal Rahman, S.Pd.', ruang: 'Lapangan' },

  // JUMAT - Kelas 7A
  { id: 'SCH019', hari: 'Jumat', kelas: '7A', jamKe: 1, waktu: '07:15 - 08:00', mapel: 'Jumat Berkah & Yasin/Kahfi', guruNama: 'Tim Keagamaan', ruang: 'Masjid' },
  { id: 'SCH020', hari: 'Jumat', kelas: '7A', jamKe: 2, waktu: '08:00 - 08:45', mapel: 'Pramuka Islam & P5', guruNama: 'Ustadz Faisal Rahman, S.Pd.', ruang: 'Aula' },

  // Kelas 8A Sample
  { id: 'SCH021', hari: 'Senin', kelas: '8A', jamKe: 1, waktu: '07:00 - 07:40', mapel: 'Upacara & Zikir Pagi', guruNama: 'Tim Guru', ruang: 'Lapangan' },
  { id: 'SCH022', hari: 'Senin', kelas: '8A', jamKe: 2, waktu: '07:40 - 08:20', mapel: 'Bahasa Arab', guruNama: 'Ustadz Muhammad Ridwan, Lc., M.A.', ruang: 'Kelas 8A' },
  { id: 'SCH023', hari: 'Senin', kelas: '8A', jamKe: 3, waktu: '08:20 - 09:00', mapel: 'IPA Terpadu', guruNama: 'Ustadzah Dewi Rahmawati, M.Si.', ruang: 'Lab IPA' }
];

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'CAL001',
    tanggalMulai: '2024-07-15',
    tanggalSelesai: '2024-07-17',
    kegiatan: 'Masa Pengenalan Lingkungan Sekolah (MPLS) & Masa Ta\'aruf Siswa Baru',
    kategori: 'Kegiatan Ekstrakurikuler',
    deskripsi: 'Pengenalan visi misi, program Tahfidz Qur\'an, adab santri, dan tur sarana prasarana sekolah.',
    semester: 'Ganjil'
  },
  {
    id: 'CAL002',
    tanggalMulai: '2024-07-18',
    tanggalSelesai: '2024-09-20',
    kegiatan: 'Kegiatan Belajar Mengajar (KBM) Efektif Semester Ganjil',
    kategori: 'KBM',
    deskripsi: 'Proses pembelajaran reguler Kurikulum Merdeka berintegritas nilai Islam.',
    semester: 'Ganjil'
  },
  {
    id: 'CAL003',
    tanggalMulai: '2024-09-23',
    tanggalSelesai: '2024-09-28',
    kegiatan: 'Penilaian Tengah Semester (PTS) Ganjil TA 2024/2025',
    kategori: 'Ujian (PTS/PAS)',
    deskripsi: 'Ujian berbasis Komputer (CBT) & Asesmen Unjuk Kerja Tahfidz Quran.',
    semester: 'Ganjil'
  },
  {
    id: 'CAL004',
    tanggalMulai: '2024-09-16',
    tanggalSelesai: '2024-09-16',
    kegiatan: 'Peringatan Maulid Nabi Muhammad SAW 1446 H & Tabligh Akbar',
    kategori: 'Hari Besar Islam (PHBI)',
    deskripsi: 'Lomba sholawat antar kelas, tausiyah dakwah, dan pembagian santunan anak yatim.',
    semester: 'Ganjil'
  },
  {
    id: 'CAL005',
    tanggalMulai: '2024-12-02',
    tanggalSelesai: '2024-12-11',
    kegiatan: 'Penilaian Akhir Semester (PAS) Ganjil',
    kategori: 'Ujian (PTS/PAS)',
    deskripsi: 'Evaluasi capaian pembelajaran semester 1 seluruh tingkat.',
    semester: 'Ganjil'
  },
  {
    id: 'CAL006',
    tanggalMulai: '2024-12-12',
    tanggalSelesai: '2024-12-19',
    kegiatan: 'Pekan Olahraga & Seni Islam (Porseni) & Classmeeting',
    kategori: 'Kegiatan Ekstrakurikuler',
    deskripsi: 'Lomba futsal, panahan, kaligrafi, musabaqah tilawatil qur\'an (MTQ), dan pidato 3 bahasa.',
    semester: 'Ganjil'
  },
  {
    id: 'CAL007',
    tanggalMulai: '2024-12-20',
    tanggalSelesai: '2024-12-20',
    kegiatan: 'Penyerahan Laporan Hasil Belajar (Rapor) Semester Ganjil',
    kategori: 'Pembagian Rapor',
    deskripsi: 'Penerimaan rapor oleh orang tua/wali murid beserta konsultasi perkembangan karakter siswa.',
    semester: 'Ganjil'
  },
  {
    id: 'CAL008',
    tanggalMulai: '2024-12-21',
    tanggalSelesai: '2025-01-05',
    kegiatan: 'Libur Semester Ganjil & Libur Tahun Baru',
    kategori: 'Libur Sekolah',
    deskripsi: 'Libur akhir semester dan pembiasaan amaliah mandiri di rumah.',
    semester: 'Ganjil'
  }
];

export const initialAgendaItems: AgendaItem[] = [
  {
    id: 'AGD001',
    judul: 'Musabaqah Hifdzil Qur\'an (MHQ) & Tartil Antar Kelas',
    tanggal: '2024-10-12',
    waktu: '08:00 - 12:30 WIB',
    lokasi: 'Masjid Al Qomar & Aula Utama',
    penanggungJawab: 'Ustadz Muhammad Ridwan, Lc., M.A.',
    kategori: 'Keagamaan',
    deskripsi: 'Ajang seleksi santri penghafal Al-Qur\'an Juz 30, 29, dan 1 untuk maju ke seleksi tingkat Kabupaten Banyuwangi.',
    status: 'Akan Datang'
  },
  {
    id: 'AGD002',
    judul: 'Parenting & Kajian Rutin Wali Murid "Mendidik Remaja Rabbani"',
    tanggal: '2024-10-26',
    waktu: '08:30 - 11:30 WIB',
    lokasi: 'Aula Lantai 3 SMP Islam Al Qomar',
    penanggungJawab: 'Komite Sekolah & Humas',
    kategori: 'Parenting / Kemitraan',
    deskripsi: 'Kajian interaktif bersama narasumber psikolog Islam mengenai sinergi rumah dan sekolah.',
    status: 'Akan Datang'
  },
  {
    id: 'AGD003',
    judul: 'Outbound & Field Trip Edukasi Sains & Alam Terpadu',
    tanggal: '2024-11-09',
    waktu: '06:30 - 16:00 WIB',
    lokasi: 'Bumi Perkemahan Claket, Pacet, Mojokerto',
    penanggungJawab: 'Ustadz Faisal Rahman, S.Pd.',
    kategori: 'Lomba / Prestasi',
    deskripsi: 'Kegiatan pembelajaran outdoor sains, ketangkasan fisik, dan tadabbur alam bagi siswa kelas 7 & 8.',
    status: 'Akan Datang'
  },
  {
    id: 'AGD004',
    judul: 'Rapat Koordinasi Persiapan CBT Penilaian Akhir Semester',
    tanggal: '2024-11-20',
    waktu: '13:30 - 15:30 WIB',
    lokasi: 'Ruang Rapat Guru',
    penanggungJawab: 'Ustadz Nur Hidayat, S.Hum. (Waka Kurikulum)',
    kategori: 'Rapat Guru',
    deskripsi: 'Pembahasan kisi-kisi soal, jadwal pengawasan, dan verifikasi bank soal CBT.',
    status: 'Akan Datang'
  }
];

export const initialTeacherDocs: TeacherDoc[] = [
  {
    id: 'DOC001',
    teacherId: 'T002',
    teacherName: 'Ustadzah Siti Fatimah, S.Pd.',
    jenisDokumen: 'Modul Ajar / RPP',
    mataPelajaran: 'Matematika',
    kelas: '7A',
    tahunAjaran: '2024/2025',
    judul: 'Modul Ajar Matematika Merdeka - Bilangan Bulat & Pecahan',
    linkFile: 'https://docs.google.com/document/d/sample-modul-matematika-7a',
    tanggalUpload: '2024-07-20',
    status: 'Disetujui',
    catatanKepsek: 'Sangat baik, penerapan diferensiasi soal sudah lengkap.'
  },
  {
    id: 'DOC002',
    teacherId: 'T003',
    teacherName: 'Ustadz Muhammad Ridwan, Lc., M.A.',
    jenisDokumen: 'Program Tahunan (Prota)',
    mataPelajaran: 'Bahasa Arab',
    kelas: '8A',
    tahunAjaran: '2024/2025',
    judul: 'Program Tahunan Bahasa Arab & Percakapan Harian (Hiwar)',
    linkFile: 'https://docs.google.com/document/d/sample-prota-arab-8a',
    tanggalUpload: '2024-07-22',
    status: 'Disetujui',
    catatanKepsek: 'Sudah disetujui untuk dilaksanakan.'
  },
  {
    id: 'DOC003',
    teacherId: 'T004',
    teacherName: 'Ustadzah Dewi Rahmawati, M.Si.',
    jenisDokumen: 'Modul Ajar / RPP',
    mataPelajaran: 'Ilmu Pengetahuan Alam (IPA)',
    kelas: '9A',
    tahunAjaran: '2024/2025',
    judul: 'Modul Ajar IPA - Sistem Reproduksi Manusia & Kesehatan Dalam Islam',
    linkFile: 'https://docs.google.com/document/d/sample-modul-ipa-9a',
    tanggalUpload: '2024-07-25',
    status: 'Menunggu Verifikasi'
  },
  {
    id: 'DOC004',
    teacherId: 'T005',
    teacherName: 'Ustadz Nur Hidayat, S.Hum.',
    jenisDokumen: 'Silabus',
    mataPelajaran: 'Bahasa Indonesia',
    kelas: '7A',
    tahunAjaran: '2024/2025',
    judul: 'Silabus & Alur Tujuan Pembelajaran (ATP) Bahasa Indonesia Kelas VII',
    linkFile: 'https://docs.google.com/document/d/sample-atp-indo-7a',
    tanggalUpload: '2024-07-28',
    status: 'Disetujui'
  }
];

export const initialAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'ATT001',
    tanggal: '2024-09-02',
    kelas: '7A',
    mapel: 'Matematika',
    teacherId: 'T002',
    teacherName: 'Ustadzah Siti Fatimah, S.Pd.',
    entries: [
      { studentId: 'S001', studentName: 'Ahmad Zaki Mubarak', status: 'H' },
      { studentId: 'S002', studentName: 'Aisyah Humaira Azzahra', status: 'H' },
      { studentId: 'S003', studentName: 'Bilal Hafizh Al-Ghazali', status: 'S', keterangan: 'Demam' },
      { studentId: 'S004', studentName: 'Fatima Nabila Husna', status: 'H' }
    ]
  },
  {
    id: 'ATT002',
    tanggal: '2024-09-02',
    kelas: '8A',
    mapel: 'Bahasa Arab',
    teacherId: 'T003',
    teacherName: 'Ustadz Muhammad Ridwan, Lc., M.A.',
    entries: [
      { studentId: 'S005', studentName: 'Fathan Al-Farisi', status: 'H' },
      { studentId: 'S006', studentName: 'Khadijah Maryam As-Segaf', status: 'H' },
      { studentId: 'S007', studentName: 'Muhammad Rayhan Syahputra', status: 'I', keterangan: 'Acara keluarga' }
    ]
  }
];

export const initialSubjectGradeRecords: SubjectGradeRecord[] = [
  {
    id: 'GRD001',
    kelas: '7A',
    mapel: 'Bahasa Inggris',
    semester: 'Ganjil',
    tahunAjaran: '2024/2025',
    teacherId: 'T002',
    teacherName: 'Ustadzah Siti Fatimah, S.Pd.',
    tpList: ['It is My Family', 'She is My Sister', 'The Elephant is Big', 'The Giraffe is Tall', 'Yummy Fried Chicken', '0', '0', '0', '0', '0'],
    studentGrades: [
      {
        studentId: 'S001',
        studentName: 'Ahmad Zaki Mubarak',
        sumatifScores: [88, 92, 85, 90, 88, 0, 0, 0, 0, 0],
        nilaiFormatif1: 88,
        nilaiFormatif2: 92,
        nilaiSumatifLM: 89,
        nilaiPTS: 86,
        nilaiPAS: 88,
        catatanKompetensi: 'Sangat baik dalam memahami struktur teks deskriptif keluarga dan kosa kata Bahasa Inggris.'
      },
      {
        studentId: 'S002',
        studentName: 'Aisyah Humaira Azzahra',
        sumatifScores: [95, 94, 98, 92, 95, 0, 0, 0, 0, 0],
        nilaiFormatif1: 95,
        nilaiFormatif2: 94,
        nilaiSumatifLM: 95,
        nilaiPTS: 92,
        nilaiPAS: 94,
        catatanKompetensi: 'Istimewa. Tata bahasa Inggris sangat lancar dan pemahaman bacaan sangat tinggi.'
      },
      {
        studentId: 'S003',
        studentName: 'Bilal Hafizh Al-Ghazali',
        sumatifScores: [80, 82, 84, 80, 82, 0, 0, 0, 0, 0],
        nilaiFormatif1: 80,
        nilaiFormatif2: 82,
        nilaiSumatifLM: 82,
        nilaiPTS: 78,
        nilaiPAS: 80,
        catatanKompetensi: 'Cukup baik. Perlu latihan pengucapan kata sifat dan penyusunan kalimat sederhana.'
      },
      {
        studentId: 'S004',
        studentName: 'Fatima Nabila Husna',
        sumatifScores: [90, 88, 92, 86, 90, 0, 0, 0, 0, 0],
        nilaiFormatif1: 90,
        nilaiFormatif2: 88,
        nilaiSumatifLM: 89,
        nilaiPTS: 85,
        nilaiPAS: 87,
        catatanKompetensi: 'Sangat baik dalam ketelitian dialog Bahasa Inggris serta aktif dalam percakapan.'
      }
    ]
  },
  {
    id: 'GRD002',
    kelas: '7A',
    mapel: 'Matematika',
    semester: 'Ganjil',
    tahunAjaran: '2024/2025',
    teacherId: 'T002',
    teacherName: 'Ustadzah Siti Fatimah, S.Pd.',
    tpList: ['Bilangan Bulat & Pecahan', 'Persamaan Aljabar', 'Segi Empat & Segitiga', 'Penyajian Data', 'Skala & Perbandingan', '0', '0', '0', '0', '0'],
    studentGrades: [
      {
        studentId: 'S001',
        studentName: 'Ahmad Zaki Mubarak',
        sumatifScores: [88, 92, 90, 86, 88, 0, 0, 0, 0, 0],
        nilaiFormatif1: 88,
        nilaiFormatif2: 92,
        nilaiSumatifLM: 89,
        nilaiPTS: 86,
        nilaiPAS: 88,
        catatanKompetensi: 'Sangat baik dalam memahami konsep operasi aljabar dan pemecahan masalah bilangan bulat.'
      },
      {
        studentId: 'S002',
        studentName: 'Aisyah Humaira Azzahra',
        sumatifScores: [95, 94, 96, 92, 95, 0, 0, 0, 0, 0],
        nilaiFormatif1: 95,
        nilaiFormatif2: 94,
        nilaiSumatifLM: 94,
        nilaiPTS: 92,
        nilaiPAS: 94,
        catatanKompetensi: 'Istimewa. Mampu menyusun pembuktian aljabar dengan rapi dan teliti.'
      }
    ]
  }
];

export const initialSheetsConfig: GoogleSheetsConfig = {
  webAppUrl: '',
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  autoSync: false,
  lastSyncedAt: undefined
};

export const initialAchievements: StudentAchievement[] = [
  {
    id: 'ACH001',
    studentId: 'S001',
    studentName: 'Ahmad Zaki Mubarak',
    kelas: '7A',
    judulPrestasi: 'Juara 1 Musabaqah Hifdzil Qur\'an (MHQ) Category 5 Juz',
    kategori: 'Tahfidz & Al-Qur\'an',
    tingkat: 'Provinsi',
    tahun: '2024',
    penyelenggara: 'LPTQ Provinsi Jawa Timur',
    pembimbing: 'Ustadz Muhammad Ridwan, Lc., M.A.',
    medali: 'Juara 1',
    deskripsi: 'Meraih nilai tertinggi tajwid, makhraj, dan kelancaran hafalan 5 Juz Al-Qur\'an pada MTQ Pelajar SMP Se-Jawa Timur.'
  },
  {
    id: 'ACH002',
    studentId: 'S002',
    studentName: 'Aisyah Humaira Azzahra',
    kelas: '7A',
    judulPrestasi: 'Medali Emas Olimpiade Matematika Islam Nasional (OMIN)',
    kategori: 'Akademik',
    tingkat: 'Nasional',
    tahun: '2024',
    penyelenggara: 'Kementerian Agama & Asosiasi Pendidikan Islam',
    pembimbing: 'Ustadzah Siti Fatimah, S.Pd.',
    medali: 'Emas',
    deskripsi: 'Meraih skor sempurna 100 pada babak final Olimpiade Matematika Islam tingkat SMP/MTs se-Indonesia.'
  },
  {
    id: 'ACH003',
    studentName: 'Muhammad Rizky Pratama',
    kelas: '8A',
    judulPrestasi: 'Juara 1 Lomba Pidato Bahasa Arab (Khutabah) Remaja',
    kategori: 'Bahasa & Pidato',
    tingkat: 'Kota / Kabupaten',
    tahun: '2024',
    penyelenggara: 'Kemenag Kab. Banyuwangi',
    pembimbing: 'Ustadz Muhammad Ridwan, Lc., M.A.',
    medali: 'Juara 1',
    deskripsi: 'Menyampaikan pidato fashih bertema "Pentingnya Menuntut Ilmu dalam Islam" dengan retorika dan intonasi terbaik.'
  },
  {
    id: 'ACH004',
    studentName: 'Nabila Khairunnisa',
    kelas: '8B',
    judulPrestasi: 'Juara 2 Seni Kaligrafi Islam (Khattath) Kontemporer',
    kategori: 'Seni & Kaligrafi',
    tingkat: 'Kota / Kabupaten',
    tahun: '2024',
    penyelenggara: 'Dinas Pendidikan Kab. Banyuwangi',
    pembimbing: 'Ustadz Nur Hidayat, S.Hum.',
    medali: 'Juara 2',
    deskripsi: 'Menciptakan karya lukis kaligrafi surah Al-Alaq dengan perpaduan kaidah Khat Tsuluts & ornamen geometris islami.'
  },
  {
    id: 'ACH005',
    studentName: 'Fathan Al-Ghazali',
    kelas: '9A',
    judulPrestasi: 'Medali Perak Olimpiade Sains Terapan & Robotik Islami',
    kategori: 'Sains & Teknologi',
    tingkat: 'Nasional',
    tahun: '2023',
    penyelenggara: 'Institut Teknologi & Sains Islam Nusantara',
    pembimbing: 'Ustadzah Dewi Rahmawati, M.Si.',
    medali: 'Perak',
    deskripsi: 'Mengembangkan inovasi prototype pemilah sampah otomatis berbasis IoT dan sensor hidroponik sekolah.'
  },
  {
    id: 'ACH006',
    studentName: 'Umar Al-Farisi',
    kelas: '9B',
    judulPrestasi: 'Juara 1 Pencak Silat Tapak Suci Kelas Tanding Remaja',
    kategori: 'Olahraga',
    tingkat: 'Provinsi',
    tahun: '2024',
    penyelenggara: 'IPSI & Pimpinan Wilayah Tapak Suci Jatim',
    pembimbing: 'Ustadz H. Ahmad Basuki, M.Pd.',
    medali: 'Juara 1',
    deskripsi: 'Memenangkan seluruh laga pertandingan kelas tanding D putra dengan teknik sapuan & jatuhan bersih.'
  }
];

export const initialPpdbSettings: PpdbSettings = {
  tahunAjaran: '', // Otomatis sync dengan Profil Sekolah jika kosong
  gelombangList: [
    {
      id: 'GEL-1',
      nama: 'Gelombang 1 (Inden & Beasiswa)',
      tanggalMulai: '1 Nopember',
      tanggalSelesai: '28 Februari',
      beasiswaInfo: 'Beasiswa Potongan Infaq Rp 1.500.000 + Prioritas Asrama & Kelas Pilihan',
      status: 'Dibuka'
    },
    {
      id: 'GEL-2',
      nama: 'Gelombang 2 (Reguler)',
      tanggalMulai: '1 Maret',
      tanggalSelesai: '30 Juni',
      beasiswaInfo: 'Potongan Khusus Prestasi Tahfidz & Juara OSN/O2SN',
      status: 'Segera'
    }
  ],
  programList: [
    {
      id: 'Tahfidz Al-Qur\'an',
      nama: 'Program Tahfidz Unggulan',
      kategori: 'Tahfidz Al-Qur\'an',
      deskripsi: 'Target Hafalan 3-5 Juz & Sanad Matan Al-Jazariyah',
      target: '3-5 Juz',
      icon: 'quran'
    },
    {
      id: 'Bilingual / Bahasa',
      nama: 'Kelas Bilingual & Sains',
      kategori: 'Bilingual / Bahasa',
      deskripsi: 'Penguasaan Bahasa Arab, Bahasa Inggris Aktif, & Dasar Coding/Robotika',
      target: 'TOEFL Junior & Arabic Active',
      icon: 'globe'
    },
    {
      id: 'Reguler & Sains',
      nama: 'Kelas Reguler & Sains Modern',
      kategori: 'Reguler & Sains',
      deskripsi: 'Kurikulum Merdeka Unggul, Lab IPA Praktikum, Komputer Digital & Pembinaan Olimpiade',
      target: 'Juara OSN & Akademik',
      icon: 'star'
    }
  ],
  contactList: [
    {
      nama: 'Ustadz Faisal Rahman',
      jabatan: 'Humas PPDB & Informasi',
      noHp: '0812-3456-7807',
      jamLayanan: '07.30 - 15.00 WIB (Senin - Sabtu)',
      keteranganTambahan: 'Layanan konsultasi program, infaq, dan asrama santri'
    },
    {
      nama: 'Ustadzah Siti Fatimah, S.Pd.',
      jabatan: 'Sekretariat Pendaftaran & Verifikasi Berkas',
      noHp: '0813-9876-5432',
      jamLayanan: '08.00 - 14.00 WIB',
      keteranganTambahan: 'Konfirmasi upload berkas & jadwal tes pemetaan'
    }
  ],
  syaratPendaftaran: [
    'Mengisi Formulir Pendaftaran Online PPDB',
    'Fotokopi Akta Kelahiran & Kartu Keluarga (2 lembar)',
    'Fotokopi Ijazah / Surat Keterangan Lulus (SKL) SD/MI',
    'Fotokopi Rapor SD/MI Kelas 4 - 6 semester ganjil',
    'Pas foto berwarna terbaru ukuran 3x4 (3 lembar)',
    'Sertifikat kejuaraan / piagam prestasi / tahfidz (jika ada)'
  ]
};

export const initialPpdbRegistrations: PpdbRegistration[] = [
  {
    id: 'PPDB-2025-001',
    tahunAjaran: '2024/2025',
    namaLengkap: 'Ibrahim Hafizh Ar-Rasyid',
    nisn: '0112348901',
    jenisKelamin: 'L',
    tempatLahir: 'Banyuwangi',
    tanggalLahir: '2012-05-14',
    asalSekolah: 'SD Islam Terpadu Al-Uswah Banyuwangi',
    namaAyah: 'Drs. Rahmat Hidayat',
    statusAyah: 'Masih Hidup',
    pekerjaanAyah: 'PNS / Guru',
    noHpAyah: '081234567890',
    pendapatanAyah: 'Rp 5.000.000 - Rp 10.000.000',
    alamatAyah: 'Jl. Giri Indah No. 24, Banyuwangi',
    namaIbu: 'Hj. Nurul Aini, S.Pd.',
    statusIbu: 'Masih Hidup',
    pekerjaanIbu: 'Guru / Dosen',
    noHpIbu: '081234567899',
    pendapatanIbu: 'Rp 3.000.000 - Rp 5.000.000',
    alamatIbu: 'Jl. Giri Indah No. 24, Banyuwangi',
    namaOrangTua: 'Drs. Rahmat Hidayat',
    noHpOrtu: '081234567890',
    alamat: 'Jl. Giri Indah No. 24, Banyuwangi',
    pilihanKelas: 'Tahfidz Al-Qur\'an',
    tanggalDaftar: '2025-01-10',
    status: 'Diterima',
    catatan: 'Lulus tes hafalan 2 Juz dan tes potensi akademik. Diterima di Kelas Tahfidz unggulan.'
  },
  {
    id: 'PPDB-2025-002',
    tahunAjaran: '2024/2025',
    namaLengkap: 'Siti Maryam Az-Zahra',
    nisn: '0112348902',
    jenisKelamin: 'P',
    tempatLahir: 'Sidoarjo',
    tanggalLahir: '2012-08-20',
    asalSekolah: 'MI Negeri 1 Sidoarjo',
    namaAyah: 'Ahmad Syarifuddin, S.T.',
    statusAyah: 'Masih Hidup',
    pekerjaanAyah: 'Karyawan Swasta',
    noHpAyah: '081398765432',
    pendapatanAyah: 'Rp 5.000.000 - Rp 10.000.000',
    alamatAyah: 'Perum Taman Pinang Indah Blok C-12, Sidoarjo',
    namaIbu: 'Khadijah Indrawati',
    statusIbu: 'Masih Hidup',
    pekerjaanIbu: 'Ibu Rumah Tangga',
    noHpIbu: '081398765433',
    pendapatanIbu: 'Tidak Berpenghasilan',
    alamatIbu: 'Perum Taman Pinang Indah Blok C-12, Sidoarjo',
    namaOrangTua: 'Ahmad Syarifuddin, S.T.',
    noHpOrtu: '081398765432',
    alamat: 'Perum Taman Pinang Indah Blok C-12, Sidoarjo',
    pilihanKelas: 'Bilingual / Bahasa',
    tanggalDaftar: '2025-01-12',
    status: 'Lulus Berkas',
    catatan: 'Berkas lengkap. Dijadwalkan wawancara dan tes baca Al-Qur\'an Sabtu mendatang.'
  },
  {
    id: 'PPDB-2025-003',
    tahunAjaran: '2024/2025',
    namaLengkap: 'Muhammad Farhan Al-Mubarak',
    nisn: '0112348903',
    jenisKelamin: 'L',
    tempatLahir: 'Gresik',
    tanggalLahir: '2012-03-10',
    asalSekolah: 'SD Muhammadiyah 1 Giri Gresik',
    namaAyah: 'H. Bambang Kurniawan',
    statusAyah: 'Masih Hidup',
    pekerjaanAyah: 'Wiraswasta / Pengusaha',
    noHpAyah: '085712345678',
    pendapatanAyah: '> Rp 10.000.000',
    alamatAyah: 'Jl. Veteran No. 88, Gresik',
    namaIbu: 'Hj. Aminah Wardani',
    statusIbu: 'Masih Hidup',
    pekerjaanIbu: 'Wiraswasta',
    noHpIbu: '085712345679',
    pendapatanIbu: 'Rp 3.000.000 - Rp 5.000.000',
    alamatIbu: 'Jl. Veteran No. 88, Gresik',
    namaOrangTua: 'H. Bambang Kurniawan',
    noHpOrtu: '085712345678',
    alamat: 'Jl. Veteran No. 88, Gresik',
    pilihanKelas: 'Reguler & Sains',
    tanggalDaftar: '2025-01-15',
    status: 'Menunggu Verifikasi',
    catatan: 'Formulir telah diterima. Tim verifikasi sedang meninjau rapot SD kelas 4-6.'
  }
];

export const initialGalleryItems: GalleryItem[] = [
  {
    id: 'GAL001',
    judul: 'Wisuda Khotmil Qur\'an & Imtihan Tahfidz 30 Juz',
    kategori: 'Kegiatan Santri',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1000',
    deskripsi: 'Prosesi wisuda dan uji publik kelancaran hafalan Al-Qur\'an santri SMP Islam Al Qomar disaksikan para ustadz dan orang tua wali.',
    tanggal: '2024-05-20'
  },
  {
    id: 'GAL002',
    judul: 'Kajian Subuh Berjamaah & Zikir Pagi Santri',
    kategori: 'Keagamaan',
    imageUrl: 'https://images.unsplash.com/photo-1542816417-0983cbe82752?auto=format&fit=crop&q=80&w=1000',
    deskripsi: 'Suasana rutin shalat subuh berjamaah disambung kajian tazkiyatun nufus di Masjid Al Qomar.',
    tanggal: '2024-08-15'
  },
  {
    id: 'GAL003',
    judul: 'Juara 1 Musabaqah Tilawatil Qur\'an (MTQ) Tingkat Provinsi',
    kategori: 'Prestasi & Lomba',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000',
    deskripsi: 'Penyerahan piala dan sertifikat penghargaan juara 1 MTQ Pelajar SMP Se-Jawa Timur.',
    tanggal: '2024-09-10'
  },
  {
    id: 'GAL004',
    judul: 'Laboratorium Komputer Digital & Pembelajaran Coding',
    kategori: 'Sarana & Fasilitas',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1000',
    deskripsi: 'Siswa-siswi melatih kemampuan pemrograman, media digital, dan CBT menggunakan fasilitas lab komputer terkini.',
    tanggal: '2024-07-28'
  },
  {
    id: 'GAL005',
    judul: 'Latihan Rutin Pencak Silat Tapak Suci & Panahan Islami',
    kategori: 'Ekstrakurikuler',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266200b?auto=format&fit=crop&q=80&w=1000',
    deskripsi: 'Pengembangan fisik, kedisiplinan, dan ketangkasan olah raga sunnah di lapangan sekolah.',
    tanggal: '2024-08-30'
  },
  {
    id: 'GAL006',
    judul: 'Praktikum Biologi & Penelitian Hydroponik di Lab IPA',
    kategori: 'Sarana & Fasilitas',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1000',
    deskripsi: 'Praktikum mikroskopis dan percobaan sains alam didampingi guru IPA profesional.',
    tanggal: '2024-09-05'
  }
];

export const initialGradeLocks: GradeLockRecord[] = [
  {
    id: '7A-Pendidikan Agama Islam-Ganjil',
    kelas: '7A',
    mapel: 'Pendidikan Agama Islam',
    semester: 'Ganjil',
    isLocked: false,
    lockedBy: '',
    lockedAt: ''
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-20260812-001',
    timestamp: '2026-08-12 08:30:12',
    userName: 'Ustadz Nur Hidayat, S.Hum.',
    userRole: 'Waka Kurikulum',
    action: 'LOCK_DRAFT_NILAI',
    module: 'Input Nilai Asesmen',
    kelas: '8A',
    mapel: 'Bahasa Indonesia',
    semester: 'Ganjil',
    details: 'Mengunci draft nilai PAS Bahasa Indonesia Kelas 8A mendekati batas akhir deadline penginputan rapor.',
    previousDataSummary: 'Status: Terbuka (Unlocked)',
    newDataSummary: 'Status: Terkunci (Locked by Waka Kurikulum)'
  },
  {
    id: 'AUD-20260812-002',
    timestamp: '2026-08-12 09:15:00',
    userName: 'Ustadzah Siti Fatimah, S.Pd.',
    userRole: 'Guru Mapel / Wali Kelas 7A',
    action: 'UPDATE_NILAI',
    module: 'Input Nilai Asesmen',
    kelas: '7A',
    mapel: 'Matematika',
    semester: 'Ganjil',
    details: 'Mengubah nilai Sumatif 1 & PAS untuk 5 siswa Kelas 7A (Ahmad Zaky: Sumatif 1 (85 -> 92), PAS (80 -> 88)).',
    previousDataSummary: 'Rata-rata Nilai Kelas: 83.4',
    newDataSummary: 'Rata-rata Nilai Kelas: 86.2'
  },
  {
    id: 'AUD-20260812-003',
    timestamp: '2026-08-12 10:05:45',
    userName: 'Ustadz H. Ahmad Basuki, M.Pd.',
    userRole: 'Kepala Sekolah / Admin',
    action: 'UNLOCK_DRAFT_NILAI',
    module: 'Input Nilai Asesmen',
    kelas: '8A',
    mapel: 'Bahasa Indonesia',
    semester: 'Ganjil',
    details: 'Membuka kembali kunci draft nilai Kelas 8A atas permintaan guru mapel untuk perbaikan nilai remedial.',
    previousDataSummary: 'Status: Terkunci',
    newDataSummary: 'Status: Terbuka (Unlocked)'
  }
];


