'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Users, Plus, UserCheck, UserX, Shield, Filter } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { User, UserRole, Site } from '@/types';

export default function UsersPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [usersSnapshot, sitesSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'users'),
          where('orgId', '==', userData!.orgId)
        )),
        getDocs(query(
          collection(db, 'sites'),
          where('orgId', '==', userData!.orgId)
        )),
      ]);

      const usersData = usersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastLogin: data.lastLogin?.toDate(),
        } as User;
      });
      setUsers(usersData);

      setSites(sitesSnapshot.docs.map((doc) => doc.data() as Site));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: UserRole): 'pass' | 'warning' | 'pending' | 'fail' => {
    switch (role) {
      case 'super_admin':
        return 'fail';
      case 'responsible_person':
        return 'warning';
      case 'site_manager':
      case 'fire_marshal':
        return 'pass';
      default:
        return 'pending';
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getSiteNames = (siteIds?: string[]): string => {
    if (!siteIds || siteIds.length === 0) return 'All Sites';
    const names = siteIds
      .map((id) => sites.find((s) => s.id === id)?.name)
      .filter(Boolean);
    if (names.length === 0) return 'All Sites';
    if (names.length > 2) return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
    return names.join(', ');
  };

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;
    return true;
  });

  const getActiveUsers = () => users.filter((u) => u.status === 'active');
  const getInactiveUsers = () => users.filter((u) => u.status === 'inactive');

  const getRoleCount = (role: UserRole) => {
    return users.filter((u) => u.role === role).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Users</h1>
          <p className="text-sm text-brand-600 mt-1">
            Manage team members and permissions
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/dashboard/users/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{users.length}</div>
                <div className="text-sm text-brand-600">Total Users</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{getActiveUsers().length}</div>
                <div className="text-sm text-brand-600">Active</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 text-gray-700">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{getInactiveUsers().length}</div>
                <div className="text-sm text-brand-600">Inactive</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">
                  {getRoleCount('responsible_person') + getRoleCount('super_admin')}
                </div>
                <div className="text-sm text-brand-600">Admins</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-medium text-brand-900">Filters</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="responsible_person">Responsible Person</option>
                <option value="site_manager">Site Manager</option>
                <option value="technician">Technician</option>
                <option value="fire_marshal">Fire Marshal</option>
                <option value="competent_person">Competent Person</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {(roleFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Users List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </div>
            {filteredUsers.length > 0 && (
              <span className="text-sm text-brand-600">{filteredUsers.length} user(s)</span>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                {users.length === 0 ? 'No Users Yet' : 'No Matching Users'}
              </h3>
              <p className="text-sm text-brand-600 mb-4">
                {users.length === 0
                  ? 'Add team members to collaborate on fire safety compliance.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
              {users.length === 0 && (
                <Button
                  variant="primary"
                  onClick={() => router.push('/dashboard/users/new')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First User
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-brand-900">{user.name}</h4>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'pass' : 'pending'}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-brand-600">
                      <span>{user.email}</span>
                      <span>•</span>
                      <span>{getSiteNames(user.siteIds)}</span>
                    </div>
                    {user.lastLogin && (
                      <div className="text-xs text-brand-600 mt-1">
                        Last login: {formatUKDate(user.lastLogin, 'dd/MM/yyyy HH:mm')}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
