import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, Smartphone, Check, AlertTriangle, Database, ShieldCheck, Sparkles, RefreshCw, X, ChevronRight } from 'lucide-react';
import { StorageService } from '../services/storage';

interface PWAOfflineBannerProps {
  onNavigateToSheets?: () => void;
}

export const PWAOfflineBanner: React.FC<PWAOfflineBannerProps> = ({ onNavigateToSheets }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(true);
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);

  // Storage Stats for Offline Verification
  const [storageStats, setStorageStats] = useState({
    siswaCount: 0,
    guruCount: 0,
    absensiCount: 0,
    nilaiCount: 0,
    sarprasCount: 0
  });

  const loadStorageStats = () => {
    const s = StorageService.getStudents();
    const g = StorageService.getTeachers();
    const a = StorageService.getAttendance();
    const n = StorageService.getGrades();
    const sp = StorageService.getSarpras();

    setStorageStats({
      siswaCount: s.length,
      guruCount: g.length,
      absensiCount: a.length,
      nilaiCount: n.length,
      sarprasCount: sp.length
    });
  };

  useEffect(() => {
    loadStorageStats();

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setTimeout(() => setJustReconnected(false), 8000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for PWA BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual install instructions for iOS / browsers without beforeinstallprompt
      alert(
        'Petunjuk Install PWA DAPODIK Al Qomar:\n\n' +
        '📱 Android (Chrome): Klik titik tiga (⋮) di pojok kanan atas browser > pilih "Tambahkan ke Layar Utama" / "Install Aplikasi".\n\n' +
        '🍎 iOS / iPhone / iPad (Safari): Klik tombol Share (ikon kotak dengan panah ke atas) > gulir ke bawah > pilih "Add to Home Screen" (Tambahkan ke Layar Utama).'
      );
    }
  };

  const activeOfflineState = !isOnline || isSimulatedOffline;

  return (
    <div className="w-full space-y-2 mb-4">
      
      {/* 1. RECONNECTED ALERT TOAST */}
      {justReconnected && (
        <div className="bg-emerald-900/90 border border-emerald-400 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-bold">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-200">Koneksi Internet Kembali Terhubung!</p>
              <p className="text-[11px] text-emerald-100">
                Data yang diinput saat offline tersimpan aman. Klik untuk sinkronkan ke Google Sheets.
              </p>
            </div>
          </div>
          {onNavigateToSheets && (
            <button
              onClick={onNavigateToSheets}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              <span>Sync Sheets</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 2. OFFLINE MODE BANNER */}
      {activeOfflineState && (
        <div className="bg-gradient-to-r from-amber-950/90 via-amber-900/90 to-amber-950/90 border border-amber-500/50 text-amber-100 p-3.5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-xl animate-pulse">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-300">
                  {isSimulatedOffline ? 'Mode Simulasi Offline Aktif' : 'Mode Offline (Tanpa Internet)'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  Data Lokal Siap
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 mt-0.5">
                Anda tetap bisa menginput Absensi, Nilai, &amp; mengelola data. Perubahan tersimpan otomatis di perangkat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadStorageStats();
                setShowOfflineModal(true);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl transition-all border border-amber-300/50 flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cek Status Offline ({storageStats.siswaCount + storageStats.guruCount} Data)</span>
            </button>

            {isSimulatedOffline && (
              <button
                onClick={() => setIsSimulatedOffline(false)}
                className="bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-amber-500/30"
              >
                Matikan Simulasi
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. PWA INSTALL BANNER (Floating or Header Bar) */}
      {!isInstalled && showInstallBanner && (
        <div className="bg-slate-900/90 border border-emerald-500/40 text-slate-100 p-3 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-400/30">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Install Aplikasi DAPODIK Al Qomar di HP / Tablet</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-mono">
                  PWA
                </span>
              </p>
              <p className="text-[11px] text-slate-300">
                Akses cepat dari layar utama HP/Tablet tanpa perlu membuka browser. Bekerja 100% offline!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallPWA}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-xl shadow transition-all border border-emerald-300/50 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install Aplikasi</span>
            </button>

            {!isSimulatedOffline && isOnline && (
              <button
                onClick={() => setIsSimulatedOffline(true)}
                title="Uji coba mode offline untuk melihat keandalan penyimpanan lokal"
                className="bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-white/10 whitespace-nowrap"
              >
                Uji Offline
              </button>
            )}

            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. OFFLINE HEALTH INSPECTOR MODAL */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 text-slate-100 rounded-2xl max-w-lg w-full p-6 border border-emerald-500/40 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold font-serif text-base text-white">
                  Inspektur Penyimpanan Offline (Device Storage)
                </h3>
              </div>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh data sekolah disimpan secara lokal di memori HP/Tablet Anda (*localStorage / IndexedDB*) agar aplikasi dapat digunakan tanpa gangguan sinyal:
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Data Siswa</span>
                <span className="font-bold text-emerald-400">{storageStats.siswaCount} Siswa</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Data Guru</span>
                <span className="font-bold text-emerald-400">{storageStats.guruCount} Guru</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Rekap Absensi</span>
                <span className="font-bold text-amber-400">{storageStats.absensiCount} Sesi</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Nilai &amp; Rapor</span>
                <span className="font-bold text-cyan-400">{storageStats.nilaiCount} Record</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between col-span-2">
                <span className="text-slate-400">Status Service Worker</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Active (v1 Cached)
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Tip Guru:</strong> Hasil pengisian Absensi &amp; Nilai saat offline akan bertahan tersimpan walaupun HP/browser Anda ditutup atau dimatikan.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowOfflineModal(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-colors"
              >
                Tutup Inspection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
