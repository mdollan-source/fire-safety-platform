'use client';

import { useState, useRef, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { storage, db } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormError from '@/components/ui/FormError';
import { Upload, X, FileText, Loader2, Camera } from 'lucide-react';
import { DocumentCategory, DocumentEntityType } from '@/types';

interface DocumentUploadProps {
  entityType: DocumentEntityType;
  entityId: string;
  onUploadComplete?: () => void;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function DocumentUpload({ entityType, entityId, onUploadComplete }: DocumentUploadProps) {
  const { user, userData } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('certificate');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setError('');

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, images, or Office documents.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }

    // Auto-fill title with filename (without extension)
    if (!title) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileSelect(file);

      // Auto-set title for camera photos
      if (!title) {
        const timestamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        setTitle(`Photo - ${timestamp}`);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !userData) return;

    setError('');
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create storage path
      const timestamp = Date.now();
      const storagePath = `documents/${userData.orgId}/${entityType}/${entityId}/${timestamp}_${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);

      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          setError(`Failed to upload file: ${error.message || error.code || 'Unknown error'}`);
          setUploading(false);
        },
        async () => {
          // Upload complete - get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('Upload complete, download URL:', downloadURL);

          // Save document metadata to Firestore
          const documentData: any = {
            orgId: userData.orgId,
            entityType,
            entityId,
            category,
            title: title.trim(),
            description: description.trim() || null,
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            storageUrl: storagePath,
            uploadedBy: user!.uid,
            uploadedByName: userData.name,
            uploadedAt: new Date(),
            updatedAt: new Date(),
          };

          // Add expiry date if provided
          if (expiryDate) {
            documentData.expiryDate = new Date(expiryDate);
            documentData.expiryNotified = false;
          }

          console.log('Saving document metadata to Firestore:', documentData);
          const docRef = await addDoc(collection(db, 'documents'), documentData);
          console.log('Document saved with ID:', docRef.id);

          // Reset form
          setSelectedFile(null);
          setPhotoPreview(null);
          setTitle('');
          setDescription('');
          setExpiryDate('');
          setCategory('certificate');
          setUploadProgress(0);
          setUploading(false);

          // Notify parent component
          if (onUploadComplete) {
            onUploadComplete();
          }

          // Reset file inputs
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          if (cameraInputRef.current) {
            cameraInputRef.current.value = '';
          }
        }
      );
    } catch (err: any) {
      console.error('Error uploading document:', err);
      console.error('Error details:', {
        code: err.code,
        message: err.message,
        serverResponse: err.serverResponse,
      });
      setError(err.message || err.code || 'Failed to upload document');
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <FormError message={error} />}

      {/* Drag & Drop Area */}
      {!selectedFile && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-brand-500 bg-brand-50'
              : 'border-brand-300 hover:border-brand-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-brand-400 mx-auto mb-4" />
          <p className="text-sm text-brand-900 font-medium mb-2">
            Drag and drop your file here, or click to browse
          </p>
          <p className="text-xs text-brand-600 mb-4">
            PDF, Images, or Office documents (Max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
          <div className="flex gap-3 justify-center">
            <Button
              variant="secondary"
              size="md"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Select File
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>
        </div>
      )}

      {/* Selected File Preview */}
      {selectedFile && !uploading && (
        <div className="border border-brand-200 rounded-lg p-4 bg-brand-50">
          {/* Photo Preview */}
          {photoPreview && (
            <div className="mb-4 relative rounded-lg overflow-hidden bg-white">
              <img
                src={photoPreview}
                alt="Document preview"
                className="w-full h-auto max-h-96 object-contain"
              />
              <div className="absolute top-2 right-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPhotoPreview(null);
                  }}
                  className="bg-white shadow-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {photoPreview ? (
                <Camera className="w-8 h-8 text-brand-600" />
              ) : (
                <FileText className="w-8 h-8 text-brand-600" />
              )}
              <div>
                <p className="text-sm font-medium text-brand-900">{selectedFile.name}</p>
                <p className="text-xs text-brand-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {!photoPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Document Title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fire Safety Certificate 2024"
              required
            />

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 border border-brand-300 rounded text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              >
                <option value="certificate">Certificate</option>
                <option value="manual">Manual / Guide</option>
                <option value="plan">Floor Plan / Evacuation Plan</option>
                <option value="insurance">Insurance Document</option>
                <option value="policy">Policy / Procedure</option>
                <option value="risk_assessment">Risk Assessment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
                className="w-full px-3 py-2 border border-brand-300 rounded text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {category === 'certificate' && (
              <Input
                label="Expiry Date (Optional)"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                helperText="We'll send reminders before expiry"
              />
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={!title.trim()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Document
            </Button>
          </form>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="border border-brand-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-brand-600 animate-spin" />
              <p className="text-sm font-medium text-brand-900">Uploading...</p>
            </div>
            <p className="text-sm text-brand-600">{uploadProgress}%</p>
          </div>
          <div className="w-full bg-brand-100 rounded-full h-2">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
