'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bell, CheckCircle, XCircle } from 'lucide-react';

export default function ManualSetupPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runFullSetup = async () => {
    setError('');
    setStatus('Starting setup...');
    setStep(1);

    try {
      // Step 1: Request permission
      setStatus('Step 1/3: Requesting notification permission...');
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        throw new Error('Permission denied. Please allow notifications in your browser.');
      }

      setStatus('✅ Permission granted!');
      setStep(2);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Register service worker
      setStatus('Step 2/3: Registering service worker...');
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      setStatus('✅ Service worker registered!');
      setStep(3);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Get FCM token
      setStatus('Step 3/3: Getting FCM token from Firebase...');

      const { getFCMToken } = await import('@/lib/notifications/fcm-client');
      const token = await getFCMToken(user!.uid);

      if (token) {
        setStatus('✅ All done! FCM token obtained and saved to database.');
        setStep(4);

        // Show success message
        setTimeout(() => {
          alert(
            '🎉 Success! Push notifications are now enabled.\n\n' +
            'You can now:\n' +
            '• Go to Test Notifications page\n' +
            '• Click "Send Test Task"\n' +
            '• Receive browser notifications!\n\n' +
            'Token preview: ' + token.substring(0, 50) + '...'
          );
        }, 500);
      } else {
        throw new Error('Failed to get FCM token');
      }

    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Setup failed');
      setStatus('❌ Setup failed. See error below.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Manual Notification Setup</h1>
        <p className="text-sm text-brand-600 mt-1">
          Run the complete setup process to enable push notifications
        </p>
      </div>

      <Card>
        <Card.Header>Automatic Setup Wizard</Card.Header>
        <Card.Content>
          <div className="space-y-6">
            <p className="text-sm text-brand-600">
              This will automatically:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-brand-700">
              <li>Request notification permission from your browser</li>
              <li>Register the Firebase messaging service worker</li>
              <li>Obtain your FCM token from Firebase</li>
              <li>Save your token to the database</li>
            </ol>

            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={runFullSetup}
                disabled={!user || step === 4}
                className="w-full"
              >
                <Bell className="w-5 h-5 mr-2" />
                {step === 4 ? 'Setup Complete!' : 'Run Setup Now'}
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Progress */}
      {status && (
        <Card className={error ? 'border-l-4 border-l-red-500 bg-red-50' : 'border-l-4 border-l-green-500 bg-green-50'}>
          <Card.Content>
            <div className="space-y-4">
              {/* Steps */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {step >= 2 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : step === 1 ? (
                    <div className="w-5 h-5 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  )}
                  <span className={`text-sm ${step >= 2 ? 'text-green-900 font-medium' : 'text-gray-600'}`}>
                    Step 1: Request Permission
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {step >= 3 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : step === 2 ? (
                    <div className="w-5 h-5 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  )}
                  <span className={`text-sm ${step >= 3 ? 'text-green-900 font-medium' : 'text-gray-600'}`}>
                    Step 2: Register Service Worker
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {step >= 4 ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : step === 3 ? (
                    <div className="w-5 h-5 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                  )}
                  <span className={`text-sm ${step >= 4 ? 'text-green-900 font-medium' : 'text-gray-600'}`}>
                    Step 3: Get FCM Token
                  </span>
                </div>
              </div>

              {/* Status message */}
              <div className={`p-3 rounded border ${error ? 'bg-white border-red-200' : 'bg-white border-green-200'}`}>
                <p className="text-sm font-mono">{status}</p>
              </div>

              {/* Error details */}
              {error && (
                <div className="p-3 bg-white rounded border border-red-200">
                  <p className="text-sm font-semibold text-red-900 mb-1">Error Details:</p>
                  <p className="text-sm text-red-700 font-mono">{error}</p>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Next Steps */}
      {step === 4 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <Card.Header>🎉 What's Next?</Card.Header>
          <Card.Content>
            <div className="space-y-3 text-sm">
              <p className="font-medium text-blue-900">
                Push notifications are now enabled! Here's what you can do:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Go to <strong>Test Notifications</strong> page</li>
                <li>Click <strong>"Send Test Task"</strong></li>
                <li>You should receive both:
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Email notification</li>
                    <li>Browser push notification with your fire icon 🔥</li>
                  </ul>
                </li>
              </ol>
              <p className="text-blue-700 mt-3">
                💡 <strong>Note:</strong> This process happens automatically for normal users when they click "Enable" on the notification prompt. You only needed to do this manually because you're testing.
              </p>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Info */}
      <Card>
        <Card.Header>ℹ️ For Normal Users</Card.Header>
        <Card.Content>
          <div className="text-sm text-brand-600 space-y-2">
            <p>
              Normal users won't need to visit this page. When they log in, they'll see a friendly prompt that says:
            </p>
            <div className="bg-brand-50 p-4 rounded-lg border border-brand-200 my-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-brand-900 mb-1">Enable Notifications</h4>
                  <p className="text-xs text-brand-600 mb-3">
                    Get instant alerts for task assignments, reminders, and critical defects on all your devices.
                  </p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-brand-900 text-white text-xs rounded">
                      Enable
                    </button>
                    <button className="px-3 py-1.5 text-brand-600 text-xs">
                      Not Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <p>
              When they click <strong>"Enable"</strong>, all the steps above happen automatically in the background. Easy! 👍
            </p>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
