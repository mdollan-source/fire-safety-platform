'use client';

import { useSync } from '@/hooks/useSync';
import { RefreshCw, CloudOff, CheckCircle } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function SyncStatus() {
  const { status, pendingCount, triggerSync } = useSync();
  const { isOnline } = useNetworkStatus();

  if (!isOnline || pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={triggerSync}
        disabled={status === 'syncing'}
        className="bg-white border border-neutral-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors disabled:opacity-50"
      >
        {status === 'syncing' ? (
          <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
        ) : status === 'error' ? (
          <CloudOff className="h-5 w-5 text-red-600" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}

        <div className="text-left">
          <div className="text-sm font-medium text-neutral-900">
            {status === 'syncing' ? 'Syncing...' :
             status === 'error' ? 'Sync failed' :
             'Pending changes'}
          </div>
          <div className="text-xs text-neutral-500">
            {pendingCount} item{pendingCount !== 1 ? 's' : ''} to sync
          </div>
        </div>
      </button>
    </div>
  );
}
