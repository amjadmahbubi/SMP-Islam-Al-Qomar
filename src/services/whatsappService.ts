// WhatsApp Notification Service & Template Generator for DAPODIK SMP Islam Al Qomar

export interface WANotificationLog {
  id: string;
  timestamp: string;
  type: 'PPDB_PENDAFTARAN' | 'PPDB_STATUS' | 'PRESENSI_SISWA' | 'BROADCAST_KELAS';
  recipientName: string;
  recipientPhone: string;
  message: string;
  status: 'Terkirim' | 'Gagal' | 'Direct WA Opened';
}

export interface WAGatewayConfig {
  provider: 'direct_link' | 'fonnte' | 'wablas' | 'custom_webhook';
  apiKey: string;
  senderNumber: string;
  autoSendPPDB: boolean;
  autoSendAbsensiNonHadir: boolean;
}

const STORAGE_KEY_WA_CONFIG = 'dapodik_wa_config';
const STORAGE_KEY_WA_LOGS = 'dapodik_wa_logs';

export const DEFAULT_WA_CONFIG: WAGatewayConfig = {
  provider: 'direct_link',
  apiKey: '',
  senderNumber: '081234567890',
  autoSendPPDB: true,
  autoSendAbsensiNonHadir: true
};

export class WAService {
  static getConfig(): WAGatewayConfig {
    const data = localStorage.getItem(STORAGE_KEY_WA_CONFIG);
    if (!data) return DEFAULT_WA_CONFIG;
    try {
      return { ...DEFAULT_WA_CONFIG, ...JSON.parse(data) };
    } catch {
      return DEFAULT_WA_CONFIG;
    }
  }

  static saveConfig(config: WAGatewayConfig): void {
    localStorage.setItem(STORAGE_KEY_WA_CONFIG, JSON.stringify(config));
  }

  static getLogs(): WANotificationLog[] {
    const data = localStorage.getItem(STORAGE_KEY_WA_LOGS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static addLog(log: Omit<WANotificationLog, 'id' | 'timestamp'>): WANotificationLog {
    const logs = this.getLogs();
    const newLog: WANotificationLog = {
      ...log,
      id: `WALOG-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID')
    };
    const updated = [newLog, ...logs].slice(0, 100); // keep last 100 logs
    localStorage.setItem(STORAGE_KEY_WA_LOGS, JSON.stringify(updated));
    return newLog;
  }

  // Format phone number to Indonesian 62 format
  static formatPhone(phone: string): string {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return cleaned;
  }

  // Template 1: PPDB Registration Receipt
  static createPpdbRegistrationMessage(data: {
    namaLengkap: string;
    idPendaftaran: string;
    pilihanKelas: string;
    asalSekolah: string;
    namaOrangTua: string;
    schoolName: string;
  }): string {
    return (
      `*PANITIA PPDB ${data.schoolName.toUpperCase()}*\n` +
      `Assalamualaikum Wr. Wb. Bpk/Ibu *${data.namaOrangTua}*,\n\n` +
      `Terima kasih telah mendaftarkan putra/putri Anda di *${data.schoolName}*.\n\n` +
      `📋 *DETAIL PENDAFTARAN PPDB:*\n` +
      `• No. Pendaftaran: *${data.idPendaftaran}*\n` +
      `• Nama Calon Siswa: *${data.namaLengkap}*\n` +
      `• Program Kelas: *${data.pilihanKelas}*\n` +
      `• Asal Sekolah: *${data.asalSekolah}*\n` +
      `• Status: ⏳ *Menunggu Verifikasi Berkas*\n\n` +
      ` Silakan simpan No. Pendaftaran di atas untuk pengecekan status berkas dan jadwal tes seleksi.\n\n` +
      `Wassalamualaikum Wr. Wb.\n` +
      `_Panitia PPDB SMP Islam Al Qomar Banyuwangi_`
    );
  }

  // Template 2: PPDB Status Update
  static createPpdbStatusUpdateMessage(data: {
    namaLengkap: string;
    idPendaftaran: string;
    status: string;
    catatan?: string;
    schoolName: string;
  }): string {
    let statusEmoji = 'ℹ️';
    if (data.status === 'Diterima') statusEmoji = '✅';
    else if (data.status === 'Berkas Diverifikasi') statusEmoji = '📝';
    else if (data.status === 'Ditolak') statusEmoji = '❌';

    return (
      `*PEMBERITAHUAN STATUS PPDB - ${data.schoolName.toUpperCase()}*\n\n` +
      `Yth. Orang Tua/Wali dari *${data.namaLengkap}* (No. Reg: *${data.idPendaftaran}*),\n\n` +
      `Status Pendaftaran PPDB putra/putri Anda telah diperbarui:\n` +
      `Status Baru: ${statusEmoji} *${data.status.toUpperCase()}*\n\n` +
      `💬 *Catatan Panitia:*\n"${data.catatan || 'Silakan hubungi Panitia PPDB untuk informasi lebih lanjut.'}"\n\n` +
      `Informasi lebih lanjut silakan membalas pesan ini atau datang ke Sekretariat PPDB SMP Islam Al Qomar.\n\n` +
      `_Terima kasih atas perhatian Bpk/Ibu._`
    );
  }

  // Template 3: Individual Student Absence Notification
  static createAbsensiMessage(data: {
    studentName: string;
    kelas: string;
    tanggal: string;
    status: 'H' | 'I' | 'S' | 'A';
    catatan?: string;
    mapel: string;
    guruName: string;
    schoolName: string;
  }): string {
    const statusMap = {
      H: 'HADIR',
      I: 'IZIN',
      S: 'SAKIT',
      A: 'ALPA (TANPA KETERANGAN)'
    };

    const statusEmoji = {
      H: '✅',
      I: '📩',
      S: '💊',
      A: '⚠️'
    };

    return (
      `*LAPORAN KEHADIRAN SISWA - ${data.schoolName.toUpperCase()}*\n\n` +
      `Assalamualaikum Wr. Wb. Yth. Orang Tua/Wali dari *${data.studentName}* (Kelas ${data.kelas}),\n\n` +
      `Memberitahukan catatan kehadiran putra/putri Anda pada:\n` +
      `📅 Tanggal: *${data.tanggal}*\n` +
      `📖 Mata Pelajaran: *${data.mapel}*\n` +
      `👨‍🏫 Guru Pengampu: *${data.guruName}*\n` +
      ` Status Kehadiran: ${statusEmoji[data.status]} *${statusMap[data.status]}*\n` +
      (data.catatan ? `📝 Catatan: _${data.catatan}_\n` : '') +
      `\n` +
      (data.status === 'A'
        ? `⚠️ *Perhatian:* Mohon konfirmasi kepada Wali Kelas mengenai alasan ketidakhadiran putra/putri Anda.\n\n`
        : '') +
      `Semoga ananda senantiasa diberikan kesehatan dan keberkahan dalam menuntut ilmu.\n\n` +
      `Wassalamualaikum Wr. Wb.\n` +
      `_Wali Kelas ${data.kelas} ${data.schoolName}_`
    );
  }

  // Template 4: Class Attendance Summary Broadcast
  static createClassAttendanceBroadcast(data: {
    kelas: string;
    tanggal: string;
    totalHadir: number;
    totalIzin: number;
    totalSakit: number;
    totalAlpa: number;
    nonHadirNames: string[];
    schoolName: string;
  }): string {
    return (
      `*REKAP PRESENSI HARIAN KELAS ${data.kelas} - ${data.schoolName.toUpperCase()}*\n` +
      `📅 Tanggal: *${data.tanggal}*\n\n` +
      `📊 *RINGKASAN KEHADIRAN:* \n` +
      `• Hadir: *${data.totalHadir} Siswa*\n` +
      `• Izin: *${data.totalIzin} Siswa*\n` +
      `• Sakit: *${data.totalSakit} Siswa*\n` +
      `• Alpa: *${data.totalAlpa} Siswa*\n\n` +
      ((data.nonHadirNames && data.nonHadirNames.length > 0)
        ? `📋 *Catatan Siswa Tidak Hadir / Izin / Sakit:*\n` +
          (data.nonHadirNames || []).map((n, i) => `${i + 1}. ${n}`).join('\n') +
          `\n\n`
        : ` Alhamdulillaah seluruh siswa Kelas ${data.kelas} HADIR LENGKAP.\n\n`) +
      `_Disampaikan oleh Wali Kelas ${data.kelas} ${data.schoolName}_`
    );
  }

  // Send WhatsApp via Direct Link (wa.me) or API Gateway
  static async sendWA(phone: string, message: string, recipientName: string, type: WANotificationLog['type']): Promise<boolean> {
    const config = this.getConfig();
    const formattedPhone = this.formatPhone(phone);

    // If Fonnte or Wablas API key is configured, attempt HTTP POST
    if (config.provider === 'fonnte' && config.apiKey) {
      try {
        const response = await fetch('https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': config.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            target: formattedPhone,
            message: message
          })
        });
        const resJson = await response.json();
        if (resJson.status) {
          this.addLog({
            type,
            recipientName,
            recipientPhone: formattedPhone,
            message,
            status: 'Terkirim'
          });
          return true;
        }
      } catch (err) {
        console.warn('Fonnte API error, falling back to Direct WA:', err);
      }
    }

    // Default Fallback: Open Direct WA Web/App Link
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;
    
    window.open(waUrl, '_blank');

    this.addLog({
      type,
      recipientName,
      recipientPhone: formattedPhone,
      message,
      status: 'Direct WA Opened'
    });

    return true;
  }
}
