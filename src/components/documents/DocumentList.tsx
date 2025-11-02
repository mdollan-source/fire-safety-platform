'use client';

import { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase/config';
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { ref, deleteObject, getDownloadURL } from 'firebase/storage';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { FileText, Download, Trash2, Calendar, AlertCircle, Eye } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { Document, DocumentEntityType } from '@/types';
import { differenceInDays } from 'date-fns';
import DocumentViewer from './DocumentViewer';

interface DocumentListProps {
  entityType: DocumentEntityType;
  entityId: string;
  orgId: string;
  refreshTrigger?: number;
}

export default function DocumentList({ entityType, entityId, orgId, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [entityType, entityId, orgId, refreshTrigger]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('Fetching documents for:', { orgId, entityType, entityId });

      const docsQuery = query(
        collection(db, 'documents'),
        where('orgId', '==', orgId),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId)
      );

      const snapshot = await getDocs(docsQuery);
      console.log('Found', snapshot.docs.length, 'documents');

      const docsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Document:', doc.id, data);
        return {
          id: doc.id,
          ...data,
          expiryDate: data.expiryDate?.toDate(),
          uploadedAt: data.uploadedAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
        } as Document;
      });

      // Sort by uploadedAt descending (newest first)
      docsData.sort((a, b) => {
        if (!a.uploadedAt || !b.uploadedAt) return 0;
        return b.uploadedAt.getTime() - a.uploadedAt.getTime();
      });

      setDocuments(docsData);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const downloadURL = await getDownloadURL(ref(storage, document.storageUrl));

      // Create a temporary link and trigger download
      const link = window.document.createElement('a');
      link.href = downloadURL;
      link.download = document.fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(document.id);

      // Delete from Storage
      await deleteObject(ref(storage, document.storageUrl));

      // Delete from Firestore
      await deleteDoc(doc(db, 'documents', document.id));

      // Refresh list
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getCategoryColor = (category: string): 'pass' | 'fail' | 'pending' => {
    switch (category) {
      case 'certificate':
        return 'pass';
      case 'manual':
        return 'pending';
      case 'risk_assessment':
        return 'fail';
      default:
        return 'pending';
    }
  };

  const getExpiryStatus = (expiryDate?: Date) => {
    if (!expiryDate) return null;

    const daysUntilExpiry = differenceInDays(expiryDate, new Date());

    if (daysUntilExpiry < 0) {
      return { label: 'Expired', color: 'fail' as const, days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Expiring Soon', color: 'fail' as const, days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 90) {
      return { label: 'Expires Soon', color: 'pending' as const, days: daysUntilExpiry };
    }

    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-brand-600">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 border border-brand-200 rounded-lg bg-brand-50">
        <FileText className="w-12 h-12 text-brand-400 mx-auto mb-3" />
        <p className="text-sm text-brand-600">No documents uploaded yet</p>
        <p className="text-xs text-brand-500 mt-1">Upload certificates, manuals, and other documents</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const expiryStatus = getExpiryStatus(document.expiryDate);

        return (
          <div
            key={document.id}
            className="border border-brand-200 rounded-lg p-4 hover:bg-brand-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <FileText className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <h4 className="text-sm font-medium text-brand-900 truncate">
                    {document.title}
                  </h4>
                  <Badge variant={getCategoryColor(document.category)} className="flex-shrink-0">
                    {getCategoryLabel(document.category)}
                  </Badge>
                  {expiryStatus && (
                    <Badge variant={expiryStatus.color} className="flex-shrink-0">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {expiryStatus.label}
                    </Badge>
                  )}
                </div>

                {document.description && (
                  <p className="text-xs text-brand-600 mb-2">{document.description}</p>
                )}

                <div className="flex items-center gap-4 text-xs text-brand-600 flex-wrap">
                  <span>{document.fileName}</span>
                  <span>•</span>
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>•</span>
                  <span>Uploaded by {document.uploadedByName}</span>
                  <span>•</span>
                  <span>{formatUKDate(document.uploadedAt, 'dd/MM/yyyy')}</span>
                </div>

                {document.expiryDate && (
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Calendar className="w-3 h-3 text-brand-600" />
                    <span className="text-brand-700">
                      Expires: {formatUKDate(document.expiryDate, 'dd/MM/yyyy')}
                      {expiryStatus && expiryStatus.days >= 0 && (
                        <span className="text-brand-600 ml-1">
                          ({expiryStatus.days} days)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setViewingDocument(document)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(document)}
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(document)}
                  disabled={deleting === document.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  );
}
