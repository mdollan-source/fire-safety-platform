'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function NotificationDiagnosticsPage() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const results: any = {};

    // Check if running in browser
    results.isBrowser = typeof window !== 'undefined';

    // Check if notifications are supported
    results.notificationsSupported = 'Notification' in window;

    // Check notification permission
    if ('Notification' in window) {
      results.notificationPermission = Notification.permission;
    }

    // Check service worker support
    results.serviceWorkerSupported = 'serviceWorker' in navigator;

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        results.serviceWorkerRegistered = registrations.length > 0;
        results.serviceWorkerCount = registrations.length;
        results.serviceWorkerDetails = registrations.map(reg => ({
          scope: reg.scope,
          active: !!reg.active,
          installing: !!reg.installing,
          waiting: !!reg.waiting,
        }));
      } catch (error) {
        results.serviceWorkerError = (error as Error).message;
      }
    }

    // Check for FCM token in Firestore
    if (user) {
      try {
        const { db } = await import('@/lib/firebase/config');
        const { collection, getDocs } = await import('firebase/firestore');

        const tokensSnapshot = await getDocs(collection(db, 'users', user.uid, 'fcmTokens'));
        results.fcmTokensStored = tokensSnapshot.size;
        results.fcmTokenDetails = tokensSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data(),
        }));
      } catch (error) {
        results.fcmTokenError = (error as Error).message;
      }
    }

    // Check environment variables
    results.vapidKeyPresent = !!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    results.firebaseConfigPresent = {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    setDiagnostics(results);
    setLoading(false);
  };

  const requestPermissionManually = async () => {
    try {
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);

      if (permission === 'granted') {
        alert('✅ Permission granted! Now try registering for notifications.');
      } else {
        alert('❌ Permission denied. Please enable notifications in your browser settings.');
      }

      runDiagnostics();
    } catch (error) {
      alert('Error requesting permission: ' + (error as Error).message);
    }
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
      alert('✅ Service Worker registered successfully!');
      runDiagnostics();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      alert('❌ Service Worker registration failed: ' + (error as Error).message);
    }
  };

  const getFCMToken = async () => {
    if (!user) {
      alert('You must be logged in');
      return;
    }

    try {
      const { getFCMToken } = await import('@/lib/notifications/fcm-client');
      const token = await getFCMToken(user.uid);

      if (token) {
        alert('✅ FCM Token obtained and saved!\n\nToken: ' + token.substring(0, 50) + '...');
      } else {
        alert('❌ Failed to get FCM token. Check console for errors.');
      }

      runDiagnostics();
    } catch (error) {
      console.error('Error getting FCM token:', error);
      alert('❌ Error: ' + (error as Error).message);
    }
  };

  const sendTestNotification = async () => {
    try {
      // Send a browser notification directly (not via FCM)
      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'This is a test notification from Fire Safety',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        });
        alert('✅ Test notification sent! Check your screen.');
      } else {
        alert('❌ Notification permission not granted');
      }
    } catch (error) {
      alert('❌ Error: ' + (error as Error).message);
    }
  };

  const StatusIcon = ({ status }: { status: boolean | undefined }) => {
    if (status === undefined) return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-brand-900">Running Diagnostics...</h1>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Notification Diagnostics</h1>
          <p className="text-sm text-brand-600 mt-1">
            Check what's working and what needs attention
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={runDiagnostics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Browser Support */}
      <Card>
        <Card.Header>Browser Support</Card.Header>
        <Card.Content>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Notifications API</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.notificationsSupported} />
                <span className="text-sm font-mono">
                  {diagnostics.notificationsSupported ? 'Supported' : 'Not Supported'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Service Worker API</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.serviceWorkerSupported} />
                <span className="text-sm font-mono">
                  {diagnostics.serviceWorkerSupported ? 'Supported' : 'Not Supported'}
                </span>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Permissions */}
      <Card>
        <Card.Header>Notification Permission</Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current Status</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.notificationPermission === 'granted'} />
                <span className="text-sm font-mono font-bold">
                  {diagnostics.notificationPermission || 'unknown'}
                </span>
              </div>
            </div>

            {diagnostics.notificationPermission !== 'granted' && (
              <div className="pt-3 border-t">
                <p className="text-sm text-brand-600 mb-3">
                  {diagnostics.notificationPermission === 'denied'
                    ? '⚠️ Notifications are blocked. You need to enable them in Chrome settings.'
                    : 'Click the button below to request notification permission.'}
                </p>
                <Button variant="primary" onClick={requestPermissionManually}>
                  Request Permission
                </Button>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Service Worker */}
      <Card>
        <Card.Header>Service Worker</Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Registered</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={diagnostics.serviceWorkerRegistered} />
                <span className="text-sm font-mono">
                  {diagnostics.serviceWorkerRegistered
                    ? `${diagnostics.serviceWorkerCount} registration(s)`
                    : 'Not Registered'}
                </span>
              </div>
            </div>

            {diagnostics.serviceWorkerDetails && diagnostics.serviceWorkerDetails.length > 0 && (
              <div className="text-xs bg-brand-50 p-3 rounded border border-brand-200">
                <pre className="overflow-x-auto">
                  {JSON.stringify(diagnostics.serviceWorkerDetails, null, 2)}
                </pre>
              </div>
            )}

            {!diagnostics.serviceWorkerRegistered && (
              <div className="pt-3 border-t">
                <p className="text-sm text-brand-600 mb-3">
                  Service Worker needs to be registered for push notifications.
                </p>
                <Button variant="primary" onClick={registerServiceWorker}>
                  Register Service Worker
                </Button>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* FCM Token */}
      <Card>
        <Card.Header>FCM Token</Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Tokens Stored</span>
              <div className="flex items-center gap-2">
                <StatusIcon status={(diagnostics.fcmTokensStored || 0) > 0} />
                <span className="text-sm font-mono">
                  {diagnostics.fcmTokensStored || 0} token(s)
                </span>
              </div>
            </div>

            {diagnostics.fcmTokenDetails && diagnostics.fcmTokenDetails.length > 0 && (
              <div className="text-xs bg-brand-50 p-3 rounded border border-brand-200">
                <pre className="overflow-x-auto">
                  {JSON.stringify(diagnostics.fcmTokenDetails, null, 2)}
                </pre>
              </div>
            )}

            {diagnostics.fcmTokensStored === 0 && (
              <div className="pt-3 border-t">
                <p className="text-sm text-brand-600 mb-3">
                  No FCM token found. You need to obtain a token to receive push notifications.
                </p>
                <Button
                  variant="primary"
                  onClick={getFCMToken}
                  disabled={diagnostics.notificationPermission !== 'granted'}
                >
                  Get FCM Token
                </Button>
                {diagnostics.notificationPermission !== 'granted' && (
                  <p className="text-xs text-brand-500 mt-2">
                    ⚠️ Grant notification permission first
                  </p>
                )}
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <Card.Header>Firebase Configuration</Card.Header>
        <Card.Content>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">VAPID Key</span>
              <StatusIcon status={diagnostics.vapidKeyPresent} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">API Key</span>
              <StatusIcon status={diagnostics.firebaseConfigPresent?.apiKey} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Project ID</span>
              <StatusIcon status={diagnostics.firebaseConfigPresent?.projectId} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Messaging Sender ID</span>
              <StatusIcon status={diagnostics.firebaseConfigPresent?.messagingSenderId} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">App ID</span>
              <StatusIcon status={diagnostics.firebaseConfigPresent?.appId} />
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Quick Test */}
      <Card>
        <Card.Header>Quick Test</Card.Header>
        <Card.Content>
          <p className="text-sm text-brand-600 mb-4">
            Send a test browser notification (bypasses FCM, tests browser directly)
          </p>
          <Button
            variant="secondary"
            onClick={sendTestNotification}
            disabled={diagnostics.notificationPermission !== 'granted'}
          >
            Send Test Browser Notification
          </Button>
        </Card.Content>
      </Card>

      {/* Step-by-Step Fix */}
      {diagnostics.notificationPermission !== 'granted' && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <Card.Header>⚠️ Action Required</Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <p className="text-sm font-semibold">Follow these steps to enable notifications:</p>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Click the "Request Permission" button above</li>
                <li>When Chrome asks, click "Allow"</li>
                <li>Click "Register Service Worker"</li>
                <li>Click "Get FCM Token"</li>
                <li>Go back to Test Notifications page and try sending</li>
              </ol>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  );
}
