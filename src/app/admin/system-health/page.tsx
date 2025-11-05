'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Database, Mail, Users } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';

interface HealthMetrics {
  totalOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  emailsSentToday: number;
  emailFailuresToday: number;
  recentErrors: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

export default function SystemHealthPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (userData && userData.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    if (userData) {
      fetchHealthMetrics();
    }
  }, [userData]);

  const fetchHealthMetrics = async () => {
    try {
      setLoading(true);

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);

      // Fetch all metrics in parallel
      const [orgsSnapshot, usersSnapshot, emailLogsSnapshot] = await Promise.all([
        getDocs(collection(db, 'organisations')),
        getDocs(collection(db, 'users')),
        getDocs(
          query(
            collection(db, 'email_logs'),
            where('sentAt', '>=', todayTimestamp),
            orderBy('sentAt', 'desc')
          )
        ),
      ]);

      const totalOrganizations = orgsSnapshot.size;
      const totalUsers = usersSnapshot.size;
      const activeUsers = usersSnapshot.docs.filter(
        (doc) => doc.data().status === 'active'
      ).length;

      const emailLogs = emailLogsSnapshot.docs.map((doc) => doc.data());
      const emailsSentToday = emailLogs.length;
      const emailFailuresToday = emailLogs.filter(
        (log) => log.status === 'failed' || log.status === 'bounced'
      ).length;

      // Get recent errors from email logs
      const recentErrors = emailLogsSnapshot.docs
        .filter((doc) => {
          const data = doc.data();
          return data.status === 'failed' || data.error;
        })
        .slice(0, 10)
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type || 'unknown',
            message: data.error || 'Unknown error',
            timestamp: data.sentAt?.toDate() || new Date(),
          };
        });

      setMetrics({
        totalOrganizations,
        totalUsers,
        activeUsers,
        emailsSentToday,
        emailFailuresToday,
        recentErrors,
      });

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (): { status: 'healthy' | 'warning' | 'critical'; message: string } => {
    if (!metrics) return { status: 'warning', message: 'Loading...' };

    const failureRate = metrics.emailsSentToday > 0
      ? (metrics.emailFailuresToday / metrics.emailsSentToday) * 100
      : 0;

    if (failureRate > 20) {
      return { status: 'critical', message: 'High email failure rate' };
    } else if (failureRate > 10) {
      return { status: 'warning', message: 'Elevated email failure rate' };
    } else if (metrics.recentErrors.length > 5) {
      return { status: 'warning', message: 'Multiple recent errors' };
    }

    return { status: 'healthy', message: 'All systems operational' };
  };

  const healthStatus = getHealthStatus();

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
              <Activity className="w-6 h-6" />
              System Health
            </h1>
            <p className="text-sm text-brand-600 mt-1">
              Monitor system metrics, errors, and performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-brand-600">
              Last updated: {formatUKDate(lastRefresh, 'HH:mm:ss')}
            </span>
            <Button variant="secondary" onClick={fetchHealthMetrics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card className="mb-6">
        <Card.Content>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {healthStatus.status === 'healthy' && (
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                )}
                {healthStatus.status === 'warning' && (
                  <AlertTriangle className="w-12 h-12 text-orange-600" />
                )}
                {healthStatus.status === 'critical' && (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    System Status
                  </h2>
                  <p className="text-brand-600">{healthStatus.message}</p>
                </div>
              </div>
              <Badge
                variant={
                  healthStatus.status === 'healthy'
                    ? 'pass'
                    : healthStatus.status === 'warning'
                    ? 'warning'
                    : 'fail'
                }
              >
                {healthStatus.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-brand-600">
                  Organizations
                </span>
              </div>
              <div className="text-2xl font-bold text-brand-900">
                {loading ? '...' : metrics?.totalOrganizations || 0}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-brand-600">
                  Active Users
                </span>
              </div>
              <div className="text-2xl font-bold text-brand-900">
                {loading ? '...' : `${metrics?.activeUsers || 0} / ${metrics?.totalUsers || 0}`}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-brand-600">
                  Emails Today
                </span>
              </div>
              <div className="text-2xl font-bold text-brand-900">
                {loading ? '...' : metrics?.emailsSentToday || 0}
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-brand-600">
                  Email Failures
                </span>
              </div>
              <div className="text-2xl font-bold text-brand-900">
                {loading ? '...' : metrics?.emailFailuresToday || 0}
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-brand-900">Recent Errors</h2>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-brand-600">Loading errors...</div>
            </div>
          ) : !metrics?.recentErrors || metrics.recentErrors.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                No Recent Errors
              </h3>
              <p className="text-sm text-brand-600">
                All systems are running smoothly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {metrics.recentErrors.map((error) => (
                <div
                  key={error.id}
                  className="p-4 border border-red-200 bg-red-50 rounded"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="fail">{error.type}</Badge>
                        <span className="text-xs text-brand-500">
                          {formatUKDate(error.timestamp, 'dd/MM/yyyy HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm text-red-800">{error.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
