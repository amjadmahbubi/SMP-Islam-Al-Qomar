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
  teachers,
  schoolInfo
}) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'guru' | 'public'>('admin');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[1]?.id || teachers[0]?.id || 'T002');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  if (!isOpen) return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLoginError('Silakan masukkan kata sandi Anda');
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
    setLoginError('');
    const teacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];
    onLogin({
      role: 'guru',
      name: teacher.nama,
      email: teacher.email,
      teacherId: teacher.id
    });
    setPassword('');
    onClose();
  };

  const handlePublicLogin = () => {
    onLogin({
      role: 'public',
      name: 'Pengunjung Umum',
      email: 'public@alqomar.sch.id'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="glass backdrop-blur-2xl bg-slate-900/90 rounded-2xl shadow-2xl border border-white/20 max-w-md w-full overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/80 to-slate-900/90 p-6 relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold text-2xl rounded-xl flex items-center justify-center mb-3 shadow overflow-hidden">
            {schoolInfo?.logoUrl ? (
              <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-cover" />
            ) : (
              "☪"
            )}
          </div>
          <h2 className="text-xl font-bold font-serif text-white">Akses Sistem DAPODIK</h2>
          <p className="text-xs text-slate-300 mt-1">
            Pilih hak akses untuk masuk ke Sistem Informasi SMP Islam Al Qomar
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-1.5 rounded-xl mb-6 border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'admin'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className={`w-4 h-4 ${selectedRole === 'admin' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('guru')}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'guru'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${selectedRole === 'guru' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Guru</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('public')}
              className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                selectedRole === 'public'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className={`w-4 h-4 ${selectedRole === 'public' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>Umum / Siswa</span>
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/40 rounded-xl text-xs text-red-200 font-semibold flex items-center justify-between">
              <span>{loginError}</span>
              <button onClick={() => setLoginError('')} className="text-red-300 font-bold">×</button>
            </div>
          )}

          {/* ADMIN FORM */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-400/30 rounded-xl p-3 text-xs text-amber-200">
                <p className="font-semibold flex items-center gap-1.5 text-amber-300">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  Akses Penuh Administrator
                </p>
                <p className="mt-1 text-amber-200/90">
                  Dapat mengelola seluruh data sekolah, guru, siswa, sarpras, jadwal, kalender, absensi, nilai, dan Google Sheets.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Administrator</label>
                <input
                  type="email"
                  value="admin@alqomar.sch.id"
                  disabled
                  className="w-full px-3 py-2 bg-slate-950/60 border border-white/10 rounded-lg text-sm text-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Kata Sandi</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    className="w-full px-3 py-2 pl-9 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                    placeholder="Masukkan kata sandi..."
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-300/50"
              >
                <span>Masuk Sebagai Admin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* GURU FORM */}
          {selectedRole === 'guru' && (
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-3 text-xs text-emerald-200">
                <p className="font-semibold flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  Akses Guru & Pengajar
                </p>
                <p className="mt-1 text-emerald-200/90">
                  Mengisi administrasi guru (Modul/RPP), mengambil absensi siswa harian, serta memasukkan nilai & catatan rapor.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Pilih Akun Guru</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-900"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id} className="bg-white text-slate-900">
                      {t.nama} — ({t.mapelUtama})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">Kata Sandi</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    className="w-full px-3 py-2 pl-9 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
                    placeholder="Masukkan kata sandi..."
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 border border-emerald-300/50"
              >
                <span>Masuk Sebagai Guru</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* PUBLIC FORM */}
          {selectedRole === 'public' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-3 text-xs text-blue-200">
                <p className="font-semibold flex items-center gap-1.5 text-blue-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  Mode Umum / Siswa / Orang Tua
                </p>
                <p className="mt-1 text-blue-200/90">
                  Dapat melihat data statistik sekolah, jadwal pelajaran, agenda kegiatan, kalender akademik, dan portal cek nilai rapor siswa.
                </p>
              </div>

              <button
                type="button"
                onClick={handlePublicLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 border border-white/10"
              >
                <span>Lanjutkan Sebagai Pengunjung Umum</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
