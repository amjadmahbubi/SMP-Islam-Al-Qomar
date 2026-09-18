import React, { useState, useEffect } from 'react';
import {
  SarprasItem,
  SarprasMutasi,
  SarprasPerawatan,
  SarprasPerencanaan,
  SarprasAuditLog,
  SarprasGedung,
  SarprasRuang,
  UserSession,
  Teacher,
  SchoolInfo
} from '../../types';
import { StorageService } from '../../services/storage';
import { SarprasAsetTab } from './sarpras/SarprasAsetTab';
import { SarprasMasterGedungRuangTab } from './sarpras/SarprasMasterGedungRuangTab';
import { SarprasMutasiTab } from './sarpras/SarprasMutasiTab';
import { SarprasDepresiasiTab } from './sarpras/SarprasDepresiasiTab';
import { SarprasPerawatanTab } from './sarpras/SarprasPerawatanTab';
import { SarprasPerencanaanTab } from './sarpras/SarprasPerencanaanTab';
import { SarprasAuditTab } from './sarpras/SarprasAuditTab';
import { SarprasLaporanTab } from './sarpras/SarprasLaporanTab';
import {
  Package,
  ArrowRightLeft,
  TrendingDown,
  Wrench,
  ClipboardList,
  ShieldAlert,
  FileText,
  ShieldCheck,
  Building2,
  Sparkles,
  Layers
} from 'lucide-react';

interface DataSarprasViewProps {
  sarpras: SarprasItem[];
  onSaveSarpras: (sarpras: SarprasItem[]) => void;
  session?: UserSession;
  teachers?: Teacher[];
  schoolInfo?: SchoolInfo;
}

export type SarprasTabKey = 'aset' | 'gedung-ruang' | 'mutasi' | 'depresiasi' | 'perawatan' | 'perencanaan' | 'laporan' | 'audit';

export const DataSarprasView: React.FC<DataSarprasViewProps> = ({
  sarpras,
  onSaveSarpras,
  session,
  teachers = [],
  schoolInfo
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SarprasTabKey>('aset');

  // Master Data Gedung & Ruang
  const [gedungList, setGedungList] = useState<SarprasGedung[]>(() => StorageService.getSarprasGedung());
  const [ruangList, setRuangList] = useState<SarprasRuang[]>(() => StorageService.getSarprasRuang());

  // Cross-tab interaction state
  const [preselectedItem, setPreselectedItem] = useState<SarprasItem | null>(null);

  // Sub-modules state
  const [mutasiList, setMutasiList] = useState<SarprasMutasi[]>(() => StorageService.getSarprasMutasi());
  const [perawatanList, setPerawatanList] = useState<SarprasPerawatan[]>(() => StorageService.getSarprasPerawatan());
  const [perencanaanList, setPerencanaanList] = useState<SarprasPerencanaan[]>(() => StorageService.getSarprasPerencanaan());
  const [auditLogs, setAuditLogs] = useState<SarprasAuditLog[]>(() => StorageService.getSarprasAuditLogs());

  // Role detection
  const loggedTeacher = teachers.find(
    t => (session?.teacherId && t.id === session.teacherId) || t.nama === session?.name
  );

  const isWakaSarpras = !!(
    loggedTeacher &&
    (loggedTeacher.jabatan?.toLowerCase().includes('sarpras') ||
      loggedTeacher.jabatan?.toLowerCase().includes('sarana'))
  );

  const isAdmin = session?.role === 'admin';
  const canEdit = isAdmin || isWakaSarpras;

  // Helper for audit logging
  const handleAddAuditLog = (aksi: SarprasAuditLog['aksi'], rincian: string, kodeBarang?: string, namaBarang?: string) => {
    StorageService.addSarprasAuditLog({
      aksi,
      kodeBarang,
      namaBarang,
      rincian,
      pelaku: session?.name || 'Petugas Sarpras',
      role: session?.role === 'admin' ? 'Admin Dapodik' : (loggedTeacher?.jabatan || 'Waka Sarpras')
    });
    setAuditLogs(StorageService.getSarprasAuditLogs());
  };

  // Master Gedung & Ruang handlers
  const handleSaveGedung = (updatedList: SarprasGedung[]) => {
    setGedungList(updatedList);
    StorageService.saveSarprasGedung(updatedList);
  };

  const handleSaveRuang = (updatedList: SarprasRuang[]) => {
    setRuangList(updatedList);
    StorageService.saveSarprasRuang(updatedList);
  };

  // Mutasi handlers
  const handleSaveMutasi = (updatedList: SarprasMutasi[]) => {
    setMutasiList(updatedList);
    StorageService.saveSarprasMutasi(updatedList);
  };

  // Perawatan handlers
  const handleSavePerawatan = (updatedList: SarprasPerawatan[]) => {
    setPerawatanList(updatedList);
    StorageService.saveSarprasPerawatan(updatedList);
  };

  // Perencanaan handlers
  const handleSavePerencanaan = (updatedList: SarprasPerencanaan[]) => {
    setPerencanaanList(updatedList);
    StorageService.saveSarprasPerencanaan(updatedList);
  };

  // Clear logs handler
  const handleClearLogs = () => {
    StorageService.saveSarprasAuditLogs([]);
    setAuditLogs([]);
  };

  // Update single asset item
  const handleUpdateSarprasItem = (updatedItem: SarprasItem) => {
    const updated = sarpras.map(s => (s.id === updatedItem.id ? updatedItem : s));
    onSaveSarpras(updated);
  };

  // Add single asset item
  const handleAddSarprasItem = (newItem: SarprasItem) => {
    onSaveSarpras([newItem, ...sarpras]);
  };

  // Cross-tab jumps
  const handleNavigateToMutasi = (item: SarprasItem) => {
    setPreselectedItem(item);
    setActiveSubTab('mutasi');
  };

  const handleNavigateToPerawatan = (item: SarprasItem) => {
    setPreselectedItem(item);
    setActiveSubTab('perawatan');
  };

  // Tab definitions
  const tabs = [
    { key: 'aset' as const, label: 'Data Aset', icon: Package, count: sarpras.length },
    { key: 'gedung-ruang' as const, label: 'Master Gedung & Ruang', icon: Building2, count: ruangList.length },
    { key: 'mutasi' as const, label: 'Mutasi Aset', icon: ArrowRightLeft, count: mutasiList.length },
    { key: 'depresiasi' as const, label: 'Depresiasi Real-time', icon: TrendingDown },
    { key: 'perawatan' as const, label: 'Perbaikan / Servis', icon: Wrench, count: perawatanList.filter(p => p.status === 'Sedang Dikerjakan').length },
    { key: 'perencanaan' as const, label: 'Perencanaan (RKSP)', icon: ClipboardList, count: perencanaanList.filter(p => p.status === 'Diajukan').length },
    { key: 'laporan' as const, label: 'KIR & Stiker Label', icon: FileText },
    { key: 'audit' as const, label: 'Audit Trail', icon: ShieldAlert, count: auditLogs.length }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                SIM Sarpras Terpadu
              </span>
              {canEdit && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-500/15 text-sky-300 border border-sky-400/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isAdmin ? 'Akses Admin' : 'Waka Sarpras'}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-400" />
              Manajemen Sarana & Prasarana
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Pencatatan inventaris resmi, penomoran otomatis, pelacakan mutasi BAST, depresiasi akuntansi berjalan, perbaikan teknisi, perencanaan RKSP, dan audit trail terpadu.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10 text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Nilai Inventaris</p>
              <p className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
                Rp {sarpras.reduce((acc, s) => acc + ((Number(s.hargaPerolehan) || 0) * (Number(s.jumlah) || 1)), 0).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveSubTab(tab.key);
                  setPreselectedItem(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab View Rendering */}
      <div>
        {activeSubTab === 'aset' && (
          <SarprasAsetTab
            sarpras={sarpras}
            onSaveSarpras={onSaveSarpras}
            ruangList={ruangList}
            gedungList={gedungList}
            teachers={teachers}
            session={session}
            canEdit={canEdit}
            onOpenMutasiWithItem={handleNavigateToMutasi}
            onOpenPerawatanWithItem={handleNavigateToPerawatan}
            onAddAuditLog={(action, detail, item) =>
              handleAddAuditLog(
                action,
                detail,
                item?.nomorInventarisResmi || item?.kode,
                item?.namaBarangRuang
              )
            }
          />
        )}

        {activeSubTab === 'gedung-ruang' && (
          <SarprasMasterGedungRuangTab
            gedungList={gedungList}
            ruangList={ruangList}
            sarpras={sarpras}
            onSaveGedung={handleSaveGedung}
            onSaveRuang={handleSaveRuang}
            teachers={teachers}
            canEdit={canEdit}
            onAddAuditLog={(action, detail) => handleAddAuditLog(action, detail)}
          />
        )}

        {activeSubTab === 'mutasi' && (
          <SarprasMutasiTab
            sarpras={sarpras}
            mutasiList={mutasiList}
            ruangList={ruangList}
            onSaveMutasi={handleSaveMutasi}
            onUpdateSarprasItem={handleUpdateSarprasItem}
            teachers={teachers}
            session={session}
            canEdit={canEdit}
            onAddAuditLog={(action, detail) => handleAddAuditLog(action, detail)}
            preselectedItem={preselectedItem}
            onClearPreselected={() => setPreselectedItem(null)}
          />
        )}

        {activeSubTab === 'depresiasi' && (
          <SarprasDepresiasiTab sarpras={sarpras} />
        )}

        {activeSubTab === 'perawatan' && (
          <SarprasPerawatanTab
            sarpras={sarpras}
            perawatanList={perawatanList}
            onSavePerawatan={handleSavePerawatan}
            onUpdateSarprasItem={handleUpdateSarprasItem}
            teachers={teachers}
            session={session}
            canEdit={canEdit}
            onAddAuditLog={(action, detail) => handleAddAuditLog(action, detail)}
            preselectedItem={preselectedItem}
            onClearPreselected={() => setPreselectedItem(null)}
          />
        )}

        {activeSubTab === 'perencanaan' && (
          <SarprasPerencanaanTab
            perencanaanList={perencanaanList}
            onSavePerencanaan={handleSavePerencanaan}
            onAddSarprasItem={handleAddSarprasItem}
            sarpras={sarpras}
            teachers={teachers}
            session={session}
            canEdit={canEdit}
            onAddAuditLog={(action, detail) => handleAddAuditLog(action, detail)}
          />
        )}

        {activeSubTab === 'laporan' && (
          <SarprasLaporanTab
            sarpras={sarpras}
            mutasiList={mutasiList}
            perawatanList={perawatanList}
            perencanaanList={perencanaanList}
            schoolInfo={schoolInfo}
            teachers={teachers}
          />
        )}

        {activeSubTab === 'audit' && (
          <SarprasAuditTab
            logs={auditLogs}
            onClearLogs={handleClearLogs}
            canEdit={canEdit}
          />
        )}
      </div>
    </div>
  );
};
