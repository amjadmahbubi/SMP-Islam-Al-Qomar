import React, { useState } from 'react';
import { ScheduleItem, Teacher, Student, SchoolInfo } from '../../types';
import { Clock, Filter, Search, Printer, CalendarDays } from 'lucide-react';
import { getAllClasses, COMMON_SCHEDULE_ACTIVITIES } from '../../data/constants';

interface PublicJadwalProps {
  schedules: ScheduleItem[];
  teachers?: Teacher[];
  students?: Student[];
  schoolInfo?: SchoolInfo;
}

export const PublicJadwal: React.FC<PublicJadwalProps> = ({
  schedules,
  teachers = [],
  students = [],
  schoolInfo
}) => {
  const dynamicClasses = getAllClasses(students, schedules, teachers);
  const [selectedClass, setSelectedClass] = useState<string>(dynamicClasses[0] || '7A');
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const filteredSchedules = schedules.filter(item => {
    const matchClass = item.kelas === selectedClass;
    const matchDay = item.hari === selectedDay;
    const matchSearch = searchTerm === '' || 
      item.mapel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.guruNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.ruang.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchDay && matchSearch;
  }).sort((a, b) => a.jamKe - b.jamKe);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Jadwal Pelajaran SMP Islam Al Qomar</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-400/20 text-amber-300 px-2.5 py-0.5 rounded-md border border-amber-400/30 font-mono">
              TA {schoolInfo?.tahunAjaran || '2024/2025'} • Semester {schoolInfo?.semesterAktif || 'Ganjil'}
            </span>
          </div>
          <h2 className="text-xl font-bold font-serif text-white">
            Jadwal Pembelajaran Kelas {selectedClass} — Hari {selectedDay}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Jadwal kegiatan belajar mengajar, tahfidz Al-Qur'an, muatan lokal (Bahasa Jawa, Imla'), dan pembiasaan islami
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="self-start md:self-auto flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl border border-white/10 transition-colors shadow"
        >
          <Printer className="w-4 h-4 text-slate-300" />
          <span>Cetak Jadwal</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl space-y-4">
        
        {/* Class Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Pilih Rombongan Belajar (Kelas)
          </label>
          <div className="flex flex-wrap gap-2">
            {dynamicClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  selectedClass === cls
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow'
                    : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                Kelas {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Day Selector Tabs & Search Input */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2 border-t border-white/10">
          
          <div className="lg:col-span-8 flex flex-wrap gap-1.5">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDay === day
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold shadow'
                    : 'bg-slate-950/40 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="lg:col-span-4 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari mata pelajaran atau ustadz..."
              className="w-full px-3 py-2 pl-9 bg-slate-950/60 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

        </div>

      </div>

      {/* Schedule Grid List */}
      {filteredSchedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((sch) => {
            const isActivity = COMMON_SCHEDULE_ACTIVITIES.includes(sch.mapel);
            return (
              <div
                key={sch.id}
                className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-5 border border-white/10 shadow-xl hover:border-emerald-400/30 transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-400/30">
                    Jam Ke-{sch.jamKe}
                  </span>
                  <span className="text-xs font-mono text-slate-300 font-semibold bg-slate-950/60 px-2 py-0.5 rounded border border-white/5">
                    {sch.waktu}
                  </span>
                </div>

                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-white font-serif leading-snug">
                      {sch.mapel}
                    </h3>
                    {isActivity && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-400/30 shrink-0">
                        Kegiatan
                      </span>
                    )}
                    {(sch.mapel === 'Bahasa Jawa' || sch.mapel === "Imla'") && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-400/30 shrink-0">
                        Mulok
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-emerald-300 font-medium mt-1.5">
                    👨‍🏫 {sch.guruNama}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span>Ruangan: <strong className="text-slate-200">{sch.ruang}</strong></span>
                  <span className="text-emerald-400 font-semibold">SMP Islam Al Qomar</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass backdrop-blur-xl bg-slate-900/60 rounded-2xl p-10 border border-white/10 shadow-xl text-center space-y-3">
          <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-white/10">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">
            Tidak ada jadwal untuk Kelas {selectedClass} pada hari {selectedDay}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            Gunakan tombol filter di atas atau reset kata kunci pencarian Anda untuk melihat jadwal pelajaran lainnya.
          </p>
        </div>
      )}

    </div>
  );
};
