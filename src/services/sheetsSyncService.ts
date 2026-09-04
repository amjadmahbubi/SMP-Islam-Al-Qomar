import { 
  Student, 
  Teacher, 
  SarprasItem, 
  SchoolInfo, 
  ScheduleItem, 
  CalendarEvent, 
  PpdbRegistration 
} from '../types';

export interface SheetsPayload {
  status?: string;
  timestamp?: string;
  students?: Student[];
  teachers?: Teacher[];
  sarpras?: SarprasItem[];
  schoolInfo?: SchoolInfo;
  ppdbRegistrations?: PpdbRegistration[];
  schedules?: ScheduleItem[];
  events?: CalendarEvent[];
}

export interface FetchResult {
  success: boolean;
  data?: SheetsPayload;
  error?: string;
  isNetworkError?: boolean;
}

export function validateSheetsUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL Google Apps Script tidak boleh kosong.' };
  }
  const clean = url.trim();
  if (!clean.startsWith('https://script.google.com/')) {
    return { isValid: false, error: 'URL harus diawali dengan https://script.google.com/' };
  }
  if (!clean.includes('/exec')) {
    return { isValid: false, error: 'URL harus berakhiran /exec (Web App ter-deploy).' };
  }
  return { isValid: true };
}

export async function fetchFromGoogleSheets(webAppUrl: string, timeoutMs = 8000): Promise<FetchResult> {
  const validation = validateSheetsUrl(webAppUrl);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const cleanUrl = webAppUrl.trim();
  const fetchUrl = cleanUrl.includes('?') 
    ? `${cleanUrl}&action=getAllData&_t=${Date.now()}` 
    : `${cleanUrl}?action=getAllData&_t=${Date.now()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fetchUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { 
        success: false, 
        error: `Server Google Sheets merespon kode: ${response.status} ${response.statusText}` 
      };
    }

    const json = await response.json();
    if (!json || typeof json !== 'object') {
      return { success: false, error: 'Respon dari Google Sheets bukan format JSON yang valid.' };
    }

    return {
      success: true,
      data: json as SheetsPayload
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      success: false,
      isNetworkError: true,
      error: isTimeout ? 'Koneksi ke Google Sheets timeout (lebih dari 8 detik).' : (err.message || 'Gagal terhubung ke Google Sheets.')
    };
  }
}
