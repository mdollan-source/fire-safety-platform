'use client';

import { useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { saveOfflineDefect } from '@/lib/offline/db';
import { syncService } from '@/lib/offline/sync';

export function useOfflineDefect() {
  const { isOnline } = useNetworkStatus();

  const saveDefect = useCallback(
    async (
      assetId: string,
      defectData: any,
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
        const offlineId = await saveOfflineDefect(
          assetId,
          defectData,
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
    saveDefect,
    triggerSync,
  };
}
