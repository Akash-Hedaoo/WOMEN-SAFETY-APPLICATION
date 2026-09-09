/**
 * Guardian Cache Service — caches guardian contacts in localStorage
 * so offline SOS can still reach guardian phone numbers.
 */
import { API_BASE_URL } from '../utils/constants';

const CACHE_KEY = 'safeera_cached_guardians';

/**
 * Get the auth token from localStorage (mirrors SOS.jsx pattern).
 */
function getAuthToken() {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken')
  );
}

/**
 * Fetch guardians from the backend API and cache them locally.
 * Should be called whenever the app is online (on mount, on reconnect).
 *
 * @returns {Array} array of guardian objects
 */
export async function syncGuardians() {
  const token = getAuthToken();
  if (!token) return getCachedGuardians();

  try {
    const res = await fetch(`${API_BASE_URL}/api/guardian`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return getCachedGuardians();

    const data = await res.json();
    const allGuardians = [
      ...(data.verified || []).map((g) => ({
        _id: g._id,
        guardianName: g.guardianName,
        guardianPhone: g.guardianPhone,
        relation: g.relation,
        isVerified: true,
      })),
      ...(data.pending || []).map((g) => ({
        _id: g._id,
        guardianName: g.guardianName,
        guardianPhone: g.guardianPhone,
        relation: g.relation,
        isVerified: false,
      })),
    ];

    // Cache to localStorage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        guardians: allGuardians,
        syncedAt: new Date().toISOString(),
      }));
    } catch {
      // localStorage full — silent fail
    }

    return allGuardians;
  } catch (err) {
    console.warn('[GuardianCache] Sync failed, using cache:', err.message);
    return getCachedGuardians();
  }
}

/**
 * Get cached guardians from localStorage.
 * Used during offline SOS to know who to SMS.
 *
 * @returns {Array} array of guardian objects (may be empty if never synced)
 */
export function getCachedGuardians() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.guardians || [];
  } catch {
    return [];
  }
}

/**
 * Get only verified guardians (these are the ones we should SMS in an emergency).
 *
 * @returns {Array} filtered array of verified guardian objects
 */
export function getVerifiedCachedGuardians() {
  return getCachedGuardians().filter((g) => g.isVerified);
}

/**
 * Get the contacts to use for an emergency SMS.
 * Verified guardians are preferred. If the user has just added their first
 * guardian and verification is still pending, use that contact rather than
 * leaving an SOS without a recipient.
 */
export function getEmergencyCachedGuardians() {
  const guardians = getCachedGuardians();
  const verified = guardians.filter((g) => g.isVerified);
  return verified.length > 0 ? verified : guardians;
}

/**
 * Get the timestamp of the last successful sync.
 *
 * @returns {string|null} ISO timestamp or null
 */
export function getLastSyncTime() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.syncedAt || null;
  } catch {
    return null;
  }
}
