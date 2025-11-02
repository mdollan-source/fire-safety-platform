'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bell, Mail, Smartphone, CheckCircle2 } from 'lucide-react';
import {
  requestNotificationPermission,
  getFCMToken,
  areNotificationsSupported,
  getNotificationPermission,
} from '@/lib/notifications/fcm-client';

interface NotificationPrefs {
  email: {
    enabled: boolean;
    taskAssignment: boolean;
    taskReminder: boolean;
    taskOverdue: boolean;
    defectReported: boolean;
    weeklyDigest: boolean;
  };
  push: {
    enabled: boolean;
    taskAssignment: boolean;
    taskReminder: boolean;
    taskOverdue: boolean;
    defectReported: boolean;
  };
}

const DEFAULT_PREFS: NotificationPrefs = {
  email: {
    enabled: true,
    taskAssignment: true,
    taskReminder: true,
    taskOverdue: true,
    defectReported: true,
    weeklyDigest: true,
  },
  push: {
    enabled: false,
    taskAssignment: true,
    taskReminder: true,
    taskOverdue: true,
    defectReported: true,
  },
};

export default function NotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [enablePushLoading, setEnablePushLoading] = useState(false);

  const pushSupported = areNotificationsSupported();
  const pushPermission = getNotificationPermission();

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid, 'settings', 'notifications');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPrefs({ ...DEFAULT_PREFS, ...docSnap.data() as NotificationPrefs });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPrefs: NotificationPrefs) => {
    if (!user) return;

    try {
      setSaving(true);
      const docRef = doc(db, 'users', user.uid, 'settings', 'notifications');
      await setDoc(docRef, newPrefs, { merge: true });

      setPrefs(newPrefs);
      setSuccessMessage('Preferences saved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEnablePush = async () => {
    if (!user) return;

    try {
      setEnablePushLoading(true);

      // Request permission
      const granted = await requestNotificationPermission();

      if (granted) {
        // Get FCM token
        await getFCMToken(user.uid);

        // Update preferences
        const newPrefs = {
          ...prefs,
          push: { ...prefs.push, enabled: true },
        };
        await savePreferences(newPrefs);
      } else {
        alert('Notifications were blocked. Please enable them in your browser settings.');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      alert('Failed to enable push notifications. Please try again.');
    } finally {
      setEnablePushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    const newPrefs = {
      ...prefs,
      push: { ...prefs.push, enabled: false },
    };
    await savePreferences(newPrefs);
  };

  const toggleEmailPref = async (key: keyof NotificationPrefs['email']) => {
    if (key === 'enabled') {
      const newPrefs = {
        ...prefs,
        email: { ...prefs.email, enabled: !prefs.email.enabled },
      };
      await savePreferences(newPrefs);
    } else {
      const newPrefs = {
        ...prefs,
        email: { ...prefs.email, [key]: !prefs.email[key] },
      };
      await savePreferences(newPrefs);
    }
  };

  const togglePushPref = async (key: keyof NotificationPrefs['push']) => {
    if (key === 'enabled') return; // Use enable/disable buttons instead

    const newPrefs = {
      ...prefs,
      push: { ...prefs.push, [key]: !prefs.push[key] },
    };
    await savePreferences(newPrefs);
  };

  if (loading) {
    return (
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </div>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-brand-600">Loading preferences...</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </div>
      </Card.Header>
      <Card.Content>
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Email Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="font-medium text-brand-900">Email Notifications</div>
                  <div className="text-xs text-brand-600">Receive notifications via email</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={prefs.email.enabled}
                  onChange={() => toggleEmailPref('enabled')}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-brand-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-900"></div>
              </label>
            </div>

            {prefs.email.enabled && (
              <div className="ml-7 space-y-3 border-l-2 border-brand-200 pl-4">
                <ToggleOption
                  label="Task Assignments"
                  description="When you're assigned a new task"
                  checked={prefs.email.taskAssignment}
                  onChange={() => toggleEmailPref('taskAssignment')}
                  disabled={saving}
                />
                <ToggleOption
                  label="Task Reminders"
                  description="24h and 1h before task is due"
                  checked={prefs.email.taskReminder}
                  onChange={() => toggleEmailPref('taskReminder')}
                  disabled={saving}
                />
                <ToggleOption
                  label="Overdue Tasks"
                  description="When a task becomes overdue"
                  checked={prefs.email.taskOverdue}
                  onChange={() => toggleEmailPref('taskOverdue')}
                  disabled={saving}
                />
                <ToggleOption
                  label="Defect Reports"
                  description="When a new defect is reported"
                  checked={prefs.email.defectReported}
                  onChange={() => toggleEmailPref('defectReported')}
                  disabled={saving}
                />
                <ToggleOption
                  label="Weekly Digest"
                  description="Summary of tasks and defects each week"
                  checked={prefs.email.weeklyDigest}
                  onChange={() => toggleEmailPref('weeklyDigest')}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {/* Push Notifications */}
          <div className="pt-6 border-t border-brand-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-brand-600" />
                <div>
                  <div className="font-medium text-brand-900">Push Notifications</div>
                  <div className="text-xs text-brand-600">
                    {pushSupported
                      ? 'Receive instant alerts on your device'
                      : 'Not supported in this browser'}
                  </div>
                </div>
              </div>
              {pushSupported && (
                <>
                  {!prefs.push.enabled || pushPermission !== 'granted' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleEnablePush}
                      disabled={enablePushLoading || saving}
                    >
                      {enablePushLoading ? 'Enabling...' : 'Enable'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDisablePush}
                      disabled={saving}
                    >
                      Disable
                    </Button>
                  )}
                </>
              )}
            </div>

            {pushSupported && prefs.push.enabled && pushPermission === 'granted' && (
              <div className="ml-7 space-y-3 border-l-2 border-brand-200 pl-4">
                <ToggleOption
                  label="Task Assignments"
                  description="When you're assigned a new task"
                  checked={prefs.push.taskAssignment}
                  onChange={() => togglePushPref('taskAssignment')}
                  disabled={saving}
                />
                <ToggleOption
                  label="Task Reminders"
                  description="24h and 1h before task is due"
                  checked={prefs.push.taskReminder}
                  onChange={() => togglePushPref('taskReminder')}
                  disabled={saving}
                />
                <ToggleOption
                  label="Overdue Tasks"
                  description="When a task becomes overdue"
                  checked={prefs.push.taskOverdue}
                  onChange={() => togglePushPref('taskOverdue')}
                  disabled={saving}
                />
                <ToggleOption
                  label="Defect Reports"
                  description="When a new defect is reported"
                  checked={prefs.push.defectReported}
                  onChange={() => togglePushPref('defectReported')}
                  disabled={saving}
                />
              </div>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

function ToggleOption({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-brand-900">{label}</div>
        <div className="text-xs text-brand-600">{description}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-900"></div>
      </label>
    </div>
  );
}
