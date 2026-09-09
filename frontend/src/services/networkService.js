/**
 * Network Service — wraps Capacitor Network plugin for reliable connectivity detection.
 * Falls back to navigator.onLine on web.
 */
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

/**
 * Check if the device currently has internet connectivity.
 * Uses Capacitor Network plugin on native, navigator.onLine on web.
 *
 * @returns {Promise<boolean>}
 */
export async function isOnline() {
  if (Capacitor.isNativePlatform()) {
    const status = await Network.getStatus();
    return status.connected;
  }
  return navigator.onLine;
}

/**
 * Get detailed network status.
 *
 * @returns {Promise<{ connected: boolean, connectionType: string }>}
 */
export async function getNetworkStatus() {
  if (Capacitor.isNativePlatform()) {
    return await Network.getStatus();
  }
  return {
    connected: navigator.onLine,
    connectionType: navigator.onLine ? 'unknown' : 'none',
  };
}

/**
 * Listen for network connectivity changes.
 * Fires callback whenever the device goes online or offline.
 *
 * @param {(status: { connected: boolean, connectionType: string }) => void} callback
 * @returns {() => void} cleanup function to remove the listener
 */
export function addConnectivityListener(callback) {
  if (Capacitor.isNativePlatform()) {
    // Capacitor returns a Promise<PluginListenerHandle> on current versions.
    // Keep the eventual handle so an unmount that happens before it resolves
    // still cleans up the native listener.
    let removed = false;
    let handle;
    Network.addListener('networkStatusChange', callback)
      .then((listenerHandle) => {
        handle = listenerHandle;
        if (removed) return handle.remove();
      })
      .catch((error) => console.warn('[NetworkService] Listener unavailable:', error));

    return () => {
      removed = true;
      return handle?.remove();
    };
  }

  // Web fallback
  const onOnline = () => callback({ connected: true, connectionType: 'unknown' });
  const onOffline = () => callback({ connected: false, connectionType: 'none' });
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
