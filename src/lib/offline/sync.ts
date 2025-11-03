import {
  getSyncQueue,
  removeSyncQueueItem,
  updateSyncQueueRetry,
  getOfflineEntries,
  removeOfflineEntry,
  getOfflineDefects,
  removeOfflineDefect,
} from './db';
import { db, storage } from '@/lib/firebase/config';
import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const MAX_RETRIES = 3;

export class SyncService {
  private syncing = false;
  private syncListeners: ((status: 'syncing' | 'idle' | 'error') => void)[] = [];

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.sync());
      window.addEventListener('offline', () => this.onOffline());
    }
  }

  addSyncListener(listener: (status: 'syncing' | 'idle' | 'error') => void) {
    this.syncListeners.push(listener);
  }

  removeSyncListener(listener: (status: 'syncing' | 'idle' | 'error') => void) {
    this.syncListeners = this.syncListeners.filter((l) => l !== listener);
  }

  private notifyListeners(status: 'syncing' | 'idle' | 'error') {
    this.syncListeners.forEach((listener) => listener(status));
  }

  async sync() {
    if (this.syncing || !navigator.onLine) {
      return;
    }

    this.syncing = true;
    this.notifyListeners('syncing');

    try {
      // Sync queue items
      await this.syncQueue();

      // Sync offline entries
      await this.syncOfflineEntries();

      // Sync offline defects
      await this.syncOfflineDefects();

      this.notifyListeners('idle');
    } catch (error) {
      console.error('Sync error:', error);
      this.notifyListeners('error');
    } finally {
      this.syncing = false;
    }
  }

  private async syncQueue() {
    const queue = await getSyncQueue();

    for (const item of queue) {
      try {
        const collectionRef = collection(db, item.collection);

        switch (item.action) {
          case 'create':
            await setDoc(doc(collectionRef, item.data.id), item.data);
            break;
          case 'update':
            await updateDoc(doc(collectionRef, item.data.id), item.data);
            break;
          case 'delete':
            await deleteDoc(doc(collectionRef, item.data.id));
            break;
        }

        // Success - remove from queue
        await removeSyncQueueItem(item.id);
      } catch (error) {
        console.error(`Failed to sync queue item ${item.id}:`, error);

        // Increment retry count
        if (item.retryCount < MAX_RETRIES) {
          await updateSyncQueueRetry(item.id, item.retryCount + 1);
        } else {
          // Max retries reached - remove from queue (could log this)
          console.error(`Max retries reached for queue item ${item.id}, removing`);
          await removeSyncQueueItem(item.id);
        }
      }
    }
  }

  private async syncOfflineEntries() {
    const entries = await getOfflineEntries();

    for (const entry of entries) {
      try {
        // Upload photos (evidence) first if any
        const evidenceUrls: string[] = [];
        for (const [index, photoBlob] of entry.photos.entries()) {
          const photoRef = ref(
            storage,
            `evidence/${entry.data.orgId}/${entry.taskId}/offline_${index}_${Date.now()}.jpg`
          );
          await uploadBytes(photoRef, photoBlob);
          const photoURL = await getDownloadURL(photoRef);
          evidenceUrls.push(photoURL);
        }

        // Upload signature if present
        let signatureUrl = '';
        if (entry.data.signatureDataUrl) {
          // Convert data URL to Blob
          const response = await fetch(entry.data.signatureDataUrl);
          const blob = await response.blob();

          const signatureRef = ref(
            storage,
            `evidence/${entry.data.orgId}/${entry.taskId}/signature.png`
          );

          await uploadBytes(signatureRef, blob);
          signatureUrl = await getDownloadURL(signatureRef);
        }

        // Prepare final entry data
        const entryData = {
          ...entry.data,
          evidenceUrls,
          signatureUrl,
          id: entry.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Remove the signatureDataUrl as it's now uploaded
        delete entryData.signatureDataUrl;

        await setDoc(doc(db, 'entries', entry.id), entryData);

        // Update task as completed if taskId exists
        if (entry.taskId) {
          await updateDoc(doc(db, 'tasks', entry.taskId), {
            status: 'completed',
            completedAt: new Date(),
            completedBy: entry.data.completedBy,
            entryId: entry.id,
            updatedAt: new Date(),
          });
        }

        // Success - remove from offline storage
        await removeOfflineEntry(entry.id);
      } catch (error) {
        console.error(`Failed to sync offline entry ${entry.id}:`, error);
        // Entry remains in offline storage for next sync attempt
      }
    }
  }

  private async syncOfflineDefects() {
    const defects = await getOfflineDefects();

    for (const defect of defects) {
      try {
        // Upload photos (evidence) first if any
        const evidenceUrls: string[] = [];
        for (const [index, photoBlob] of defect.photos.entries()) {
          const photoRef = ref(
            storage,
            `defects/${defect.assetId}/offline_${index}_${Date.now()}.jpg`
          );
          await uploadBytes(photoRef, photoBlob);
          const photoURL = await getDownloadURL(photoRef);
          evidenceUrls.push(photoURL);
        }

        // Create defect document with evidence URLs
        const defectData = {
          ...defect.data,
          evidenceUrls,
          id: defect.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(doc(db, 'defects', defect.id), defectData);

        // Success - remove from offline storage
        await removeOfflineDefect(defect.id);
      } catch (error) {
        console.error(`Failed to sync offline defect ${defect.id}:`, error);
        // Defect remains in offline storage for next sync attempt
      }
    }
  }

  private onOffline() {
    this.notifyListeners('idle');
  }

  isSyncing() {
    return this.syncing;
  }

  isOnline() {
    return navigator.onLine;
  }
}

// Singleton instance
export const syncService = new SyncService();
