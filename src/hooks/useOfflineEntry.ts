'use client';

import { useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { saveOfflineEntry } from '@/lib/offline/db';
import { addToSyncQueue } from '@/lib/offline/db';
import { syncService } from '@/lib/offline/sync';

export function useOfflineEntry() {
  const { isOnline } = useNetworkStatus();

  const saveEntry = useCallback(
    async (
      taskId: string,
      assetId: string,
      entryData: any,
      photos: File[]
    ) => {
      if (!isOnline) {
        // Convert Files to Blobs for offline storage
        const photoBlobs = await Promise.all(
          photos.map(async (file) => {
            return new Blob([await file.arrayBuffer()], { type: file.type });
          })
        );

        // Save to offline storage
        const offlineId = await saveOfflineEntry(
          taskId,
          assetId,
          entryData,
          photoBlobs
        );

        return { id: offlineId, offline: true };
      }

      // If online, return null - caller should handle normal flow
      return null;
    },
    [isOnline]
  );

  const triggerSync = useCallback(() => {
    if (isOnline) {
      syncService.sync();
    }
  }, [isOnline]);

  return {
    isOnline,
    saveEntry,
    triggerSync,
  };
}
