'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { db, storage } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';
import SignaturePad from '@/components/check/SignaturePad';
import { CheckTask, Asset, CheckField } from '@/types';
import { DEFAULT_CHECK_TEMPLATES } from '@/data/check-templates';
import { getAssetTypeDefinition } from '@/data/asset-types';
import { generateHash } from '@/lib/utils/hash';
import {
  ArrowLeft,
  CheckCircle2,
  Camera,
  MapPin,
  PenTool,
  Upload,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { differenceInHours } from 'date-fns';
import { useOfflineEntry } from '@/hooks/useOfflineEntry';
import { useOfflineDefect } from '@/hooks/useOfflineDefect';

export default function CompleteCheckPage() {
  const params = useParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  const taskId = params.id as string;
  const { isOnline, saveEntry } = useOfflineEntry();
  const { saveDefect } = useOfflineDefect();

  const [task, setTask] = useState<CheckTask | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');

  // Defect raising state
  const [raiseDefect, setRaiseDefect] = useState(false);
  const [defectTitle, setDefectTitle] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  const [defectSeverity, setDefectSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);

      // Fetch task
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (!taskDoc.exists()) {
        setError('Task not found');
        return;
      }

      const taskData = taskDoc.data() as CheckTask;

      if (taskData.status === 'completed') {
        setError('This task has already been completed');
        return;
      }

      // Auto-claim task if not claimed or claim expired
      const shouldClaim = !taskData.claimedBy ||
        (taskData.claimedAt && differenceInHours(new Date(), taskData.claimedAt instanceof Date ? taskData.claimedAt : (taskData.claimedAt as any).toDate()) >= 4);

      if (shouldClaim && userData) {
        await updateDoc(doc(db, 'tasks', taskId), {
          claimedBy: userData.id,
          claimedByName: userData.name,
          claimedAt: new Date(),
          status: 'in_progress',
          updatedAt: new Date(),
        });

        // Update local task data
        taskData.claimedBy = userData.id;
        taskData.claimedByName = userData.name;
        taskData.claimedAt = new Date();
        taskData.status = 'in_progress';
      } else if (taskData.status === 'pending' && taskData.claimedBy && userData) {
        // Task is claimed but still pending - mark as in_progress
        await updateDoc(doc(db, 'tasks', taskId), {
          status: 'in_progress',
          updatedAt: new Date(),
        });
        taskData.status = 'in_progress';
      }

      setTask(taskData);

      // Fetch asset if assetId exists
      if (taskData.assetId && user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch(`/api/assets/${taskData.assetId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setAsset(data.asset);
          }
        } catch (err) {
          console.error('Error fetching asset:', err);
          // Continue without asset data - it's not critical for completing the check
        }
      }
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGpsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Failed to get location. Please enable location services.');
        setGpsLoading(false);
      }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 photos
    const newPhotos = [...photos, ...files].slice(0, 5);
    setPhotos(newPhotos);

    // Create preview URLs
    const newPreviews = newPhotos.map((file) => URL.createObjectURL(file));
    setPhotoPreview(newPreviews);
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreview.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreview(newPreviews);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!task || !user || !userData) return;

    setError('');
    setSubmitting(true);

    try {
      const template = DEFAULT_CHECK_TEMPLATES.find((t) => t.name === task.templateId);
      if (!template) {
        throw new Error('Check template not found');
      }

      // Validate required fields
      const missingFields = template.fields
        .filter((field) => field.required && !fieldValues[field.id])
        .map((field) => field.label);

      if (missingFields.length > 0) {
        throw new Error(`Please complete required fields: ${missingFields.join(', ')}`);
      }

      // Validate signature if required
      if (template.requiresSignature && !signatureDataUrl) {
        throw new Error('Signature is required. Please save your signature.');
      }

      // Validate GPS if required
      if (template.requiresGPS && !gpsLocation) {
        throw new Error('GPS location is required. Please capture your location.');
      }

      // OFFLINE MODE: Save locally and sync later
      if (!isOnline) {
        // Prepare entry data for offline storage
        const entryData: any = {
          orgId: userData.orgId,
          siteId: task.siteId,
          assetId: task.assetId,
          taskId: task.id,
          scheduleId: task.scheduleId || null,
          templateId: task.templateId,
          completedAt: new Date(),
          completedBy: user.uid,
          completedByName: userData.name,
          fieldValues: fieldValues,
          gpsLocation: gpsLocation,
          signatureDataUrl: signatureDataUrl, // Store data URL for later upload
          version: 1,
        };

        // Save entry offline with photos
        const result = await saveEntry(task.id, task.assetId, entryData, photos);

        // Handle defect offline if needed
        if (raiseDefect) {
          if (!defectTitle.trim()) {
            throw new Error('Please provide a defect title');
          }

          const now = new Date();
          let targetDate;
          switch (defectSeverity) {
            case 'critical':
              targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
              break;
            case 'high':
              targetDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
              break;
            case 'medium':
              targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              break;
            case 'low':
              targetDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
              break;
          }

          const defectData = {
            orgId: userData.orgId,
            siteId: task.siteId,
            assetId: task.assetId,
            sourceEntryId: result?.id,
            severity: defectSeverity,
            title: defectTitle,
            description: defectDescription,
            status: 'open',
            targetDate: targetDate,
            createdBy: user.uid,
            createdAt: new Date(),
          };

          await saveDefect(task.assetId, defectData, photos);
        }

        alert('Check saved offline. It will sync automatically when you\'re back online.');
        router.push('/dashboard/checks');
        return;
      }

      // ONLINE MODE: Upload to Firebase immediately
      // Upload photos
      const evidenceUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const timestamp = Date.now();
        const photoRef = ref(
          storage,
          `evidence/${userData.orgId}/${task.id}/${timestamp}_${i}.jpg`
        );

        await uploadBytes(photoRef, photo);
        const downloadUrl = await getDownloadURL(photoRef);
        evidenceUrls.push(downloadUrl);
      }

      // Upload signature
      let signatureUrl = '';
      if (signatureDataUrl) {
        // Convert data URL to Blob
        const response = await fetch(signatureDataUrl);
        const blob = await response.blob();

        const signatureRef = ref(
          storage,
          `evidence/${userData.orgId}/${task.id}/signature.png`
        );

        await uploadBytes(signatureRef, blob);
        signatureUrl = await getDownloadURL(signatureRef);
      }

      // Create entry data with hash for immutability
      const entryData: any = {
        orgId: userData.orgId,
        siteId: task.siteId,
        assetId: task.assetId,
        taskId: task.id,
        scheduleId: task.scheduleId || null,
        templateId: task.templateId,
        completedAt: new Date(),
        completedBy: user.uid,
        completedByName: userData.name,
        fieldValues: fieldValues,
        evidenceUrls: evidenceUrls,
        gpsLocation: gpsLocation,
        signatureUrl: signatureUrl,
        version: 1,
      };

      // Generate hash for immutability
      const hash = generateHash(entryData);
      entryData.hash = hash;

      // Create entry document
      const entryId = `entry_${Date.now()}`;
      await setDoc(doc(db, 'entries', entryId), {
        ...entryData,
        id: entryId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update task as completed
      await updateDoc(doc(db, 'tasks', task.id), {
        status: 'completed',
        completedAt: new Date(),
        completedBy: user.uid,
        entryId: entryId,
        updatedAt: new Date(),
      });

      // Create defect if requested
      if (raiseDefect) {
        if (!defectTitle.trim()) {
          throw new Error('Please provide a defect title');
        }

        const defectId = `defect_${Date.now()}`;

        // Calculate target date based on severity
        const now = new Date();
        let targetDate;
        switch (defectSeverity) {
          case 'critical':
            targetDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
            break;
          case 'high':
            targetDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
            break;
          case 'medium':
            targetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
            break;
          case 'low':
            targetDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
            break;
        }

        // Create defect document
        await setDoc(doc(db, 'defects', defectId), {
          id: defectId,
          orgId: userData.orgId,
          siteId: task.siteId,
          assetId: task.assetId,
          sourceEntryId: entryId,
          severity: defectSeverity,
          title: defectTitle,
          description: defectDescription,
          status: 'open',
          targetDate: targetDate,
          evidenceUrls: evidenceUrls, // Use same photos from check
          createdBy: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Redirect to checks page
      router.push('/dashboard/checks');
    } catch (err: any) {
      console.error('Error completing check:', err);
      setError(err.message || 'Failed to complete check. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading check form...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">{error}</h3>
              <Button variant="primary" onClick={() => router.push('/dashboard/checks')}>
                Back to Checks
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const template = DEFAULT_CHECK_TEMPLATES.find((t) => t.name === task.templateId);
  if (!template) {
    return <div>Template not found</div>;
  }

  const assetType = asset ? getAssetTypeDefinition(asset.type) : null;
  const dueDate = task.dueAt ? (task.dueAt instanceof Date ? task.dueAt : (task.dueAt as any).toDate()) : new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">{template.name}</h1>
            <p className="text-sm text-brand-600 mt-1">{template.description}</p>
          </div>
          <Badge variant="warning">In Progress</Badge>
        </div>
      </div>

      {/* Task Context */}
      <Card>
        <Card.Header>Check Details</Card.Header>
        <Card.Content>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-brand-600">Asset</div>
              <div className="font-medium text-brand-900">
                {asset?.name || assetType?.name}
              </div>
            </div>
            {asset?.location && (
              <div>
                <div className="text-brand-600">Location</div>
                <div className="font-medium text-brand-900">{asset.location}</div>
              </div>
            )}
            <div>
              <div className="text-brand-600">Due Date</div>
              <div className="font-medium text-brand-900">
                {formatUKDate(dueDate, 'dd/MM/yyyy')}
              </div>
            </div>
            <div>
              <div className="text-brand-600">Standards</div>
              <div className="font-medium text-brand-900">
                {template.references?.[0] || 'N/A'}
              </div>
            </div>
          </div>
          {asset?.photoUrl && (
            <div className="mt-6 pt-6 border-t border-brand-200">
              <div className="text-sm font-medium text-brand-900 mb-3">Asset Photo</div>
              <img
                src={asset.photoUrl}
                alt={asset.name || 'Asset'}
                className="w-64 h-64 object-cover border border-brand-300 rounded"
              />
              <p className="text-xs text-brand-600 mt-2">
                Verify this is the correct equipment before completing the check
              </p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Guidance */}
      {template.guidance && (
        <Card>
          <Card.Header>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Guidance
            </div>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-brand-700">{template.guidance}</p>
          </Card.Content>
        </Card>
      )}

      {/* Check Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <Card.Header>Complete Check</Card.Header>
          <Card.Content>
            {error && <FormError message={error} />}

            <div className="space-y-6">
              {/* Dynamic Fields */}
              {template.fields.map((field) => (
                <div key={field.id}>
                  {renderField(field, fieldValues[field.id], (value) =>
                    handleFieldChange(field.id, value)
                  )}
                </div>
              ))}

              {/* Evidence Photos */}
              {template.requiresEvidence && (
                <div className="pt-6 border-t border-brand-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-5 h-5 text-brand-700" />
                    <label className="block text-sm font-medium text-brand-900">
                      Evidence Photos {template.requiresEvidence && <span className="text-red-600">*</span>}
                    </label>
                  </div>
                  <p className="text-xs text-brand-600 mb-3">
                    Upload up to 5 photos as evidence of this check
                  </p>

                  <div className="space-y-3">
                    {photoPreview.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {photoPreview.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Evidence ${index + 1}`}
                              className="w-full h-32 object-cover border border-brand-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(index)}
                              className="absolute top-1 right-1 bg-red-600 text-white p-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {photos.length < 5 && (
                      <div className="flex gap-3">
                        {/* Take Photo Button */}
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-brand-500 bg-brand-50 text-brand-700 hover:bg-brand-100 cursor-pointer transition-colors">
                          <Camera className="w-5 h-5" />
                          <span className="text-sm font-medium">Take Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoChange}
                            className="hidden"
                            disabled={submitting}
                          />
                        </label>

                        {/* Upload Photos Button */}
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-brand-300 text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm font-medium">Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoChange}
                            className="hidden"
                            disabled={submitting}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GPS Location */}
              {template.requiresGPS && (
                <div className="pt-6 border-t border-brand-200">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-brand-700" />
                    <label className="block text-sm font-medium text-brand-900">
                      GPS Location {template.requiresGPS && <span className="text-red-600">*</span>}
                    </label>
                  </div>
                  <p className="text-xs text-brand-600 mb-3">
                    Capture your location to verify you are on-site
                  </p>

                  {gpsLocation ? (
                    <div className="p-3 bg-green-50 border border-green-200 text-sm">
                      <div className="font-medium text-green-900 mb-1">
                        Location Captured
                      </div>
                      <div className="text-green-700">
                        {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCaptureGPS}
                      isLoading={gpsLoading}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Capture Location
                    </Button>
                  )}
                </div>
              )}

              {/* Raise Defect (Optional) */}
              <div className="pt-6 border-t border-brand-200">
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="raiseDefect"
                    checked={raiseDefect}
                    onChange={(e) => setRaiseDefect(e.target.checked)}
                    disabled={submitting}
                    className="mt-1 w-4 h-4"
                  />
                  <div>
                    <label htmlFor="raiseDefect" className="block text-sm font-medium text-brand-900 cursor-pointer">
                      <AlertTriangle className="w-5 h-5 text-orange-600 inline mr-2" />
                      Raise a defect for this check
                    </label>
                    <p className="text-xs text-brand-600 mt-1">
                      If you found issues during this check, tick this box to automatically create a defect record
                    </p>
                  </div>
                </div>

                {raiseDefect && (
                  <div className="ml-7 space-y-4 bg-orange-50 p-4 border border-orange-200">
                    <div>
                      <label className="block text-sm font-medium text-brand-900 mb-2">
                        Defect Title <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={defectTitle}
                        onChange={(e) => setDefectTitle(e.target.value)}
                        placeholder="e.g., Fire door closer not functioning"
                        disabled={submitting}
                        className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-900 mb-2">
                        Description <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        value={defectDescription}
                        onChange={(e) => setDefectDescription(e.target.value)}
                        placeholder="Describe the defect in detail..."
                        disabled={submitting}
                        rows={3}
                        className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-900 mb-2">
                        Severity <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={defectSeverity}
                        onChange={(e) => setDefectSeverity(e.target.value as any)}
                        disabled={submitting}
                        className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="critical">Critical - Immediate risk to life safety</option>
                        <option value="high">High - Significant risk, action required</option>
                        <option value="medium">Medium - Moderate risk, remediation needed</option>
                        <option value="low">Low - Minor issue, monitor and fix</option>
                      </select>
                    </div>

                    <p className="text-xs text-brand-600">
                      The defect will be created with the same photos and linked to this check entry.
                    </p>
                  </div>
                )}
              </div>

              {/* Signature */}
              {template.requiresSignature && (
                <div className="pt-6 border-t border-brand-200">
                  <div className="flex items-center gap-2 mb-3">
                    <PenTool className="w-5 h-5 text-brand-700" />
                    <label className="block text-sm font-medium text-brand-900">
                      Digital Signature {template.requiresSignature && <span className="text-red-600">*</span>}
                    </label>
                  </div>
                  <SignaturePad
                    onSave={setSignatureDataUrl}
                    value={signatureDataUrl}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={submitting}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Complete Check
          </Button>
        </div>
      </form>
    </div>
  );
}

// Render field based on type
function renderField(
  field: CheckField,
  value: any,
  onChange: (value: any) => void
) {
  const { id, label, type, required, options, guidance } = field;

  switch (type) {
    case 'text':
      return (
        <Input
          label={label}
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          helperText={guidance}
        />
      );

    case 'number':
      return (
        <Input
          label={label}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          required={required}
          helperText={guidance}
        />
      );

    case 'boolean':
      return (
        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">
            {label} {required && <span className="text-red-600">*</span>}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={value === true}
                onChange={() => onChange(true)}
                required={required}
                className="w-4 h-4"
              />
              <span className="text-sm text-brand-900">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={value === false}
                onChange={() => onChange(false)}
                required={required}
                className="w-4 h-4"
              />
              <span className="text-sm text-brand-900">No</span>
            </label>
          </div>
          {guidance && <p className="text-xs text-brand-600 mt-1">{guidance}</p>}
        </div>
      );

    case 'enum':
      return (
        <div>
          <label className="block text-sm font-medium text-brand-900 mb-2">
            {label} {required && <span className="text-red-600">*</span>}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select...</option>
            {options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {guidance && <p className="text-xs text-brand-600 mt-1">{guidance}</p>}
        </div>
      );

    case 'date':
      return (
        <Input
          label={label}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          helperText={guidance}
        />
      );

    default:
      return null;
  }
}
