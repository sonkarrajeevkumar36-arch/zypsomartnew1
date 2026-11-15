import { GeoCoords } from '../types';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Checks whether an async error / API failure from Google Maps Platform represents quota exhaustion
 * or auth/billing limits, and dispatches the top-level `gmp-quota-exceeded` event without false positives.
 */
export function notifyIfGmpQuotaExceeded(err: unknown): boolean {
  if (!err || typeof window === 'undefined') return false;
  const anyErr = err as any;
  const status = anyErr?.status ?? anyErr?.code ?? anyErr?.error?.status;
  const message = String(anyErr?.message || anyErr?.error?.message || err || '');

  const isQuota =
    status === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    status === 'OVER_QUERY_LIMIT' ||
    message.includes('OverQuotaMapError') ||
    message.includes('QuotaExceededError') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('OVER_QUERY_LIMIT') ||
    message.includes('429');

  if (isQuota) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    return true;
  }
  return false;
}

/**
 * Loads user-pinned delivery coordinates from localStorage, enforcing Google Maps Platform's
 * 30 consecutive calendar days caching limit.
 */
export function loadCachedCoords(storageKey: string): GeoCoords | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: number; lng?: number; savedAt?: number };
    if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number') {
      return null;
    }
    if (parsed.savedAt && Date.now() - parsed.savedAt > THIRTY_DAYS_MS) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

export function saveCachedCoords(storageKey: string, coords: GeoCoords | null): void {
  try {
    if (!coords) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        lat: coords.lat,
        lng: coords.lng,
        savedAt: Date.now()
      })
    );
  } catch {
    // Ignore storage quota / restricted storage errors
  }
}
