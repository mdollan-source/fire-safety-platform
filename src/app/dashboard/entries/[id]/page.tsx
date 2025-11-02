'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import {
  ArrowLeft,
  CheckCircle2,
  Camera,
  MapPin,
  FileText,
  Shield,
  Calendar,
  User,
  Building2,
  Package,
  ClipboardCheck
} from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { DEFAULT_CHECK_TEMPLATES } from '@/data/check-templates';

interface Entry {
  id: string;
  orgId: string;
  siteId: string;
  assetId: string;
  taskId: string;
  templateId: string;
  completedAt: Date;
  completedBy: string;
  completedByName: string;
  fieldValues: Record<string, any>;
  evidenceUrls: string[];
  gpsLocation?: { lat: number; lng: number };
  signatureUrl?: string;
  hash: string;
  version: number;
  createdAt: Date;
}

interface Asset {
  id: string;
  name: string;
  type: string;
}

interface Site {
  id: string;
  name: string;
}

export default function EntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (entryId) {
      fetchEntry();
    }
  }, [entryId]);

  const fetchEntry = async () => {
    try {
      setLoading(true);

      // Fetch entry
      const entryDoc = await getDoc(doc(db, 'entries', entryId));
      if (!entryDoc.exists()) {
        setError('Entry not found');
        return;
      }

      const entryData = entryDoc.data();
      const entryObj: Entry = {
        ...entryData,
        completedAt: entryData.completedAt?.toDate(),
        createdAt: entryData.createdAt?.toDate(),
      } as Entry;
      setEntry(entryObj);

      // Fetch asset
      const assetDoc = await getDoc(doc(db, 'assets', entryData.assetId));
      if (assetDoc.exists()) {
        setAsset(assetDoc.data() as Asset);
      }

      // Fetch site
      const siteDoc = await getDoc(doc(db, 'sites', entryData.siteId));
      if (siteDoc.exists()) {
        setSite(siteDoc.data() as Site);
      }
    } catch (err) {
      console.error('Error fetching entry:', err);
      setError('Failed to load entry details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading entry...</div>
      </div>
    );
  }

  if (error || !entry) {
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

  const template = DEFAULT_CHECK_TEMPLATES.find((t) => t.name === entry.templateId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Check History
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">Check Entry</h1>
            <p className="text-sm text-brand-600 mt-1">
              Immutable audit record with evidence
            </p>
          </div>
          <Badge variant="pass">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Check Information */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Check Information
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-brand-600">Template</div>
                  <div className="font-medium text-brand-900">{template?.name || entry.templateId}</div>
                  {template?.description && (
                    <div className="text-sm text-brand-600 mt-1">{template.description}</div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-200">
                  <div>
                    <div className="text-sm text-brand-600">Completed By</div>
                    <div className="font-medium text-brand-900">{entry.completedByName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-brand-600">Completed At</div>
                    <div className="font-medium text-brand-900">
                      {formatUKDate(entry.completedAt, 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Field Values */}
          {entry.fieldValues && Object.keys(entry.fieldValues).length > 0 && (
            <Card>
              <Card.Header>Check Results</Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {Object.entries(entry.fieldValues).map(([key, value]) => {
                    const field = template?.fields.find((f) => f.id === key);
                    return (
                      <div key={key} className="pb-3 border-b border-brand-100 last:border-0">
                        <div className="text-sm font-medium text-brand-900 mb-1">
                          {field?.label || key}
                        </div>
                        <div className="text-sm text-brand-700">
                          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Evidence Photos */}
          {entry.evidenceUrls && entry.evidenceUrls.length > 0 && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Evidence Photos ({entry.evidenceUrls.length})
                </div>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {entry.evidenceUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => setSelectedPhoto(url)}
                    >
                      <img
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-32 object-cover border-2 border-brand-200 hover:border-brand-500 transition-colors"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                          Click to enlarge
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* GPS Location */}
          {entry.gpsLocation && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  GPS Location
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-brand-600">Latitude</div>
                      <div className="font-mono text-sm text-brand-900">
                        {entry.gpsLocation.lat.toFixed(6)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-brand-600">Longitude</div>
                      <div className="font-mono text-sm text-brand-900">
                        {entry.gpsLocation.lng.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  {/* Embedded Map */}
                  <div className="mt-4">
                    <iframe
                      width="100%"
                      height="300"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${entry.gpsLocation.lat},${entry.gpsLocation.lng}&zoom=15`}
                      allowFullScreen
                    />
                  </div>

                  <a
                    href={`https://www.google.com/maps?q=${entry.gpsLocation.lat},${entry.gpsLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-sm text-brand-700 hover:text-brand-900 font-medium"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Digital Signature */}
          {entry.signatureUrl && (
            <Card>
              <Card.Header>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Digital Signature
                </div>
              </Card.Header>
              <Card.Content>
                <div className="bg-white border-2 border-brand-300 p-4">
                  <img
                    src={entry.signatureUrl}
                    alt="Digital Signature"
                    className="max-w-md mx-auto"
                  />
                </div>
                <p className="text-xs text-brand-600 mt-3">
                  By signing, {entry.completedByName} certifies that this check has been completed accurately and in accordance with the required standards.
                </p>
              </Card.Content>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <Card.Header>Details</Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-brand-600">Site</div>
                    <div className="text-sm font-medium text-brand-900">{site?.name || 'Unknown'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Package className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-brand-600">Asset</div>
                    <div
                      className="text-sm font-medium text-brand-900 hover:text-brand-700 cursor-pointer"
                      onClick={() => router.push(`/dashboard/assets/${entry.assetId}`)}
                    >
                      {asset?.name || 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-brand-600">Completed By</div>
                    <div className="text-sm font-medium text-brand-900">{entry.completedByName}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-brand-600">Date & Time</div>
                    <div className="text-sm font-medium text-brand-900">
                      {formatUKDate(entry.completedAt, 'dd/MM/yyyy')}
                    </div>
                    <div className="text-xs text-brand-600">
                      {formatUKDate(entry.completedAt, 'HH:mm')}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Verification */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Verification
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-600">Evidence Photos</span>
                  <Badge variant={entry.evidenceUrls && entry.evidenceUrls.length > 0 ? 'pass' : 'pending'}>
                    {entry.evidenceUrls && entry.evidenceUrls.length > 0 ? entry.evidenceUrls.length : 'None'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-600">GPS Verification</span>
                  <Badge variant={entry.gpsLocation ? 'pass' : 'pending'}>
                    {entry.gpsLocation ? 'Verified' : 'Not captured'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-brand-600">Digital Signature</span>
                  <Badge variant={entry.signatureUrl ? 'pass' : 'pending'}>
                    {entry.signatureUrl ? 'Signed' : 'Not signed'}
                  </Badge>
                </div>

                <div className="pt-3 border-t border-brand-200">
                  <div className="text-xs text-brand-600 mb-1">Immutable Hash (SHA-256)</div>
                  <div className="font-mono text-xs text-brand-900 break-all bg-brand-50 p-2 border border-brand-200">
                    {entry.hash}
                  </div>
                  <p className="text-xs text-brand-600 mt-2">
                    This cryptographic hash ensures the entry cannot be altered without detection.
                  </p>
                </div>

                <div className="pt-3 border-t border-brand-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-600">Entry Version</span>
                    <span className="text-sm font-medium text-brand-900">v{entry.version}</span>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Actions */}
          <Card>
            <Card.Header>Actions</Card.Header>
            <Card.Content>
              <div className="space-y-2">
                {asset && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/dashboard/assets/${asset.id}`)}
                  >
                    View Asset
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/dashboard/entries')}
                >
                  Back to All Entries
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Evidence"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              className="absolute top-4 right-4 bg-white text-brand-900 px-4 py-2 font-medium hover:bg-brand-50"
              onClick={() => setSelectedPhoto(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
