'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Asset, Site, Defect } from '@/types';
import { getAssetTypeDefinition } from '@/data/asset-types';
import {
  ArrowLeft,
  Edit,
  MapPin,
  Building2,
  Calendar,
  Package,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  QrCode,
  X,
  Download
} from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';
import { QRCodeSVG } from 'qrcode.react';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [site, setSite] = useState<Site | null>(null);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [documentsRefresh, setDocumentsRefresh] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchAssetDetails();
  }, [assetId]);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);

      // Fetch asset
      const assetDoc = await getDoc(doc(db, 'assets', assetId));
      if (!assetDoc.exists()) {
        setError('Asset not found');
        return;
      }

      const assetData = assetDoc.data() as Asset;
      setAsset(assetData);

      // Fetch site
      const siteDoc = await getDoc(doc(db, 'sites', assetData.siteId));
      if (siteDoc.exists()) {
        setSite(siteDoc.data() as Site);
      }

      // Fetch defects for this asset
      const defectsQuery = query(
        collection(db, 'defects'),
        where('assetId', '==', assetId)
      );
      const defectsSnapshot = await getDocs(defectsQuery);
      const defectsData = defectsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          targetDate: data.targetDate?.toDate(),
          resolvedAt: data.resolvedAt?.toDate(),
        } as Defect;
      });
      setDefects(defectsData);
    } catch (err: any) {
      console.error('Error fetching asset:', err);
      console.error('Error details:', err.code, err.message);
      setError(err.message || 'Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'assets', assetId));
      router.push('/dashboard/assets');
    } catch (err) {
      console.error('Error deleting asset:', err);
      alert('Failed to delete asset');
      setDeleting(false);
    }
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById('asset-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `asset-${assetId}-qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading asset...</div>
      </div>
    );
  }

  if (error || !asset) {
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
              <Button variant="primary" onClick={() => router.push('/dashboard/assets')}>
                Back to Assets
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  const typeDefinition = getAssetTypeDefinition(asset.type);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900">
              {asset.name || typeDefinition?.name}
            </h1>
            <p className="text-sm text-brand-600 mt-1">{typeDefinition?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                asset.status === 'active'
                  ? 'pass'
                  : asset.status === 'inactive'
                  ? 'pending'
                  : 'fail'
              }
            >
              {asset.status}
            </Badge>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push(`/dashboard/assets/${assetId}/edit`)}
              disabled={deleting}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asset Information */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Asset Information
              </div>
            </Card.Header>
            <Card.Content>
              <div className="space-y-4">
                {asset.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-brand-600">Location</div>
                      <div className="font-medium text-brand-900">{asset.location}</div>
                    </div>
                  </div>
                )}

                {site && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-brand-600">Site</div>
                      <div className="font-medium text-brand-900">{site.name}</div>
                      <div className="text-sm text-brand-600">
                        {site.address.line1}, {site.address.city}
                      </div>
                    </div>
                  </div>
                )}

                {asset.createdAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-brand-500 mt-0.5" />
                    <div>
                      <div className="text-sm text-brand-600">Registered</div>
                      <div className="font-medium text-brand-900">
                        {formatUKDate(asset.createdAt.toDate())}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Type-Specific Details */}
          {asset.typeSpecific && Object.keys(asset.typeSpecific).length > 0 && (
            <Card>
              <Card.Header>Technical Specifications</Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(asset.typeSpecific).map(([key, value]) => {
                    // Format the key
                    const label = key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());

                    // Format the value
                    let displayValue = value;
                    if (value instanceof Date) {
                      displayValue = formatUKDate(value);
                    } else if (typeof value === 'object') {
                      displayValue = JSON.stringify(value);
                    }

                    return (
                      <div key={key}>
                        <div className="text-sm text-brand-600">{label}</div>
                        <div className="font-medium text-brand-900">{String(displayValue)}</div>
                      </div>
                    );
                  })}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Check History */}
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Check History
              </div>
            </Card.Header>
            <Card.Content>
              <div className="text-center py-8">
                <p className="text-sm text-brand-600">
                  Check history will appear here once you complete checks on this asset.
                </p>
              </div>
            </Card.Content>
          </Card>

          {/* Defects */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Active Defects
                </div>
                {defects.length > 0 && (
                  <span className="text-sm text-brand-600">
                    {defects.filter(d => d.status !== 'resolved' && d.status !== 'verified' && d.status !== 'closed').length} open
                  </span>
                )}
              </div>
            </Card.Header>
            <Card.Content>
              {defects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-brand-600">
                    No defects recorded for this asset.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {defects
                    .filter(d => d.status !== 'resolved' && d.status !== 'verified' && d.status !== 'closed')
                    .slice(0, 5)
                    .map((defect) => (
                      <div
                        key={defect.id}
                        className="p-3 border border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/defects/${defect.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-brand-900 text-sm">{defect.title}</h5>
                            <p className="text-xs text-brand-600 mt-1 line-clamp-1">
                              {defect.description}
                            </p>
                            {defect.targetDate && (
                              <p className="text-xs text-brand-600 mt-1">
                                Due: {formatUKDate(defect.targetDate, 'dd/MM/yyyy')}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              defect.severity === 'critical' || defect.severity === 'high'
                                ? 'fail'
                                : defect.severity === 'medium'
                                ? 'warning'
                                : 'pending'
                            }
                          >
                            {defect.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  {defects.filter(d => d.status !== 'resolved' && d.status !== 'verified' && d.status !== 'closed').length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-brand-600">
                        All defects have been resolved.
                      </p>
                    </div>
                  )}
                  {defects.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push('/dashboard/defects')}
                    >
                      View All Defects
                    </Button>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Documents & Certificates */}
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
                    entityType="asset"
                    entityId={assetId}
                    onUploadComplete={() => setDocumentsRefresh((prev) => prev + 1)}
                  />
                </div>

                {/* Documents List */}
                <div>
                  <h4 className="text-sm font-medium text-brand-900 mb-3">Uploaded Documents</h4>
                  <DocumentList
                    entityType="asset"
                    entityId={assetId}
                    orgId={asset.orgId}
                    refreshTrigger={documentsRefresh}
                  />
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <Card.Header>Quick Stats</Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-brand-900">0</div>
                  <div className="text-sm text-brand-600">Total Checks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">0</div>
                  <div className="text-sm text-brand-600">Failed Checks</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${defects.filter(d => d.status !== 'resolved' && d.status !== 'verified' && d.status !== 'closed').length > 0 ? 'text-red-600' : 'text-brand-900'}`}>
                    {defects.filter(d => d.status !== 'resolved' && d.status !== 'verified' && d.status !== 'closed').length}
                  </div>
                  <div className="text-sm text-brand-600">Open Defects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">-</div>
                  <div className="text-sm text-brand-600">Last Check</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-brand-900">-</div>
                  <div className="text-sm text-brand-600">Next Check Due</div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Actions */}
          <Card>
            <Card.Header>Actions</Card.Header>
            <Card.Content>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => router.push('/dashboard/defects/new')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Raise Defect
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/checks/schedule?assetId=${assetId}&siteId=${asset.siteId}`)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Schedule Check
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowQRModal(true)}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  View QR Code
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push('/dashboard/reports')}
                >
                  Download Report
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-brand-900">Asset QR Code</h3>
              <button
                onClick={() => setShowQRModal(false)}
                className="text-brand-400 hover:text-brand-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border-2 border-brand-200">
                <QRCodeSVG
                  id="asset-qr-code"
                  value={`${window.location.origin}/dashboard/assets/${assetId}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="text-center">
                <p className="text-sm font-medium text-brand-900">{asset.name || typeDefinition?.name}</p>
                <p className="text-xs text-brand-600 mt-1">Scan to view asset details</p>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleDownloadQR}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => setShowQRModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
