import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { SchoolInfo, Student, Teacher, ScheduleItem, SarprasItem, GoogleSheetsConfig } from '../../types';
import { 
  Database, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  FileJson, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  School, 
  Share2,
  FileSpreadsheet,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface MasterDataBackupViewProps {
  schoolInfo: SchoolInfo;
  students: Student[];
  teachers: Teacher[];
  schedules: ScheduleItem[];
  sarpras: SarprasItem[];
  sheetsConfig: GoogleSheetsConfig;
  onRefreshAllData: () => void;
  onNavigateToSheets?: () => void;
}

export const MasterDataBackupView: React.FC<MasterDataBackupViewProps> = ({
  schoolInfo,
  students = [],
  teachers = [],
  schedules = [],
  sarpras = [],
  sheetsConfig,
  onRefreshAllData,
  onNavigateToSheets
}) => {
  const [copied, setCopied] = useState(false);
  const [jsonPreview, setJsonPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleGenerateJSON = () => {
    const jsonStr = StorageService.exportAllDataJSON();
    setJsonPreview(jsonStr);
    return jsonStr;
  };

  const handleCopyJSON = () => {
    const jsonStr = handleGenerateJSON();
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = handleGenerateJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dapodik-al-qomar-master-${schoolInfo.npsn || '70004839'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        executeImport(content);
      }
    };
    reader.readAsText(file);
  };

  const executeImport = (rawJson: string) => {
    if (!rawJson.trim()) {
      setImportStatus({ success: false, message: 'Harap masukkan data JSON terlebih dahulu.' });
      return;
    }

    const ok = StorageService.importAllDataJSON(rawJson);
    if (ok) {
      setImportStatus({
        success: true,
        message: 'Selamat! Seluruh data sekolah berhasil dipulihkan ke perangkat ini. Halaman akan dimuat ulang.'
      });
      setTimeout(() => {
        onRefreshAllData();
        window.location.reload();
      }, 1200);
    } else {
      setImportStatus({
        success: false,
        message: 'Format data JSON tidak valid atau rusak. Silakan periksa kembali berkas cadangan Anda.'
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <Database className="w-6 h-6" />
              </span>
              <h2 className="text-xl font-bold text-white font-serif tracking-wide">
                Cadangkan & Bagikan Data Master Sekolah
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Jadikan data yang telah Anda input (<strong>{students.length} Siswa</strong>, <strong>{teachers.length} Guru</strong>, dan Profil Sekolah) sebagai 
              <strong> Data Bawaan Permanen</strong> agar saat tautan Vercel dibagikan ke HP atau akun lain, data tidak kembali ke contoh awal!
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyJSON}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg hover:shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Data JSON Sekolah'}</span>
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
              title="Unduh berkas JSON cadangan"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Unduh JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Ringkasan Data Saat Ini */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Profil Sekolah</span>
            <School className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold text-white font-mono truncate" title={schoolInfo.nama}>
            {schoolInfo.nama}
          </div>
          <div className="text-xs text-emerald-400 font-mono">NPSN: {schoolInfo.npsn}</div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Siswa Tersimpan</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{students.length}</div>
          <div className="text-xs text-slate-400">Siswa Aktif</div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Guru & Tendik</span>
            <GraduationCap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{teachers.length}</div>
          <div className="text-xs text-slate-400">Ustadz & Ustadzah</div>
        </div>

        <div className="bg-slate-900/80 border border-white/10 p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Tahun Ajaran</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">{schoolInfo.tahunAjaran}</div>
          <div className="text-xs text-slate-400">Semester {schoolInfo.semesterAktif}</div>
        </div>
      </div>

      {/* Panduan 3 Solusi Terbaik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Solusi 1: Jadikan Master Code Proyek */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs border border-emerald-500/40">
              1
            </span>
            <h3 className="font-bold text-white text-base">
              Cara Tercepat: Jadikan Master Permanen Vercel
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Agar siapa pun (wali murid, siswa, atau guru) yang membuka link <code>smp-islam-al-qomar.vercel.app</code> langsung melihat data <strong>{students.length} Siswa</strong> dan <strong>{teachers.length} Guru</strong> Anda tanpa perlu login:
          </p>
          <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <li>Klik tombol hijau <strong>"Salin Data JSON Sekolah"</strong> di atas.</li>
            <li>Kirim/tempel teks JSON tersebut ke <strong>Chat AI Studio</strong> ini.</li>
            <li>AI akan otomatis memasukkan data asli Anda ke dalam kode bawaan proyek (<code>initialData.ts</code>).</li>
            <li>Setelah Anda redeploy ke Vercel, semua orang yang membuka web akan <strong>100% otomatis melihat data asli sekolah</strong>!</li>
          </ol>
          <button
            onClick={handleCopyJSON}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Teks JSON Berhasil Disalin!' : 'Salin JSON Sekarang'}</span>
          </button>
        </div>

        {/* Solusi 2: Google Sheets Cloud Sync */}
        <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-xs border border-blue-500/40">
              2
            </span>
            <h3 className="font-bold text-white text-base">
              Solusi Sinkronisasi Otomatis: Google Sheets
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Jika Anda ingin data sekolah bisa diubah sewaktu-waktu oleh tim tata usaha di Google Spreadsheet dan otomatis tersinkronisasi ke seluruh HP:
          </p>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside bg-slate-950/60 p-3 rounded-xl border border-white/5">
            <li>Gunakan modul <strong>Integrasi Google Sheets</strong> yang telah disediakan.</li>
            <li>Tautkan Web App URL Google Spreadsheet sekolah Anda.</li>
            <li>Setiap kali web dibuka di HP mana pun, sistem akan melakukan <em>Auto-Sync on Load</em> mengambil data terbaru dari Google Sheets.</li>
          </ul>
          {onNavigateToSheets && (
            <button
              onClick={onNavigateToSheets}
              className="w-full flex items-center justify-center gap-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Buka Pengaturan Google Sheets</span>
            </button>
          )}
        </div>
      </div>

      {/* Bagian Pulihkan / Impor Data Cadangan (Untuk Laptop/Akun Baru) */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Pulihkan / Muat Data Cadangan ke Perangkat Ini
            </h3>
          </div>
          <label className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Pilih File JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
        <p className="text-xs text-slate-400">
          Jika Anda membuka website ini di laptop lain atau browser akun lain, Anda bisa langsung mengunggah file cadangan <code>.json</code> di bawah ini agar data {students.length} siswa dan {teachers.length} guru langsung aktif seketika:
        </p>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              importStatus.success
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-red-500/20 text-red-300 border border-red-500/40'
            }`}
          >
            {importStatus.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="space-y-2">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Tempel teks JSON cadangan di sini atau unggah berkas .json melalui tombol di atas..."
            rows={3}
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-300 focus:border-emerald-500 focus:outline-none"
          />
          {importText.trim() && (
            <button
              onClick={() => executeImport(importText)}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Terapkan & Pulihkan Data Ini
            </button>
          )}
        </div>
      </div>

      {/* Pratinjau JSON (Opsional untuk Memeriksa) */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4">
        <button
          onClick={() => {
            if (!showPreview && !jsonPreview) {
              handleGenerateJSON();
            }
            setShowPreview(!showPreview);
          }}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <FileJson className="w-4 h-4 text-slate-400" />
            Lihat Pratinjau Struktur Data JSON Sekolah
          </span>
          <span className="text-emerald-400 font-mono text-[11px]">
            {showPreview ? 'Sembunyikan Pratinjau ▲' : 'Buka Pratinjau ▼'}
          </span>
        </button>

        {showPreview && (
          <div className="mt-3 relative">
            <pre className="bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-emerald-300 max-h-64 overflow-y-auto border border-white/10">
              {jsonPreview || handleGenerateJSON()}
            </pre>
            <button
              onClick={handleCopyJSON}
              className="absolute top-2 right-2 bg-slate-800/80 hover:bg-slate-700 text-white px-2.5 py-1 rounded-lg text-xs font-mono border border-white/10"
            >
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
