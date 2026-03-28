import type { ResumeProfile } from "./types.js";

const DB_NAME = "alignlocal_v1";
const DB_VERSION = 1;
const STORE = "resumes";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

function uid(): string {
  return crypto.randomUUID();
}

export async function listResumes(): Promise<ResumeProfile[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const q = tx.objectStore(STORE).getAll();
    q.onerror = () => reject(q.error ?? new Error("getAll failed"));
    q.onsuccess = () => {
      const rows = (q.result as ResumeProfile[]) ?? [];
      resolve(rows.sort((a, b) => b.updatedAt - a.updatedAt));
    };
  });
}

export async function saveResume(name: string, text: string, id?: string): Promise<ResumeProfile> {
  const db = await openDb();
  const now = Date.now();
  const profile: ResumeProfile = {
    id: id ?? uid(),
    name: name.trim() || "Untitled resume",
    text,
    updatedAt: now,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const q = tx.objectStore(STORE).put(profile);
    q.onerror = () => reject(q.error ?? new Error("put failed"));
    q.onsuccess = () => resolve(profile);
  });
}

export async function deleteResume(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const q = tx.objectStore(STORE).delete(id);
    q.onerror = () => reject(q.error ?? new Error("delete failed"));
    q.onsuccess = () => resolve();
  });
}
