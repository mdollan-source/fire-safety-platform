'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import FormError from '@/components/ui/FormError';
import { Defect, Asset, Site, DefectStatus, DefectSeverity } from '@/types';
import { ArrowLeft, Save, AlertTriangle, MapPin, Calendar, User, CheckCircle2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { formatUKDate } from '@/lib/utils/date';
import { isPast } from 'date-fns';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function DefectDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const defectId = params.id as string;

  const [defect, setDefect] = useState<Defect | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [createdByUser, setCreatedByUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<DefectStatus>('open');
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    if (defectId) {
      fetchDefect();
    }
  }, [defectId]);

  const fetchDefect = async () => {
    try {
      setLoading(true);

      // Fetch defect
      const defectDoc = await getDoc(doc(db, 'defects', defectId));
      if (!defectDoc.exists()) {
        throw new Error('Defect not found');
      }

      const defectData = defectDoc.data();
      const defectObj: Defect = {
        ...defectData,
        createdAt: defectData.createdAt?.toDate(),
        updatedAt: defectData.updatedAt?.toDate(),
        targetDate: defectData.targetDate?.toDate(),
        resolvedAt: defectData.resolvedAt?.toDate(),
      } as Defect;
      setDefect(defectObj);
      setEditStatus(defectObj.status);
      setResolutionNotes(defectObj.resolutionNotes || '');

      // Fetch site
      const siteDoc = await getDoc(doc(db, 'sites', defectData.siteId));
      if (siteDoc.exists()) {
        setSite(siteDoc.data() as Site);
      }

      // Fetch asset if linked
      if (defectData.assetId) {
        const assetDoc = await getDoc(doc(db, 'assets', defectData.assetId));
        if (assetDoc.exists()) {
          setAsset(assetDoc.data() as Asset);
        }
      }

      // Fetch user who created the defect
      if (defectData.createdBy) {
        const userDoc = await getDoc(doc(db, 'users', defectData.createdBy));
        if (userDoc.exists()) {
          setCreatedByUser({ id: userDoc.id, ...userDoc.data() });
        }
      }
    } catch (error: any) {
      console.error('Error fetching defect:', error);
      setError(error.message || 'Failed to load defect');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!defect || !user) return;

    setUpdating(true);
    setError('');

    try {
      const updates: any = {
        status: editStatus,
        updatedAt: new Date(),
      };

      // Add resolution details if status is resolved
      if (editStatus === 'resolved' || editStatus === 'verified' || editStatus === 'closed') {
        updates.resolvedAt = new Date();
        updates.resolvedBy = user.uid;
        if (resolutionNotes.trim()) {
          updates.resolutionNotes = resolutionNotes;
        }
      }

      await updateDoc(doc(db, 'defects', defectId), updates);

      // Refresh defect data
      await fetchDefect();
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update defect');
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityColor = (severity: DefectSeverity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100';
      case 'high':
        return 'text-orange-700 bg-orange-100';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100';
      case 'low':
        return 'text-blue-700 bg-blue-100';
    }
  };

  const getStatusColor = (status: DefectStatus) => {
    switch (status) {
      case 'open':
        return 'text-red-700 bg-red-100';
      case 'in_progress':
        return 'text-orange-700 bg-orange-100';
      case 'resolved':
      case 'verified':
        return 'text-green-700 bg-green-100';
      case 'closed':
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading defect...</div>
      </div>
    );
  }

  if (!defect) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-brand-900 mb-2">Defect Not Found</h3>
              <p className="text-sm text-brand-600">The defect you're looking for doesn't exist.</p>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const isOverdue =
    defect.targetDate &&
    defect.status !== 'resolved' &&
    defect.status !== 'verified' &&
    defect.status !== 'closed' &&
    isPast(defect.targetDate);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Defects
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">{defect.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs font-semibold uppercase ${getSeverityColor(defect.severity)}`}>
                {defect.severity}
              </span>
              <span className={`px-2 py-1 text-xs font-semibold uppercase ${getStatusColor(defect.status)}`}>
                {defect.status.replace('_', ' ')}
              </span>
              {isOverdue && (
                <span className="px-2 py-1 text-xs font-semibold uppercase text-red-700 bg-red-100">
                  OVERDUE
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Defect Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Description
              </div>
            </Card.Header>
            <Card.Content>
              <p className="text-brand-700 whitespace-pre-wrap">{defect.description}</p>
            </Card.Content>
          </Card>

          {/* Evidence Photos */}
          {defect.evidenceUrls && defect.evidenceUrls.length > 0 && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Evidence ({defect.evidenceUrls.length} photo{defect.evidenceUrls.length > 1 ? 's' : ''})
                </div>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {defect.evidenceUrls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover border border-brand-300 hover:border-brand-500 transition-colors"
                      />
                    </a>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Resolution Notes */}
          {defect.resolutionNotes && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Resolution Notes
                </div>
              </Card.Header>
              <Card.Content>
                <p className="text-brand-700 whitespace-pre-wrap">{defect.resolutionNotes}</p>
                {defect.resolvedAt && (
                  <p className="text-sm text-brand-600 mt-2">
                    Resolved on {formatUKDate(defect.resolvedAt, 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Update Status */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Update Status
                </div>
                {!isEditing && (
                  <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Content>
              {error && <FormError message={error} />}

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-900 mb-2">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as DefectStatus)}
                      disabled={updating}
                      className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="verified">Verified</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>

                  {(editStatus === 'resolved' || editStatus === 'verified' || editStatus === 'closed') && (
                    <div>
                      <label className="block text-sm font-medium text-brand-900 mb-2">
                        Resolution Notes
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Describe the actions taken to resolve this defect..."
                        disabled={updating}
                        rows={4}
                        className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setEditStatus(defect.status);
                        setResolutionNotes(defect.resolutionNotes || '');
                      }}
                      disabled={updating}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleStatusUpdate} isLoading={updating}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-brand-600">
                  Click Edit to update the defect status or add resolution notes.
                </p>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <Card.Header>Details</Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-brand-600">Site</div>
                    <div className="text-sm font-medium text-brand-900">{site?.name || 'Unknown'}</div>
                  </div>
                </div>

                {asset && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-brand-600">Asset</div>
                      <div
                        className="text-sm font-medium text-brand-900 hover:text-brand-700 cursor-pointer"
                        onClick={() => router.push(`/dashboard/assets/${asset.id}`)}
                      >
                        {asset.name}
                      </div>
                    </div>
                  </div>
                )}

                {defect.targetDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-brand-600">Target Date</div>
                      <div className="text-sm font-medium text-brand-900">
                        {formatUKDate(defect.targetDate, 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-brand-600">Raised By</div>
                    <div className="text-sm font-medium text-brand-900">
                      {createdByUser?.name || 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-brand-600">Raised</div>
                    <div className="text-sm font-medium text-brand-900">
                      {formatUKDate(defect.createdAt, 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>

                {defect.resolvedAt && (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-brand-600">Resolved</div>
                      <div className="text-sm font-medium text-brand-900">
                        {formatUKDate(defect.resolvedAt, 'dd/MM/yyyy HH:mm')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Quick Actions */}
          <Card>
            <Card.Header>Actions</Card.Header>
            <Card.Content>
              <div className="space-y-2">
                {asset && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/dashboard/assets/${asset.id}`)}
                    className="w-full"
                  >
                    View Asset
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push('/dashboard/defects')}
                  className="w-full"
                >
                  Back to All Defects
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
