import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  // Offline queue for actions that need to be synced
  syncQueue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      collection: string;
      data: any;
      timestamp: number;
      retryCount: number;
    };
    indexes: { 'by-timestamp': number };
  };

  // Cached data from Firestore
  cachedData: {
    key: string;
    value: {
      id: string;
      collection: string;
      data: any;
      cachedAt: number;
    };
    indexes: { 'by-collection': string };
  };

  // Check entries saved offline
  offlineEntries: {
    key: string;
    value: {
      id: string;
      taskId: string;
      assetId?: string;
      data: any;
      photos: Blob[];
      createdAt: number;
    };
  };

  // Defects created offline
  offlineDefects: {
    key: string;
    value: {
      id: string;
      assetId?: string;
      data: any;
      photos: Blob[];
      createdAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<OfflineDB>('fire-safety-offline-db', 1, {
    upgrade(db) {
      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-timestamp', 'timestamp');
      }

      // Cached data store
      if (!db.objectStoreNames.contains('cachedData')) {
        const cacheStore = db.createObjectStore('cachedData', { keyPath: 'id' });
        cacheStore.createIndex('by-collection', 'collection');
      }

      // Offline entries store
      if (!db.objectStoreNames.contains('offlineEntries')) {
        db.createObjectStore('offlineEntries', { keyPath: 'id' });
      }

      // Offline defects store
      if (!db.objectStoreNames.contains('offlineDefects')) {
        db.createObjectStore('offlineDefects', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// Sync Queue Operations
export async function addToSyncQueue(
  action: 'create' | 'update' | 'delete',
  collection: string,
  data: any
) {
  const db = await getDB();
  const id = `${collection}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.add('syncQueue', {
    id,
    action,
    collection,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  });

  return id;
}

export async function getSyncQueue() {
  const db = await getDB();
  return db.getAll('syncQueue');
}

export async function removeSyncQueueItem(id: string) {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

export async function updateSyncQueueRetry(id: string, retryCount: number) {
  const db = await getDB();
  const item = await db.get('syncQueue', id);
  if (item) {
    item.retryCount = retryCount;
    await db.put('syncQueue', item);
  }
}

export async function clearSyncQueue() {
  const db = await getDB();
  await db.clear('syncQueue');
}

// Cached Data Operations
export async function cacheData(collection: string, id: string, data: any) {
  const db = await getDB();
  await db.put('cachedData', {
    id: `${collection}_${id}`,
    collection,
    data,
    cachedAt: Date.now(),
  });
}

export async function getCachedData(collection: string, id: string) {
  const db = await getDB();
  const cached = await db.get('cachedData', `${collection}_${id}`);
  return cached?.data;
}

export async function getCachedCollection(collection: string) {
  const db = await getDB();
  const index = db.transaction('cachedData').store.index('by-collection');
  const items = await index.getAll(collection);
  return items.map((item) => item.data);
}

export async function clearCachedData() {
  const db = await getDB();
  await db.clear('cachedData');
}

// Offline Entries Operations
export async function saveOfflineEntry(
  taskId: string,
  assetId: string | undefined,
  data: any,
  photos: Blob[] = []
) {
  const db = await getDB();
  const id = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.add('offlineEntries', {
    id,
    taskId,
    ...(assetId && { assetId }),
    data,
    photos,
    createdAt: Date.now(),
  });

  return id;
}

export async function getOfflineEntries() {
  const db = await getDB();
  return db.getAll('offlineEntries');
}

export async function removeOfflineEntry(id: string) {
  const db = await getDB();
  await db.delete('offlineEntries', id);
}

// Offline Defects Operations
export async function saveOfflineDefect(
  assetId: string | undefined,
  data: any,
  photos: Blob[] = []
) {
  const db = await getDB();
  const id = `defect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await db.add('offlineDefects', {
    id,
    ...(assetId && { assetId }),
    data,
    photos,
    createdAt: Date.now(),
  });

  return id;
}

export async function getOfflineDefects() {
  const db = await getDB();
  return db.getAll('offlineDefects');
}

export async function removeOfflineDefect(id: string) {
  const db = await getDB();
  await db.delete('offlineDefects', id);
}

// General utility
export async function clearAllOfflineData() {
  const db = await getDB();
  await db.clear('syncQueue');
  await db.clear('cachedData');
  await db.clear('offlineEntries');
  await db.clear('offlineDefects');
}
