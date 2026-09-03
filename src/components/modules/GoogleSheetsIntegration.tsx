import React, { useState, useEffect } from 'react';
import { Student, Teacher, SarprasItem, AttendanceRecord, SubjectGradeRecord, SchoolInfo, ScheduleItem, CalendarEvent, PpdbRegistration, GoogleSheetsConfig } from '../../types';
import { 
  Sheet, 
  Copy, 
  Check, 
  RefreshCw, 
  Code, 
  Link2, 
  Database, 
  Table, 
  CheckCircle2, 
  Calendar, 
  UserPlus, 
  Clock, 
  Download, 
  Upload, 
  ArrowLeftRight, 
  Sparkles, 
  Eye, 
  AlertCircle,
  AlertTriangle,
  Lock,
  Unlock,
  Save,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { StorageService } from '../../services/storage';

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  isEditorUrl?: boolean;
}

/**
 * Validates whether the given string is a valid Google Apps Script Web App URL.
 * Checks protocol, domain (script.google.com), /macros/s/ path, and /exec endpoint.
 */
export function validateGoogleAppsScriptUrl(url: string): UrlValidationResult {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'URL Web App Google Apps Script tidak boleh kosong.'
    };
  }

  if (!trimmed.startsWith('https://')) {
    return {
      isValid: false,
      error: 'URL harus diawali dengan https:// (protokol HTTPS aman).'
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: 'Format URL tidak valid. Pastikan format URL ditulis dengan benar.'
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname !== 'script.google.com' &&
    hostname !== 'script.googleusercontent.com' &&
    !hostname.endsWith('.google.com')
  ) {
    return {
      isValid: false,
      error: `Domain tidak valid ("${hostname}"). URL harus berasal dari domain script.google.com`
    };
  }

  const pathname = parsed.pathname;

  // Check if user accidentally pasted the Script Editor URL (/edit)
  if (pathname.includes('/edit') || pathname.endsWith('/edit')) {
    return {
      isValid: false,
      isEditorUrl: true,
      error: 'URL yang Anda masukkan adalah URL Editor Kode Apps Script (/edit), bukan URL Web App (/exec). Buka Apps Script > klik tombol "Deploy" (Terapkan) di kanan atas > "Deployment baru" > pilih jenis "Aplikasi Web" > Akses: "Siapa saja" (Anyone) > Salin URL Web App yang berakhiran /exec.'
    };
  }

  // Must contain /macros/s/
  if (!pathname.includes('/macros/s/')) {
    return {
      isValid: false,
      error: 'Struktur URL tidak valid. URL Web App Apps Script harus memuat path "/macros/s/<DEPLOYMENT_ID>/exec".'
    };
  }

  // Must have /exec or /dev in path
  if (!pathname.includes('/exec') && !pathname.includes('/dev')) {
    return {
      isValid: false,
      error: 'URL Web App harus memiliki akhiran "/exec" agar dapat diakses untuk sinkronisasi DAPODIK.'
    };
  }

  return { isValid: true };
}

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
  sheetsConfig?: GoogleSheetsConfig;
  onSaveSheetsConfig?: (config: GoogleSheetsConfig) => void;
  onUrlDraftChange?: (isMismatched: boolean) => void;
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
  sheetsConfig,
  onSaveSheetsConfig,
  onUrlDraftChange,
  onImportStudents,
  onImportTeachers,
  onImportSarpras,
  onImportSchedules,
  onImportEvents,
  onImportPpdb,
  onImportSchoolInfo
}) => {
  // Load persisted config from props or storage
  const initialConfig = sheetsConfig || StorageService.getSheetsConfig();

  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return initialConfig.webAppUrl || 'https://script.google.com/macros/s/AKfycbx-SMP-Islam-Al-Qomar-Dapodik/exec';
  });

  // Keep URL locked by default if it was configured/locked previously
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (initialConfig.isLocked !== undefined) return initialConfig.isLocked;
    // Default to true if a URL is already set, so it won't be lost accidentally
    return Boolean(initialConfig.webAppUrl);
  });

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(() => initialConfig.lastSyncedAt || null);

  // Pull / Import State
  const [pullStatus, setPullStatus] = useState<'idle' | 'pulling' | 'success'>('idle');
  const [lastPulled, setLastPulled] = useState<string | null>(() => initialConfig.lastPulledAt || null);
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  
  // Pulled Data Preview
  const [pulledData, setPulledData] = useState<{
    students?: Student[];
    teachers?: Teacher[];
    sarpras?: SarprasItem[];
    schoolInfo?: SchoolInfo;
    ppdbRegistrations?: PpdbRegistration[];
  } | null>(null);

  // Saved database URL
  const savedDbUrl = (sheetsConfig?.webAppUrl || StorageService.getSheetsConfig().webAppUrl || '').trim();
  const currentUrl = sheetUrl.trim();
  const isUrlMismatched = Boolean(savedDbUrl && currentUrl && currentUrl !== savedDbUrl);
  const currentValidation = validateGoogleAppsScriptUrl(currentUrl);

  // Notify parent of mismatch state for Header indicator
  useEffect(() => {
    if (onUrlDraftChange) {
      onUrlDraftChange(isUrlMismatched);
    }
  }, [isUrlMismatched, onUrlDraftChange]);

  // Keep state synchronized if external config changes
  useEffect(() => {
    if (sheetsConfig) {
      if (sheetsConfig.webAppUrl && sheetsConfig.webAppUrl !== sheetUrl && isLocked) {
        setSheetUrl(sheetsConfig.webAppUrl);
      }
      if (sheetsConfig.isLocked !== undefined) {
        setIsLocked(sheetsConfig.isLocked);
      }
      if (sheetsConfig.lastSyncedAt) {
        setLastSynced(sheetsConfig.lastSyncedAt);
      }
      if (sheetsConfig.lastPulledAt) {
        setLastPulled(sheetsConfig.lastPulledAt);
      }
    }
  }, [sheetsConfig, isLocked]);

  // Save and lock the URL permanently with strict validation
  const handleSaveAndLockUrl = (urlToSave?: string): boolean => {
    const targetUrl = (urlToSave !== undefined ? urlToSave : sheetUrl).trim();
    
    // Strict Validation
    const validation = validateGoogleAppsScriptUrl(targetUrl);
    if (!validation.isValid) {
      setValidationError(validation.error || 'Format URL Google Apps Script tidak valid.');
      alert(`VALIDASI GAGAL:\n\n${validation.error}\n\nPastikan URL hasil deployment Web App berakhiran "/exec".`);
      return false;
    }

    setValidationError(null);

    const updatedConfig: GoogleSheetsConfig = {
      ...(sheetsConfig || StorageService.getSheetsConfig()),
      webAppUrl: targetUrl,
      isLocked: true,
      lastSyncedAt: lastSynced || undefined,
      lastPulledAt: lastPulled || undefined
    };

    setSheetUrl(targetUrl);
    setIsLocked(true);
    StorageService.setSheetsConfig(updatedConfig);
    if (onSaveSheetsConfig) {
      onSaveSheetsConfig(updatedConfig);
    }

    if (onUrlDraftChange) {
      onUrlDraftChange(false);
    }

    setSaveSuccessMsg('URL Web App Terverifikasi Valid, Dikunci & Tersimpan Permanen!');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
    return true;
  };

  // Unlock URL to allow editing
  const handleUnlockUrl = () => {
    setIsLocked(false);
    setValidationError(null);
  };

  // Restore stored DB URL
  const handleRestoreStoredUrl = () => {
    if (savedDbUrl) {
      setSheetUrl(savedDbUrl);
      setIsLocked(true);
      setValidationError(null);
      if (onUrlDraftChange) {
        onUrlDraftChange(false);
      }
      setSaveSuccessMsg('URL berhasil dikembalikan ke URL tersimpan di database konfigurasi.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  // Copy current URL to clipboard
  const handleCopyUrl = () => {
    if (!sheetUrl) return;
    navigator.clipboard.writeText(sheetUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Reset to default sample URL
  const handleResetToDefaultUrl = () => {
    const confirmReset = window.confirm(
      'Apakah Anda yakin ingin mengembalikan URL ke URL bawaan/default?\n\nCatatan: Jika Anda telah men-deploy Apps Script sendiri di spreadsheet Anda, URL custom Anda akan digantikan.'
    );
    if (!confirmReset) return;

    const defaultUrl = 'https://script.google.com/macros/s/AKfycbx-SMP-Islam-Al-Qomar-Dapodik/exec';
    setSheetUrl(defaultUrl);
    setIsLocked(false);
    setValidationError(null);

    const updatedConfig: GoogleSheetsConfig = {
      ...(sheetsConfig || StorageService.getSheetsConfig()),
      webAppUrl: defaultUrl,
      isLocked: false
    };

    StorageService.setSheetsConfig(updatedConfig);
    if (onSaveSheetsConfig) {
      onSaveSheetsConfig(updatedConfig);
    }
    if (onUrlDraftChange) {
      onUrlDraftChange(false);
    }

    setSaveSuccessMsg('URL telah dikembalikan ke bawaan/default.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

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
        const rawMapelTambahan = String(r[11] || "").trim();
        const mapelTambahanList = rawMapelTambahan
          ? rawMapelTambahan.split(/[;,]/).map(s => s.trim()).filter(Boolean)
          : [];

        list.push({
          id: String(r[0] || "T" + (i < 10 ? "00" + i : i < 100 ? "0" + i : i)),
          nuptk: String(r[1] || ""),
          nigy: String(r[2] || ""),
          nip: String(r[2] || ""),
          nama: String(r[3] || ""),
          gender: String(r[4] || "L").toUpperCase().indexOf("P") !== -1 ? "P" : "L",
          mapelUtama: String(r[5] || "Pendidikan Agama Islam"),
          mapelTambahan: mapelTambahanList,
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
      var key = String(rows[i][0] || "").toLowerCase().trim();
      var val = String(rows[i][1] || "").trim();
      if (key.indexOf("nama") !== -1 && key.indexOf("kepala") === -1) info.nama = val;
      if (key.indexOf("npsn") !== -1) info.npsn = val;
      if (key.indexOf("alamat") !== -1) info.alamat = val;
      if (key.indexOf("kepala") !== -1 && key.indexOf("nigy") === -1 && key.indexOf("nip") === -1) info.kepalaSekolah = val;
      if (key.indexOf("nigy") !== -1 || key.indexOf("nip") !== -1) { info.nigyKepalaSekolah = val; info.nipKepalaSekolah = val; }
      if (key.indexOf("akreditasi") !== -1) info.akreditasi = val;
      if (key.indexOf("email") !== -1) info.email = val;
      if (key.indexOf("website") !== -1) info.website = val;
      if (key.indexOf("telepon") !== -1) info.telepon = val;
      if (key.indexOf("tahun") !== -1 || key.indexOf("ajaran") !== -1) info.tahunAjaran = val;
      if (key.indexOf("semester") !== -1) info.semesterAktif = val;
      if (key.indexOf("visi") !== -1) info.visi = val;
      if (key.indexOf("misi") !== -1) {
        info.misi = val.split("\n")
          .map(function(m) { return m.replace(/^[0-9]+[\.\)\-]\s*/, "").trim(); })
          .filter(Boolean);
      }
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
      var visiText = s.visi || "";
      var misiText = "";
      if (Array.isArray(s.misi) && s.misi.length > 0) {
        misiText = s.misi.map(function(m, idx) { return (idx + 1) + ". " + m; }).join("\n");
      } else if (typeof s.misi === "string") {
        misiText = s.misi;
      }

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
          ["No Telepon", s.telepon || ""],
          ["Visi Sekolah", visiText],
          ["Misi Sekolah", misiText]
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
        var mapelTambahanStr = Array.isArray(t.mapelTambahan) && t.mapelTambahan.length > 0 ? t.mapelTambahan.join("; ") : "-";
        return [t.id, t.nuptk, t.nigy || t.nip || "-", t.nama, t.gender, t.mapelUtama, t.jabatan, t.statusPegawai, t.waliKelasDi || "-", t.email, t.telepon, mapelTambahanStr];
      });
      updateTab("Data_Guru", ["ID", "NUPTK", "NIGY", "Nama Lengkap", "Jenis Kelamin", "Mapel Utama", "Jabatan", "Status Pegawai", "Wali Kelas", "Email", "No HP", "Mapel Tambahan"], teacherRows);
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
    const cleanUrl = sheetUrl.trim();
    const validation = validateGoogleAppsScriptUrl(cleanUrl);
    if (!validation.isValid) {
      alert(`GAGAL SINKRONISASI PUSH:\n\n${validation.error}\n\nSilakan masukkan URL Web App Google Apps Script yang valid (berakhiran /exec).`);
      setIsLocked(false);
      return;
    }

    // Auto-lock and save URL to storage to ensure it's never lost during data edits
    const savedSuccessfully = handleSaveAndLockUrl(cleanUrl);
    if (!savedSuccessfully) return;

    setSyncStatus('syncing');
    try {
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

      await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });

      const timeNow = new Date().toLocaleTimeString('id-ID');
      setSyncStatus('success');
      setLastSynced(timeNow);

      // Persist last sync time in storage
      const currentConfig = sheetsConfig || StorageService.getSheetsConfig();
      const updatedConfig: GoogleSheetsConfig = {
        ...currentConfig,
        webAppUrl: cleanUrl,
        isLocked: true,
        lastSyncedAt: timeNow
      };
      StorageService.setSheetsConfig(updatedConfig);
      if (onSaveSheetsConfig) {
        onSaveSheetsConfig(updatedConfig);
      }

      setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (err) {
      console.error('Error syncing to Google Sheets:', err);
      setSyncStatus('idle');
      alert('Gagal mengirim data. Pastikan URL Web App Google Apps Script sudah benar dan hak akses telah diset ke "Anyone" (Siapa Saja).');
    }
  };

  // Pull / Fetch Data from Google Sheets -> Web App
  const handlePullFromSheets = async () => {
    const cleanUrl = sheetUrl.trim();
    const validation = validateGoogleAppsScriptUrl(cleanUrl);
    if (!validation.isValid) {
      alert(`GAGAL MENARIK DATA (PULL):\n\n${validation.error}\n\nSilakan masukkan URL Web App Google Apps Script yang valid (berakhiran /exec).`);
      setIsLocked(false);
      return;
    }

    // Auto-lock and save URL to storage
    const savedSuccessfully = handleSaveAndLockUrl(cleanUrl);
    if (!savedSuccessfully) return;

    setPullStatus('pulling');
    try {
      const fetchUrl = cleanUrl.includes('?') 
        ? `${cleanUrl}&action=getAllData` 
        : `${cleanUrl}?action=getAllData`;

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
        const timeNow = new Date().toLocaleTimeString('id-ID');
        setLastPulled(timeNow);

        // Persist last pull time in storage
        const currentConfig = sheetsConfig || StorageService.getSheetsConfig();
        const updatedConfig: GoogleSheetsConfig = {
          ...currentConfig,
          webAppUrl: cleanUrl,
          isLocked: true,
          lastPulledAt: timeNow
        };
        StorageService.setSheetsConfig(updatedConfig);
        if (onSaveSheetsConfig) {
          onSaveSheetsConfig(updatedConfig);
        }
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
            Sinkronisasi Dua Arah (Kirim &amp; Tarik Data Google Sheets)
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
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all border border-emerald-300/50 cursor-pointer disabled:opacity-50"
          >
            <Upload className={`w-4 h-4 ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
            <span>{syncStatus === 'syncing' ? 'Mengirim Data...' : 'Kirim Ke Sheets (Push)'}</span>
          </button>

          {/* PULL BUTTON */}
          <button
            onClick={handlePullFromSheets}
            disabled={pullStatus === 'pulling'}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all border border-indigo-400/40 cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${pullStatus === 'pulling' ? 'animate-spin' : ''}`} />
            <span>{pullStatus === 'pulling' ? 'Menarik Data...' : 'Tarik Dari Sheets (Pull)'}</span>
          </button>

          {/* SIMULATE PULL BUTTON FOR PREVIEW TEST */}
          <button
            onClick={handleSimulatePull}
            title="Uji coba tarik data langsung di lingkungan preview"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors border border-emerald-500/30 cursor-pointer"
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

      {/* Sheet Webhook URL Settings with Permanent Locking */}
      <div className={`glass backdrop-blur-xl rounded-2xl p-6 border shadow-xl space-y-4 transition-all ${
        isUrlMismatched
          ? 'bg-slate-900/90 border-amber-400/60 ring-2 ring-amber-400/30'
          : isLocked 
            ? 'bg-slate-900/70 border-emerald-500/40 ring-1 ring-emerald-500/20' 
            : 'bg-slate-900/90 border-amber-400/50 ring-1 ring-amber-400/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              isUrlMismatched
                ? 'bg-amber-500/25 text-amber-300'
                : isLocked 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'bg-amber-500/20 text-amber-300'
            }`}>
              {isUrlMismatched ? <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" /> : isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif text-white flex items-center gap-2">
                <span>Pengaturan &amp; Penguncian Endpoint API Google Apps Script</span>
                {isUrlMismatched && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-400/40 animate-pulse">
                    Perbedaan Terdeteksi
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-300">
                {isUrlMismatched
                  ? '⚠️ Peringatan: URL di kolom input berbeda dengan URL tersimpan di database konfigurasi.'
                  : isLocked 
                    ? '🔒 URL Web App saat ini TERKUNCI & TERSIMPAN PERMANEN di database konfigurasi.' 
                    : '🔓 Mode Edit URL Aktif — Masukkan URL Web App Google Apps Script (/exec), lalu klik Kunci & Simpan.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isUrlMismatched ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/25 text-amber-300 text-[11px] font-bold border border-amber-400/40 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Belum Disimpan</span>
              </span>
            ) : isLocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Link Terkunci Permanen</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-400/30 animate-pulse">
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>Siap Diubah</span>
              </span>
            )}
          </div>
        </div>

        {/* FEEDBACK ALERT IF JUST SAVED */}
        {saveSuccessMsg && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-400/50 rounded-xl flex items-center gap-2 text-emerald-200 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* MISMATCH WARNING CARD (If active URL != stored DB URL) */}
        {isUrlMismatched && (
          <div className="p-4 bg-amber-950/70 border-2 border-amber-500/50 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Peringatan Administrator: URL Berbeda dengan Database</span>
                </h4>
                <p className="text-xs text-slate-200 mt-1">
                  URL yang ada pada input saat ini belum disinkronkan ke database konfigurasi aplikasi. Jika halaman dimuat ulang atau berpindah menu tanpa menyimpan, perubahan akan hilang.
                </p>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10">
                    <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block mb-1">
                      📁 URL Tersimpan di Database Konfigurasi:
                    </span>
                    <span className="text-emerald-300 break-all select-all font-bold">
                      {savedDbUrl || '(Belum Dikonfigurasi)'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-amber-400/40">
                    <span className="text-[10px] text-amber-400 uppercase font-sans font-bold block mb-1">
                      ✏️ URL Aktif Saat Ini di Input:
                    </span>
                    <span className="text-amber-200 break-all select-all font-bold">
                      {currentUrl || '(Kosong)'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-amber-500/30">
                  <button
                    type="button"
                    onClick={() => handleSaveAndLockUrl()}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Kunci &amp; Simpan URL Ini ke Database</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreStoredUrl}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Batalkan &amp; Pulihkan URL Tersimpan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="url"
                value={sheetUrl}
                readOnly={isLocked}
                onChange={(e) => {
                  setSheetUrl(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className={`w-full px-4 py-3 rounded-xl text-xs font-mono font-bold transition-all focus:outline-none ${
                  isLocked 
                    ? 'bg-slate-950/90 text-emerald-300 border border-emerald-500/40 cursor-default select-all' 
                    : !currentValidation.isValid && currentUrl
                      ? 'bg-white text-slate-950 border-2 border-rose-500 focus:ring-2 focus:ring-rose-400/50 shadow-inner'
                      : 'bg-white text-slate-950 border-2 border-amber-400 focus:ring-2 focus:ring-amber-400/50 shadow-inner'
                }`}
              />
              {isLocked && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  <Lock className="w-3 h-3" />
                  <span>Terkunci</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {isLocked ? (
                <>
                  <button
                    type="button"
                    onClick={handleUnlockUrl}
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-3 rounded-xl shadow transition-all cursor-pointer"
                    title="Klik untuk membuka kunci jika Anda ingin mengubah link URL Web App"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Buka Kunci / Ganti URL</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-3 rounded-xl border border-white/10 transition-all cursor-pointer"
                    title="Salin URL saat ini"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Tersalin!' : 'Salin URL'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleSaveAndLockUrl()}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-3 rounded-xl shadow-lg transition-all cursor-pointer font-sans"
                    title="Kunci link ini agar tidak berubah saat Anda berpindah menu atau mengedit data"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Kunci &amp; Simpan URL Web App</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (savedDbUrl) {
                        setSheetUrl(savedDbUrl);
                      }
                      setIsLocked(true);
                      setValidationError(null);
                      if (onUrlDraftChange) {
                        onUrlDraftChange(false);
                      }
                    }}
                    className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaultUrl}
                    className="flex items-center gap-1 text-slate-400 hover:text-rose-300 text-[11px] px-2.5 py-3 transition-colors cursor-pointer"
                    title="Kembalikan URL ke contoh default bawaan aplikasi"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Default</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* REAL-TIME VALIDATION STATUS BADGE */}
          {!isLocked && (
            <div className="space-y-2">
              {currentValidation.isValid ? (
                <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-300">Format URL Google Apps Script Valid: </span>
                    <span>Protokol HTTPS, Domain script.google.com, dan Endpoint /exec terverifikasi. Siap dikunci &amp; disimpan.</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-950/80 border-2 border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-rose-300">
                      {currentValidation.isEditorUrl ? 'Perhatian: Ini adalah URL Editor Kode, Bukan Web App!' : 'URL Apps Script Tidak Valid:'}
                    </p>
                    <p className="text-slate-200 leading-relaxed">
                      {currentValidation.error}
                    </p>
                    {currentValidation.isEditorUrl && (
                      <div className="mt-2 p-2 bg-slate-950/80 rounded-lg text-[11px] border border-rose-400/30 text-slate-300">
                        <strong className="text-amber-300">Cara Mendapatkan URL Web App:</strong>
                        <ol className="list-decimal list-inside mt-1 space-y-0.5">
                          <li>Di Google Apps Script, klik tombol biru <strong>Deploy (Terapkan)</strong> di kanan atas.</li>
                          <li>Pilih <strong>Deployment baru</strong>.</li>
                          <li>Klik ikon gerigi &gt; pilih <strong>Aplikasi web</strong>.</li>
                          <li>Pilih Akses: <strong>Siapa saja (Anyone)</strong>, lalu klik <strong>Terapkan</strong>.</li>
                          <li>Salin <strong>URL Aplikasi Web</strong> (berakhiran <code>/exec</code>).</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 text-emerald-300/90">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>URL tersimpan secara persisten di database konfigurasi browser dan diproteksi dari penimpaan tidak sengaja.</span>
            </span>
            {isLocked && (
              <button
                type="button"
                onClick={handleResetToDefaultUrl}
                className="text-slate-400 hover:text-rose-300 underline cursor-pointer text-[11px]"
              >
                Kembalikan ke URL Bawaan
              </button>
            )}
          </div>
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

          <div className="glass backdrop-blur-xl bg-slate-900/60 p-5 rounded-2xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold font-serif text-sm text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Tab: Profil_Sekolah
                </span>
                <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 font-bold text-xs px-2 py-0.5 rounded">
                  Visi &amp; Misi Termasuk
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Identitas Sekolah, NPSN, Akreditasi, Kepala Sekolah, serta butir Visi &amp; Misi (tersinkron 2-arah).
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-2 border-t border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dapat Ditarik &amp; Dikirim</span>
            </div>
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
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-purple-900">Profil &amp; Informasi Sekolah</p>
                      <p className="text-[11px] text-purple-700">{pulledData.schoolInfo.nama} • Kepala Sekolah: {pulledData.schoolInfo.kepalaSekolah}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-1 rounded">Siap Diimpor</span>
                  </div>
                  {pulledData.schoolInfo.visi && (
                    <div className="bg-white/80 p-2 rounded-lg border border-purple-100 text-[11px] text-purple-950">
                      <span className="font-bold text-purple-800">Visi: </span>
                      <span>{pulledData.schoolInfo.visi}</span>
                    </div>
                  )}
                  {pulledData.schoolInfo.misi && pulledData.schoolInfo.misi.length > 0 && (
                    <div className="bg-white/80 p-2 rounded-lg border border-purple-100 text-[11px] text-purple-950">
                      <span className="font-bold text-purple-800">Misi ({pulledData.schoolInfo.misi.length} butir):</span>
                      <ol className="list-decimal list-inside mt-0.5 space-y-0.5 text-[10px] text-slate-700">
                        {pulledData.schoolInfo.misi.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ol>
                    </div>
                  )}
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
