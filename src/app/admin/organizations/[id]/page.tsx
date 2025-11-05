'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Calendar,
  Settings,
  CreditCard,
  Activity,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Package,
  ClipboardCheck,
  FileText
} from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { Organisation, User, Site, Asset, CheckTask, Defect } from '@/types';

interface OrgStats {
  users: User[];
  sites: Site[];
  assets: Asset[];
  tasks: CheckTask[];
  defects: Defect[];
  activeUsers: number;
  completedTasksThisMonth: number;
  openDefects: number;
}

export default function OrganizationDetailPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<Organisation | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'billing' | 'activity'>('overview');

  useEffect(() => {
    if (userData && userData.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    if (userData && orgId) {
      fetchOrganizationDetails();
    }
  }, [userData, orgId]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);

      // Fetch organization
      const orgDoc = await getDoc(doc(db, 'organisations', orgId));
      if (!orgDoc.exists()) {
        alert('Organization not found');
        router.push('/admin/organizations');
        return;
      }

      const orgData = { id: orgDoc.id, ...orgDoc.data() } as Organisation;
      setOrganization(orgData);

      // Fetch all related data in parallel
      const [usersSnap, sitesSnap, assetsSnap, tasksSnap, defectsSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'sites'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'assets'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'tasks'), where('orgId', '==', orgId))),
        getDocs(query(collection(db, 'defects'), where('orgId', '==', orgId))),
      ]);

      const users = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
      const sites = sitesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Site));
      const assets = assetsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Asset));
      const tasks = tasksSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          completedAt: data.completedAt?.toDate(),
          dueAt: data.dueAt?.toDate(),
        } as CheckTask;
      });
      const defects = defectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Defect));

      // Calculate stats
      const activeUsers = users.filter((u) => u.status === 'active').length;
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedTasksThisMonth = tasks.filter(
        (t) => t.status === 'completed' && t.completedAt && t.completedAt >= firstOfMonth
      ).length;
      const openDefects = defects.filter((d) => d.status !== 'closed').length;

      setStats({
        users,
        sites,
        assets,
        tasks,
        defects,
        activeUsers,
        completedTasksThisMonth,
        openDefects,
      });
    } catch (error) {
      console.error('Error fetching organization details:', error);
      alert('Failed to load organization details');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendOrganization = async () => {
    if (!organization) return;

    const confirm = window.confirm(
      `Are you sure you want to suspend ${organization.name}? Users will not be able to access the system.`
    );

    if (!confirm) return;

    try {
      // Suspend all users
      if (stats?.users) {
        await Promise.all(
          stats.users.map((user) =>
            updateDoc(doc(db, 'users', user.id), {
              status: 'suspended',
              updatedAt: new Date(),
            })
          )
        );
      }

      alert('Organization suspended successfully');
      await fetchOrganizationDetails();
    } catch (error) {
      console.error('Error suspending organization:', error);
      alert('Failed to suspend organization');
    }
  };

  const handleActivateOrganization = async () => {
    if (!organization) return;

    try {
      // Activate all users
      if (stats?.users) {
        await Promise.all(
          stats.users.filter((u) => u.status === 'suspended').map((user) =>
            updateDoc(doc(db, 'users', user.id), {
              status: 'active',
              updatedAt: new Date(),
            })
          )
        );
      }

      alert('Organization activated successfully');
      await fetchOrganizationDetails();
    } catch (error) {
      console.error('Error activating organization:', error);
      alert('Failed to activate organization');
    }
  };

  if (!userData || userData.role !== 'super_admin') {
    return null;
  }

  if (loading || !organization || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-brand-600">Loading organization details...</div>
      </div>
    );
  }

  const createdDate = organization.createdAt instanceof Date
    ? organization.createdAt
    : (organization.createdAt as any)?.toDate();

  const allUsersSuspended = stats.users.length > 0 && stats.users.every((u) => u.status === 'suspended');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/admin/organizations')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Organizations
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {organization.name}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-brand-600">
              {createdDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Created {formatUKDate(createdDate, 'dd/MM/yyyy')}
                </span>
              )}
              <Badge variant={allUsersSuspended ? 'fail' : 'pass'}>
                {allUsersSuspended ? 'Suspended' : 'Active'}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            {allUsersSuspended ? (
              <Button variant="primary" onClick={handleActivateOrganization}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Activate
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleSuspendOrganization}>
                <XCircle className="w-4 h-4 mr-2" />
                Suspend
              </Button>
            )}
            <Button variant="secondary">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-brand-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-brand-900 text-brand-900 font-medium'
                : 'border-transparent text-brand-600 hover:text-brand-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-brand-900 text-brand-900 font-medium'
                : 'border-transparent text-brand-600 hover:text-brand-900'
            }`}
          >
            Users ({stats.users.length})
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'billing'
                ? 'border-brand-900 text-brand-900 font-medium'
                : 'border-transparent text-brand-600 hover:text-brand-900'
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-brand-900 text-brand-900 font-medium'
                : 'border-transparent text-brand-600 hover:text-brand-900'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <Card.Content>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-brand-600">Users</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">{stats.activeUsers}</div>
                  <div className="text-xs text-brand-500">of {stats.users.length} total</div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-brand-600">Sites</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">{stats.sites.length}</div>
                  <div className="text-xs text-brand-500">locations</div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-brand-600">Assets</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">{stats.assets.length}</div>
                  <div className="text-xs text-brand-500">managed</div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-brand-600">Checks This Month</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">{stats.completedTasksThisMonth}</div>
                  <div className="text-xs text-brand-500">completed</div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Organization Details */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-brand-900 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Organization Details
              </h2>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-brand-700">Organization ID</label>
                  <p className="text-sm text-brand-900 font-mono">{organization.id}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-brand-700">Timezone</label>
                  <p className="text-sm text-brand-900">{organization.settings?.timezone || 'Europe/London'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-brand-700">Retention Period</label>
                  <p className="text-sm text-brand-900">{organization.settings?.retentionYears || 6} years</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-brand-700">Domain</label>
                  <p className="text-sm text-brand-900">{organization.domain || 'Not set'}</p>
                </div>
              </div>

              {/* Features */}
              <div className="mt-4">
                <label className="text-sm font-medium text-brand-700 mb-2 block">Features Enabled</label>
                <div className="flex flex-wrap gap-2">
                  {organization.settings?.features?.whiteLabel && (
                    <Badge variant="pending">White Label</Badge>
                  )}
                  {organization.settings?.features?.sso && (
                    <Badge variant="pending">SSO</Badge>
                  )}
                  {organization.settings?.features?.auditorPortal && (
                    <Badge variant="pending">Auditor Portal</Badge>
                  )}
                  {organization.settings?.features?.hrbPack && (
                    <Badge variant="pending">HRB Pack</Badge>
                  )}
                  {!organization.settings?.features?.whiteLabel &&
                   !organization.settings?.features?.sso &&
                   !organization.settings?.features?.auditorPortal &&
                   !organization.settings?.features?.hrbPack && (
                    <span className="text-sm text-brand-500">No premium features enabled</span>
                  )}
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Sites */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-brand-900">Sites</h2>
            </Card.Header>
            <Card.Content>
              {stats.sites.length === 0 ? (
                <p className="text-sm text-brand-600 py-4">No sites created yet</p>
              ) : (
                <div className="space-y-2">
                  {stats.sites.map((site) => (
                    <div key={site.id} className="p-3 border border-brand-200 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-brand-900">{site.name}</p>
                        <p className="text-sm text-brand-600">
                          {site.address.city}, {site.address.postcode}
                        </p>
                      </div>
                      <Badge variant={site.status === 'active' ? 'pass' : 'pending'}>
                        {site.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-brand-900">Users</h2>
          </Card.Header>
          <Card.Content>
            {stats.users.length === 0 ? (
              <p className="text-sm text-brand-600 py-4">No users in this organization</p>
            ) : (
              <div className="space-y-2">
                {stats.users.map((user) => {
                  const lastLogin = user.lastLogin instanceof Date
                    ? user.lastLogin
                    : (user.lastLogin as any)?.toDate();

                  return (
                    <div key={user.id} className="p-4 border border-brand-200 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-brand-900">{user.name}</p>
                          <Badge variant="pending">{user.role.replace(/_/g, ' ')}</Badge>
                          <Badge variant={
                            user.status === 'active' ? 'pass' :
                            user.status === 'suspended' ? 'fail' : 'pending'
                          }>
                            {user.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-brand-600">{user.email}</p>
                        {lastLogin && (
                          <p className="text-xs text-brand-500 mt-1">
                            Last login: {formatUKDate(lastLogin, 'dd/MM/yyyy HH:mm')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-brand-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription & Billing
              </h2>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-brand-700">Current Plan</label>
                  <p className="text-2xl font-bold text-brand-900 capitalize mt-1">
                    {organization.billing?.plan || 'Free'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-brand-700">Status</label>
                  <div className="mt-1">
                    <Badge variant="pass" className="text-base">Active</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-brand-700">Max Users</label>
                  <p className="text-lg text-brand-900 mt-1">
                    {stats.users.length} / {organization.billing?.maxUsers || '∞'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-brand-700">Max Sites</label>
                  <p className="text-lg text-brand-900 mt-1">
                    {stats.sites.length} / {organization.billing?.maxSites || '∞'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-brand-700">Storage Limit</label>
                  <p className="text-lg text-brand-900 mt-1">
                    {organization.billing?.storageGB || '∞'} GB
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-brand-200">
                <Button variant="primary">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Change Plan
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* Usage Limits */}
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-brand-900">Usage & Limits</h2>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {/* Users Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-brand-700">Users</span>
                    <span className="text-brand-600">
                      {stats.users.length} / {organization.billing?.maxUsers || '∞'}
                    </span>
                  </div>
                  {organization.billing?.maxUsers && (
                    <div className="w-full bg-brand-200 h-2">
                      <div
                        className="bg-brand-900 h-2"
                        style={{
                          width: `${Math.min((stats.users.length / organization.billing.maxUsers) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Sites Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-brand-700">Sites</span>
                    <span className="text-brand-600">
                      {stats.sites.length} / {organization.billing?.maxSites || '∞'}
                    </span>
                  </div>
                  {organization.billing?.maxSites && (
                    <div className="w-full bg-brand-200 h-2">
                      <div
                        className="bg-brand-900 h-2"
                        style={{
                          width: `${Math.min((stats.sites.length / organization.billing.maxSites) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <Card.Content>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardCheck className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-brand-600">Total Checks</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">{stats.tasks.length}</div>
                  <div className="text-xs text-brand-500">
                    {stats.tasks.filter((t) => t.status === 'completed').length} completed
                  </div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-brand-600">Defects</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">{stats.defects.length}</div>
                  <div className="text-xs text-brand-500">{stats.openDefects} open</div>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-brand-600">This Month</span>
                  </div>
                  <div className="text-2xl font-bold text-brand-900">{stats.completedTasksThisMonth}</div>
                  <div className="text-xs text-brand-500">checks completed</div>
                </div>
              </Card.Content>
            </Card>
          </div>

          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-brand-900">Recent Activity</h2>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-brand-600 py-4">
                Activity timeline coming soon...
              </p>
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
