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
import {
  ArrowLeft,
  Save,
  Trash2,
  Building2,
  MapPin,
  Users,
  Package,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Edit2,
  X,
  FileText
} from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { Site, Asset, Defect, User } from '@/types';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';

export default function SiteDetailPage() {
  const { userData: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const siteId = params.id as string;

  const [site, setSite] = useState<Site | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [documentsRefresh, setDocumentsRefresh] = useState(0);

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddressLine1, setEditAddressLine1] = useState('');
  const [editAddressLine2, setEditAddressLine2] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPostcode, setEditPostcode] = useState('');
  const [editCountry, setEditCountry] = useState('United Kingdom');
  const [editManagerIds, setEditManagerIds] = useState<string[]>([]);

  useEffect(() => {
    if (siteId && currentUser?.orgId) {
      fetchSiteData();
    }
  }, [siteId, currentUser]);

  const fetchSiteData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch site
      const siteDoc = await getDoc(doc(db, 'sites', siteId));
      if (!siteDoc.exists()) {
        setError('Site not found');
        return;
      }

      const siteData = siteDoc.data();

      // Verify site belongs to same org
      if (siteData.orgId !== currentUser!.orgId) {
        setError('Site not found in your organisation');
        return;
      }

      const siteObj: Site = {
        ...siteData,
        createdAt: siteData.createdAt?.toDate(),
        updatedAt: siteData.updatedAt?.toDate(),
      } as Site;
      setSite(siteObj);

      // Set edit fields
      setEditName(siteObj.name);
      setEditAddressLine1(siteObj.address.line1);
      setEditAddressLine2(siteObj.address.line2 || '');
      setEditCity(siteObj.address.city);
      setEditPostcode(siteObj.address.postcode);
      setEditCountry(siteObj.address.country);
      setEditManagerIds(siteObj.managerIds || []);

      // Debug: First, let's fetch ALL assets for this org to see what siteIds they have
      const allAssetsSnapshot = await getDocs(query(
        collection(db, 'assets'),
        where('orgId', '==', currentUser!.orgId)
      ));

      console.log('=== ASSETS DEBUG ===');
      console.log('Current site ID:', siteId);
      console.log('Site ID type:', typeof siteId);
      console.log('All assets in org:', allAssetsSnapshot.size);

      allAssetsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Asset ${index}:`, {
          id: doc.id,
          assetId: data.id,
          siteId: data.siteId,
          siteIdType: typeof data.siteId,
          match: data.siteId === siteId,
          name: data.name,
          tag: data.tag
        });
      });

      // Fetch related data in parallel
      const [usersSnapshot, assetsSnapshot, defectsSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'users'),
          where('orgId', '==', currentUser!.orgId)
        )),
        getDocs(query(
          collection(db, 'assets'),
          where('siteId', '==', siteId)
        )),
        getDocs(query(
          collection(db, 'defects'),
          where('siteId', '==', siteId),
          where('status', 'in', ['open', 'in_progress'])
        )),
      ]);

      console.log('Assets query with siteId filter returned:', assetsSnapshot.size, 'documents');

      setUsers(usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate(),
      })) as User[]);

      const assetsData = assetsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Asset[];

      console.log('Processed assets:', assetsData.length, assetsData);
      setAssets(assetsData);

      setDefects(defectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        targetDate: doc.data().targetDate?.toDate(),
      })) as Defect[]);

    } catch (err) {
      console.error('Error fetching site:', err);
      setError('Failed to load site details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSaving(true);

    try {
      if (!editName.trim()) {
        throw new Error('Site name is required');
      }
      if (!editAddressLine1.trim() || !editCity.trim() || !editPostcode.trim()) {
        throw new Error('Address line 1, city, and postcode are required');
      }

      const updates: any = {
        name: editName.trim(),
        address: {
          line1: editAddressLine1.trim(),
          line2: editAddressLine2.trim() || undefined,
          city: editCity.trim(),
          postcode: editPostcode.trim().toUpperCase(),
          country: editCountry,
        },
        managerIds: editManagerIds,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'sites', siteId), updates);

      // Update local state
      setSite({
        ...site!,
        ...updates,
        updatedAt: new Date(),
        address: updates.address,
      });
      setEditMode(false);
      setSuccessMessage('Site updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update site');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!site) return;

    try {
      setSaving(true);
      const newStatus = site.status === 'active' ? 'inactive' : 'active';

      await updateDoc(doc(db, 'sites', siteId), {
        status: newStatus,
        updatedAt: new Date(),
      });

      setSite({ ...site, status: newStatus, updatedAt: new Date() });
      setSuccessMessage(`Site ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update site status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!site) return;

    // Check if site has assets
    if (assets.length > 0) {
      alert(`Cannot delete site with ${assets.length} registered asset(s). Please remove or reassign assets first.`);
      return;
    }

    const confirmMessage = `Are you sure you want to delete "${site.name}"? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'sites', siteId));
      router.push('/dashboard/sites');
    } catch (err: any) {
      setError(err.message || 'Failed to delete site');
      setDeleting(false);
    }
  };

  const getManagerNames = (managerIds: string[]): string => {
    if (!managerIds || managerIds.length === 0) return 'No managers assigned';
    const managers = users.filter((u) => managerIds.includes(u.id));
    return managers.map((m) => m.name).join(', ') || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading site details...</div>
      </div>
    );
  }

  if (error && !site) {
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

  if (!site) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sites
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">{site.name}</h1>
            <p className="text-sm text-brand-600 mt-1">
              {site.address.line1}, {site.address.city}
            </p>
          </div>
          <Badge variant={site.status === 'active' ? 'pass' : 'pending'}>
            {site.status}
          </Badge>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700">
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
              <div className="p-2 bg-orange-100 text-orange-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{defects.length}</div>
                <div className="text-sm text-brand-600">Open Defects</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">
                  {(site.managerIds || []).length}
                </div>
                <div className="text-sm text-brand-600">Site Managers</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Site Details / Edit Form */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Site Details
                </div>
                {!editMode && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditMode(true)}
                    disabled={saving}
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Content>
              {editMode ? (
                <form onSubmit={handleSave} className="space-y-4">
                  {error && <FormError message={error} />}

                  <Input
                    label="Site Name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g., Main Office"
                    required
                    disabled={saving}
                  />

                  <div className="space-y-4">
                    <div className="text-sm font-medium text-brand-900">Address</div>

                    <Input
                      label="Address Line 1"
                      type="text"
                      value={editAddressLine1}
                      onChange={(e) => setEditAddressLine1(e.target.value)}
                      placeholder="Street address"
                      required
                      disabled={saving}
                    />

                    <Input
                      label="Address Line 2 (optional)"
                      type="text"
                      value={editAddressLine2}
                      onChange={(e) => setEditAddressLine2(e.target.value)}
                      placeholder="Building, floor, etc."
                      disabled={saving}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="City"
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        required
                        disabled={saving}
                      />

                      <Input
                        label="Postcode"
                        type="text"
                        value={editPostcode}
                        onChange={(e) => setEditPostcode(e.target.value.toUpperCase())}
                        required
                        disabled={saving}
                      />
                    </div>

                    <Input
                      label="Country"
                      type="text"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-900 mb-2">
                      Site Managers
                    </label>
                    <select
                      multiple
                      value={editManagerIds}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                        setEditManagerIds(selected);
                      }}
                      className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      size={4}
                      disabled={saving}
                    >
                      {users
                        .filter((u) =>
                          u.role === 'site_manager' ||
                          u.role === 'responsible_person' ||
                          u.role === 'super_admin'
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.role.replace(/_/g, ' ')})
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-brand-600 mt-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setEditMode(false);
                        setEditName(site.name);
                        setEditAddressLine1(site.address.line1);
                        setEditAddressLine2(site.address.line2 || '');
                        setEditCity(site.address.city);
                        setEditPostcode(site.address.postcode);
                        setEditCountry(site.address.country);
                        setEditManagerIds(site.managerIds || []);
                        setError('');
                      }}
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
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
                  <div>
                    <div className="text-sm text-brand-600">Site Name</div>
                    <div className="font-medium text-brand-900">{site.name}</div>
                  </div>

                  <div className="pt-4 border-t border-brand-200">
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-brand-600 mt-0.5" />
                      <div className="text-sm text-brand-600">Address</div>
                    </div>
                    <div className="text-sm text-brand-900">
                      <p>{site.address.line1}</p>
                      {site.address.line2 && <p>{site.address.line2}</p>}
                      <p>{site.address.city}</p>
                      <p>{site.address.postcode}</p>
                      <p>{site.address.country}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-200">
                    <div className="flex items-start gap-2 mb-2">
                      <Users className="w-4 h-4 text-brand-600 mt-0.5" />
                      <div className="text-sm text-brand-600">Site Managers</div>
                    </div>
                    <div className="text-sm text-brand-900">
                      {getManagerNames(site.managerIds || [])}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-brand-200">
                    <div className="text-sm text-brand-600">Status</div>
                    <div className="font-medium text-brand-900 capitalize">{site.status}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-200">
                    <div>
                      <div className="text-sm text-brand-600">Created</div>
                      <div className="text-sm text-brand-900">
                        {formatUKDate(site.createdAt, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-brand-600">Last Updated</div>
                      <div className="text-sm text-brand-900">
                        {formatUKDate(site.updatedAt, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Assets List */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Assets at this Site ({assets.length})
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/dashboard/assets/new?siteId=${siteId}`)}
                >
                  Add Asset
                </Button>
              </div>
            </Card.Header>
            <Card.Content>
              {assets.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-brand-300 mx-auto mb-3" />
                  <p className="text-sm text-brand-600 mb-3">No assets registered at this site</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/dashboard/assets/new?siteId=${siteId}`)}
                  >
                    Add First Asset
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 border border-brand-200 hover:bg-brand-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/assets/${asset.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-brand-900">{asset.name || asset.tag}</p>
                        <p className="text-xs text-brand-600">
                          {asset.type.replace(/_/g, ' ')} • {asset.tag}
                        </p>
                      </div>
                      <Badge variant={asset.status === 'active' ? 'pass' : asset.status === 'inactive' ? 'warning' : 'pending'}>
                        {asset.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Defects List */}
          {defects.length > 0 && (
            <Card>
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Open Defects ({defects.length})
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/dashboard/defects')}
                  >
                    View All
                  </Button>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-2">
                  {defects.slice(0, 5).map((defect) => (
                    <div
                      key={defect.id}
                      className="flex items-start justify-between p-3 border border-brand-200 hover:bg-brand-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/dashboard/defects/${defect.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-brand-900 truncate">{defect.title}</p>
                        <p className="text-xs text-brand-600">
                          Raised {formatUKDate(defect.createdAt, 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Badge variant={
                        defect.severity === 'critical' ? 'fail' :
                        defect.severity === 'high' ? 'fail' :
                        defect.severity === 'medium' ? 'warning' :
                        'pending'
                      }>
                        {defect.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents & Certificates
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-6">
                {/* Upload Section */}
                <div>
                  <h4 className="text-sm font-medium text-brand-900 mb-3">Upload New Document</h4>
                  <DocumentUpload
                    entityType="site"
                    entityId={siteId}
                    onUploadComplete={() => setDocumentsRefresh((prev) => prev + 1)}
                  />
                </div>

                {/* Documents List */}
                <div>
                  <h4 className="text-sm font-medium text-brand-900 mb-3">Uploaded Documents</h4>
                  <DocumentList
                    entityType="site"
                    entityId={siteId}
                    orgId={site.orgId}
                    refreshTrigger={documentsRefresh}
                  />
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
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/assets/new?siteId=${siteId}`)}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push(`/dashboard/defects/new?siteId=${siteId}`)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Raise Defect
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard/checks')}
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  View Checks
                </Button>

                <Button
                  variant={site.status === 'active' ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                  onClick={handleToggleStatus}
                  disabled={saving}
                >
                  {site.status === 'active' ? 'Deactivate Site' : 'Activate Site'}
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
                Deleting a site is permanent and cannot be undone. You must remove all assets from this site before deletion.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full border-red-300 text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                isLoading={deleting}
                disabled={assets.length > 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Site
              </Button>
              {assets.length > 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Remove {assets.length} asset(s) first
                </p>
              )}
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
