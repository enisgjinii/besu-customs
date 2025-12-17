/**
 * Automatic Cache Clearing System
 * Clears cache when app version changes
 */

// Update this version number when you want to force cache clear
export const APP_VERSION = "1.0.0";
const VERSION_KEY = "app_version";

export async function checkAndClearCache(): Promise<boolean> {
  try {
    // Only run in browser
    if (typeof window === "undefined") return false;

    // Get stored version
    const storedVersion = localStorage.getItem(VERSION_KEY);

    // If version matches, no need to clear
    if (storedVersion === APP_VERSION) {
      console.log("✅ Cache version matches:", APP_VERSION);
      return false;
    }

    console.log("🔄 Version mismatch. Clearing cache...", {
      stored: storedVersion,
      current: APP_VERSION,
    });

    // Clear all caches
    let clearedCount = 0;

    // 1. Clear Cache API
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        clearedCount += cacheNames.length;
        console.log(`✅ Cleared ${cacheNames.length} cache(s)`);
      } catch (e) {
        console.warn("Failed to clear Cache API:", e);
      }
    }

    // 2. Clear localStorage (except version key)
    try {
      const keysToKeep = [VERSION_KEY];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      console.log("✅ Cleared localStorage");
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }

    // 3. Clear sessionStorage
    try {
      sessionStorage.clear();
      console.log("✅ Cleared sessionStorage");
    } catch (e) {
      console.warn("Failed to clear sessionStorage:", e);
    }

    // 4. Clear IndexedDB
    if ("indexedDB" in window) {
      try {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map((db) => {
            if (db.name) {
              return new Promise<void>((resolve) => {
                const request = indexedDB.deleteDatabase(db.name!);
                request.onsuccess = () => resolve();
                request.onerror = () => resolve();
              });
            }
            return Promise.resolve();
          }),
        );
        console.log("✅ Cleared IndexedDB");
      } catch (e) {
        console.warn("Failed to clear IndexedDB:", e);
      }
    }

    // Update version
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    console.log(
      "✅ Cache cleared successfully. Updated to version:",
      APP_VERSION,
    );

    return true;
  } catch (error) {
    console.error("❌ Failed to check/clear cache:", error);
    return false;
  }
}

/**
 * Force clear all cache (for manual clearing)
 */
export async function forceClearCache(): Promise<void> {
  try {
    // Clear version to force cache clear on next check
    localStorage.removeItem(VERSION_KEY);

    // Clear everything
    await checkAndClearCache();

    console.log("✅ Force cache clear completed");
  } catch (error) {
    console.error("❌ Force cache clear failed:", error);
    throw error;
  }
}

/**
 * Get current app version
 */
export function getAppVersion(): string {
  return APP_VERSION;
}

/**
 * Get stored version
 */
export function getStoredVersion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(VERSION_KEY);
}
