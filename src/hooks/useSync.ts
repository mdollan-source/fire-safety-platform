'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncService } from '@/lib/offline/sync';
import { getSyncQueue, getOfflineEntries, getOfflineDefects } from '@/lib/offline/db';

export type SyncStatus = 'syncing' | 'idle' | 'error';

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  const updatePendingCount = useCallback(async () => {
    try {
      const [queue, entries, defects] = await Promise.all([
        getSyncQueue(),
        getOfflineEntries(),
        getOfflineDefects(),
      ]);
      setPendingCount(queue.length + entries.length + defects.length);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  useEffect(() => {
    // Initial count
    updatePendingCount();

    // Listen to sync status changes
    const handleStatusChange = (newStatus: SyncStatus) => {
      setStatus(newStatus);
      if (newStatus === 'idle') {
        updatePendingCount();
      }
    };

    syncService.addSyncListener(handleStatusChange);

    // Update count periodically
    const interval = setInterval(updatePendingCount, 10000);

    return () => {
      syncService.removeSyncListener(handleStatusChange);
      clearInterval(interval);
    };
  }, [updatePendingCount]);

  const triggerSync = useCallback(() => {
    syncService.sync();
  }, []);

  return {
    status,
    pendingCount,
    isSyncing: status === 'syncing',
    isError: status === 'error',
    triggerSync,
  };
}
