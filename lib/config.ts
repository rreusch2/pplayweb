export function getBackendUrl() {
  // Prefer explicit env variable, otherwise fall back to known production URL, then localhost for dev
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (envUrl && /^https?:\/\//i.test(envUrl)) return envUrl.replace(/\/$/, '');
  // Known Railway backend (from mobile app config)
  const fallbackProd = 'https://zooming-rebirth-production-a305.up.railway.app';
  if (typeof window !== 'undefined') {
    // If running locally and no env set, allow localhost
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return 'http://localhost:3001';
  }
  return fallbackProd;
}

export const BACKEND_URL = getBackendUrl();

export function getDefaultChatHeaders() {
  return {
    'Content-Type': 'application/json',
  } as Record<string, string>;
}
