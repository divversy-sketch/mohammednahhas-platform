const DB_NAME = 'nahhas-offline-db';
const DB_VERSION = 1;
const STORE = 'pending-actions';

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('type', 'type');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txRequest(mode, callback) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = callback(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  }));
}

export async function enqueueOfflineAction(type, payload, metadata = {}) {
  const item = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    payload,
    metadata,
    attempts: 0,
    createdAt: Date.now(),
  };
  await txRequest('readwrite', (store) => store.put(item));
  window.dispatchEvent(new CustomEvent('nahhas-offline-queue-change'));
  return item;
}

export async function listOfflineActions() {
  return txRequest('readonly', (store) => store.getAll());
}

export async function removeOfflineAction(id) {
  await txRequest('readwrite', (store) => store.delete(id));
  window.dispatchEvent(new CustomEvent('nahhas-offline-queue-change'));
}

export async function countOfflineActions() {
  return txRequest('readonly', (store) => store.count());
}

export async function flushOfflineActions(handlers = {}) {
  if (!navigator.onLine) return { synced: 0, failed: 0 };
  const actions = (await listOfflineActions()).sort((a, b) => a.createdAt - b.createdAt);
  let synced = 0;
  let failed = 0;

  for (const action of actions) {
    const handler = handlers[action.type];
    if (!handler) continue;
    try {
      await handler(action.payload, action.metadata);
      await removeOfflineAction(action.id);
      synced += 1;
    } catch (error) {
      failed += 1;
      await txRequest('readwrite', (store) => store.put({
        ...action,
        attempts: (action.attempts || 0) + 1,
        lastError: String(error?.message || error),
        lastAttemptAt: Date.now(),
      }));
    }
  }

  return { synced, failed };
}
