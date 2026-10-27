import React from 'react';
import { Student, SchoolInfo } from '../../types';
import { Printer, X, Award, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

interface SuratKeteranganLulusModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  schoolInfo: SchoolInfo;
}

export const SuratKeteranganLulusModal: React.FC<SuratKeteranganLulusModalProps> = ({
  isOpen,
  onClose,
  student,
  schoolInfo
}) => {
  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    const cleanDate = dateStr.split('T')[0].split(' ')[0].replace(/^(Senin|Selasa|Rabu|Kamis|Jum'?at|Sabtu|Minggu|Ahad)[,\s]+/gi, '').trim();
    const parts = cleanDate.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day) && !isNaN(year)) {
        return `${day} ${monthNames[monthIndex]} ${year}`;
      }
    }
    return cleanDate;
  };

  const currentYear = new Date().getFullYear();
  const tahunLulusDisplay = student.tahunLulus || schoolInfo.tahunAjaran || `${currentYear - 1}/${currentYear}`;
  const tanggalLulusDisplay = student.tanggalLulus
    ? formatDateIndo(student.tanggalLulus)
    : formatDateIndo(new Date().toISOString().split('T')[0]);
  const nomorSklDisplay = student.nomorSkl || `421.3/${student.nis || '001'}/SMP-AQ/SKL/${currentYear}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Top Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Award className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold font-serif text-slate-900 text-sm sm:text-base">
                Surat Keterangan Lulus (SKL) Resmi
              </h3>
              <p className="text-xs text-slate-500">
                Santri: <span className="font-semibold text-slate-800">{student.nama}</span> ({student.nisn})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Area) */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 print:bg-white print:p-0">
          
          <div
            id="print-skl-document"
            className="bg-white p-8 sm:p-12 rounded-xl border border-slate-300 shadow-md max-w-2xl mx-auto print:shadow-none print:border-none print:max-w-none print:p-8 print:m-0 text-slate-900 font-serif leading-relaxed"
          >
            {/* Kop Surat Resmi */}
            <div className={`text-center relative ${schoolInfo.kopSuratUrl ? 'pb-2 mb-2' : 'border-b-4 border-double border-slate-900 pb-4'}`}>
              {schoolInfo.kopSuratUrl ? (
                <div className="w-full flex justify-center mb-1">
                  <img 
                    src={schoolInfo.kopSuratUrl} 
                    alt="Kop Surat Resmi SMP Islam Al Qomar" 
                    className="w-full max-h-32 object-contain mx-auto print:max-h-36"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4 mb-1">
                  <div className="w-16 h-16 rounded-full bg-emerald-800 text-emerald-100 flex items-center justify-center font-bold text-2xl border-2 border-emerald-600 shadow-sm print:border-black overflow-hidden shrink-0">
                    {schoolInfo.logoUrl ? (
                      <img src={schoolInfo.logoUrl} alt={schoolInfo.nama} className="w-full h-full object-cover" />
                    ) : (
                      "AQ"
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-700 font-sans">
                      YAYASAN PENDIDIKAN ISLAM AL QOMAR
                    </h3>
                    <h1 className="text-lg sm:text-2xl font-black uppercase text-emerald-950 font-serif tracking-wide print:text-black">
                      {schoolInfo.nama || 'SMP ISLAM AL QOMAR'}
                    </h1>
                    <p className="text-[11px] text-slate-600 font-sans mt-0.5 font-medium">
                      NPSN: {schoolInfo.npsn || '70001007'} | Akreditasi: {schoolInfo.akreditasi || 'B'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans">
                      {schoolInfo.alamat || 'Banyuwangi, Jawa Timur'} | Telp: {schoolInfo.telepon || '-'} | Email: {schoolInfo.email || '-'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Judul & Nomor Surat */}
            <div className="text-center my-6">
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider underline underline-offset-4 text-slate-900">
                SURAT KETERANGAN LULUS
              </h2>
              <p className="text-xs font-mono text-slate-700 mt-1">
                Nomor: {nomorSklDisplay}
              </p>
            </div>

            {/* Pembuka */}
            <p className="text-xs sm:text-sm text-justify mb-4 font-sans">
              Kepala Sekolah Menengah Pertama (SMP) Islam Al Qomar Banyuwangi, berdasarkan hasil Rapat Pleno Dewan Guru tentang Kelulusan Peserta Didik Tahun Ajaran <strong>{tahunLulusDisplay}</strong>, dengan ini menerangkan bahwa:
            </p>

            {/* Tabel Identitas Siswa */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 mb-5 font-sans text-xs sm:text-sm print:bg-transparent print:border-slate-300">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200/60">
                    <td className="py-1.5 w-44 font-semibold text-slate-700">Nama Peserta Didik</td>
                    <td className="py-1.5 w-4 text-center">:</td>
                    <td className="py-1.5 font-bold text-slate-900 uppercase font-serif text-sm">
                      {student.nama}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60">
                    <td className="py-1.5 font-semibold text-slate-700">Nomor Induk Siswa Nasional (NISN)</td>
                    <td className="py-1.5 text-center">:</td>
                    <td className="py-1.5 font-mono font-bold text-slate-900">
                      {student.nisn}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60">
                    <td className="py-1.5 font-semibold text-slate-700">Nomor Induk Siswa (NIS)</td>
                    <td className="py-1.5 text-center">:</td>
                    <td className="py-1.5 font-mono text-slate-900">
                      {student.nis}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60">
                    <td className="py-1.5 font-semibold text-slate-700">Tempat, Tanggal Lahir</td>
                    <td className="py-1.5 text-center">:</td>
                    <td className="py-1.5 text-slate-900">
                      {student.tempatLahir}, {formatDateIndo(student.tanggalLahir)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60">
                    <td className="py-1.5 font-semibold text-slate-700">Jenis Kelamin</td>
                    <td className="py-1.5 text-center">:</td>
                    <td className="py-1.5 text-slate-900">
                      {student.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200/60">
                    <td className="py-1.5 font-semibold text-slate-700">Nama Orang Tua / Wali</td>
                    <td className="py-1.5 text-center">:</td>
                    <td className="py-1.5 text-slate-900">
                      {student.namaOrangTua || (student.namaAyah ? `${student.namaAyah} & ${student.namaIbu || ''}` : '-')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-semibold text-slate-700">Rombel / Kelas Terakhir</td>
                    <td className="py-1.5 text-center">:</td>
                    <td className="py-1.5 text-slate-900 font-semibold">
                      Kelas {student.kelas}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pernyataan Kelulusan Box */}
            <div className="my-5 text-center">
              <p className="text-xs sm:text-sm font-sans mb-3 text-slate-700">
                Sesuai dengan kriteria kelulusan peserta didik yang ditetapkan oleh Satuan Pendidikan SMP Islam Al Qomar, peserta didik di atas dinyatakan:
              </p>
              
              <div className="inline-block border-2 border-emerald-800 bg-emerald-50 text-emerald-950 font-black font-serif text-xl sm:text-2xl px-10 py-2.5 rounded-lg tracking-widest uppercase shadow-sm print:border-black print:bg-white print:text-black">
                L U L U S
              </div>

              {student.nomorIjazah && (
                <p className="text-xs font-mono text-slate-600 mt-2">
                  Nomor Seri Ijazah: <strong>{student.nomorIjazah}</strong>
                </p>
              )}
            </div>

            {/* Catatan Penutup */}
            <p className="text-xs sm:text-sm font-sans text-justify mb-8 text-slate-700 leading-relaxed">
              Surat Keterangan Lulus ini diterbitkan secara sah dan berlaku sementara sampai dengan diterbitkannya Ijazah Asli, serta dapat dipergunakan untuk keperluan pendaftaran ke jenjang pendidikan selanjutnya (SMA/SMK/MA/Pondok Pesantren) atau keperluan resmi lainnya.
            </p>

            {/* Tanda Tangan & Pas Foto */}
            <div className="grid grid-cols-2 gap-6 items-end mt-6 pt-4 font-sans text-xs sm:text-sm">
              <div className="flex flex-col items-center">
                <div className="w-24 h-32 border-2 border-dashed border-slate-400 rounded-md flex flex-col items-center justify-center text-slate-400 text-center p-2 text-[10px] uppercase font-mono print:border-slate-500">
                  <span>Pas Foto</span>
                  <span>3 x 4 cm</span>
                  <span className="text-[8px] text-slate-400 mt-1">(Cap Tiga Jari)</span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <p className="text-slate-700">
                  Banyuwangi, {tanggalLulusDisplay}
                </p>
                <p className="text-slate-800 font-semibold mb-16">
                  Kepala SMP Islam Al Qomar,
                </p>

                <p className="font-bold text-slate-950 underline underline-offset-4 text-sm font-serif">
                  {schoolInfo.kepalaSekolah || 'Diah Putriani, S.Pd'}
                </p>
                <p className="text-[11px] text-slate-600 font-mono">
                  {schoolInfo.nigyKepalaSekolah
                    ? `NIGY: ${schoolInfo.nigyKepalaSekolah}`
                    : (schoolInfo.nipKepalaSekolah ? `NIP: ${schoolInfo.nipKepalaSekolah}` : 'NIGY: 992 101 002')}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer (Hidden during print) */}
        <div className="print:hidden px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Dokumen resmi terverifikasi data pokok satuan pendidikan SMP Islam Al Qomar</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
