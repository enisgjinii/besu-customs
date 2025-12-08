import { StateStorage } from "zustand/middleware";

const DB_NAME = "besu-customs-db";
const STORE_NAME = "key-val";

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            db.createObjectStore(STORE_NAME);
        };
    });
};

export const idbStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            const db = await initDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, "readonly");
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(name);
                request.onerror = () => resolve(null);
                request.onsuccess = () => resolve(request.result as string || null);
            });
        } catch {
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(value, name);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    },
    removeItem: async (name: string): Promise<void> => {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(name);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    },
};
