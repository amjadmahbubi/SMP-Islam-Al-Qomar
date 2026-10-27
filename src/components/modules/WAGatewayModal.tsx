import React, { useState, useEffect, useRef } from 'react';
import { WAGatewayConfig, WAService, WANotificationLog, DEFAULT_ATTENDANCE_TEMPLATE } from '../../services/whatsappService';
import { MessageSquare, Send, Settings, History, CheckCircle2, Phone, Sparkles, Shield, RefreshCw, X, FileText, Code2, RotateCcw, Copy, Check, Eye } from 'lucide-react';

interface WAGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
}

const PLACEHOLDERS = [
  { tag: '{nama_santri}', desc: 'Nama Siswa/Santri' },
  { tag: '{kelas}', desc: 'Kelas (cth: 7A)' },
  { tag: '{status_kehadiran}', desc: 'Status (Hadir / Sakit / Izin / Alpa)' },
  { tag: '{tanggal}', desc: 'Tanggal Presensi' },
  { tag: '{mapel}', desc: 'Mata Pelajaran' },
  { tag: '{nama_guru}', desc: 'Nama Guru / Wali Kelas' },
  { tag: '{nama_sekolah}', desc: 'Nama Sekolah Resmi' },
  { tag: '{catatan}', desc: 'Catatan Keterangan / Alasan' }
];

export const WAGatewayModal: React.FC<WAGatewayModalProps> = ({ isOpen, onClose, schoolName }) => {
  const [activeTab, setActiveTab] = useState<'template' | 'send' | 'settings' | 'logs'>('template');
  const [config, setConfig] = useState<WAGatewayConfig>(WAService.getConfig());
  const [logs, setLogs] = useState<WANotificationLog[]>(WAService.getLogs());

  // Template State
  const [templateText, setTemplateText] = useState(config.customAttendanceTemplate || DEFAULT_ATTENDANCE_TEMPLATE);
  const templateInputRef = useRef<HTMLTextAreaElement>(null);
  const [copiedPreview, setCopiedPreview] = useState(false);

  // Test Message State
  const [testPhone, setTestPhone] = useState('081234567890');
  const [testRecipient, setTestRecipient] = useState('Bpk. Wali Santri');
  const [testMessage, setTestMessage] = useState(
    `*TES NOTIFIKASI WA DAPODIK AL QOMAR*\n\n` +
    `Assalamualaikum Wr. Wb.\n` +
    `Ini adalah pesan uji coba integrasi WhatsApp Otomatis dari Sistem Informasi DAPODIK SMP Islam Al Qomar Banyuwangi.\n\n` +
    `Layanan Notifikasi WA Otomatis untuk *PPDB* & *Presensi Harian Siswa* Siap Digunakan!`
  );

  const [savedSettingsNotice, setSavedSettingsNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = WAService.getConfig();
      setConfig(cfg);
      setTemplateText(cfg.customAttendanceTemplate || DEFAULT_ATTENDANCE_TEMPLATE);
      setLogs(WAService.getLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInsertPlaceholder = (tag: string) => {
    const textarea = templateInputRef.current;
    if (!textarea) {
      setTemplateText(prev => prev + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextVal = templateText.substring(0, start) + tag + templateText.substring(end);
    setTemplateText(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = { ...config, customAttendanceTemplate: templateText };
    setConfig(updated);
    WAService.saveConfig(updated);
    setSavedSettingsNotice('Template Notifikasi Berhasil Disimpan & Aktif!');
    setTimeout(() => setSavedSettingsNotice(null), 3000);
  };

  const handleResetTemplate = () => {
    if (window.confirm('Kembalikan template pesan notifikasi kehadiran ke format bawaan resmi?')) {
      setTemplateText(DEFAULT_ATTENDANCE_TEMPLATE);
      const updated = { ...config, customAttendanceTemplate: DEFAULT_ATTENDANCE_TEMPLATE };
      setConfig(updated);
      WAService.saveConfig(updated);
      setSavedSettingsNotice('Template dikembalikan ke format bawaan resmi.');
      setTimeout(() => setSavedSettingsNotice(null), 3000);
    }
  };

  const previewMessage = WAService.parseTemplate(templateText, {
    nama_santri: 'Ahmad Fauzan Pratama',
    nama_siswa: 'Ahmad Fauzan Pratama',
    kelas: '7A',
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    mapel: 'Pendidikan Agama Islam',
    status_kehadiran: '⚠️ ALPA (TANPA KETERANGAN)',
    nama_guru: 'Ustadz Amjad Mahbubi, S.Pd.',
    nama_sekolah: schoolName || 'SMP Islam Al Qomar',
    catatan: '📝 Catatan: Tidak hadir tanpa konfirmasi / surat izin tertulis'
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    WAService.saveConfig(config);
    setSavedSettingsNotice('Pengaturan WhatsApp Gateway Berhasil Disimpan!');
    setTimeout(() => setSavedSettingsNotice(null), 3000);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) {
      alert('Masukkan nomor WhatsApp penerima.');
      return;
    }
    await WAService.sendWA(testPhone, testMessage, testRecipient, 'PPDB_PENDAFTARAN');
    setLogs(WAService.getLogs());
  };

  const handleSendPreviewToWA = () => {
    if (!testPhone) {
      alert('Masukkan nomor WhatsApp tujuan pada kolom nomor.');
      return;
    }
    WAService.sendWA(testPhone, previewMessage, 'Bpk/Ibu Wali Santri Ahmad Fauzan', 'PRESENSI_SISWA');
    setLogs(WAService.getLogs());
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-2xl w-full border border-emerald-500/40 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-sm sm:text-base text-white flex items-center gap-2">
                <span>Integrasi WhatsApp Gateway &amp; Notifikasi Otomatis</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Template otomatis, presensi santri, &amp; pengumuman wali kelas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-slate-950 px-3 sm:px-5 text-xs font-bold gap-1 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('template')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'template'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Template &amp; Placeholder WA</span>
          </button>

          <button
            onClick={() => setActiveTab('send')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'send'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Pesan Manual</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'settings'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'logs'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Log ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {savedSettingsNotice && (
            <div className="p-3 bg-emerald-900/80 border border-emerald-400 text-emerald-100 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{savedSettingsNotice}</span>
            </div>
          )}

          {/* TAB 0: TEMPLATE DENGAN PLACEHOLDER OTOMATIS */}
          {activeTab === 'template' && (
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-emerald-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Kustomisasi Format Notifikasi Presensi WhatsApp</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Gunakan placeholder di bawah ini. Saat guru/BK menekan tombol <strong>Kirim WA</strong> pada baris absensi siswa, sistem akan otomatis mengganti kode variabel dengan data riil santri tersebut.
                </p>
              </div>

              {/* Placeholder Chips Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300 text-[11px]">
                    Klik Placeholder untuk Menyisipkan ke Pesan:
                  </label>
                  <span className="text-[10px] text-slate-400">Klik chip untuk menyisipkan</span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.tag}
                      type="button"
                      onClick={() => handleInsertPlaceholder(p.tag)}
                      title={p.desc}
                      className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 border border-emerald-400/30 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>{p.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Textarea */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-300">Format Template Notifikasi Presensi:</label>
                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="text-[11px] text-amber-300 hover:text-amber-200 flex items-center gap-1 underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Bawaan</span>
                  </button>
                </div>
                <textarea
                  ref={templateInputRef}
                  rows={8}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Real-time Parsed Preview */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pratinjau Hasil Nyata di WhatsApp (Live Preview):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(previewMessage);
                      setCopiedPreview(true);
                      setTimeout(() => setCopiedPreview(false), 2000);
                    }}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPreview ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPreview ? 'Tersalin' : 'Salin Pratinjau'}</span>
                  </button>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-500/30 text-[11px] font-sans text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                  {previewMessage}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Template Ini</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendPreviewToWA}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Uji Kirim Pratinjau ke WA</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 1: KIRIM MANUAL / TEST */}
          {activeTab === 'send' && (
            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Layanan ini mendukung pengiriman langsung via <strong>WhatsApp Web / Mobile App (`wa.me`)</strong> tanpa biaya tambahan, atau menggunakan <strong>API Provider Gateway (Fonnte/Wablas)</strong>.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    value={testRecipient}
                    onChange={(e) => setTestRecipient(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Bpk. Ahmad"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nomor WhatsApp (Indonesian Format)</label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Isi Pesan WhatsApp</label>
                <textarea
                  rows={6}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-sans text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Pesan WhatsApp Sekarang</span>
              </button>
            </form>
          )}

          {/* TAB 2: PENGATURAN GATEWAY */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              
              {savedSettingsNotice && (
                <div className="p-3 bg-emerald-900/80 border border-emerald-400 text-emerald-100 rounded-xl flex items-center gap-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Pengaturan WhatsApp Gateway Berhasil Disimpan!</span>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Metode Pengiriman Pesan</label>
                <select
                  value={config.provider}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="direct_link">Direct WhatsApp Link (`wa.me` / Gratis Tanpa API)</option>
                  <option value="fonnte">API Gateway Fonnte (Otomatis Headless Background)</option>
                </select>
              </div>

              {config.provider === 'fonnte' && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Fonnte Token API Key</label>
                  <input
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="Masukkan Token Fonnte..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Token dapat diperoleh gratis dari dashboard Fonnte (fonnte.com).
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nomor Pengirim / Sekretariat WA PPDB</label>
                <input
                  type="text"
                  value={config.senderNumber}
                  onChange={(e) => setConfig({ ...config, senderNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-white/10 space-y-3">
                <p className="font-bold text-slate-200">Otomatisasi Notifikasi Sistem:</p>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendPPDB}
                    onChange={(e) => setConfig({ ...config, autoSendPPDB: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                  />
                  <span>Tawarkan Notifikasi WA otomatis saat Pendaftaran PPDB Baru berhasil</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoSendAbsensiNonHadir}
                    onChange={(e) => setConfig({ ...config, autoSendAbsensiNonHadir: e.target.checked })}
                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                  />
                  <span>Aktifkan opsi Kirim WA ke Orang Tua untuk Siswa Izin / Sakit / Alpa saat Input Absensi</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors"
              >
                Simpan Konfigurasi
              </button>
            </form>
          )}

          {/* TAB 3: LOG RIWAYAT */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">{log.recipientName} ({log.recipientPhone})</span>
                      <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans bg-slate-900 p-2 rounded-lg border border-slate-800">
                      {log.message}
                    </p>
                    <div className="flex justify-between items-center text-[10px] pt-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 font-bold">
                        {log.type}
                      </span>
                      <span className="text-amber-400 font-mono font-bold">
                        Status: {log.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 italic">
                  Belum ada log pengiriman pesan WhatsApp.
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
