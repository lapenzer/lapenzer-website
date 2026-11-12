import { Event } from "../engine/types";
const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("aisnl-research-v1", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore("runs", { keyPath: "id" });
      const events = db.createObjectStore("events", { keyPath: ["run", "id"] });
      events.createIndex("run", "run");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
async function request<T>(
  store: string,
  mode: IDBTransactionMode,
  action: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = action(tx.objectStore(store));
    let result: T;
    req.onsuccess = () => {
      result = req.result;
    };
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export interface SavedRun {
  id: string;
  name: string;
  savedAt: string;
  tick: number;
  n: number;
  seed: string;
  data: any;
}
export const saveRun = (run: SavedRun) =>
  request("runs", "readwrite", (s) => s.put(run));
export const listRuns = () =>
  request<SavedRun[]>("runs", "readonly", (s) => s.getAll());
export const deleteRun = (id: string) =>
  request("runs", "readwrite", (s) => s.delete(id));
export async function journal(run: string, events: Event[]) {
  if (!events.length) return;
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("events", "readwrite");
    for (const e of events) tx.objectStore("events").put({ ...e, run });
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export const readJournal = (run: string) =>
  request<(Event & { run: string })[]>("events", "readonly", (s) =>
    s.index("run").getAll(IDBKeyRange.only(run)),
  );
