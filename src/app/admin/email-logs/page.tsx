'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Mail, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { EmailLog } from '@/types/email-log';

export default function EmailLogsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained'>('all');

  useEffect(() => {
    if (userData && userData.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    if (userData) {
      fetchLogs();
    }
  }, [userData, filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);

      let q = query(
        collection(db, 'email_logs'),
        orderBy('sentAt', 'desc'),
        limit(100)
      );

      if (filter !== 'all') {
        q = query(
          collection(db, 'email_logs'),
          where('status', '==', filter),
          orderBy('sentAt', 'desc'),
          limit(100)
        );
      }

      const snapshot = await getDocs(q);
      const logsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmailLog[];

      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching email logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="w-4 h-4" />;
      case 'complained':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string): 'pass' | 'fail' | 'warning' | 'pending' => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'pass';
      case 'failed':
      case 'bounced':
        return 'fail';
      case 'complained':
        return 'warning';
      default:
        return 'pending';
    }
  };

  if (!userData || userData.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
              <Mail className="w-6 h-6" />
              Email Logs
            </h1>
            <p className="text-sm text-brand-600 mt-1">
              View all sent emails and delivery status
            </p>
          </div>
          <Button variant="secondary" onClick={fetchLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Content>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'sent' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('sent')}
            >
              Sent
            </Button>
            <Button
              variant={filter === 'delivered' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('delivered')}
            >
              Delivered
            </Button>
            <Button
              variant={filter === 'failed' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('failed')}
            >
              Failed
            </Button>
            <Button
              variant={filter === 'bounced' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('bounced')}
            >
              Bounced
            </Button>
            <Button
              variant={filter === 'complained' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('complained')}
            >
              Complained
            </Button>
          </div>
        </Card.Content>
      </Card>

      {/* Email Logs */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">Recent Emails</h2>
            <span className="text-sm text-brand-600">{logs.length} emails</span>
          </div>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-brand-600">Loading email logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                No Email Logs
              </h3>
              <p className="text-sm text-brand-600">
                No emails have been sent yet, or they haven't been logged.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const sentDate = log.sentAt instanceof Date
                  ? log.sentAt
                  : (log.sentAt as any)?.toDate();
                const deliveredDate = log.deliveredAt
                  ? (log.deliveredAt instanceof Date
                    ? log.deliveredAt
                    : (log.deliveredAt as any)?.toDate())
                  : null;

                return (
                  <div
                    key={log.id}
                    className="p-4 border border-brand-200 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getStatusVariant(log.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(log.status)}
                              {log.status}
                            </span>
                          </Badge>
                          <span className="text-sm font-medium text-brand-900 uppercase">
                            {log.type}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-brand-900 font-medium">{log.subject}</p>
                          <p className="text-brand-600">
                            <strong>To:</strong> {log.to}
                          </p>
                          <p className="text-brand-600">
                            <strong>From:</strong> {log.from}
                          </p>
                          {log.resendId && (
                            <p className="text-brand-500 text-xs">
                              Resend ID: {log.resendId}
                            </p>
                          )}
                          {deliveredDate && (
                            <p className="text-green-600 text-xs">
                              <strong>Delivered:</strong> {formatUKDate(deliveredDate, 'dd/MM/yyyy HH:mm')}
                            </p>
                          )}
                          {log.webhookData && (
                            <div className="mt-2 p-2 bg-brand-100 rounded text-xs">
                              {log.webhookData.bounce_type && (
                                <p className="text-red-600">
                                  <strong>Bounce Type:</strong> {log.webhookData.bounce_type}
                                </p>
                              )}
                              {log.webhookData.complaint_type && (
                                <p className="text-orange-600">
                                  <strong>Complaint Type:</strong> {log.webhookData.complaint_type}
                                </p>
                              )}
                              {log.webhookData.error && (
                                <p className="text-red-600">
                                  <strong>Webhook Error:</strong> {log.webhookData.error}
                                </p>
                              )}
                            </div>
                          )}
                          {log.error && (
                            <p className="text-red-600 text-xs mt-2">
                              <strong>Error:</strong> {log.error}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm text-brand-600">
                        <p className="text-xs text-brand-500 mb-1">Sent</p>
                        {sentDate && formatUKDate(sentDate, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
