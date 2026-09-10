/**
 * Location Service — wraps Capacitor Geolocation on native, falls back to browser API.
 * Caches last-known position in localStorage for offline fallback.
 */
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const CACHE_KEY = 'safeera_last_known_location';

/**
 * Get the current GPS position.
 * Uses Capacitor Geolocation on native platforms, navigator.geolocation on web.
 * Caches every successful reading for offline fallback.
 *
 * @returns {{ latitude: number, longitude: number, accuracy: number, locationType: 'current' }}
 * @throws if both native and browser geolocation fail
 */
export async function getCurrentPosition() {
  if (Capacitor.isNativePlatform()) {
    // Request permission first on native
    const permStatus = await Geolocation.checkPermissions();
    if (permStatus.location !== 'granted') {
      const req = await Geolocation.requestPermissions();
      if (req.location !== 'granted') {
        throw new Error('Location permission denied');
      }
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 5000,
    });

    const result = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      locationType: 'current',
    };
    cacheLocation(result);
    return result;
  }

  // Web fallback
  if (!('geolocation' in navigator)) {
    throw new Error('Geolocation not available');
  }

  const pos = await getAccurateBrowserPosition();

  const result = {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    locationType: 'current',
  };
  cacheLocation(result);
  return result;
}

function getAccurateBrowserPosition() {
  return new Promise((resolve, reject) => {
    let bestPosition = null;
    let finished = false;

    const finish = (callback, value) => {
      if (finished) return;
      finished = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timeoutId);
      callback(value);
    };

    // A watch gives browsers time to refine a coarse Wi-Fi reading into a GPS reading.
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        if (position.coords.accuracy <= 50) {
          finish(resolve, position);
        }
      },
      (error) => finish(reject, error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );

    const timeoutId = setTimeout(() => {
      if (bestPosition) {
        finish(resolve, bestPosition);
      } else {
        finish(reject, new Error('Unable to get a location reading'));
      }
    }, 20000);
  });
}

/**
 * Get the last known (cached) location from localStorage.
 * Used when live GPS fails (e.g., indoors, permission denied).
 *
 * @returns {{ latitude: number, longitude: number, accuracy: number, locationType: 'last_known', cachedAt: string } | null}
 */
export function getLastKnownPosition() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return { ...cached, locationType: 'last_known' };
  } catch {
    return null;
  }
}

/**
 * Try to get current position; if it fails, fall back to last known.
 * Returns null only if both fail.
 */
export async function getBestAvailablePosition() {
  try {
    return await getCurrentPosition();
  } catch (err) {
    console.warn('[LocationService] Live GPS failed, using cached:', err.message);
    return getLastKnownPosition();
  }
}

/** Cache the location in localStorage */
function cacheLocation(location) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ...location, cachedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage full or unavailable — silent fail
  }
}
