// IndexedDB storage for custom 3D GLB models
// Enables immediate reactive preview and offline persistence for user-uploaded models

const DB_NAME = 'vsb_model_db';
const DB_VERSION = 1;
const STORE_NAME = 'models';
const MODEL_KEY = 'custom_glb';

let activeObjectUrl: string | null = null;
let cachedBlob: Blob | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCustomModel(file: File | Blob): Promise<string> {
  // Validate minimum size for a valid GLB binary header
  if (!file || file.size < 512) {
    throw new Error('Invalid or corrupted 3D model file (file is too small)');
  }

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file, MODEL_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Revoke previous object URL safely only when replacing with a new file
    if (activeObjectUrl) {
      try {
        URL.revokeObjectURL(activeObjectUrl);
      } catch {
        // ignore
      }
    }

    cachedBlob = file;
    activeObjectUrl = URL.createObjectURL(file);
    return activeObjectUrl;
  } catch (err) {
    console.warn('Could not store in IndexedDB, using memory object URL:', err);
    if (activeObjectUrl) {
      try {
        URL.revokeObjectURL(activeObjectUrl);
      } catch {
        // ignore
      }
    }
    cachedBlob = file;
    activeObjectUrl = URL.createObjectURL(file);
    return activeObjectUrl;
  }
}

export async function getCustomModelUrl(): Promise<string | null> {
  // If we already created an active object URL for this session, reuse it!
  // Do NOT revoke and re-create on every render/component call!
  if (activeObjectUrl) {
    return activeObjectUrl;
  }

  try {
    const db = await openDB();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(MODEL_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (blob && blob.size >= 512) {
      cachedBlob = blob;
      activeObjectUrl = URL.createObjectURL(blob);
      return activeObjectUrl;
    }

    // Corrupted or empty blob found in store -> clean it up
    if (blob) {
      await removeCustomModel();
    }
    return null;
  } catch (err) {
    console.debug('No custom model stored in IndexedDB:', err);
    return null;
  }
}

export async function removeCustomModel(): Promise<void> {
  if (activeObjectUrl) {
    try {
      URL.revokeObjectURL(activeObjectUrl);
    } catch {
      // ignore
    }
    activeObjectUrl = null;
  }
  cachedBlob = null;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(MODEL_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error clearing model from IndexedDB:', err);
  }
}
