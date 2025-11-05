'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, where, doc, updateDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Users, RefreshCw, Search, Filter } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { User, Organisation } from '@/types';

interface UserWithOrg extends User {
  organisationName?: string;
}

export default function UsersManagementPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserWithOrg[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithOrg[]>([]);
  const [organizations, setOrganizations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orgFilter, setOrgFilter] = useState<string>('all');

  useEffect(() => {
    if (userData && userData.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    if (userData) {
      fetchData();
    }
  }, [userData]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, orgFilter, users]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch organizations and users in parallel
      const [orgsSnapshot, usersSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'organisations'), orderBy('name', 'asc'))),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'))),
      ]);

      const orgsData = orgsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Organisation[];

      const orgsMap = new Map(orgsData.map((org) => [org.id, org.name]));

      const usersData = usersSnapshot.docs.map((doc) => {
        const userData = { id: doc.id, ...doc.data() } as User;
        return {
          ...userData,
          organisationName: userData.orgId ? orgsMap.get(userData.orgId) : 'No Organization',
        };
      }) as UserWithOrg[];

      setOrganizations(orgsData);
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.organisationName?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Organization filter
    if (orgFilter !== 'all') {
      filtered = filtered.filter((user) => user.orgId === orgFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );

      alert(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const getRoleBadgeVariant = (role: string): 'pass' | 'fail' | 'warning' | 'pending' => {
    switch (role) {
      case 'responsible_person':
        return 'pass';
      case 'site_manager':
        return 'warning';
      case 'competent_person':
        return 'pending';
      case 'super_admin':
        return 'fail';
      default:
        return 'pending';
    }
  };

  const getStatusBadgeVariant = (status: string): 'pass' | 'fail' | 'warning' | 'pending' => {
    switch (status) {
      case 'active':
        return 'pass';
      case 'suspended':
        return 'fail';
      case 'invited':
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
              <Users className="w-6 h-6" />
              User Management
            </h1>
            <p className="text-sm text-brand-600 mt-1">
              Search and manage users across all organizations
            </p>
          </div>
          <Button variant="secondary" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="text-2xl font-bold text-brand-900">{users.length}</div>
              <div className="text-sm text-brand-600">Total Users</div>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.status === 'active').length}
              </div>
              <div className="text-sm text-brand-600">Active Users</div>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {users.filter((u) => (u.status as string) === 'invited').length}
              </div>
              <div className="text-sm text-brand-600">Pending Invites</div>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.status === 'suspended').length}
              </div>
              <div className="text-sm text-brand-600">Suspended</div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Content>
          <div className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-400" />
              <input
                type="text"
                placeholder="Search by name, email, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-brand-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-4">
              {/* Organization Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-600" />
                <select
                  value={orgFilter}
                  onChange={(e) => setOrgFilter(e.target.value)}
                  className="px-3 py-1.5 border border-brand-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 border border-brand-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Roles</option>
                <option value="responsible_person">Responsible Person</option>
                <option value="site_manager">Site Manager</option>
                <option value="competent_person">Competent Person</option>
                <option value="super_admin">Super Admin</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-brand-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="invited">Invited</option>
                <option value="suspended">Suspended</option>
              </select>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                  setOrgFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>

            <div className="text-sm text-brand-600">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Users List */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-brand-900">Users</h2>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-brand-600">Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">No Users Found</h3>
              <p className="text-sm text-brand-600">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No users have been created yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const lastLogin = user.lastLogin
                  ? user.lastLogin instanceof Date
                    ? user.lastLogin
                    : (user.lastLogin as any)?.toDate()
                  : null;

                return (
                  <div
                    key={user.id}
                    className="p-4 border border-brand-200 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-brand-900">{user.name}</h3>
                          <Badge variant={getRoleBadgeVariant(user.role)}>
                            {user.role.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(user.status)}>
                            {user.status}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-brand-600">
                          <p>
                            <strong>Email:</strong> {user.email}
                          </p>
                          <p>
                            <strong>Organization:</strong> {user.organisationName || 'N/A'}
                          </p>
                          {lastLogin && (
                            <p>
                              <strong>Last Login:</strong>{' '}
                              {formatUKDate(lastLogin, 'dd/MM/yyyy HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
                        >
                          View Details
                        </Button>
                        {user.status === 'active' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'suspended')}
                          >
                            Suspend
                          </Button>
                        )}
                        {user.status === 'suspended' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
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
