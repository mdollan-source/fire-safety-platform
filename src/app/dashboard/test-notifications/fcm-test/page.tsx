'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bell, Send, CheckCircle, XCircle } from 'lucide-react';

export default function FCMTestPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFCMSetup = async () => {
    setLoading(true);
    setResult(null);

    const testResults: any = {
      steps: [],
    };

    try {
      // Step 1: Check if user has FCM tokens
      testResults.steps.push({ step: 1, name: 'Checking FCM tokens in database', status: 'running' });
      setResult({ ...testResults });

      const { db } = await import('@/lib/firebase/config');
      const { collection, getDocs } = await import('firebase/firestore');

      const tokensSnapshot = await getDocs(collection(db, 'users', user!.uid, 'fcmTokens'));
      const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

      testResults.steps[0].status = 'success';
      testResults.steps[0].data = { count: tokens.length, tokens };
      setResult({ ...testResults });

      if (tokens.length === 0) {
        testResults.steps.push({
          step: 2,
          name: 'No FCM tokens found',
          status: 'error',
          error: 'You need to run the Setup Notifications wizard first',
        });
        setResult({ ...testResults });
        return;
      }

      // Step 2: Try to send a test FCM message
      testResults.steps.push({ step: 2, name: 'Sending test FCM message via API', status: 'running' });
      setResult({ ...testResults });

      const response = await fetch('/api/notifications/task-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: {
            userId: user!.uid,
            email: user!.email,
            name: user!.displayName || 'Test User',
          },
          taskId: 'fcm-test-' + Date.now(),
          taskTitle: 'FCM Test Notification',
          siteName: 'Test Site',
          dueDate: new Date().toLocaleDateString('en-GB'),
        }),
      });

      testResults.steps[1].status = response.ok ? 'success' : 'error';
      testResults.steps[1].data = {
        status: response.status,
        ok: response.ok,
      };

      if (!response.ok) {
        const errorData = await response.json();
        testResults.steps[1].error = JSON.stringify(errorData, null, 2);
      }

      setResult({ ...testResults });

      // Step 3: Check if foreground listener is working
      testResults.steps.push({ step: 3, name: 'Checking foreground message listener', status: 'info' });
      testResults.steps[2].data = {
        info: 'If you received a browser notification, the FCM is working! If not, check the browser console for FCM errors.',
      };
      setResult({ ...testResults });

    } catch (error: any) {
      console.error('FCM test error:', error);
      testResults.steps.push({
        step: testResults.steps.length + 1,
        name: 'Test failed',
        status: 'error',
        error: error.message,
      });
      setResult({ ...testResults });
    } finally {
      setLoading(false);
    }
  };

  const checkTokensServerSide = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/check-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.uid }),
      });

      const data = await response.json();

      if (data.success) {
        alert(
          `✅ Server-side token check (Admin SDK):\n\n` +
          `User ID: ${data.userId}\n` +
          `Token count: ${data.tokenCount}\n\n` +
          (data.tokenCount > 0
            ? `Tokens found! This means the Admin SDK CAN read tokens.\n\nTokens:\n${JSON.stringify(data.tokens, null, 2)}`
            : `No tokens found. You need to run the Manual Setup wizard.`)
        );
      } else {
        alert(`❌ Error checking tokens:\n\n${data.error}\n\nCode: ${data.code}`);
      }
    } catch (error: any) {
      console.error('Check tokens error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendDirectFCM = async () => {
    setLoading(true);
    try {
      // Get tokens
      const { db } = await import('@/lib/firebase/config');
      const { collection, getDocs } = await import('firebase/firestore');

      const tokensSnapshot = await getDocs(collection(db, 'users', user!.uid, 'fcmTokens'));
      const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

      if (tokens.length === 0) {
        alert('❌ No FCM tokens found. Run Setup Notifications first.');
        return;
      }

      alert('📤 Attempting to send direct FCM message to your token(s).\n\nToken count: ' + tokens.length + '\n\nCheck browser console for results.');

      // Try using foreground messaging directly
      const { onForegroundMessage } = await import('@/lib/notifications/fcm-client');

      // Set up listener
      const unsubscribe = onForegroundMessage((payload) => {
        console.log('Received foreground message!', payload);
        alert('✅ Received FCM message!\n\n' + JSON.stringify(payload, null, 2));
      });

      // Note: We can't send FCM messages from client-side directly
      // The API endpoint handles this server-side
      alert('⚠️ Note: FCM messages must be sent from the server.\n\nUse "Send Test Task" on the Test Notifications page to trigger a server-side FCM send.');

    } catch (error: any) {
      console.error('Direct FCM error:', error);
      alert('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const checkConsoleErrors = () => {
    alert(
      '🔍 Check Browser Console for Errors\n\n' +
      '1. Press F12 to open Developer Tools\n' +
      '2. Click the "Console" tab\n' +
      '3. Look for red errors related to:\n' +
      '   • FCM\n' +
      '   • Firebase\n' +
      '   • Service Worker\n' +
      '   • Messaging\n\n' +
      '4. Copy any errors you see and share them\n\n' +
      'Common issues:\n' +
      '• "Missing VAPID key"\n' +
      '• "Service worker not found"\n' +
      '• "Firebase not initialized"'
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">FCM Push Notification Test</h1>
        <p className="text-sm text-brand-600 mt-1">
          Debug why push notifications aren't appearing
        </p>
      </div>

      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <Card.Header>📋 What We Know So Far</Card.Header>
        <Card.Content>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Email notifications working ✅</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Test browser notification working ✅</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span>FCM push notifications not appearing ❌</span>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>Test FCM Configuration</Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <p className="text-sm text-brand-600">
              This will check if your FCM tokens are saved and try to send a test message.
            </p>
            <Button
              variant="primary"
              onClick={testFCMSetup}
              disabled={loading || !user}
            >
              <Send className="w-4 h-4 mr-2" />
              Run FCM Test
            </Button>
          </div>
        </Card.Content>
      </Card>

      {result && (
        <Card>
          <Card.Header>Test Results</Card.Header>
          <Card.Content>
            <div className="space-y-3">
              {result.steps.map((step: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-brand-50 rounded">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    {step.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                    {step.status === 'running' && (
                      <div className="w-5 h-5 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                    )}
                    {step.status === 'info' && <Bell className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-900">{step.name}</p>
                    {step.data && (
                      <pre className="text-xs mt-2 bg-white p-2 rounded border border-brand-200 overflow-x-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    )}
                    {step.error && (
                      <p className="text-xs text-red-600 mt-2 font-mono">{step.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Header>Troubleshooting Actions</Card.Header>
        <Card.Content>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-brand-900 mb-1">Check Tokens (Server-Side)</h4>
                <p className="text-xs text-brand-600 mb-2">
                  Use Admin SDK to check if FCM tokens exist in database (bypasses security rules)
                </p>
                <Button variant="primary" size="sm" onClick={checkTokensServerSide} disabled={loading}>
                  Check Tokens with Admin SDK
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-brand-900 mb-1">Check Browser Console</h4>
                <p className="text-xs text-brand-600 mb-2">
                  Look for FCM or Firebase errors in the browser console
                </p>
                <Button variant="secondary" size="sm" onClick={checkConsoleErrors}>
                  How to Check Console
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-brand-900 mb-1">Test Foreground Listener</h4>
                <p className="text-xs text-brand-600 mb-2">
                  Set up a listener for incoming FCM messages
                </p>
                <Button variant="secondary" size="sm" onClick={sendDirectFCM}>
                  Setup FCM Listener
                </Button>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
        <Card.Header>💡 Common Issues & Fixes</Card.Header>
        <Card.Content>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-yellow-900 mb-1">Issue 1: VAPID Key Mismatch</p>
              <p className="text-yellow-700">
                The VAPID key in .env.local must match the one in Firebase Console → Cloud Messaging → Web Push certificates
              </p>
            </div>

            <div>
              <p className="font-medium text-yellow-900 mb-1">Issue 2: Service Worker Scope</p>
              <p className="text-yellow-700">
                The service worker at /firebase-messaging-sw.js needs to be accessible
              </p>
            </div>

            <div>
              <p className="font-medium text-yellow-900 mb-1">Issue 3: Firebase Admin Not Sending</p>
              <p className="text-yellow-700">
                Server-side FCM sending might be failing. Check server logs (terminal running npm run dev)
              </p>
            </div>

            <div>
              <p className="font-medium text-yellow-900 mb-1">Issue 4: Token Invalid</p>
              <p className="text-yellow-700">
                FCM token might have expired. Try running Setup Notifications again to get a fresh token
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
