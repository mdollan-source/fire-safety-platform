'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { onForegroundMessage } from '@/lib/notifications/fcm-client';

/**
 * Component that listens for FCM foreground messages (when browser tab is open)
 * and displays them using the browser's Notification API
 */
export default function ForegroundMessageListener() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('🔔 Setting up foreground FCM listener...');

    // Subscribe to foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('🔔 Foreground FCM message received:', payload);

      const title = payload.notification?.title || 'Fire Safety';
      const body = payload.notification?.body || '';
      const icon = payload.notification?.icon || '/icons/icon-192x192.png';
      const image = payload.notification?.image;

      // Show browser notification (even though tab is open)
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon,
          image,
          badge: '/icons/badge-72x72.png',
          requireInteraction: true,
          data: payload.data,
          tag: payload.data?.type || 'notification',
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          const url = payload.data?.url;
          if (url) {
            window.location.href = url;
          }
          notification.close();
        };

        console.log('✅ Foreground notification shown:', title);
      } else {
        console.log('⚠️ Cannot show notification - permission not granted');
      }
    });

    console.log('✅ Foreground FCM listener active');

    return () => {
      console.log('🔕 Unsubscribing from foreground FCM listener');
      unsubscribe();
    };
  }, [user]);

  // This component doesn't render anything - it just listens for messages
  return null;
}
