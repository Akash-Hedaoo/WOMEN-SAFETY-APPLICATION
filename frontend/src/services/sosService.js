/**
 * SOS Service — main orchestration for online/offline SOS flow.
 *
 * Online:  GPS → OTP → native device SMS → POST /api/sos/trigger → backend broadcast
 * Offline: GPS → OTP → native SMS composer / direct SIM SMS → queue for backend sync
 * No signal: GPS (cached) → OTP → queue locally → retry on reconnect
 */
import { getCurrentPosition, getLastKnownPosition } from './locationService';
import { isOnline, addConnectivityListener } from './networkService';
import { getEmergencyCachedGuardians, syncGuardians } from './guardianCacheService';
import { buildEmergencyMessage, sendToAllGuardians, isSmsAvailable } from './nativeSmsService';
import * as sosQueue from './sosOfflineQueue';
import { API_BASE_URL } from '../utils/constants';

/**
 * Generate a cryptographically random 4-digit OTP.
 * @returns {string} 4-digit OTP string (e.g., "4829")
 */
export function generateOTP() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 10000).padStart(4, '0');
}

/**
 * Generate a unique client-side SOS ID for idempotency.
 * @returns {string} UUID string
 */
export function generateClientSosId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getAuthToken() {
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken')
  );
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Main SOS trigger — handles online, offline, and no-signal scenarios.
 */
export async function triggerSOS(options = {}) {
  const {
    triggerSource = 'manual_button',
    threatScore = 0,
    threatDetails = {},
    message = 'Emergency assistance needed immediately!',
  } = options;

  const steps = [];
  const clientSosId = generateClientSosId();
  const otp = generateOTP();
  const user = getStoredUser();
  const token = getAuthToken();

  let online = false;
  try {
    online = await isOnline();
  } catch (error) {
    console.warn('[SOS] Could not determine network state:', error);
  }

  // Step 1: Get location
  let location = null;
  try {
    location = online ? await getCurrentPosition() : getLastKnownPosition();
    if (location) {
      steps.push({
        step: 'Location',
        status: location.locationType === 'current' ? 'success' : 'warning',
        detail: location.locationType === 'current'
          ? `GPS acquired (±${Math.round(location.accuracy || 0)}m)`
          : 'Using last known location',
      });
    } else {
      steps.push({ step: 'Location', status: 'failed', detail: 'Location unavailable' });
    }
  } catch (err) {
    steps.push({ step: 'Location', status: 'failed', detail: err.message });
  }

  const latitude = location?.latitude ?? null;
  const longitude = location?.longitude ?? null;
  const locationType = location?.locationType ?? 'unavailable';
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const mapsUrl = hasCoordinates
    ? `https://maps.google.com/?q=${latitude},${longitude}`
    : '';

  // Step 2: OTP generated
  steps.push({ step: 'OTP', status: 'success', detail: `Emergency OTP: ${otp}` });

  // Send via the phone's SIM before attempting the server. This keeps device
  // SMS working directly from SIM.
  let cachedGuardians = getEmergencyCachedGuardians();
  if (cachedGuardians.length === 0 && online && token) {
    try {
      cachedGuardians = await syncGuardians();
    } catch (e) {
      console.warn('[SOS] Could not auto-sync guardians:', e);
    }
  }

  let deviceSmsResult = null;
  try {
    if (cachedGuardians && cachedGuardians.length > 0 && await isSmsAvailable()) {
      const smsBody = buildEmergencyMessage({
        userName: user?.name || 'A Safe-Era user',
        latitude,
        longitude,
        otp,
        mapsUrl,
        status: online ? 'online' : 'offline',
      });
      deviceSmsResult = await sendToAllGuardians(cachedGuardians, smsBody);
      steps.push({
        step: 'Device SMS',
        status: deviceSmsResult.sent > 0 || deviceSmsResult.opened > 0 ? 'success' : 'failed',
        detail: deviceSmsResult.sent > 0
          ? `Emergency SMS sent from this phone to ${deviceSmsResult.sent}/${deviceSmsResult.total} guardians`
          : deviceSmsResult.opened > 0
          ? `SMS composer opened for ${deviceSmsResult.opened}/${deviceSmsResult.total} guardians`
          : 'Could not send emergency SMS from this device',
      });
    } else if (!cachedGuardians || cachedGuardians.length === 0) {
      steps.push({ step: 'Device SMS', status: 'warning', detail: 'No saved guardians — add a guardian in Guardian Network' });
    } else {
      steps.push({ step: 'Device SMS', status: 'failed', detail: 'SMS is unavailable on this device' });
    }
  } catch (error) {
    steps.push({ step: 'Device SMS', status: 'failed', detail: error.message || 'Could not send emergency SMS' });
  }

  // Step 3: Try online backend
  if (online && token) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sos/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude,
          longitude,
          message,
          triggerSource,
          threatScore,
          threatDetails,
          clientSosId,
          otp,
          locationType,
          smsStatus: online ? 'online' : 'offline',
          deliveryMethod: deviceSmsResult?.sent > 0 ? 'device_sms' : 'online',
          deliveryStatus: deviceSmsResult?.sent > 0 ? 'sent_from_device' : 'sent',
        }),
      });

      const data = await res.json();

      if (data.success) {
        steps.push({
          step: 'Backend',
          status: 'success',
          detail: `Server notified — ${data.guardiansAlerted || 0} guardians alerted`,
        });

        // Queue record as synced
        sosQueue.enqueue({
          clientSosId,
          otp,
          latitude,
          longitude,
          locationType,
          mapsUrl,
          timestamp: new Date().toISOString(),
          triggerSource,
          message,
          smsStatus: deviceSmsResult?.sent > 0 ? 'sent_from_device' : 'via_backend',
          smsDetails: deviceSmsResult?.results || [],
          backendSynced: true,
        });
        sosQueue.markSynced(clientSosId);

        return {
          success: true,
          mode: 'online',
          steps,
          otp,
          clientSosId,
          location,
          alert: data.alert,
          smsResult: deviceSmsResult,
        };
      }

      // Non-success response — fall through to offline
      steps.push({
        step: 'Backend',
        status: 'warning',
        detail: data.message || 'Backend returned error, trying SMS fallback',
      });
    } catch {
      steps.push({
        step: 'Backend',
        status: 'failed',
        detail: 'Cannot reach server — switching to offline SMS',
      });
    }
  } else {
    steps.push({
      step: 'Backend',
      status: 'failed',
      detail: online ? 'Not authenticated' : 'No internet connection',
    });
  }

  // Step 4: Offline SMS fallback
  const guardians = cachedGuardians && cachedGuardians.length > 0 ? cachedGuardians : getEmergencyCachedGuardians();
  const smsAvailable = await isSmsAvailable();

  if (guardians && guardians.length > 0 && smsAvailable) {
    const smsBody = buildEmergencyMessage({
      userName: user?.name || 'A Safe-Era user',
      latitude,
      longitude,
      otp,
      mapsUrl,
      status: 'offline',
    });

    const smsResult = deviceSmsResult || await sendToAllGuardians(guardians, smsBody);

    steps.push({
      step: 'SMS',
      status: (smsResult.sent > 0 || smsResult.opened > 0) ? 'success' : 'failed',
      detail: smsResult.sent > 0
        ? `Emergency SMS sent from this phone to ${smsResult.sent}/${smsResult.total} guardians`
        : smsResult.opened > 0
        ? `SMS composer opened for ${smsResult.opened}/${smsResult.total} guardians`
        : 'Could not open SMS composer',
    });

    sosQueue.enqueue({
      clientSosId,
      otp,
      latitude,
      longitude,
      locationType,
      mapsUrl,
      timestamp: new Date().toISOString(),
      triggerSource,
      message,
      smsStatus: 'offline',
      smsDetails: smsResult.results,
      deviceSmsSent: smsResult.sent > 0,
      backendSynced: false,
    });

    steps.push({ step: 'Backend Sync', status: 'pending', detail: 'Will sync when online' });

    return {
      success: true,
      mode: 'offline_sms',
      steps,
      otp,
      clientSosId,
      location,
      smsResult,
    };
  }

  // Step 5: No SMS available — queue only
  if (!guardians || guardians.length === 0) {
    steps.push({ step: 'SMS', status: 'warning', detail: 'No cached guardians — add guardians first' });
  } else {
    steps.push({ step: 'SMS', status: 'failed', detail: 'SMS not available on this device' });
  }

  sosQueue.enqueue({
    clientSosId,
    otp,
    latitude,
    longitude,
    locationType,
    mapsUrl,
    timestamp: new Date().toISOString(),
    triggerSource,
    message,
    smsStatus: 'unavailable',
    smsDetails: [],
    backendSynced: false,
  });

  steps.push({ step: 'Local Save', status: 'success', detail: 'Saved locally — will send when signal returns' });

  return {
    success: true,
    mode: 'queued_only',
    steps,
    otp,
    clientSosId,
    location,
  };
}

/**
 * Sync all pending offline SOS records to the backend.
 */
export async function syncPendingSOS() {
  const token = getAuthToken();
  if (!token) return { synced: 0, failed: 0 };

  const online = await isOnline();
  if (!online) return { synced: 0, failed: 0 };

  const pending = sosQueue.getPending();
  let synced = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/sos/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: record.latitude,
          longitude: record.longitude,
          message: record.message,
          triggerSource: record.triggerSource,
          clientSosId: record.clientSosId,
          otp: record.otp,
          locationType: record.locationType,
          smsStatus: record.smsStatus === 'offline' ? 'offline' : 'online',
          deliveryMethod: record.deviceSmsSent ? 'device_sms' : 'pending',
          deliveryStatus: record.deviceSmsSent ? 'sent_from_device' : 'pending',
        }),
      });

      const data = await res.json();
      if (data.success || data.isDuplicateSuppressed) {
        sosQueue.markSynced(record.clientSosId);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  sosQueue.cleanupOldRecords();
  return { synced, failed };
}

/**
 * Start a background listener that syncs pending SOS records when connectivity returns.
 */
export function startAutoSync() {
  syncPendingSOS().catch(() => {});
  syncGuardians().catch(() => {});

  return addConnectivityListener(async (status) => {
    if (status.connected) {
      console.log('[SOS AutoSync] Connectivity restored — syncing pending records...');
      await syncGuardians().catch(() => {});
      await syncPendingSOS().catch(() => {});
    }
  });
}
