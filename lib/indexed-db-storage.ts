import { StateStorage } from "zustand/middleware";

const DB_NAME = "besu-customs-db";
const STORE_NAME = "key-val";

// Check if we're in browser and IndexedDB is available
const isIndexedDBAvailable = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return "indexedDB" in window && window.indexedDB !== null;
  } catch {
    return false;
  }
};

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Fallback to localStorage
const localStorageFallback: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return typeof window !== "undefined" ? localStorage.getItem(name) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(name, value);
      }
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(name);
      }
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
    }
  },
};

// Try IndexedDB first, fallback to localStorage
export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    // Return null immediately on server
    if (typeof window === "undefined") return null;

    if (!isIndexedDBAvailable()) {
      return localStorageFallback.getItem(name);
    }

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(STORE_NAME, "readonly");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(name);
          request.onerror = () => {
            console.warn("IndexedDB getItem failed, using localStorage");
            resolve(localStorageFallback.getItem(name));
          };
          request.onsuccess = () => resolve((request.result as string) || null);
        } catch (error) {
          console.warn(
            "IndexedDB transaction failed, using localStorage:",
            error,
          );
          resolve(localStorageFallback.getItem(name));
        }
      });
    } catch (error) {
      console.warn("IndexedDB init failed, using localStorage:", error);
      return localStorageFallback.getItem(name);
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    // Do nothing on server
    if (typeof window === "undefined") return;

    if (!isIndexedDBAvailable()) {
      localStorageFallback.setItem(name, value);
      return;
    }

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(STORE_NAME, "readwrite");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put(value, name);
          request.onerror = () => {
            console.warn("IndexedDB setItem failed, using localStorage");
            localStorageFallback.setItem(name, value);
            resolve();
          };
          request.onsuccess = () => resolve();
        } catch (error) {
          console.warn(
            "IndexedDB transaction failed, using localStorage:",
            error,
          );
          localStorageFallback.setItem(name, value);
          resolve();
        }
      });
    } catch (error) {
      console.warn("IndexedDB init failed, using localStorage:", error);
      localStorageFallback.setItem(name, value);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    // Do nothing on server
    if (typeof window === "undefined") return;

    if (!isIndexedDBAvailable()) {
      localStorageFallback.removeItem(name);
      return;
    }

    try {
      const db = await initDB();
      return new Promise((resolve) => {
        try {
          const transaction = db.transaction(STORE_NAME, "readwrite");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.delete(name);
          request.onerror = () => {
            console.warn("IndexedDB removeItem failed, using localStorage");
            localStorageFallback.removeItem(name);
            resolve();
          };
          request.onsuccess = () => resolve();
        } catch (error) {
          console.warn(
            "IndexedDB transaction failed, using localStorage:",
            error,
          );
          localStorageFallback.removeItem(name);
          resolve();
        }
      });
    } catch (error) {
      console.warn("IndexedDB init failed, using localStorage:", error);
      localStorageFallback.removeItem(name);
    }
  },
};
