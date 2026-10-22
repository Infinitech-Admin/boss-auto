// Path: lib/draft-files.ts  (NEW)
//
// Keeps the photos/videos a guest picked inside the browser (IndexedDB) while
// they go log in, so they can be uploaded automatically when they come back.
// Nothing here talks to the server.

const DB_NAME = "sell-trade-draft";
const STORE = "files";
const TTL_MS = 6 * 60 * 60 * 1000; // same lifetime as the form draft (6 hours)

type StoredFile = {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  savedAt: number;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const req = indexedDB.open(DB_NAME, 1);

    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();

  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));

      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Returns false when the browser could not keep the file (e.g. storage full). */
export async function storeFile(id: string, file: File): Promise<boolean> {
  try {
    const record: StoredFile = {
      id,
      blob: file,
      name: file.name,
      type: file.type,
      savedAt: Date.now(),
    };
    await withStore("readwrite", (s) => s.put(record));
    return true;
  } catch {
    return false;
  }
}

export async function deleteStoredFile(id: string): Promise<void> {
  try {
    await withStore("readwrite", (s) => s.delete(id));
  } catch {
    /* ignore */
  }
}

export async function clearStoredFiles(): Promise<void> {
  try {
    await withStore("readwrite", (s) => s.clear());
  } catch {
    /* ignore */
  }
}

export async function loadStoredFiles(): Promise<{ id: string; file: File }[]> {
  try {
    const all = await withStore<StoredFile[]>("readonly", (s) => s.getAll());
    const now = Date.now();
    const fresh: { id: string; file: File }[] = [];

    for (const record of all) {
      const valid =
        record.blob instanceof Blob && now - record.savedAt <= TTL_MS;

      if (!valid) {
        void deleteStoredFile(record.id); // purge expired / broken records
        continue;
      }

      fresh.push({
        id: record.id,
        file: new File([record.blob], record.name, { type: record.type }),
      });
    }

    return fresh;
  } catch {
    return [];
  }
}
