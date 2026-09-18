import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Unregister all service workers and purge caches in preview to avoid stale caching
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  }).catch(() => {});
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    }).catch(() => {});
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err) {
    console.error('Error mounting React root:', err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; background: #020617; color: #f8fafc; padding: 24px; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="max-width: 480px; width: 100%; background: #0f172a; border: 1px solid #ef4444; border-radius: 16px; padding: 24px; text-align: center;">
          <h2 style="color: #ef4444; margin-bottom: 12px; font-size: 18px;">Terjadi Kendala Memuat Aplikasi</h2>
          <p style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">Silakan muat ulang halaman. Jika kendala berlanjut, data lokal dapat direset.</p>
          <button onclick="localStorage.clear(); location.reload();" style="background: #10b981; color: #020617; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Reset Cache & Muat Ulang
          </button>
        </div>
      </div>
    `;
  }
}

