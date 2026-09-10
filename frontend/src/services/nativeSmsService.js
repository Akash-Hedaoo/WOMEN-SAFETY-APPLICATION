/**
 * Native SMS Service — wraps @capawesome/capacitor-sms-composer
 * to open the native SMS compose screen pre-filled with emergency data.
 *
 * NOTE: This plugin does NOT auto-send. It opens the system SMS app
 * with recipient + body pre-filled. The user taps Send.
 * This is the safest universal approach — no SEND_SMS permission needed.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';

const EmergencySms = registerPlugin('EmergencySms');

const toSmsRecipient = (phoneNumber) => {
  const digits = String(phoneNumber || '').replace(/\D/g, '');
  // Guardians are stored as Indian 10-digit numbers. Add the country code so
  // Android sends reliably even when the device is roaming.
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
};

async function canSendDirectSms() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return null;
  try {
    const status = await EmergencySms.isAvailable();
    return status.available;
  } catch {
    return false;
  }
}

/**
 * Open the system SMS composer without returning its Capacitor plugin proxy.
 * Capacitor proxies expose every property (including `then`), so returning one
 * from an async function makes JavaScript treat it as a Promise and attempts
 * to call the nonexistent native `then` method.
 */
async function openSmsComposer(recipient, message) {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('SMS not available on this platform');
  }

  try {
    const { SmsComposer } = await import('@capawesome/capacitor-sms-composer');
    return await SmsComposer.composeSms({
      recipients: [recipient],
      body: message,
    });
  } catch (error) {
    throw new Error(error?.message || 'SMS composer failed');
  }
}

/**
 * Build the emergency SMS message body.
 *
 * @param {{ latitude: number, longitude: number, otp: string, mapsUrl: string, status: 'online'|'offline' }} params
 * @returns {string} formatted SMS body
 */
export function buildEmergencyMessage({ latitude, longitude, otp, mapsUrl, status = 'offline' }) {
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const locationLabel = status === 'online' ? '📍 Current location' : '📍 Last known location';
  const location = hasCoordinates ? mapsUrl : 'Location unavailable';
  const statusLine = status === 'online'
    ? '📡 Status: Online'
    : '⚠️ Her device is currently offline. This alert was sent directly via SMS.';
  const details = status === 'online'
    ? [`${locationLabel}: ${location}`, `🔐 Verification OTP: ${otp}`, statusLine]
    : [statusLine, `${locationLabel}: ${location}`, `🔐 Verification OTP: ${otp}`];

  return [
    '🚨 SAFE-ERA SOS ALERT 🚨',
    '',
    'Your member may be in danger and has triggered an SOS.',
    ...details,
    'Please contact her immediately and take necessary action.',
  ].join('\n');
}

/**
 * Send an emergency SMS through the device's active SIM/eSIM. If the device
 * cannot send directly, open the native SMS composer as a manual fallback.
 *
 * @param {string} phoneNumber — recipient phone number
 * @param {string} message — the SMS body
 * @returns {{ opened: boolean, method: 'compose'|'unavailable', status?: string, error?: string }}
 */
export async function sendEmergencySms(phoneNumber, message) {
  const recipient = toSmsRecipient(phoneNumber);
  const directSmsAvailable = await canSendDirectSms();

  if (directSmsAvailable) {
    try {
      const result = await EmergencySms.send({ phoneNumber: recipient, message });
      return { opened: true, sent: true, method: 'direct', parts: result.parts || 1 };
    } catch (err) {
      // Permission can be denied, or an eSIM/tablet may advertise messaging
      // without being able to send. Let the user still use the system composer.
      console.warn('[NativeSMS] Direct SMS unavailable, opening composer:', err?.message || err);
    }
  }

  try {
    const result = await openSmsComposer(recipient, message);
    // Android reports `unknown` after the system composer closes; it cannot
    // confirm whether the user actually sent the message.
    return { opened: result.status !== 'canceled', sent: result.status === 'sent', method: 'compose', status: result.status };
  } catch (err) {
    console.error('[NativeSMS] Failed to open SMS composer:', err);
    return { opened: false, method: 'unavailable', error: err.message || 'SMS composer failed' };
  }
}

/**
 * Send to every guardian sequentially. Android sends directly from the active
 * SIM/eSIM after permission; other platforms use the system SMS composer.
 *
 * @param {Array<{ guardianPhone: string, guardianName: string }>} guardians
 * @param {string} message — the emergency SMS body
 * @returns {{ total: number, sent: number, opened: number, failed: number, results: Array }}
 */
export async function sendToAllGuardians(guardians, message) {
  const results = [];
  let sent = 0;
  let opened = 0;
  let failed = 0;

  for (const guardian of guardians) {
    const result = await sendEmergencySms(guardian.guardianPhone, message);
    results.push({ guardian: guardian.guardianName, phone: guardian.guardianPhone, ...result });
    if (result.sent) sent++;
    if (result.opened) {
      opened++;
    } else {
      failed++;
    }
  }

  return { total: guardians.length, sent, opened, failed, results };
}

/**
 * Check if native SMS is available on this platform.
 * @returns {Promise<boolean>}
 */
export async function isSmsAvailable() {
  if (await canSendDirectSms()) return true;

  try {
    if (!Capacitor.isNativePlatform()) return false;
    const { SmsComposer } = await import('@capawesome/capacitor-sms-composer');
    const { canCompose } = await SmsComposer.canComposeSms();
    return canCompose;
  } catch {
    return false;
  }
}
