'use client';

import { useEffect, useState } from 'react';
import { Workbox } from 'workbox-window';

export function ServiceWorkerRegistration() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [wb, setWb] = useState<Workbox | null>(null);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const workbox = new Workbox('/sw.js');

      workbox.addEventListener('waiting', () => {
        setShowUpdatePrompt(true);
      });

      workbox.addEventListener('controlling', () => {
        window.location.reload();
      });

      workbox.register();
      setWb(workbox);
    }
  }, []);

  const handleUpdate = () => {
    if (wb) {
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });

      // Send message to skip waiting
      wb.messageSkipWaiting();
    }
  };

  if (!showUpdatePrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50">
      <div className="bg-white border border-neutral-200 rounded-lg shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-neutral-900">
              Update Available
            </h3>
            <p className="text-xs text-neutral-600 mt-1">
              A new version of Fire Safety Log is available. Update now to get the latest features and improvements.
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleUpdate}
            className="flex-1 bg-neutral-900 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Update Now
          </button>
          <button
            onClick={() => setShowUpdatePrompt(false)}
            className="px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
