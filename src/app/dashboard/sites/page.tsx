'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';
import Modal from '@/components/ui/Modal';
import { Building2, MapPin, Plus, Edit2, Trash2, Users } from 'lucide-react';
import { Site, User } from '@/types';

export default function SitesPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
    managerIds: [] as string[],
  });

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    await Promise.all([fetchSites(), fetchUsers()]);
  };

  const fetchSites = async () => {
    try {
      setLoading(true);
      const sitesQuery = query(
        collection(db, 'sites'),
        where('orgId', '==', userData!.orgId)
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      const sitesData = sitesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Site[];
      setSites(sitesData);
    } catch (err) {
      console.error('Error fetching sites:', err);
      setError('Failed to load sites');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('orgId', '==', userData!.orgId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate(),
      })) as User[];
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      country: 'United Kingdom',
      managerIds: [],
    });
    setError('');
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      setError('');

      // Validation
      if (!formData.name.trim()) {
        setError('Site name is required');
        return;
      }
      if (!formData.addressLine1.trim() || !formData.city.trim() || !formData.postcode.trim()) {
        setError('Address line 1, city, and postcode are required');
        return;
      }

      await addDoc(collection(db, 'sites'), {
        orgId: userData.orgId,
        name: formData.name.trim(),
        address: {
          line1: formData.addressLine1.trim(),
          line2: formData.addressLine2.trim() || undefined,
          city: formData.city.trim(),
          postcode: formData.postcode.trim().toUpperCase(),
          country: formData.country,
        },
        managerIds: formData.managerIds,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await fetchSites();
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error creating site:', err);
      setError(err.message || 'Failed to create site');
    }
  };

  const handleEditSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !editingSite) return;

    try {
      setError('');

      // Validation
      if (!formData.name.trim()) {
        setError('Site name is required');
        return;
      }
      if (!formData.addressLine1.trim() || !formData.city.trim() || !formData.postcode.trim()) {
        setError('Address line 1, city, and postcode are required');
        return;
      }

      await updateDoc(doc(db, 'sites', editingSite.id), {
        name: formData.name.trim(),
        address: {
          line1: formData.addressLine1.trim(),
          line2: formData.addressLine2.trim() || undefined,
          city: formData.city.trim(),
          postcode: formData.postcode.trim().toUpperCase(),
          country: formData.country,
        },
        managerIds: formData.managerIds,
        updatedAt: new Date(),
      });

      await fetchSites();
      setShowEditModal(false);
      setEditingSite(null);
      resetForm();
    } catch (err: any) {
      console.error('Error updating site:', err);
      setError(err.message || 'Failed to update site');
    }
  };

  const handleToggleStatus = async (site: Site) => {
    try {
      const newStatus = site.status === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'sites', site.id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      await fetchSites();
    } catch (err) {
      console.error('Error toggling site status:', err);
      alert('Failed to update site status');
    }
  };

  const handleDeleteSite = async (site: Site) => {
    if (!confirm(`Are you sure you want to delete "${site.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'sites', site.id));
      await fetchSites();
    } catch (err) {
      console.error('Error deleting site:', err);
      alert('Failed to delete site');
    }
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      addressLine1: site.address.line1,
      addressLine2: site.address.line2 || '',
      city: site.address.city,
      postcode: site.address.postcode,
      country: site.address.country,
      managerIds: site.managerIds || [],
    });
    setShowEditModal(true);
  };

  const getManagerNames = (managerIds: string[]) => {
    if (!managerIds || managerIds.length === 0) return 'No managers assigned';
    const managers = users.filter((u) => managerIds.includes(u.id));
    return managers.map((m) => m.name).join(', ') || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading sites...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Sites</h1>
          <p className="text-sm text-brand-600 mt-1">
            Manage your premises and locations
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Site
        </Button>
      </div>

      {/* Sites Grid */}
      {sites.length === 0 ? (
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-brand-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-brand-900 mb-2">No sites yet</h3>
              <p className="text-sm text-brand-600 mb-4">
                Get started by adding your first site or premises
              </p>
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Site
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <Card key={site.id}>
              <Card.Content>
                <div className="space-y-4">
                  {/* Header - Clickable */}
                  <div
                    className="flex items-start justify-between cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/dashboard/sites/${site.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-5 h-5 text-brand-600 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-brand-900 truncate">
                          {site.name}
                        </h3>
                      </div>
                      <Badge variant={site.status === 'active' ? 'completed' : 'overdue'}>
                        {site.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Address - Clickable */}
                  <div
                    className="flex items-start gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/dashboard/sites/${site.id}`)}
                  >
                    <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-brand-700">
                      <p>{site.address.line1}</p>
                      {site.address.line2 && <p>{site.address.line2}</p>}
                      <p>{site.address.city}</p>
                      <p>{site.address.postcode}</p>
                    </div>
                  </div>

                  {/* Managers */}
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-brand-600">
                      {getManagerNames(site.managerIds || [])}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-brand-200">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/dashboard/sites/${site.id}`)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(site);
                      }}
                    >
                      {site.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSite(site);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}

      {/* Create Site Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Add New Site"
      >
        <form onSubmit={handleCreateSite} className="space-y-4">
          {error && <FormError message={error} />}

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Site Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g., Main Office, Warehouse A"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Street address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Building, floor, etc. (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Site Managers
            </label>
            <select
              multiple
              value={formData.managerIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData({ ...formData, managerIds: selected });
              }}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              size={4}
            >
              {users
                .filter((u) => u.role === 'site_manager' || u.role === 'responsible_person' || u.role === 'super_admin')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role.replace(/_/g, ' ')})
                  </option>
                ))}
            </select>
            <p className="text-xs text-brand-600 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Create Site
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Site Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingSite(null);
          resetForm();
        }}
        title="Edit Site"
      >
        <form onSubmit={handleEditSite} className="space-y-4">
          {error && <FormError message={error} />}

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Site Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Address Line 1 *
            </label>
            <input
              type="text"
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-900 mb-2">
              Site Managers
            </label>
            <select
              multiple
              value={formData.managerIds}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setFormData({ ...formData, managerIds: selected });
              }}
              className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              size={4}
            >
              {users
                .filter((u) => u.role === 'site_manager' || u.role === 'responsible_person' || u.role === 'super_admin')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role.replace(/_/g, ' ')})
                  </option>
                ))}
            </select>
            <p className="text-xs text-brand-600 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowEditModal(false);
                setEditingSite(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
