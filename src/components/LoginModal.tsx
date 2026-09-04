import React, { useState } from 'react';
import { UserSession, Teacher, SchoolInfo } from '../types';
import { X, Shield, GraduationCap, User, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (session: UserSession) => void;
  teachers: Teacher[];
  schoolInfo?: SchoolInfo;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  teachers = [],
  schoolInfo
}) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'guru'>('admin');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers?.[1]?.id || teachers?.[0]?.id || 'T002');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError('Silakan masukkan kata sandi Administrator');
      return;
    }
    if (password !== 'admin123') {
      setLoginError('Kata sandi Admin salah! Masukkan kata sandi resmi administrator.');
      return;
    }
    setLoginError('');
    onLogin({
      role: 'admin',
      name: 'Administrator DAPODIK',
      email: 'admin@alqomar.sch.id'
    });
    setPassword('');
    onClose();
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError('Silakan masukkan kata sandi Anda');
      return;
    }
    const teacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
    const expectedPassword = teacher.password || 'guru123';
    if (password !== expectedPassword && password !== 'admin123') {
      setLoginError(`Kata sandi untuk ${teacher.nama} tidak sesuai. Silakan hubungi Administrator.`);
      return;
    }

    const isKepalaSekolah = !!(
      teacher.jabatan?.toLowerCase().includes('kepala sekolah') ||
      teacher.jabatan?.toLowerCase().includes('kepsek') ||
      teacher.id === 'T001'
    );

    setLoginError('');
    onLogin({
      role: isKepalaSekolah ? 'admin' : 'guru',
      name: teacher.nama,
      email: teacher.email,
      teacherId: teacher.id
    });
    setPassword('');
    onClose();
  };

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
  const isSelectedKepsek = !!(
    selectedTeacher &&
    (selectedTeacher.jabatan?.toLowerCase().includes('kepala sekolah') ||
      selectedTeacher.jabatan?.toLowerCase().includes('kepsek') ||
      selectedTeacher.id === 'T001')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass backdrop-blur-2xl bg-slate-900/95 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-slate-900 p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-2xl rounded-xl flex items-center justify-center shadow overflow-hidden shrink-0">
              {schoolInfo?.logoUrl ? (
                <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-cover" />
              ) : (
                "☪"
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-white leading-tight">Akses Sistem Pengelola</h2>
              <p className="text-xs text-emerald-400 font-medium">SMP Islam Al Qomar</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Portal masuk khusus Administrator DAPODIK & Ustadz/Ustadzah Pengajar.
          </p>
        </div>

        {/* Role Selector Tabs (Admin / Guru) */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-1.5 rounded-xl mb-5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('admin');
                setLoginError('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                selectedRole === 'admin'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Shield className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>Admin DAPODIK</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole('guru');
                setLoginError('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                selectedRole === 'guru'
                  ? 'bg-emerald-500 text-slate-950 shadow-lg font-extrabold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${selectedRole === 'guru' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Guru / Pengajar</span>
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/40 rounded-xl text-xs text-red-200 font-semibold flex items-center justify-between animate-in fade-in">
              <span>{loginError}</span>
              <button onClick={() => setLoginError('')} className="text-red-300 font-bold ml-2">×</button>
            </div>
          )}

          {/* ADMIN FORM */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 text-xs text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  Akses Administrator Utama
                </p>
                <p className="text-amber-200/90 leading-relaxed">
                  Akses penuh kelola data sekolah, master guru/siswa, sarpras, jadwal, kalender, absensi, nilai, dan integrasi Google Sheets.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Pengguna Admin</label>
                <input
                  type="email"
                  value="admin@alqomar.sch.id"
                  disabled
                  className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs text-slate-300 font-mono font-bold cursor-not-allowed opacity-90"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">Kata Sandi</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    autoFocus
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    className="w-full px-3 py-2.5 pl-9 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                    placeholder="Masukkan kata sandi Admin..."
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-300/50"
              >
                <span>Masuk Ke Dashboard Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* GURU FORM */}
          {selectedRole === 'guru' && (
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 text-xs text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Akses Ustadz / Ustadzah Pengajar
                </p>
                <p className="text-emerald-200/90 leading-relaxed">
                  Modul kelola administrasi guru (Modul Ajar/RPP), input presensi harian, dan pengisian nilai/catatan Rapor Digital.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">Pilih Akun Guru / Pengajar</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {(teachers || []).map((t) => {
                    const allMapels = [t.mapelUtama, ...(Array.isArray(t.mapelTambahan) ? t.mapelTambahan : [])].filter(Boolean).join(' & ');
                    return (
                      <option key={t.id} value={t.id} className="bg-white text-slate-900">
                        {t.nama} — ({allMapels || 'Guru'}{t.jabatan && t.jabatan !== 'Guru Mata Pelajaran' ? ` • ${t.jabatan}` : ''})
                      </option>
                    );
                  })}
                </select>
                {selectedTeacher && (
                  <div className="mt-1.5 flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1 gap-1">
                    <span>NUPTK: {selectedTeacher.nuptk || '-'}</span>
                    {selectedTeacher.jabatan && (
                      <span className="text-amber-300 font-bold bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30">
                        {selectedTeacher.jabatan}
                      </span>
                    )}
                    <span className="text-emerald-400 font-semibold">
                      {[selectedTeacher.mapelUtama, ...(Array.isArray(selectedTeacher.mapelTambahan) ? selectedTeacher.mapelTambahan : [])].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {isSelectedKepsek && (
                  <div className="mt-2.5 p-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-xs text-amber-200 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Hak Akses Kepala Sekolah:</span>
                      <p className="text-[11px] text-amber-200/90 mt-0.5">
                        Sebagai Kepala Sekolah, akun <strong>{selectedTeacher.nama}</strong> memiliki kewenangan <strong>Administrator Penuh</strong> untuk mengawasi dan mengelola seluruh master data, sarpras, kalender, kurikulum, dan administrasi guru.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">Kata Sandi</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    autoFocus
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    className="w-full px-3 py-2.5 pl-9 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                    placeholder="Masukkan kata sandi Guru..."
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-300/50"
              >
                <span>Masuk Ke Dashboard Guru</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
