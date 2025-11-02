'use client';

import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Document } from '@/types';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

export default function DocumentViewer({ document, onClose }: DocumentViewerProps) {
  const [downloadURL, setDownloadURL] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    fetchDownloadURL();
  }, [document]);

  const fetchDownloadURL = async () => {
    try {
      setLoading(true);
      const url = await getDownloadURL(ref(storage, document.storageUrl));
      setDownloadURL(url);
    } catch (err) {
      console.error('Error fetching download URL:', err);
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = downloadURL;
    link.download = document.fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const getFileType = (): 'pdf' | 'image' | 'video' | 'unknown' => {
    const ext = document.fileName.split('.').pop()?.toLowerCase();

    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext || '')) return 'video';

    return 'unknown';
  };

  const fileType = getFileType();

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-none sm:rounded-lg w-full max-w-6xl h-full sm:h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-brand-200">
          <div className="flex-1 min-w-0 mr-2">
            <h3 className="text-base sm:text-lg font-semibold text-brand-900 truncate">{document.title}</h3>
            <p className="hidden sm:block text-sm text-brand-600 truncate">{document.fileName}</p>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={!downloadURL}
              className="hidden sm:flex"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={!downloadURL}
              className="sm:hidden"
            >
              <Download className="w-4 h-4" />
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-brand-600 hover:text-brand-900 hover:bg-brand-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-brand-50">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-brand-600">Loading document...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && downloadURL && (
            <>
              {/* PDF Viewer */}
              {fileType === 'pdf' && (
                <iframe
                  src={`${downloadURL}#zoom=${Math.round(scale * 100)}`}
                  className="w-full h-full border-0"
                  title={document.title}
                />
              )}

              {/* Image Viewer */}
              {fileType === 'image' && (
                <div className="flex items-center justify-center p-4 h-full">
                  <img
                    src={downloadURL}
                    alt={document.title}
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: `scale(${scale})` }}
                  />
                </div>
              )}

              {/* Video Player */}
              {fileType === 'video' && (
                <div className="flex items-center justify-center p-4 h-full">
                  <video
                    controls
                    className="max-w-full max-h-full"
                    src={downloadURL}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Unsupported File Type */}
              {fileType === 'unknown' && (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-brand-900 font-medium mb-2">Preview not available</p>
                  <p className="text-brand-600 text-sm mb-4">
                    This file type cannot be previewed in the browser.
                  </p>
                  <Button variant="primary" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls (for images only) */}
        {!loading && !error && fileType === 'image' && (
          <div className="flex items-center justify-center p-4 border-t border-brand-200 bg-white">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={zoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-brand-700 min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={zoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
