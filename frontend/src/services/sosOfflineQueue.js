/**
 * SOS Offline Queue — manages locally stored SOS records in localStorage.
 * Used when the backend is unreachable. Records are synced when connectivity returns.
 */

const QUEUE_KEY = 'safeera_sos_offline_queue';

/**
 * Get all queued SOS records.
 * @returns {Array} array of SOS queue entries
 */
function getQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save the queue back to localStorage.
 * @param {Array} queue
 */
function saveQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    console.error('[SOSQueue] Failed to save queue — localStorage may be full');
  }
}

/**
 * Add a new SOS record to the offline queue.
 *
 * @param {{
 *   clientSosId: string,
 *   otp: string,
 *   latitude: number|null,
 *   longitude: number|null,
 *   locationType: 'current'|'last_known'|'unavailable',
 *   mapsUrl: string,
 *   timestamp: string,
 *   triggerSource: string,
 *   message: string,
 *   smsStatus: 'offline'|'online'|'compose_opened'|'partial'|'failed'|'unavailable',
 *   smsDetails: Array,
 *   deviceSmsSent?: boolean,
 *   backendSynced: boolean
 * }} sosRecord
 */
export function enqueue(sosRecord) {
  const queue = getQueue();

  // Prevent duplicates by clientSosId
  if (queue.some((r) => r.clientSosId === sosRecord.clientSosId)) {
    return;
  }

  queue.push({
    ...sosRecord,
    queuedAt: new Date().toISOString(),
    backendSynced: false,
  });
  saveQueue(queue);
}

/**
 * Get all pending (unsynced) records.
 * @returns {Array} SOS records not yet synced to backend
 */
export function getPending() {
  return getQueue().filter((r) => !r.backendSynced);
}

/**
 * Mark a record as synced to the backend.
 * @param {string} clientSosId
 */
export function markSynced(clientSosId) {
  const queue = getQueue();
  const updated = queue.map((r) =>
    r.clientSosId === clientSosId
      ? { ...r, backendSynced: true, syncedAt: new Date().toISOString() }
      : r
  );
  saveQueue(updated);
}

/**
 * Update the SMS status of a queued record.
 * @param {string} clientSosId
 * @param {string} smsStatus — 'offline'|'online'|'compose_opened'|'partial'|'failed'|'unavailable'
 * @param {Array} smsDetails — per-guardian results
 */
export function updateSmsStatus(clientSosId, smsStatus, smsDetails) {
  const queue = getQueue();
  const updated = queue.map((r) =>
    r.clientSosId === clientSosId ? { ...r, smsStatus, smsDetails } : r
  );
  saveQueue(updated);
}

/**
 * Get the count of pending records.
 * @returns {number}
 */
export function getPendingCount() {
  return getPending().length;
}

/**
 * Clear all synced records older than 24 hours (cleanup).
 */
export function cleanupOldRecords() {
  const queue = getQueue();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = queue.filter((r) => {
    if (!r.backendSynced) return true; // keep unsynced
    const syncedTime = new Date(r.syncedAt || r.queuedAt).getTime();
    return syncedTime > cutoff;
  });
  saveQueue(filtered);
}
