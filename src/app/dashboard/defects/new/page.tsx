'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db, storage } from '@/lib/firebase/config';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';
import { Site, Asset, DefectSeverity } from '@/types';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewDefectPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [siteId, setSiteId] = useState('');
  const [assetId, setAssetId] = useState('');
  const [severity, setSeverity] = useState<DefectSeverity>('high');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      // Fetch sites
      const sitesQuery = query(
        collection(db, 'sites'),
        where('orgId', '==', userData!.orgId)
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      const sitesData = sitesSnapshot.docs.map((doc) => doc.data() as Site);
      setSites(sitesData);

      // Auto-select first site
      if (sitesData.length > 0 && !siteId) {
        setSiteId(sitesData[0].id);
      }

      // Fetch all assets for the org
      const assetsQuery = query(
        collection(db, 'assets'),
        where('orgId', '==', userData!.orgId)
      );
      const assetsSnapshot = await getDocs(assetsQuery);
      const assetsData = assetsSnapshot.docs.map((doc) => doc.data() as Asset);
      setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Filter assets by selected site
  const filteredAssets = assets.filter((asset) => asset.siteId === siteId);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos = [...photos, ...files].slice(0, 5); // Max 5 photos
    setPhotos(newPhotos);

    // Create preview URLs
    const newPreviews = newPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreview(newPreviews);
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreview.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreview(newPreviews);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user || !userData?.orgId) {
        throw new Error('You must be signed in');
      }

      if (!siteId) {
        throw new Error('Please select a site');
      }

      if (!title.trim()) {
        throw new Error('Please provide a defect title');
      }

      // Generate defect ID
      const defectId = `defect_${Date.now()}`;

      // Upload photos to Firebase Storage
      const evidenceUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photoRef = ref(
          storage,
          `evidence/${userData.orgId}/${defectId}/${Date.now()}_${i}.jpg`
        );
        await uploadBytes(photoRef, photos[i]);
        const downloadUrl = await getDownloadURL(photoRef);
        evidenceUrls.push(downloadUrl);
      }

      // Calculate target date based on severity if not set
      let calculatedTargetDate = targetDate ? new Date(targetDate) : null;
      if (!calculatedTargetDate) {
        const now = new Date();
        switch (severity) {
          case 'critical':
            calculatedTargetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
            break;
          case 'high':
            calculatedTargetDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
            break;
          case 'medium':
            calculatedTargetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            break;
          case 'low':
            calculatedTargetDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
            break;
        }
      }

      // Build defect document
      const defectData: any = {
        id: defectId,
        orgId: userData.orgId,
        siteId: siteId,
        severity: severity,
        title: title,
        description: description,
        status: 'open',
        evidenceUrls: evidenceUrls,
        createdBy: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add optional fields if provided
      if (assetId) {
        defectData.assetId = assetId;
      }

      if (calculatedTargetDate) {
        defectData.targetDate = calculatedTargetDate;
      }

      // Create defect document
      await setDoc(doc(db, 'defects', defectId), defectData);

      // Send defect notifications to responsible persons (non-blocking - don't fail if notification fails)
      try {
        const selectedSite = sites.find(s => s.id === siteId);
        const selectedAsset = assets.find(a => a.id === assetId);

        await fetch('/api/notifications/defect-reported', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            defectId,
            defectTitle: title,
            severity,
            siteName: selectedSite?.name || 'Unknown Site',
            assetName: selectedAsset?.name,
            orgId: userData.orgId,
            reportedBy: userData.name || userData.email,
          }),
        });
      } catch (notificationError) {
        console.error('Failed to send defect notifications:', notificationError);
        // Don't block user flow if notification fails
      }

      // Redirect to defects list
      router.push('/dashboard/defects');
    } catch (err: any) {
      setError(err.message || 'Failed to create defect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sites.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                No Sites Available
              </h3>
              <p className="text-sm text-brand-600 mb-4">
                You need to create a site before you can raise defects.
              </p>
              <Button variant="primary" onClick={() => router.push('/dashboard/sites/new')}>
                Create Site
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
        <h1 className="text-2xl font-bold text-brand-900">Raise Defect</h1>
        <p className="text-sm text-brand-600 mt-1">
          Record fire safety defects and non-compliance issues
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
                onChange={(e) => {
                  setSiteId(e.target.value);
                  setAssetId(''); // Reset asset when site changes
                }}
                required
                disabled={loading}
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

            {/* Asset Selection (Optional) */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Related Asset
              </label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                disabled={loading || !siteId}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">General Site Defect</option>
                {filteredAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-brand-600 mt-1">
                Optional - leave blank for general site defects
              </p>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Severity <span className="text-red-600">*</span>
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as DefectSeverity)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="critical">Critical - Immediate risk to life safety</option>
                <option value="high">High - Significant risk, action required</option>
                <option value="medium">Medium - Moderate risk, remediation needed</option>
                <option value="low">Low - Minor issue, monitor and fix</option>
              </select>
            </div>

            {/* Title */}
            <Input
              label="Defect Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fire door closer not functioning"
              required
              disabled={loading}
              helperText="Brief description of the issue"
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Description <span className="text-red-600">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed information about the defect, its location, and any immediate actions taken..."
                required
                disabled={loading}
                rows={4}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Target Date */}
            <Input
              label="Target Resolution Date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={loading}
              helperText="Optional - will be auto-calculated based on severity if not set"
            />

            {/* Photo Evidence */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Photo Evidence
              </label>
              <div className="space-y-3">
                {photoPreview.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {photoPreview.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover border border-brand-300"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white p-1 hover:bg-red-700"
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {photos.length < 5 && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      disabled={loading}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center px-4 py-2 border border-brand-300 text-sm font-medium text-brand-900 bg-white hover:bg-brand-50 focus:outline-none cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {photos.length === 0 ? 'Upload Photos' : 'Add More Photos'}
                    </label>
                    <p className="text-xs text-brand-600 mt-1">
                      Upload up to 5 photos ({5 - photos.length} remaining)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                <Save className="w-4 h-4 mr-2" />
                Raise Defect
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
