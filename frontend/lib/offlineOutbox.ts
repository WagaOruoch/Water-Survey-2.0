import { submitSurveyResponse } from "@/lib/api";
import { FormValues } from "@/types/survey";

const DB_NAME = "water-survey-offline";
const DB_VERSION = 1;
const STORE_NAME = "survey-outbox";

export interface OutboxItem {
  id: string;
  payload: FormValues;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }

  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: unknown }).response;
    return !response;
  }

  return true;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);

        operation(store)
          .then((result) => {
            tx.oncomplete = () => {
              db.close();
              resolve(result);
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error ?? new Error("IndexedDB transaction failed"));
            };
          })
          .catch((err) => {
            db.close();
            reject(err);
          });
      })
  );
}

export function createClientSubmissionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function enqueueSubmission(payload: FormValues, id: string): Promise<void> {
  if (!isBrowser() || !window.indexedDB) return;

  const item: OutboxItem = {
    id,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  await withStore("readwrite", async (store) => {
    store.put(item);
    return undefined;
  });
}

export async function getOutboxItems(): Promise<OutboxItem[]> {
  if (!isBrowser() || !window.indexedDB) return [];

  return withStore("readonly", async (store) => {
    return new Promise<OutboxItem[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const values = (request.result as OutboxItem[]) ?? [];
        values.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        resolve(values);
      };
      request.onerror = () => reject(request.error ?? new Error("Failed to read outbox"));
    });
  });
}

async function removeOutboxItem(id: string): Promise<void> {
  if (!isBrowser() || !window.indexedDB) return;

  await withStore("readwrite", async (store) => {
    store.delete(id);
    return undefined;
  });
}

async function updateOutboxItem(item: OutboxItem): Promise<void> {
  if (!isBrowser() || !window.indexedDB) return;

  await withStore("readwrite", async (store) => {
    store.put(item);
    return undefined;
  });
}

export async function getOutboxCount(): Promise<number> {
  const items = await getOutboxItems();
  return items.length;
}

export async function flushOutbox(): Promise<{ synced: number; failed: number; remaining: number }> {
  if (!isBrowser() || !window.indexedDB) {
    return { synced: 0, failed: 0, remaining: 0 };
  }

  const items = await getOutboxItems();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await submitSurveyResponse(item.payload, { clientSubmissionId: item.id });
      await removeOutboxItem(item.id);
      synced += 1;
    } catch (error) {
      item.attempts += 1;
      item.lastError = String(error);
      await updateOutboxItem(item);

      if (isNetworkError(error)) {
        break;
      }

      failed += 1;
      await removeOutboxItem(item.id);
    }
  }

  const remaining = await getOutboxCount();
  return { synced, failed, remaining };
}
