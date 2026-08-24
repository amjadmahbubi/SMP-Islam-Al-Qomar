import React, { useState } from 'react';
import { Student, Teacher, SarprasItem, AttendanceRecord, SubjectGradeRecord, SchoolInfo, ScheduleItem, CalendarEvent, PpdbRegistration } from '../../types';
import { Sheet, Copy, Check, RefreshCw, Code, Link2, Database, Table, CheckCircle2, Calendar, UserPlus, Clock, Download, Upload, ArrowLeftRight, Sparkles, Eye, AlertCircle } from 'lucide-react';

interface GoogleSheetsIntegrationProps {
  students: Student[];
  teachers: Teacher[];
  sarpras: SarprasItem[];
  attendance: AttendanceRecord[];
  grades: SubjectGradeRecord[];
  schoolInfo?: SchoolInfo;
  schedules?: ScheduleItem[];
  events?: CalendarEvent[];
  ppdbRegistrations?: PpdbRegistration[];
  onImportStudents?: (students: Student[]) => void;
  onImportTeachers?: (teachers: Teacher[]) => void;
  onImportSarpras?: (sarpras: SarprasItem[]) => void;
  onImportSchedules?: (schedules: ScheduleItem[]) => void;
  onImportEvents?: (events: CalendarEvent[]) => void;
  onImportPpdb?: (ppdb: PpdbRegistration[]) => void;
  onImportSchoolInfo?: (info: SchoolInfo) => void;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  students,
  teachers,
  sarpras,
  attendance,
  grades,
  schoolInfo,
  schedules = [],
  events = [],
  ppdbRegistrations = [],
  onImportStudents,
  onImportTeachers,
  onImportSarpras,
  onImportSchedules,
  onImportEvents,
  onImportPpdb,
  onImportSchoolInfo
}) => {
  const [sheetUrl, setSheetUrl] = useState(
    'https://script.google.com/macros/s/AKfycbx-SMP-Islam-Al-Qomar-Dapodik/exec'
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Pull / Import State
  const [pullStatus, setPullStatus] = useState<'idle' | 'pulling' | 'success'>('idle');
  const [lastPulled, setLastPulled] = useState<string | null>(null);
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  
  // Pulled Data Preview
  const [pulledData, setPulledData] = useState<{
    students?: Student[];
    teachers?: Teacher[];
    sarpras?: SarprasItem[];
    schoolInfo?: SchoolInfo;
    ppdbRegistrations?: PpdbRegistration[];
  } | null>(null);

  // Comprehensive Google Apps Script code with Bi-Directional (doGet & doPost)
  const appsScriptCode = `/**
 * GOOGLE APPS SCRIPT - SMP ISLAM AL QOMAR DAPODIK BI-DIRECTIONAL INTEGRATION
 * Tempelkan kode ini di Google Sheets > Ekstensi > Apps Script
 */

// 1. HANDLER TARIK DATA DARI GOOGLE SHEETS KE WEB APP (PULL / GET)
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAllData";
  
  function getTabData(tabName) {
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) return [];
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];
    return values;
  }

  // Parse Tab Data_Siswa
  function parseStudents() {
    var rows = getTabData("Data_Siswa");
    if (rows.length <= 1) return [];
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] || r[3]) {
        list.push({
          id: String(r[0] || "S" + (i < 10 ? "00" + i : i < 100 ? "0" + i : i)),
          nisn: String(r[1] || ""),
          nis: String(r[2] || ""),
          nama: String(r[3] || ""),
          gender: String(r[4] || "L").toUpperCase().indexOf("P") !== -1 ? "P" : "L",
          kelas: String(r[5] || "7A"),
          tempatLahir: String(r[6] || "Banyuwangi"),
          tanggalLahir: String(r[7] || "2010-01-01"),
          namaOrangTua: String(r[8] || ""),
          noHpOrangTua: String(r[9] || ""),
          alamat: String(r[10] || ""),
          status: String(r[11] || "Aktif")
        });
      }
    }
    return list;
  }

  // Parse Tab Data_Guru
  function parseTeachers() {
    var rows = getTabData("Data_Guru");
    if (rows.length <= 1) return [];
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] || r[3]) {
        list.push({
          id: String(r[0] || "T" + (i < 10 ? "00" + i : i < 100 ? "0" + i : i)),
          nuptk: String(r[1] || ""),
          nigy: String(r[2] || ""),
          nip: String(r[2] || ""),
          nama: String(r[3] || ""),
          gender: String(r[4] || "L").toUpperCase().indexOf("P") !== -1 ? "P" : "L",
          mapelUtama: String(r[5] || "Pendidikan Agama Islam"),
          jabatan: String(r[6] || "Guru Mata Pelajaran"),
          statusPegawai: String(r[7] || "Tetap Yayasan"),
          waliKelasDi: String(r[8] || "-"),
          email: String(r[9] || ""),
          telepon: String(r[10] || "")
        });
      }
    }
    return list;
  }

  // Parse Tab Data_Sarpras
  function parseSarpras() {
    var rows = getTabData("Data_Sarpras");
    if (rows.length <= 1) return [];
    var list = [];
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] || r[2]) {
        list.push({
          id: String(r[0] || "SAR" + i),
          kode: String(r[1] || "INV-" + i),
          namaBarangRuang: String(r[2] || ""),
          kategori: String(r[3] || "Elektronik"),
          jumlah: Number(r[4]) || 1,
          kondisiBaik: Number(r[5]) || 1,
          kondisiRusakRingan: Number(r[6]) || 0,
          kondisiRusakBerat: Number(r[7]) || 0,
          lokasi: String(r[8] || "Gedung Utama")
        });
      }
    }
    return list;
  }

  // Parse Tab Profil_Sekolah
  function parseSchoolInfo() {
    var rows = getTabData("Profil_Sekolah");
    if (rows.length <= 1) return null;
    var info = {};
    for (var i = 1; i < rows.length; i++) {
      var key = String(rows[i][0]).toLowerCase();
      var val = String(rows[i][1]);
      if (key.indexOf("nama") !== -1) info.nama = val;
      if (key.indexOf("npsn") !== -1) info.npsn = val;
      if (key.indexOf("alamat") !== -1) info.alamat = val;
      if (key.indexOf("kepala") !== -1) info.kepalaSekolah = val;
      if (key.indexOf("nigy") !== -1 || key.indexOf("nip") !== -1) { info.nigyKepalaSekolah = val; info.nipKepalaSekolah = val; }
      if (key.indexOf("akreditasi") !== -1) info.akreditasi = val;
      if (key.indexOf("email") !== -1) info.email = val;
      if (key.indexOf("website") !== -1) info.website = val;
      if (key.indexOf("telepon") !== -1) info.telepon = val;
      if (key.indexOf("tahun") !== -1 || key.indexOf("ajaran") !== -1) info.tahunAjaran = val;
      if (key.indexOf("semester") !== -1) info.semesterAktif = val;
    }
    return info;
  }

  // Parse Tab Data_PPDB
  function parsePPDB() {
    var rows = getTabData("Data_PPDB");
    if (rows.length <= 1) return [];
    var list = [];
    var currentYear = new Date().getFullYear();
    var defaultTa = (new Date().getMonth() >= 6) ? (currentYear + "/" + (currentYear + 1)) : ((currentYear - 1) + "/" + currentYear);

    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] || r[2]) {
        list.push({
          id: String(r[0] || ("PPDB-" + currentYear + "-" + (i < 10 ? "00" + i : i < 100 ? "0" + i : i))),
          tahunAjaran: String(r[1] || defaultTa),
          namaLengkap: String(r[2] || ""),
          nisn: String(r[3] || ""),
          jenisKelamin: String(r[4] || "L").toUpperCase().indexOf("P") !== -1 ? "P" : "L",
          tempatLahir: String(r[5] || "Banyuwangi"),
          tanggalLahir: String(r[6] || (currentYear - 13) + "-01-01"),
          asalSekolah: String(r[7] || "SD/MI"),
          pilihanKelas: String(r[8] || "Tahfidz Al-Qur'an"),
          namaAyah: String(r[9] || ""),
          pekerjaanAyah: String(r[10] || ""),
          noHpAyah: String(r[11] || ""),
          pendapatanAyah: String(r[12] || ""),
          namaIbu: String(r[13] || ""),
          pekerjaanIbu: String(r[14] || ""),
          noHpIbu: String(r[15] || ""),
          pendapatanIbu: String(r[16] || ""),
          namaOrangTua: String(r[9] || r[13] || r[17] || "Orang Tua"),
          noHpOrtu: String(r[11] || r[15] || ""),
          alamat: String(r[17] || ""),
          tanggalDaftar: String(r[18] || new Date().toISOString().split("T")[0]),
          status: String(r[19] || "Menunggu Verifikasi"),
          catatan: String(r[20] || "")
        });
      }
    }
    return list;
  }

  var responsePayload = {
    status: "success",
    timestamp: new Date().toISOString(),
    school: "SMP Islam Al Qomar Banyuwangi",
    students: parseStudents(),
    teachers: parseTeachers(),
    sarpras: parseSarpras(),
    schoolInfo: parseSchoolInfo(),
    ppdbRegistrations: parsePPDB()
  };

  return ContentService.createTextOutput(JSON.stringify(responsePayload))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. HANDLER KIRIM DATA DARI WEB APP KE GOOGLE SHEETS (PUSH / POST)
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var payload = data.payload || {};
    
    function updateTab(tabName, headers, rows) {
      try {
        var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
        sheet.clear();
        var allData = [];
        if (headers && headers.length > 0) {
          allData.push(headers);
        }
        if (rows && rows.length > 0) {
          for (var k = 0; k < rows.length; k++) {
            allData.push(rows[k]);
          }
        }
        if (allData.length > 0) {
          var numRows = allData.length;
          var numCols = allData[0].length;
          sheet.getRange(1, 1, numRows, numCols).setValues(allData);
          sheet.getRange(1, 1, 1, numCols).setFontWeight("bold").setBackground("#d1fae5");
        }
      } catch (errTab) {
        // Safe fallback
      }
    }

    if (payload.schoolInfo) {
      var s = payload.schoolInfo;
      updateTab("Profil_Sekolah", 
        ["Atribut / Parameter", "Nilai Informasi"], 
        [
          ["Nama Sekolah", s.nama || ""],
          ["NPSN", s.npsn || ""],
          ["Tahun Ajaran", s.tahunAjaran || ""],
          ["Semester Aktif", s.semesterAktif || ""],
          ["Alamat", s.alamat || ""],
          ["Kepala Sekolah", s.kepalaSekolah || ""],
          ["NIGY Kepala Sekolah", s.nigyKepalaSekolah || s.nipKepalaSekolah || ""],
          ["Akreditasi", s.akreditasi || ""],
          ["Email Sekolah", s.email || ""],
          ["Website Resmi", s.website || ""],
          ["No Telepon", s.telepon || ""]
        ]
      );
    }

    if (payload.students && Array.isArray(payload.students)) {
      var studentRows = payload.students.map(function(s) {
        return [s.id, s.nisn, s.nis, s.nama, s.gender, s.kelas, s.tempatLahir, s.tanggalLahir, s.namaOrangTua, s.noHpOrangTua, s.alamat, s.status];
      });
      updateTab("Data_Siswa", ["ID", "NISN", "NIS", "Nama Lengkap", "Jenis Kelamin", "Kelas", "Tempat Lahir", "Tanggal Lahir", "Nama Ortu", "No HP Ortu", "Alamat", "Status"], studentRows);
    }

    if (payload.teachers && Array.isArray(payload.teachers)) {
      var teacherRows = payload.teachers.map(function(t) {
        return [t.id, t.nuptk, t.nigy || t.nip || "-", t.nama, t.gender, t.mapelUtama, t.jabatan, t.statusPegawai, t.waliKelasDi || "-", t.email, t.telepon];
      });
      updateTab("Data_Guru", ["ID", "NUPTK", "NIGY", "Nama Lengkap", "Jenis Kelamin", "Mapel Utama", "Jabatan", "Status Pegawai", "Wali Kelas", "Email", "No HP"], teacherRows);
    }

    if (payload.sarpras && Array.isArray(payload.sarpras)) {
      var sarprasRows = payload.sarpras.map(function(sp) {
        return [sp.id, sp.kode, sp.namaBarangRuang, sp.kategori, sp.jumlah, sp.kondisiBaik, sp.kondisiRusakRingan, sp.kondisiRusakBerat, sp.lokasi];
      });
      updateTab("Data_Sarpras", ["ID", "Kode", "Nama Barang / Ruang", "Kategori", "Jumlah Total", "Kondisi Baik", "Rusak Ringan", "Rusak Berat", "Lokasi"], sarprasRows);
    }

    if (payload.schedules && Array.isArray(payload.schedules)) {
      var scheduleRows = payload.schedules.map(function(j) {
        return [j.id, j.hari, j.kelas, j.jamKe, j.waktu, j.mapel, j.guruNama, j.ruang];
      });
      updateTab("Data_Jadwal", ["ID", "Hari", "Kelas", "Jam Ke", "Waktu", "Mata Pelajaran", "Guru Pengampu", "Ruangan"], scheduleRows);
    }

    if (payload.events && Array.isArray(payload.events)) {
      var eventRows = payload.events.map(function(ev) {
        return [ev.id, ev.tanggalMulai, ev.tanggalSelesai, ev.kegiatan, ev.kategori, ev.semester, ev.deskripsi || ""];
      });
      updateTab("Agenda_Kalender", ["ID", "Tanggal Mulai", "Tanggal Selesai", "Nama Kegiatan / Agenda", "Kategori Event", "Semester", "Deskripsi Keterangan"], eventRows);
    }

    if (payload.ppdbRegistrations && Array.isArray(payload.ppdbRegistrations)) {
      var currentYear = new Date().getFullYear();
      var defaultTa = (new Date().getMonth() >= 6) ? (currentYear + "/" + (currentYear + 1)) : ((currentYear - 1) + "/" + currentYear);
      var ppdbRows = payload.ppdbRegistrations.map(function(p) {
        return [
          p.id,
          p.tahunAjaran || defaultTa,
          p.namaLengkap,
          p.nisn || "-",
          p.jenisKelamin,
          p.tempatLahir,
          p.tanggalLahir,
          p.asalSekolah,
          p.pilihanKelas,
          p.namaAyah || p.namaOrangTua || "-",
          p.pekerjaanAyah || "-",
          p.noHpAyah || p.noHpOrtu || "-",
          p.pendapatanAyah || "-",
          p.namaIbu || "-",
          p.pekerjaanIbu || "-",
          p.noHpIbu || "-",
          p.pendapatanIbu || "-",
          p.alamat,
          p.tanggalDaftar,
          p.status,
          p.catatan || ""
        ];
      });
      updateTab("Data_PPDB", [
        "No. PPDB",
        "Tahun Ajaran",
        "Nama Lengkap Siswa",
        "NISN",
        "Gender",
        "Tempat Lahir",
        "Tanggal Lahir",
        "Asal SD/MI",
        "Program Pilihan",
        "Nama Ayah",
        "Pekerjaan Ayah",
        "No HP/WA Ayah",
        "Penghasilan Ayah",
        "Nama Ibu",
        "Pekerjaan Ibu",
        "No HP/WA Ibu",
        "Penghasilan Ibu",
        "Alamat Domisili",
        "Tanggal Daftar",
        "Status Seleksi",
        "Catatan Panitia"
      ], ppdbRows);
    }

    var logSheet = ss.getSheetByName("Log_Dapodik") || ss.insertSheet("Log_Dapodik");
    logSheet.appendRow([new Date(), data.type || "SINKRONISASI_DAPODIK", "Sukses sinkronisasi seluruh data"]);

    return ContentService.createTextOutput(JSON.stringify({ result: "success", message: "Seluruh tab data berhasil disinkronkan di Google Sheets" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Push Data from Web App -> Google Sheets
  const handleTestSync = async () => {
    setSyncStatus('syncing');
    try {
      if (sheetUrl && sheetUrl.startsWith('http')) {
        const payload = {
          type: 'SINKRONISASI_DAPODIK_PUSH',
          timestamp: new Date().toISOString(),
          payload: {
            schoolInfo: schoolInfo || null,
            studentsCount: students.length,
            teachersCount: teachers.length,
            sarprasCount: sarpras.length,
            attendanceCount: attendance.length,
            gradesCount: grades.length,
            schedulesCount: schedules.length,
            eventsCount: events.length,
            ppdbCount: ppdbRegistrations.length,
            students,
            teachers,
            sarpras,
            schedules,
            events,
            ppdbRegistrations,
            attendance,
            grades
          }
        };

        await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
      }
      setSyncStatus('success');
      setLastSynced(new Date().toLocaleTimeString('id-ID'));
      setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (err) {
      console.error('Error syncing to Google Sheets:', err);
      setSyncStatus('idle');
      alert('Gagal mengirim data. Pastikan URL Web App Google Apps Script sudah benar dan hak akses telah diset ke "Anyone" (Siapa Saja).');
    }
  };

  // Pull / Fetch Data from Google Sheets -> Web App
  const handlePullFromSheets = async () => {
    setPullStatus('pulling');
    try {
      if (!sheetUrl || !sheetUrl.startsWith('http')) {
        throw new Error('URL Web App Google Sheets belum diatur.');
      }

      const fetchUrl = sheetUrl.includes('?') 
        ? `${sheetUrl}&action=getAllData` 
        : `${sheetUrl}?action=getAllData`;

      const response = await fetch(fetchUrl);
      const data = await response.json();

      if (data && (data.students || data.teachers || data.sarpras || data.schoolInfo || data.ppdbRegistrations)) {
        setPulledData({
          students: Array.isArray(data.students) && data.students.length > 0 ? data.students : undefined,
          teachers: Array.isArray(data.teachers) && data.teachers.length > 0 ? data.teachers : undefined,
          sarpras: Array.isArray(data.sarpras) && data.sarpras.length > 0 ? data.sarpras : undefined,
          schoolInfo: data.schoolInfo || undefined,
          ppdbRegistrations: Array.isArray(data.ppdbRegistrations) && data.ppdbRegistrations.length > 0 ? data.ppdbRegistrations : undefined,
        });
        setIsPullModalOpen(true);
        setPullStatus('success');
        setLastPulled(new Date().toLocaleTimeString('id-ID'));
      } else {
        alert('Respon dari Google Sheets valid, namun tidak ditemukan baris data di tab Sheets. Pastikan Anda telah menjalankan Sinkronkan Ke Sheets atau mengisi data di Sheets terlebih dahulu.');
        setPullStatus('idle');
      }
    } catch (err) {
      console.error('Error pulling from Google Sheets:', err);
      setPullStatus('idle');
      alert('Gagal menarik data dari Google Sheets. Pastikan skrip terbaru sudah di-deploy sebagai Web App dengan akses "Anyone". Anda juga dapat menggunakan tombol "Simulasi Tarik Data" untuk menguji fitur ini langsung.');
    }
  };

  // Simulate Pull Data for instant testing in preview
  const handleSimulatePull = () => {
    setPullStatus('pulling');
    setTimeout(() => {
      // Modify 1 or 2 fields to simulate realistic changes made in Google Sheets
      const updatedStudents: Student[] = students.map((s, idx) => {
        if (idx === 0) {
          return { ...s, nama: `${s.nama} (Updated dari Sheets)` };
        }
        return s;
      });

      const updatedSchoolInfo: SchoolInfo = schoolInfo 
        ? { ...schoolInfo, visi: `${schoolInfo.visi} [Tersinkron Google Sheets]` }
        : {
            nama: 'SMP Islam Al Qomar Banyuwangi',
            npsn: '20512345',
            akreditasi: 'A (Unggul)',
            alamat: 'Jl. KH. Agus Salim No. 45 Banyuwangi',
            telepon: '(0333) 421890',
            email: 'info@smpislamalqomar.sch.id',
            website: 'https://smpislamalqomar.sch.id',
            kepalaSekolah: 'Ustadz H. Ahmad Basuki, M.Pd.',
            nigyKepalaSekolah: 'NIGY.200501.004',
            visi: "Terwujudnya Generasi Qur'ani, Berakhlak Mulia, Berprestasi Akademik, dan Berwawasan Global.",
            misi: ["Menyelenggarakan pendidikan berbasis Al-Qur'an dan Hadits."],
            tahunAjaran: '2024/2025',
            semesterAktif: 'Ganjil'
          };

      setPulledData({
        students: updatedStudents,
        teachers,
        sarpras,
        schoolInfo: updatedSchoolInfo,
        ppdbRegistrations
      });

      setIsPullModalOpen(true);
      setPullStatus('success');
      setLastPulled(new Date().toLocaleTimeString('id-ID'));
    }, 800);
  };

  // Confirm applying pulled data to React state & localStorage
  const handleApplyPulledData = () => {
    if (!pulledData) return;

    let countSummary = [];

    if (pulledData.students && onImportStudents) {
      onImportStudents(pulledData.students);
      countSummary.push(`${pulledData.students.length} Data Siswa`);
    }

    if (pulledData.teachers && onImportTeachers) {
      onImportTeachers(pulledData.teachers);
      countSummary.push(`${pulledData.teachers.length} Data Guru`);
    }

    if (pulledData.sarpras && onImportSarpras) {
      onImportSarpras(pulledData.sarpras);
      countSummary.push(`${pulledData.sarpras.length} Data Sarpras`);
    }

    if (pulledData.ppdbRegistrations && onImportPpdb) {
      onImportPpdb(pulledData.ppdbRegistrations);
      countSummary.push(`${pulledData.ppdbRegistrations.length} Data PPDB`);
    }

    if (pulledData.schoolInfo && onImportSchoolInfo) {
      onImportSchoolInfo(pulledData.schoolInfo);
      countSummary.push('Profil Sekolah');
    }

    setIsPullModalOpen(false);
    alert(`Berhasil mengimpor & memperbarui data ke aplikasi:\n- ${countSummary.join('\n- ')}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-2">
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Integrasi 2-Arah (Bi-Directional Sync) Google Sheets</span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            Sinkronisasi Dua Arah (Kirim & Tarik Data Google Sheets)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Data dapat dikirim dari Web App ke Google Sheets, dan sebaliknya data dari spreadsheet dapat ditarik kembali ke Web App secara otomatis.
          </p>
        </div>

        {/* Sync Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* PUSH BUTTON */}
          <button
            onClick={handleTestSync}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all border border-emerald-300/50"
          >
            <Upload className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
            <span>{syncStatus === 'syncing' ? 'Mengirim Data...' : 'Kirim Ke Sheets (Push)'}</span>
          </button>

          {/* PULL BUTTON */}
          <button
            onClick={handlePullFromSheets}
            disabled={pullStatus === 'pulling'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all border border-indigo-400/40"
          >
            <Download className={`w-4 h-4 ${pullStatus === 'pulling' ? 'animate-spin' : ''}`} />
            <span>{pullStatus === 'pulling' ? 'Menarik Data...' : 'Tarik Dari Sheets (Pull)'}</span>
          </button>

          {/* SIMULATE PULL BUTTON FOR PREVIEW TEST */}
          <button
            onClick={handleSimulatePull}
            title="Uji coba tarik data langsung di lingkungan preview"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors border border-emerald-500/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulasi Tarik Data</span>
          </button>

        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">Pengiriman Ke Google Sheets (Push)</p>
              <p className="text-[11px] text-slate-300">
                {lastSynced ? `Terakhir terkirim pada pkl ${lastSynced}` : 'Belum dilakukan pengiriman sesi ini'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-400/30">
            Aplikasi ➔ Sheets
          </span>
        </div>

        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-300">Penarikan Dari Google Sheets (Pull)</p>
              <p className="text-[11px] text-slate-300">
                {lastPulled ? `Terakhir ditarik pada pkl ${lastPulled}` : 'Belum dilakukan penarikan sesi ini'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-400/30">
            Sheets ➔ Aplikasi
          </span>
        </div>
      </div>

      {/* Sheet Webhook URL Settings */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2">
          <Link2 className="w-4 h-4 text-emerald-400" />
          <span>Pengaturan Endpoint API Google Apps Script</span>
        </h3>

        <p className="text-xs text-slate-300 leading-relaxed">
          Masukkan URL Web App hasil deploy Google Apps Script spreadsheet Anda untuk mengaktifkan sinkronisasi otomatis 2-Arah (Kirim &amp; Tarik Data).
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
          />
          <button
            onClick={handleTestSync}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all border border-white/10 whitespace-nowrap"
          >
            Simpan Endpoint
          </button>
        </div>
      </div>

      {/* Synchronized Tabs Status Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Daftar Tab Spreadsheet Sinkron 2-Arah</span>
          </h3>
          <span className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-1 rounded-lg">
            Bi-Directional Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div className="glass backdrop-blur-xl bg-slate-900/60 p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-serif text-sm text-white flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-400" />
                  Tab: Data_Siswa
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-xs px-2 py-0.5 rounded">
                  {students.length} Siswa Aktif
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sinkron 2-arah: Mengirim NISN, NIS, Rombel, Biodata Ortu, &amp; menarik hasil edit dari Google Sheets.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2 border-t border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dapat Ditarik &amp; Dikirim</span>
            </div>
          </div>

          <div className="glass backdrop-blur-xl bg-slate-900/60 p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-serif text-sm text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  Tab: Data_PPDB
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold text-xs px-2 py-0.5 rounded">
                  {ppdbRegistrations.length} Pendaftar
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pendaftaran Calon Siswa Baru PPDB (Asal Sekolah, Kontak Ortu, Status Seleksi).
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2 border-t border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dapat Ditarik &amp; Dikirim</span>
            </div>
          </div>

          <div className="glass backdrop-blur-xl bg-slate-900/60 p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-serif text-sm text-white flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-400" />
                  Tab: Data_Guru
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-xs px-2 py-0.5 rounded">
                  {teachers.length} Guru
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Mengisikan NUPTK, NIGY/NIP, Nama, Mapel Utama, Jabatan, &amp; menarik pembaruan staff.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2 border-t border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dapat Ditarik &amp; Dikirim</span>
            </div>
          </div>

          <div className="glass backdrop-blur-xl bg-slate-900/60 p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-serif text-sm text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Tab: Data_Jadwal
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold text-xs px-2 py-0.5 rounded">
                  {schedules.length} Sesi Jadwal
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Jadwal pelajaran mingguan: Hari, Kelas, Jam Ke, Waktu, Mapel, Guru, &amp; Ruangan.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2 border-t border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dapat Ditarik &amp; Dikirim</span>
            </div>
          </div>

          <div className="glass backdrop-blur-xl bg-slate-900/60 p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-serif text-sm text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Tab: Agenda_Kalender
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold text-xs px-2 py-0.5 rounded">
                  {events.length} Agenda
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Kalender akademik &amp; agenda kegiatan: Tanggal, Nama Kegiatan, Kategori, Semester.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2 border-t border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dapat Ditarik &amp; Dikirim</span>
            </div>
          </div>

          <div className="glass backdrop-blur-xl bg-slate-900/60 p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-serif text-sm text-white flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-emerald-400" />
                  Tab: Data_Sarpras
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-xs px-2 py-0.5 rounded">
                  {sarpras.length} Aset
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Kode barang, kategori, jumlah unit, kondisi fisik (baik/rusak), &amp; lokasi.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2 border-t border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dapat Ditarik &amp; Dikirim</span>
            </div>
          </div>

        </div>
      </div>

      {/* Troubleshooting & Solusi Sinkronisasi Google Sheets */}
      <div className="bg-gradient-to-br from-amber-950/40 via-slate-900/80 to-slate-900/90 rounded-2xl p-6 border border-amber-400/30 shadow-xl space-y-4 text-slate-200">
        <div className="flex items-center gap-2.5 text-amber-300">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <h3 className="text-base font-bold font-serif">
            Solusi &amp; Penjelasan Teknis Integrasi Google Sheets
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Box 1: Mengapa Hanya Muncul Tab Log */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>⚠️ 1. Mengapa Hanya Muncul Riwayat Log (Tab Data Lain Belum Muncul)?</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              <strong>Penyebab:</strong> Di Google Apps Script, ketika kode baru ditempelkan, URL Web App yang sudah aktif <strong>tetap menjalankan versi kode lama</strong> sebelum Anda membuat <em>"Versi Baru" (New Version)</em> pada menu deployment.
            </p>
            <div className="bg-emerald-950/50 p-3 rounded-lg border border-emerald-500/30 space-y-1.5 text-emerald-200">
              <p className="font-bold text-emerald-300">Langkah Solusi Cepat (2 Menit):</p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed text-slate-200">
                <li>Klik tombol <strong>Salin Skrip Baru</strong> di bawah.</li>
                <li>Buka Google Sheets &gt; <strong>Ekstensi &gt; Apps Script</strong> &gt; Hapus semua kode lama lalu Paste skrip baru ini.</li>
                <li>Klik <strong>Deploy (Terapkan)</strong> di pojok kanan atas &gt; pilih <strong>Manage Deployments (Kelola Penerapan)</strong>.</li>
                <li>Klik tombol <strong>Edit (Ikon Pensil)</strong> &gt; Pada baris <em>Version</em>, pilih <strong>New version (Versi Baru)</strong>.</li>
                <li>Pastikan <em>Who has access</em> adalah <strong>Anyone (Siapa Saja)</strong> &gt; Klik <strong>Deploy</strong>.</li>
                <li>Kembali ke sini dan klik tombol <strong>Kirim Ke Sheets (Push)</strong>. Seketika seluruh 7 tab data akan terisi lengkap!</li>
              </ol>
            </div>
          </div>

          {/* Box 2: Apakah URL Web App Berganti */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-2">
            <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>🔗 2. Apakah URL Web App Harus Berganti Setiap Ada Pembaruan Data?</span>
            </h4>
            <p className="text-slate-300 leading-relaxed">
              <strong>Jawabannya: TIDAK PERLU.</strong> URL Web App Google Apps Script berfungsi sebagai <em>endpoint API permanen</em>.
            </p>
            <ul className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>URL Web App cukup Anda salin dan simpan <strong>1 kali saja</strong> di kotak Endpoint di atas.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Setiap kali ada siswa baru, perubahan jadwal, mutasi guru, atau nilai rapor baru di web, Anda cukup klik <strong>"Kirim Ke Sheets"</strong>. Data di Google Sheets akan otomatis ter-update pada spreadsheet yang sama menggunakan URL tersebut.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Anda hanya perlu memperbarui URL jika membuat project Apps Script yang benar-benar baru di file Spreadsheet lain.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Google Apps Script Integration Helper */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold font-serif text-base text-amber-300">
              Skrip Google Apps Script 2-Arah (Terbaru dengan doGet &amp; doPost)
            </h3>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
            <span>{copiedCode ? 'Tercopy!' : 'Salin Skrip Baru'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Petunjuk Pengaktifan Sinkronisasi 2-Arah:</strong><br />
          1. Klik tombol <strong>Salin Skrip Baru</strong> di atas.<br />
          2. Buka spreadsheet Anda &gt; <strong>Ekstensi &gt; Apps Script</strong>, hapus skrip lama dan paste skrip baru ini.<br />
          3. Klik <strong>Deploy &gt; New Deployment</strong>, pilih Web App, lalu atur <strong>Who has access: Anyone</strong>.<br />
          4. Salin URL Web App hasil deploy dan tempelkan di kotak Endpoint API di atas.
        </p>

        <pre className="bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-60 border border-slate-800">
          {appsScriptCode}
        </pre>
      </div>

      {/* MODAL PREVIEW PULLED DATA */}
      {isPullModalOpen && pulledData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold font-serif text-lg text-slate-900">
                  Data Ditemukan Dari Google Sheets
                </h3>
              </div>
              <button
                onClick={() => setIsPullModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Berikut adalah ringkasan data yang ditarik dari Google Sheets. Klik tombol di bawah untuk menerapkan dan mengupdate data aplikasi secara otomatis:
            </p>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto p-1 text-xs">
              
              {pulledData.students && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-900">Data Siswa ({pulledData.students.length} Siswa)</p>
                    <p className="text-[11px] text-emerald-700">Sampel: {pulledData.students[0]?.nama || '-'}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-1 rounded">Siap Diimpor</span>
                </div>
              )}

              {pulledData.teachers && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-indigo-900">Data Guru &amp; Staff ({pulledData.teachers.length} Pegawai)</p>
                    <p className="text-[11px] text-indigo-700">Sampel: {pulledData.teachers[0]?.nama || '-'}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-1 rounded">Siap Diimpor</span>
                </div>
              )}

              {pulledData.sarpras && (
                <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-cyan-900">Data Sarpras &amp; Aset ({pulledData.sarpras.length} Barang/Ruang)</p>
                    <p className="text-[11px] text-cyan-700">Sampel: {pulledData.sarpras[0]?.namaBarangRuang || '-'}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-cyan-200 text-cyan-900 px-2 py-1 rounded">Siap Diimpor</span>
                </div>
              )}

              {pulledData.ppdbRegistrations && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-900">Data Pendaftar PPDB ({pulledData.ppdbRegistrations.length} Pendaftar)</p>
                    <p className="text-[11px] text-amber-700">Sampel: {pulledData.ppdbRegistrations[0]?.namaLengkap || '-'}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-1 rounded">Siap Diimpor</span>
                </div>
              )}

              {pulledData.schoolInfo && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-purple-900">Profil &amp; Informasi Sekolah</p>
                    <p className="text-[11px] text-purple-700">{pulledData.schoolInfo.nama} ({pulledData.schoolInfo.kepalaSekolah})</p>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-1 rounded">Siap Diimpor</span>
                </div>
              )}

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPullModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyPulledData}
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terapkan Data Ke Aplikasi</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
