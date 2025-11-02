'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Bell, Mail, Smartphone, Send, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function TestNotificationsPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const sendTestTaskAssignment = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/notifications/task-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: {
            userId: user?.uid || 'test',
            email: user?.email || 'test@example.com',
            name: userData?.name || user?.displayName || 'Test User',
          },
          taskId: 'test-' + Date.now(),
          taskTitle: 'Test Fire Extinguisher Check',
          siteName: 'Main Building',
          assetName: 'Fire Extinguisher FE-001',
          dueDate: new Date(Date.now() + 86400000).toLocaleDateString('en-GB'),
        }),
      });

      if (response.ok) {
        setResult('✅ Success! Check your email and browser for notifications.');
      } else {
        setResult('❌ Failed to send notification. Check console for errors.');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setResult('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendTestDefect = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/notifications/defect-reported', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: userData?.orgId || 'test-org',
          defectId: 'defect-' + Date.now(),
          defectTitle: 'Test Critical Defect - Fire Extinguisher Pressure Low',
          severity: 'critical',
          siteName: 'Main Building',
          assetName: 'Fire Extinguisher FE-001',
          reportedBy: userData?.name || user?.displayName || 'Test User',
        }),
      });

      if (response.ok) {
        setResult('✅ Success! Responsible persons notified via email and push.');
      } else {
        setResult('❌ Failed to send notification. Check console for errors.');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setResult('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const sendTestWeeklyDigest = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/notifications/weekly-digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: {
            userId: user?.uid || 'test',
            email: user?.email || 'test@example.com',
            name: userData?.name || user?.displayName || 'Test User',
          },
          weekStart: new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-GB'),
          weekEnd: new Date().toLocaleDateString('en-GB'),
          stats: {
            tasksCompleted: 12,
            tasksDue: 5,
            tasksOverdue: 2,
            newDefects: 3,
            openDefects: 7,
          },
        }),
      });

      if (response.ok) {
        setResult('✅ Success! Check your email for the weekly digest.');
      } else {
        setResult('❌ Failed to send notification. Check console for errors.');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setResult('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testScheduledProcessor = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/notifications/process-scheduled', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setResult(
          `✅ Scheduled processor ran successfully!\n\n` +
          `Tasks processed: ${data.processed}\n` +
          `24h reminders sent: ${data.results.reminders24h}\n` +
          `1h reminders sent: ${data.results.reminders1h}\n` +
          `Overdue alerts sent: ${data.results.overdue}\n` +
          `Errors: ${data.results.errors.length}`
        );
      } else {
        setResult('❌ Failed to run processor. Check console for errors.');
      }
    } catch (error) {
      console.error('Error running processor:', error);
      setResult('❌ Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Test Notifications</h1>
          <p className="text-sm text-brand-600 mt-1">
            Send test notifications to verify email and push are working
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/test-notifications/manual-setup">
            <Button variant="primary" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Setup
            </Button>
          </Link>
          <Link href="/dashboard/test-notifications/fcm-test">
            <Button variant="secondary" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              FCM Test
            </Button>
          </Link>
          <Link href="/dashboard/test-notifications/diagnostics">
            <Button variant="secondary" size="sm">
              <Wrench className="w-4 h-4 mr-2" />
              Diagnostics
            </Button>
          </Link>
        </div>
      </div>

      {/* User Info */}
      <Card>
        <Card.Header>Your Test Account</Card.Header>
        <Card.Content>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {userData?.name || user?.displayName || 'Not set'}</p>
            <p><strong>Email:</strong> {user?.email || 'Not set'}</p>
            <p><strong>User ID:</strong> {user?.uid || 'Not set'}</p>
            <p><strong>Org ID:</strong> {userData?.orgId || 'Not set'}</p>
          </div>
        </Card.Content>
      </Card>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Task Assignment */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Task Assignment
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-brand-600 mb-4">
              Sends both email and push notification for a new task assignment.
            </p>
            <Button
              variant="primary"
              onClick={sendTestTaskAssignment}
              disabled={loading}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Test Task
            </Button>
          </Card.Content>
        </Card>

        {/* Defect Report */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Defect Report (Critical)
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-brand-600 mb-4">
              Sends critical defect alert to all responsible persons in your org.
            </p>
            <Button
              variant="primary"
              onClick={sendTestDefect}
              disabled={loading}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Test Defect
            </Button>
          </Card.Content>
        </Card>

        {/* Weekly Digest */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Weekly Digest (Email Only)
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-brand-600 mb-4">
              Sends a weekly summary email with stats and activity.
            </p>
            <Button
              variant="secondary"
              onClick={sendTestWeeklyDigest}
              disabled={loading}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Test Digest
            </Button>
          </Card.Content>
        </Card>

        {/* Scheduled Processor */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Scheduled Processor
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-brand-600 mb-4">
              Runs the scheduled task processor (normally runs via cron job).
            </p>
            <Button
              variant="secondary"
              onClick={testScheduledProcessor}
              disabled={loading}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Run Processor
            </Button>
          </Card.Content>
        </Card>
      </div>

      {/* Result */}
      {result && (
        <Card className={result.startsWith('✅') ? 'border-l-4 border-l-green-500 bg-green-50' : 'border-l-4 border-l-red-500 bg-red-50'}>
          <Card.Content>
            <pre className="text-sm whitespace-pre-wrap font-mono">{result}</pre>
          </Card.Content>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <Card.Header>📋 Testing Checklist</Card.Header>
        <Card.Content>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-brand-900 mb-2">Before Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-brand-600">
                <li>Enable push notifications (prompt or Profile → Notification Preferences)</li>
                <li>Make sure notifications are allowed in your browser settings</li>
                <li>Have your email inbox open to check for emails</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-brand-900 mb-2">What to Expect:</h4>
              <ul className="list-disc list-inside space-y-1 text-brand-600">
                <li><strong>Task Assignment:</strong> Email + Browser notification with your fire icon 🔥</li>
                <li><strong>Defect Report:</strong> Email + Browser notification to all RPs</li>
                <li><strong>Weekly Digest:</strong> Email only (no push)</li>
                <li><strong>Scheduled Processor:</strong> JSON response with results</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-brand-900 mb-2">Troubleshooting:</h4>
              <ul className="list-disc list-inside space-y-1 text-brand-600">
                <li>No push? Check browser notification permissions</li>
                <li>No email? Check spam folder or Resend dashboard</li>
                <li>Error? Open browser console (F12) for details</li>
              </ul>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
