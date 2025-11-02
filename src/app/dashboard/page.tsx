'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
  Package,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Activity,
  Plus,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { CheckTask, Defect, Asset, Site } from '@/types';
import { formatUKDate } from '@/lib/utils/date';
import { isToday, isPast, startOfDay, isFuture, isWithinInterval, addDays, subDays, format, eachDayOfInterval } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Data state
  const [tasks, setTasks] = useState<CheckTask[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    if (userData?.orgId) {
      fetchDashboardData();
    } else if (userData) {
      // User exists but no org - stop loading
      setLoading(false);
    }
  }, [userData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [tasksSnapshot, defectsSnapshot, assetsSnapshot, sitesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'tasks'), where('orgId', '==', userData!.orgId))),
        getDocs(query(collection(db, 'defects'), where('orgId', '==', userData!.orgId))),
        getDocs(query(collection(db, 'assets'), where('orgId', '==', userData!.orgId))),
        getDocs(query(collection(db, 'sites'), where('orgId', '==', userData!.orgId))),
      ]);

      const tasksData = tasksSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          dueDate: data.dueDate?.toDate(),
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        } as CheckTask;
      });
      setTasks(tasksData);

      const defectsData = defectsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          targetDate: data.targetDate?.toDate(),
          resolvedAt: data.resolvedAt?.toDate(),
        } as Defect;
      });
      setDefects(defectsData);

      setAssets(assetsSnapshot.docs.map((doc) => doc.data() as Asset));
      setSites(sitesSnapshot.docs.map((doc) => doc.data() as Site));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const getDueTodayTasks = () => {
    return tasks.filter((task) => {
      if (task.status !== 'pending') return false;
      const dueDate = task.dueDate;
      return dueDate && isToday(dueDate);
    });
  };

  const getOverdueTasks = () => {
    return tasks.filter((task) => {
      if (task.status !== 'pending') return false;
      const dueDate = task.dueDate;
      return dueDate && isPast(startOfDay(dueDate)) && !isToday(dueDate);
    });
  };

  const getUpcomingTasks = () => {
    const nextWeek = addDays(new Date(), 7);
    return tasks.filter((task) => {
      if (task.status !== 'pending') return false;
      const dueDate = task.dueDate;
      if (!dueDate) return false;
      return isFuture(dueDate) && !isToday(dueDate) && isWithinInterval(dueDate, {
        start: new Date(),
        end: nextWeek,
      });
    });
  };

  const getCompletedTasks = () => {
    return tasks.filter((task) => task.status === 'completed');
  };

  const getOpenDefects = () => {
    return defects.filter((d) => d.status === 'open' || d.status === 'in_progress');
  };

  const getCriticalDefects = () => {
    return defects.filter((d) =>
      (d.status === 'open' || d.status === 'in_progress') &&
      d.severity === 'critical'
    );
  };

  const getCompletionRate = () => {
    const total = tasks.length;
    if (total === 0) return 100;
    const completed = getCompletedTasks().length;
    return Math.round((completed / total) * 100);
  };

  const getRecentActivity = () => {
    const activities: Array<{
      type: 'check' | 'defect';
      date: Date;
      description: string;
      id: string;
    }> = [];

    // Add completed checks
    tasks
      .filter((t) => t.status === 'completed' && t.completedAt)
      .forEach((task) => {
        activities.push({
          type: 'check',
          date: task.completedAt!,
          description: `Check completed for ${getAssetName(task.assetId)}`,
          id: task.id,
        });
      });

    // Add defects
    defects.forEach((defect) => {
      activities.push({
        type: 'defect',
        date: defect.createdAt,
        description: defect.title,
        id: defect.id,
      });
    });

    // Sort by date descending and take top 5
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  };

  const getAssetName = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  // Chart data generators
  const getChecksCompletedData = () => {
    const days = 30;
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    return dateRange.map((date) => {
      const completedOnDate = tasks.filter((task) => {
        if (task.status !== 'completed' || !task.completedAt) return false;
        const completedDate = startOfDay(task.completedAt);
        return completedDate.getTime() === startOfDay(date).getTime();
      }).length;

      return {
        date: format(date, 'dd MMM'),
        completed: completedOnDate,
      };
    });
  };

  const getDefectsBySeverityData = () => {
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    defects.forEach((defect) => {
      if (defect.status !== 'resolved' && defect.status !== 'verified' && defect.status !== 'closed') {
        severityCounts[defect.severity as keyof typeof severityCounts]++;
      }
    });

    return [
      { name: 'Critical', value: severityCounts.critical, color: '#DC2626' },
      { name: 'High', value: severityCounts.high, color: '#EA580C' },
      { name: 'Medium', value: severityCounts.medium, color: '#F59E0B' },
      { name: 'Low', value: severityCounts.low, color: '#3B82F6' },
    ].filter((item) => item.value > 0);
  };

  const getAssetStatusData = () => {
    const statusCounts = {
      active: 0,
      inactive: 0,
      decommissioned: 0,
    };

    assets.forEach((asset) => {
      statusCounts[asset.status as keyof typeof statusCounts]++;
    });

    return [
      { name: 'Active', count: statusCounts.active, color: '#10B981' },
      { name: 'Inactive', count: statusCounts.inactive, color: '#F59E0B' },
      { name: 'Decommissioned', count: statusCounts.decommissioned, color: '#6B7280' },
    ].filter((item) => item.count > 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading dashboard...</div>
      </div>
    );
  }

  const dueTodayTasks = getDueTodayTasks();
  const overdueTasks = getOverdueTasks();
  const upcomingTasks = getUpcomingTasks();
  const openDefects = getOpenDefects();
  const criticalDefects = getCriticalDefects();
  const completionRate = getCompletionRate();
  const recentActivity = getRecentActivity();

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-900">
          Welcome back, {userData?.name || user?.displayName}
        </h1>
        <p className="text-sm text-brand-600 mt-1">
          Fire safety compliance dashboard
        </p>
      </div>

      {/* Setup notice if no org */}
      {!userData?.orgId && (
        <Card className="border-l-4 border-l-orange-500">
          <Card.Content>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-brand-900">Setup Required</h3>
                <p className="text-sm text-brand-700 mt-1">
                  You need to create an organisation and add your first site to start using the platform.
                </p>
                <a
                  href="/setup/organisation"
                  className="inline-block mt-3 text-sm font-medium text-brand-900 hover:underline"
                >
                  Set up organisation →
                </a>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Critical Alerts */}
      {criticalDefects.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-red-50">
          <Card.Content>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Critical Defects Require Immediate Attention</h3>
                <p className="text-sm text-red-800 mt-1">
                  You have {criticalDefects.length} critical defect{criticalDefects.length > 1 ? 's' : ''} that pose immediate risk to life safety.
                </p>
                <div className="mt-3 space-y-2">
                  {criticalDefects.slice(0, 3).map((defect) => (
                    <div
                      key={defect.id}
                      className="text-sm text-red-900 hover:text-red-700 cursor-pointer font-medium"
                      onClick={() => router.push(`/dashboard/defects/${defect.id}`)}
                    >
                      → {defect.title}
                    </div>
                  ))}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/dashboard/defects')}
                  className="mt-3 bg-red-600 hover:bg-red-700"
                >
                  View All Critical Defects
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <Card className="border-l-4 border-l-orange-500 bg-orange-50">
          <Card.Content>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-orange-900">Overdue Checks</h3>
                  <p className="text-sm text-orange-800 mt-1">
                    {overdueTasks.length} check{overdueTasks.length > 1 ? 's are' : ' is'} overdue and require immediate completion.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/dashboard/checks')}
              >
                View Checks
              </Button>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-brand-600">Checks Due Today</div>
                <div className="text-3xl font-bold text-brand-900 mt-2">{dueTodayTasks.length}</div>
              </div>
              <div className="p-3 bg-blue-100 text-blue-700 rounded-full">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant={dueTodayTasks.length > 0 ? 'warning' : 'pass'}>
                {dueTodayTasks.length > 0 ? 'Action Required' : 'Up to Date'}
              </Badge>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-brand-600">Overdue Checks</div>
                <div className="text-3xl font-bold text-brand-900 mt-2">{overdueTasks.length}</div>
              </div>
              <div className="p-3 bg-red-100 text-red-700 rounded-full">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant={overdueTasks.length > 0 ? 'fail' : 'pass'}>
                {overdueTasks.length > 0 ? 'Urgent' : 'None'}
              </Badge>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-brand-600">Open Defects</div>
                <div className="text-3xl font-bold text-brand-900 mt-2">{openDefects.length}</div>
              </div>
              <div className="p-3 bg-orange-100 text-orange-700 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant={openDefects.length > 0 ? 'warning' : 'pass'}>
                {criticalDefects.length > 0 ? `${criticalDefects.length} Critical` : openDefects.length > 0 ? 'Review' : 'None'}
              </Badge>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-brand-600">Completion Rate</div>
                <div className="text-3xl font-bold text-brand-900 mt-2">{completionRate}%</div>
              </div>
              <div className="p-3 bg-green-100 text-green-700 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-3">
              <Badge variant={completionRate >= 80 ? 'pass' : completionRate >= 60 ? 'warning' : 'fail'}>
                {completionRate >= 80 ? 'On Track' : 'Needs Attention'}
              </Badge>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{sites.length}</div>
                <div className="text-sm text-brand-600">Active Sites</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{assets.length}</div>
                <div className="text-sm text-brand-600">Registered Assets</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{getCompletedTasks().length}</div>
                <div className="text-sm text-brand-600">Checks Completed</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Quick Actions
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/checks')}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Complete Checks
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/defects/new')}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Raise Defect
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/assets/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Asset
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/checks/schedule')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Check
              </Button>
            </div>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </div>
          </Card.Header>
          <Card.Content>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-brand-600 py-4">
                No recent activity yet. Start by completing your first check.
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-3 border-b border-brand-100 last:border-0 last:pb-0 cursor-pointer hover:bg-brand-50 -mx-3 px-3 py-2 transition-colors"
                    onClick={() => router.push(
                      activity.type === 'check'
                        ? '/dashboard/checks'
                        : `/dashboard/defects/${activity.id}`
                    )}
                  >
                    <div className={`p-1 rounded ${
                      activity.type === 'check'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {activity.type === 'check' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-brand-900 line-clamp-2">
                        {activity.description}
                      </p>
                      <p className="text-xs text-brand-600 mt-1">
                        {formatUKDate(activity.date, 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Upcoming Checks */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming (Next 7 Days)
              </div>
              {upcomingTasks.length > 0 && (
                <Badge variant="pending">{upcomingTasks.length}</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Content>
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-brand-600 py-4">
                No checks due in the next 7 days.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-3 pb-3 border-b border-brand-100 last:border-0 last:pb-0 cursor-pointer hover:bg-brand-50 -mx-3 px-3 py-2 transition-colors"
                    onClick={() => router.push(`/dashboard/checks/complete/${task.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-900 line-clamp-1">
                        {getAssetName(task.assetId)}
                      </p>
                      <p className="text-xs text-brand-600 mt-1">
                        Due: {formatUKDate(task.dueDate, 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <Badge variant="pending" className="flex-shrink-0">
                      {task.priority || 'Normal'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checks Completed Trend */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Checks Completed (Last 30 Days)
            </div>
          </Card.Header>
          <Card.Content>
            {getChecksCompletedData().some((d) => d.completed > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={getChecksCompletedData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#6B7280"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6B7280"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-brand-600 text-sm">
                No checks completed in the last 30 days
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Defects by Severity */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Open Defects by Severity
            </div>
          </Card.Header>
          <Card.Content>
            {getDefectsBySeverityData().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getDefectsBySeverityData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getDefectsBySeverityData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-brand-600 text-sm">
                No open defects
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Asset Status Breakdown */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Asset Status Distribution
            </div>
          </Card.Header>
          <Card.Content>
            {getAssetStatusData().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getAssetStatusData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#6B7280"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#6B7280"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {getAssetStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-brand-600 text-sm">
                No assets registered
              </div>
            )}
          </Card.Content>
        </Card>

        {/* Compliance Summary */}
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5" />
              Compliance Summary
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-brand-700">Check Completion Rate</span>
                  <span className="text-sm font-semibold text-brand-900">{completionRate}%</span>
                </div>
                <div className="w-full bg-brand-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      completionRate >= 80 ? 'bg-green-500' :
                      completionRate >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-200">
                <div>
                  <div className="text-2xl font-bold text-brand-900">{sites.length}</div>
                  <div className="text-sm text-brand-600">Sites Managed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">{assets.length}</div>
                  <div className="text-sm text-brand-600">Total Assets</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{getCompletedTasks().length}</div>
                  <div className="text-sm text-brand-600">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
                  <div className="text-sm text-brand-600">Overdue</div>
                </div>
              </div>

              <div className="pt-4 border-t border-brand-200">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => router.push('/dashboard/reports')}
                >
                  Generate Compliance Report
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
