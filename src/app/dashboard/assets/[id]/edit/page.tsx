'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';
import { Site, AssetType, Asset } from '@/types';
import {
  ASSET_TYPES,
  EXTINGUISHER_TYPES,
  FIRE_DOOR_RATINGS,
  EMERGENCY_LIGHTING_TYPES,
  getAssetTypeDefinition
} from '@/data/asset-types';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function EditAssetPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assetId = params.id as string;

  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [siteId, setSiteId] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('fire_door');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'decommissioned'>('active');

  // Type-specific fields
  const [extinguisherType, setExtinguisherType] = useState('water');
  const [capacity, setCapacity] = useState('');
  const [fireDoorRating, setFireDoorRating] = useState('FD30');
  const [emergencyLightingType, setEmergencyLightingType] = useState('maintained');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [lastServiceDate, setLastServiceDate] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch sites
      const sitesQuery = query(
        collection(db, 'sites'),
        where('orgId', '==', userData!.orgId)
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      const sitesData = sitesSnapshot.docs.map((doc) => doc.data() as Site);
      setSites(sitesData);

      // Fetch asset
      const assetDoc = await getDoc(doc(db, 'assets', assetId));
      if (!assetDoc.exists()) {
        setError('Asset not found');
        return;
      }

      const asset = assetDoc.data() as Asset;

      // Pre-fill form
      setSiteId(asset.siteId);
      setAssetType(asset.type);
      setName(asset.name || '');
      setLocation(asset.location || '');
      setStatus(asset.status);

      // Pre-fill type-specific fields
      if (asset.typeSpecific) {
        if (asset.type === 'extinguisher') {
          setExtinguisherType(asset.typeSpecific.extinguisherType || 'water');
          setCapacity(asset.typeSpecific.capacity || '');
        } else if (asset.type === 'fire_door') {
          setFireDoorRating(asset.typeSpecific.rating || 'FD30');
        } else if (asset.type === 'emergency_lighting') {
          setEmergencyLightingType(asset.typeSpecific.lightingType || 'maintained');
        }

        setManufacturer(asset.typeSpecific.manufacturer || '');
        setModel(asset.typeSpecific.model || '');
        setSerialNumber(asset.typeSpecific.serialNumber || '');

        if (asset.typeSpecific.installDate) {
          const installDateObj = asset.typeSpecific.installDate.toDate
            ? asset.typeSpecific.installDate.toDate()
            : asset.typeSpecific.installDate;
          setInstallDate(installDateObj.toISOString().split('T')[0]);
        }
      }

      // Pre-fill service dates
      if (asset.serviceDates) {
        if (asset.serviceDates.installed) {
          const installedObj = asset.serviceDates.installed.toDate
            ? asset.serviceDates.installed.toDate()
            : asset.serviceDates.installed;
          setInstallDate(installedObj.toISOString().split('T')[0]);
        }
        if (asset.serviceDates.lastService) {
          const lastServiceObj = asset.serviceDates.lastService.toDate
            ? asset.serviceDates.lastService.toDate()
            : asset.serviceDates.lastService;
          setLastServiceDate(lastServiceObj.toISOString().split('T')[0]);
        }
        if (asset.serviceDates.nextService) {
          const nextServiceObj = asset.serviceDates.nextService.toDate
            ? asset.serviceDates.nextService.toDate()
            : asset.serviceDates.nextService;
          setNextServiceDate(nextServiceObj.toISOString().split('T')[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching asset:', err);
      setError('Failed to load asset');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!user || !userData?.orgId) {
        throw new Error('You must be signed in');
      }

      if (!siteId) {
        throw new Error('Please select a site');
      }

      // Build type-specific attributes
      const typeSpecific: any = {};

      if (assetType === 'extinguisher') {
        typeSpecific.extinguisherType = extinguisherType;
        if (capacity) typeSpecific.capacity = capacity;
      } else if (assetType === 'fire_door') {
        typeSpecific.rating = fireDoorRating;
      } else if (assetType === 'emergency_lighting') {
        typeSpecific.lightingType = emergencyLightingType;
      }

      if (manufacturer) typeSpecific.manufacturer = manufacturer;
      if (model) typeSpecific.model = model;
      if (serialNumber) typeSpecific.serialNumber = serialNumber;
      if (installDate) typeSpecific.installDate = new Date(installDate);

      // Build service dates object
      const serviceDates: any = {};
      if (installDate) serviceDates.installed = new Date(installDate);
      if (lastServiceDate) serviceDates.lastService = new Date(lastServiceDate);
      if (nextServiceDate) serviceDates.nextService = new Date(nextServiceDate);

      // Build update data
      const updateData: any = {
        siteId: siteId,
        type: assetType,
        name: name || getAssetTypeDefinition(assetType)?.name,
        status: status,
        updatedAt: new Date(),
      };

      // Only add location if provided
      if (location?.trim()) {
        updateData.location = location;
      }

      // Only add typeSpecific if there are properties
      if (Object.keys(typeSpecific).length > 0) {
        updateData.typeSpecific = typeSpecific;
      }

      // Only add serviceDates if there are properties
      if (Object.keys(serviceDates).length > 0) {
        updateData.serviceDates = serviceDates;
      }

      // Update asset document
      await updateDoc(doc(db, 'assets', assetId), updateData);

      // Redirect to asset detail
      router.push(`/dashboard/assets/${assetId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update asset. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const typeDefinition = getAssetTypeDefinition(assetType);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading asset...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-brand-900 mb-2">{error}</h3>
              <Button variant="primary" onClick={() => router.push('/dashboard/assets')}>
                Back to Assets
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-brand-900">Edit Asset</h1>
        <p className="text-sm text-brand-600 mt-1">
          Update asset information
        </p>
      </div>

      {/* Form */}
      <Card>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <FormError message={error} />}

            {/* Site Selection */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Site <span className="text-red-600">*</span>
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                required
                disabled={saving}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select a site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Type */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Asset Type <span className="text-red-600">*</span>
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as AssetType)}
                required
                disabled={saving}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {ASSET_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {typeDefinition && (
                <p className="text-xs text-brand-600 mt-1">{typeDefinition.description}</p>
              )}
            </div>

            {/* Name */}
            <Input
              label="Asset Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g., ${typeDefinition?.name} #1`}
              disabled={saving}
              helperText="Optional - defaults to asset type if left blank"
            />

            {/* Location */}
            <Input
              label="Location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Ground Floor, Main Entrance"
              disabled={saving}
              helperText="Floor, room, or specific location"
            />

            {/* Type-Specific Fields */}
            {assetType === 'extinguisher' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-2">
                    Extinguisher Type
                  </label>
                  <select
                    value={extinguisherType}
                    onChange={(e) => setExtinguisherType(e.target.value)}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {EXTINGUISHER_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Capacity"
                  type="text"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g., 6L, 2kg"
                  disabled={saving}
                />
              </>
            )}

            {assetType === 'fire_door' && (
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">
                  Fire Rating
                </label>
                <select
                  value={fireDoorRating}
                  onChange={(e) => setFireDoorRating(e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {FIRE_DOOR_RATINGS.map((rating) => (
                    <option key={rating.value} value={rating.value}>
                      {rating.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {assetType === 'emergency_lighting' && (
              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">
                  Lighting Type
                </label>
                <select
                  value={emergencyLightingType}
                  onChange={(e) => setEmergencyLightingType(e.target.value)}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {EMERGENCY_LIGHTING_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Common Optional Fields */}
            <div className="pt-4 border-t border-brand-200">
              <h3 className="text-sm font-semibold text-brand-900 mb-4">
                Additional Details (Optional)
              </h3>
              <div className="space-y-4">
                <Input
                  label="Manufacturer"
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="e.g., Honeywell"
                  disabled={saving}
                />
                <Input
                  label="Model Number"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g., XLS-500"
                  disabled={saving}
                />
                <Input
                  label="Serial Number"
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g., SN123456789"
                  disabled={saving}
                />
                <Input
                  label="Install Date"
                  type="date"
                  value={installDate}
                  onChange={(e) => setInstallDate(e.target.value)}
                  disabled={saving}
                />
                <Input
                  label="Last Service Date"
                  type="date"
                  value={lastServiceDate}
                  onChange={(e) => setLastServiceDate(e.target.value)}
                  disabled={saving}
                  helperText="When was this asset last serviced?"
                />
                <Input
                  label="Next Service Date"
                  type="date"
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  disabled={saving}
                  helperText="When is the next service due?"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                disabled={saving}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="decommissioned">Decommissioned</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
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
        </Card.Content>
      </Card>
    </div>
  );
}
