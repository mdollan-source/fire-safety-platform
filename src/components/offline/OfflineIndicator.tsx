'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Show offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
        <WifiOff className="h-4 w-4" />
        <span>You're offline - Changes will be saved locally and synced when back online</span>
      </div>
    );
  }

  // Show "back online" banner briefly
  if (wasOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
        <Wifi className="h-4 w-4" />
        <span>Back online - Syncing changes...</span>
      </div>
    );
  }

  return null;
}
