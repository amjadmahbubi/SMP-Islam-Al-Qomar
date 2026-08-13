import React, { useState, useEffect } from 'react';
import { WAGatewayConfig, WAService, WANotificationLog } from '../../services/whatsappService';
import { MessageSquare, Send, Settings, History, CheckCircle2, Phone, Sparkles, Shield, RefreshCw, X, FileText } from 'lucide-react';

interface WAGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
}

export const WAGatewayModal: React.FC<WAGatewayModalProps> = ({ isOpen, onClose, schoolName }) => {
  const [activeTab, setActiveTab] = useState<'send' | 'settings' | 'logs'>('send');
  const [config, setConfig] = useState<WAGatewayConfig>(WAService.getConfig());
  const [logs, setLogs] = useState<WANotificationLog[]>(WAService.getLogs());

  // Test Message State
  const [testPhone, setTestPhone] = useState('081234567890');
  const [testRecipient, setTestRecipient] = useState('Bpk. Wali Santri');
  const [testMessage, setTestMessage] = useState(
    `*TES NOTIFIKASI WA DAPODIK AL QOMAR*\n\n` +
    `Assalamualaikum Wr. Wb.\n` +
    `Ini adalah pesan uji coba integrasi WhatsApp Otomatis dari Sistem Informasi DAPODIK SMP Islam Al Qomar Banyuwangi.\n\n` +
    `Layanan Notifikasi WA Otomatis untuk *PPDB* & *Presensi Harian Siswa* Siap Digunakan!`
  );

  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(WAService.getConfig());
      setLogs(WAService.getLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    WAService.saveConfig(config);
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 3000);
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-2xl w-full border border-emerald-500/40 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-base text-white flex items-center gap-2">
                <span>Integrasi WhatsApp Gateway &amp; Notifikasi Otomatis</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold">
                  ACTIVE
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Kirim pesan otomatis untuk PPDB, Presensi Siswa, &amp; Pengumuman Sekolah
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
        <div className="flex border-b border-white/10 bg-slate-950 px-5 text-xs font-bold gap-2">
          <button
            onClick={() => setActiveTab('send')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'send'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Pesan Uji Coba</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
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
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-emerald-400 text-emerald-300 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Log Pesan ({logs.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          
          {/* TAB 1: KIRIM TEST */}
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
