'use client';

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

let messaging: Messaging | null = null;

/**
 * Initialize Firebase Cloud Messaging
 */
export function initializeMessaging() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const { app } = require('@/lib/firebase/config');
      messaging = getMessaging(app);
      return messaging;
    } catch (error) {
      console.error('Error initializing messaging:', error);
      return null;
    }
  }
  return null;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Get FCM token for the current device
 */
export async function getFCMToken(userId: string): Promise<string | null> {
  try {
    if (!messaging) {
      messaging = initializeMessaging();
    }

    if (!messaging) {
      console.log('Messaging not initialized');
      return null;
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('FCM Token obtained:', token);

      // Save token to Firestore
      await saveFCMToken(userId, token);

      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Save FCM token to Firestore
 */
async function saveFCMToken(userId: string, token: string) {
  try {
    await setDoc(
      doc(db, 'users', userId, 'fcmTokens', token),
      {
        token,
        deviceType: getDeviceType(),
        browser: getBrowserInfo(),
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('FCM token saved to Firestore');
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    messaging = initializeMessaging();
  }

  if (!messaging) {
    console.log('Messaging not initialized');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);

    // Show browser notification
    if (payload.notification) {
      showNotification(
        payload.notification.title || 'Fire Safety',
        payload.notification.body || '',
        payload.notification.image,
        payload.data
      );
    }
  });
}

/**
 * Show a browser notification
 */
function showNotification(
  title: string,
  body: string,
  image?: string,
  data?: any
) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data,
    requireInteraction: true,
  };

  new Notification(title, options);
}

/**
 * Get device type
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Get browser info
 */
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';

  if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
  } else if (ua.indexOf('SamsungBrowser') > -1) {
    browserName = 'Samsung Browser';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browserName = 'Opera';
  } else if (ua.indexOf('Trident') > -1) {
    browserName = 'Internet Explorer';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
  } else if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
  }

  return browserName;
}

/**
 * Check if notifications are supported
 */
export function areNotificationsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }
  return Notification.permission;
}
