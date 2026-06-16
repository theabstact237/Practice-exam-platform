/**
 * Backend base URL for the mobile app.
 *
 * Physical Android dev builds block cleartext HTTP to LAN IPs unless rebuilt with
 * usesCleartextTraffic. HTTPS (Render, localtunnel, ngrok) works without a rebuild.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  'https://aws-exam-backend.onrender.com';

export const apiRequestHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_BASE_URL.includes('loca.lt')) {
    headers['Bypass-Tunnel-Reminder'] = 'true';
  }
  return headers;
};

/** Quick reachability check before heavy AI calls. */
export const checkBackendReachable = async (timeoutMs = 8000): Promise<void> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: apiRequestHeaders(),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Backend returned HTTP ${response.status}`);
    }
  } finally {
    clearTimeout(timer);
  }
};
