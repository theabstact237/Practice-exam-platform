const SESSION_KEY = 'aws_exam_analytics_session';

/**
 * Stable ID per browser tab session (sessionStorage).
 */
export function getOrCreateSessionKey(): string {
  try {
    let key = sessionStorage.getItem(SESSION_KEY);
    if (!key) {
      key = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, key);
    }
    return key;
  } catch {
    return `fallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Coarse device class for analytics (matches backend allowed values).
 */
export function getDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  return 'desktop';
}
