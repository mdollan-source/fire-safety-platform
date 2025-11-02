'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  requestNotificationPermission,
  getFCMToken,
  areNotificationsSupported,
  getNotificationPermission,
} from '@/lib/notifications/fcm-client';
import { useAuth } from '@/lib/auth/AuthContext';

export default function NotificationPermissionPrompt() {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we should show the prompt
    const checkNotificationStatus = () => {
      if (!user || !areNotificationsSupported()) {
        return;
      }

      const permission = getNotificationPermission();

      // Show prompt if permission is default (not granted or denied)
      // and user hasn't dismissed it in this session
      if (permission === 'default' && !sessionStorage.getItem('notification-prompt-dismissed')) {
        // Wait a bit before showing the prompt (better UX)
        setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
      }
    };

    checkNotificationStatus();
  }, [user]);

  const handleEnableNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Request permission
      const granted = await requestNotificationPermission();

      if (granted) {
        // Get FCM token
        await getFCMToken(user.uid);
        setShowPrompt(false);
      } else {
        // User denied permission
        alert('Notifications were blocked. You can enable them in your browser settings.');
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      alert('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-2xl border border-brand-200 p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-brand-900 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-brand-900 mb-1">
              Enable Notifications
            </h3>
            <p className="text-xs text-brand-600 mb-4">
              Get instant alerts for task assignments, reminders, and critical defects on all your devices.
            </p>

            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnableNotifications}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Enabling...' : 'Enable'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                disabled={isLoading}
              >
                Not Now
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            disabled={isLoading}
            className="flex-shrink-0 p-1 text-brand-400 hover:text-brand-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
