'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';
import { ArrowLeft, Save, UserX, Shield, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { Site, UserRole } from '@/types';

interface UserData {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'inactive';
  siteIds?: string[];
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export default function UserDetailPage() {
  const { userData: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserData | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit mode fields
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('technician');
  const [editSelectedSites, setEditSelectedSites] = useState<string[]>([]);
  const [editAllSitesAccess, setEditAllSitesAccess] = useState(true);

  // Activity stats
  const [completedChecks, setCompletedChecks] = useState(0);
  const [reportedDefects, setReportedDefects] = useState(0);

  useEffect(() => {
    if (userId && currentUser?.orgId) {
      fetchUserData();
    }
  }, [userId, currentUser]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch user
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        setError('User not found');
        return;
      }

      const userData = userDoc.data();

      // Verify user belongs to same org
      if (userData.orgId !== currentUser!.orgId) {
        setError('User not found in your organisation');
        return;
      }

      const userObj: UserData = {
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate(),
        lastLogin: userData.lastLogin?.toDate(),
      } as UserData;
      setUser(userObj);

      // Set edit fields
      setEditName(userObj.name);
      setEditRole(userObj.role);
      setEditAllSitesAccess(!userObj.siteIds || userObj.siteIds.length === 0);
      setEditSelectedSites(userObj.siteIds || []);

      // Fetch sites
      const sitesQuery = query(
        collection(db, 'sites'),
        where('orgId', '==', currentUser!.orgId)
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      setSites(sitesSnapshot.docs.map((doc) => doc.data() as Site));

      // Fetch activity stats
      const [entriesSnapshot, defectsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'entries'),
          where('orgId', '==', currentUser!.orgId),
          where('completedBy', '==', userId)
        )),
        getDocs(query(
          collection(db, 'defects'),
          where('orgId', '==', currentUser!.orgId),
          where('raisedBy', '==', userId)
        )),
      ]);

      setCompletedChecks(entriesSnapshot.size);
      setReportedDefects(defectsSnapshot.size);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteToggle = (siteId: string) => {
    if (editSelectedSites.includes(siteId)) {
      setEditSelectedSites(editSelectedSites.filter((id) => id !== siteId));
    } else {
      setEditSelectedSites([...editSelectedSites, siteId]);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSaving(true);

    try {
      if (!editName.trim()) {
        throw new Error('Please provide a name');
      }

      const updates: any = {
        name: editName,
        role: editRole,
        updatedAt: new Date(),
      };

      // Update site access
      if (editAllSitesAccess) {
        updates.siteIds = [];
      } else {
        updates.siteIds = editSelectedSites;
      }

      await updateDoc(doc(db, 'users', userId), updates);

      // Update local state
      setUser({ ...user!, ...updates, updatedAt: new Date() });
      setEditMode(false);
      setSuccessMessage('User updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';

      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      setUser({ ...user, status: newStatus, updatedAt: new Date() });
      setSuccessMessage(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    const confirmMessage = `Are you sure you want to delete ${user.name}? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'users', userId));
      router.push('/dashboard/users');
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      setDeleting(false);
    }
  };

  const getRoleLabel = (role: UserRole): string => {
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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

  const getSiteNames = (siteIds?: string[]): string => {
    if (!siteIds || siteIds.length === 0) return 'All Sites';
    const names = siteIds
      .map((id) => sites.find((s) => s.id === id)?.name)
      .filter(Boolean);
    if (names.length === 0) return 'All Sites';
    return names.join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading user details...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-brand-900 mb-2">{error}</h3>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">{user.name}</h1>
            <p className="text-sm text-brand-600 mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
            <Badge variant={user.status === 'active' ? 'pass' : 'pending'}>
              {user.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <Card.Content>
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </Card.Content>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Details / Edit Form */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  User Details
                </div>
                {!editMode && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditMode(true)}
                    disabled={saving}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Content>
              {editMode ? (
                <form onSubmit={handleSave} className="space-y-6">
                  {error && <FormError message={error} />}

                  {/* Name */}
                  <Input
                    label="Full Name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., John Smith"
                    required
                    disabled={saving}
                  />

                  {/* Email (read-only) */}
                  <Input
                    label="Email Address"
                    type="email"
                    value={user.email}
                    disabled
                    helperText="Email cannot be changed"
                  />

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-brand-900 mb-2">
                      Role <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      required
                      disabled={saving}
                      className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="technician">Technician - Completes checks</option>
                      <option value="fire_marshal">Fire Marshal - Completes checks + training</option>
                      <option value="site_manager">Site Manager - Manages sites</option>
                      <option value="responsible_person">Responsible Person - Full compliance ownership</option>
                      <option value="competent_person">Competent Person - External contractor</option>
                      <option value="auditor">Auditor - Read-only access</option>
                      <option value="super_admin">Super Admin - Full system access</option>
                    </select>
                  </div>

                  {/* Site Access */}
                  <div className="pt-4 border-t border-brand-200">
                    <h3 className="text-sm font-semibold text-brand-900 mb-4">
                      Site Access
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="editAllSites"
                          checked={editAllSitesAccess}
                          onChange={(e) => {
                            setEditAllSitesAccess(e.target.checked);
                            if (e.target.checked) {
                              setEditSelectedSites([]);
                            }
                          }}
                          disabled={saving}
                          className="mt-1 w-4 h-4"
                        />
                        <label htmlFor="editAllSites" className="text-sm text-brand-900 cursor-pointer">
                          <div className="font-medium">Access to all sites</div>
                          <div className="text-brand-600">User can access all sites in your organisation</div>
                        </label>
                      </div>

                      {!editAllSitesAccess && (
                        <div className="ml-7 space-y-2 bg-brand-50 p-4 border border-brand-200">
                          <p className="text-sm font-medium text-brand-900 mb-2">
                            Select specific sites:
                          </p>
                          {sites.length === 0 ? (
                            <p className="text-sm text-brand-600">
                              No sites available.
                            </p>
                          ) : (
                            sites.map((site) => (
                              <div key={site.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`edit-site-${site.id}`}
                                  checked={editSelectedSites.includes(site.id)}
                                  onChange={() => handleSiteToggle(site.id)}
                                  disabled={saving}
                                  className="w-4 h-4"
                                />
                                <label
                                  htmlFor={`edit-site-${site.id}`}
                                  className="text-sm text-brand-900 cursor-pointer"
                                >
                                  {site.name}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditMode(false);
                        setEditName(user.name);
                        setEditRole(user.role);
                        setEditAllSitesAccess(!user.siteIds || user.siteIds.length === 0);
                        setEditSelectedSites(user.siteIds || []);
                        setError('');
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-brand-600">Full Name</div>
                      <div className="font-medium text-brand-900">{user.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-brand-600">Email</div>
                      <div className="font-medium text-brand-900">{user.email}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-200">
                    <div>
                      <div className="text-sm text-brand-600">Role</div>
                      <div className="font-medium text-brand-900">{getRoleLabel(user.role)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-brand-600">Status</div>
                      <div className="font-medium text-brand-900 capitalize">{user.status}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-200">
                    <div className="text-sm text-brand-600">Site Access</div>
                    <div className="font-medium text-brand-900">{getSiteNames(user.siteIds)}</div>
                  </div>

                  <div className="pt-4 border-t border-brand-200">
                    <div className="text-sm text-brand-600">Multi-Factor Authentication</div>
                    <div className="font-medium text-brand-900">
                      {user.mfaEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-200">
                    <div>
                      <div className="text-sm text-brand-600">Created</div>
                      <div className="text-sm text-brand-900">
                        {formatUKDate(user.createdAt, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-brand-600">Last Updated</div>
                      <div className="text-sm text-brand-900">
                        {formatUKDate(user.updatedAt, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </div>

                  {user.lastLogin && (
                    <div className="pt-4 border-t border-brand-200">
                      <div className="text-sm text-brand-600">Last Login</div>
                      <div className="text-sm text-brand-900">
                        {formatUKDate(user.lastLogin, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Activity Stats */}
          <Card>
            <Card.Header>Activity Statistics</Card.Header>
            <Card.Content>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-700" />
                    <span className="text-sm font-medium text-green-900">Checks Completed</span>
                  </div>
                  <div className="text-3xl font-bold text-green-900">{completedChecks}</div>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-700" />
                    <span className="text-sm font-medium text-orange-900">Defects Reported</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-900">{reportedDefects}</div>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <Card.Header>Quick Actions</Card.Header>
            <Card.Content>
              <div className="space-y-2">
                <Button
                  variant={user.status === 'active' ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                  onClick={handleToggleStatus}
                  disabled={saving}
                >
                  {user.status === 'active' ? (
                    <>
                      <UserX className="w-4 h-4 mr-2" />
                      Deactivate User
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Activate User
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/dashboard/entries')}
                >
                  View Check History
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/dashboard/defects')}
                >
                  View Defects
                </Button>
              </div>
            </Card.Content>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <Card.Header>
              <span className="text-red-900">Danger Zone</span>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-brand-600 mb-4">
                Deleting a user is permanent and cannot be undone. Their activity history will remain, but they will no longer be able to access the system.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                isLoading={deleting}
              >
                <UserX className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
