'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import FormError from '@/components/ui/FormError';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { User, Mail, Building2, Shield, CheckCircle2, Edit2, X, Lock, Download, Database, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { formatUKDate } from '@/lib/utils/date';

export default function ProfilePage() {
  const { user, userData } = useAuth();

  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Export data state
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  const handleEditProfile = () => {
    setEditName(userData?.name || user?.displayName || '');
    setEditMode(true);
    setError('');
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSaving(true);

    try {
      if (!editName.trim()) {
        throw new Error('Name is required');
      }

      if (!user || !userData) {
        throw new Error('User not found');
      }

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        name: editName.trim(),
        updatedAt: new Date(),
      });

      setEditMode(false);
      setSuccessMessage('Profile updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);

      // Reload the page to refresh userData from context
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditName('');
    setError('');
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setChangingPassword(true);

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('All password fields are required');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      if (!user || !user.email) {
        throw new Error('User not authenticated');
      }

      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordSuccess('Password changed successfully');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Clear success message after 3 seconds
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      console.error('Password change error:', err);

      // Provide user-friendly error messages
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else {
        setPasswordError(err.message || 'Failed to change password');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportAllData = async () => {
    if (!userData?.orgId) {
      alert('Organisation ID not found');
      return;
    }

    try {
      setExporting(true);
      setExportProgress('Preparing export...');

      const zip = new JSZip();

      // Fetch all data from Firestore
      setExportProgress('Fetching sites data...');
      const sitesSnapshot = await getDocs(query(collection(db, 'sites'), where('orgId', '==', userData.orgId)));
      const sitesData = sitesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setExportProgress('Fetching assets data...');
      const assetsSnapshot = await getDocs(query(collection(db, 'assets'), where('orgId', '==', userData.orgId)));
      const assetsData = assetsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setExportProgress('Fetching checks data...');
      const checksSnapshot = await getDocs(query(collection(db, 'tasks'), where('orgId', '==', userData.orgId)));
      const checksData = checksSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setExportProgress('Fetching entries data...');
      const entriesSnapshot = await getDocs(query(collection(db, 'entries'), where('orgId', '==', userData.orgId)));
      const entriesData = entriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setExportProgress('Fetching defects data...');
      const defectsSnapshot = await getDocs(query(collection(db, 'defects'), where('orgId', '==', userData.orgId)));
      const defectsData = defectsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setExportProgress('Fetching drills data...');
      const drillsSnapshot = await getDocs(query(collection(db, 'fire_drills'), where('orgId', '==', userData.orgId)));
      const drillsData = drillsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setExportProgress('Fetching training data...');
      const trainingSnapshot = await getDocs(query(collection(db, 'training_records'), where('orgId', '==', userData.orgId)));
      const trainingData = trainingSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setExportProgress('Fetching documents data...');
      const documentsSnapshot = await getDocs(query(collection(db, 'documents'), where('orgId', '==', userData.orgId)));
      const documentsData = documentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as any[];

      setExportProgress('Fetching users data...');
      const usersSnapshot = await getDocs(query(collection(db, 'users'), where('orgId', '==', userData.orgId)));
      const usersData = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setExportProgress('Fetching check schedules...');
      const schedulesSnapshot = await getDocs(query(collection(db, 'check_schedules'), where('orgId', '==', userData.orgId)));
      const schedulesData = schedulesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Create Excel workbook with all data
      setExportProgress('Creating Excel workbook...');
      const workbook = XLSX.utils.book_new();

      // Sites sheet
      const sitesExport = sitesData.map((site: any) => {
        const addressParts = [
          site.address?.line1,
          site.address?.line2,
          site.address?.city,
          site.address?.postcode,
          site.address?.country
        ].filter(Boolean);
        const fullAddress = addressParts.join(', ');

        return {
          'Site ID': site.id,
          'Name': site.name,
          'Address Line 1': site.address?.line1 || '',
          'Address Line 2': site.address?.line2 || '',
          'City': site.address?.city || '',
          'Postcode': site.address?.postcode || '',
          'Country': site.address?.country || '',
          'Full Address': fullAddress,
          'Status': site.status || 'active',
          'Created': site.createdAt ? formatUKDate(site.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
        };
      });
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sitesExport), 'Sites');

      // Assets sheet
      const assetsExport = assetsData.map((asset: any) => ({
        'Asset ID': asset.id,
        'Type': asset.type,
        'Name': asset.name || '',
        'Location': asset.location || '',
        'Serial Number': asset.serialNumber || '',
        'Site ID': asset.siteId,
        'Status': asset.status || '',
        'Created': asset.createdAt ? formatUKDate(asset.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(assetsExport), 'Assets');

      // Checks sheet
      const checksExport = checksData.map((check: any) => ({
        'Check ID': check.id,
        'Asset ID': check.assetId || '',
        'Template ID': check.templateId || '',
        'Status': check.status || '',
        'Due Date': check.dueAt ? formatUKDate(check.dueAt.toDate(), 'dd/MM/yyyy') : '',
        'Completed Date': check.completedAt ? formatUKDate(check.completedAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
        'Completed By': check.completedByName || check.completedBy || '',
        'Claimed By': check.claimedByName || '',
        'Site ID': check.siteId || '',
        'Schedule ID': check.scheduleId || '',
        'Created': check.createdAt ? formatUKDate(check.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(checksExport), 'Checks');

      // Entries sheet
      const entriesExport = entriesData.map((entry: any) => ({
        'Entry ID': entry.id,
        'Task ID': entry.taskId || '',
        'Template ID': entry.templateId || '',
        'Asset ID': entry.assetId || '',
        'Site ID': entry.siteId || '',
        'Completed': entry.completedAt ? formatUKDate(entry.completedAt.toDate(), 'dd/MM/yyyy HH:mm') :
                     entry.createdAt ? formatUKDate(entry.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
        'Completed By': entry.completedByName || entry.createdBy || '',
        'Has Signature': entry.signatureUrl || entry.signatureDataUrl ? 'Yes' : 'No',
        'Has GPS': entry.gpsLocation ? 'Yes' : 'No',
        'Evidence Count': entry.evidenceUrls ? entry.evidenceUrls.length : 0,
        'Version': entry.version || 1,
        'Hash': entry.hash || '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(entriesExport), 'Entries');

      // Defects sheet
      const defectsExport = defectsData.map((defect: any) => ({
        'Defect ID': defect.id,
        'Asset ID': defect.assetId,
        'Title': defect.title,
        'Description': defect.description || '',
        'Severity': defect.severity,
        'Status': defect.status,
        'Created': defect.createdAt ? formatUKDate(defect.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
        'Target Date': defect.targetDate ? formatUKDate(defect.targetDate.toDate(), 'dd/MM/yyyy') : '',
        'Resolved': defect.resolvedAt ? formatUKDate(defect.resolvedAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
        'Site ID': defect.siteId,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(defectsExport), 'Defects');

      // Drills sheet
      const drillsExport = drillsData.map((drill: any) => ({
        'Drill ID': drill.id,
        'Date': drill.date ? formatUKDate(drill.date.toDate(), 'dd/MM/yyyy HH:mm') : '',
        'Duration (minutes)': drill.durationMinutes || '',
        'Participants': drill.participantsCount || '',
        'Notes': drill.notes || '',
        'Site ID': drill.siteId,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(drillsExport), 'Fire Drills');

      // Training sheet
      const trainingExport = trainingData.map((training: any) => ({
        'Training ID': training.id,
        'Type': training.type,
        'Date': training.date ? formatUKDate(training.date.toDate(), 'dd/MM/yyyy') : '',
        'Trainer': training.trainerName || '',
        'Attendees': training.attendeeNames ? training.attendeeNames.join(', ') : '',
        'Notes': training.notes || '',
        'Site ID': training.siteId,
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(trainingExport), 'Training');

      // Documents sheet
      const documentsExport = documentsData.map((doc: any) => ({
        'Document ID': doc.id,
        'Title': doc.title,
        'Category': doc.category || '',
        'File Name': doc.fileName,
        'Entity Type': doc.entityType,
        'Entity ID': doc.entityId,
        'Uploaded': doc.uploadedAt ? formatUKDate(doc.uploadedAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
        'Uploaded By': doc.uploadedByName || '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(documentsExport), 'Documents');

      // Users sheet
      const usersExport = usersData.map((usr: any) => ({
        'User ID': usr.id,
        'Name': usr.name,
        'Email': usr.email,
        'Role': usr.role,
        'Site IDs': usr.siteIds ? usr.siteIds.join(', ') : 'All',
        'Created': usr.createdAt ? formatUKDate(usr.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(usersExport), 'Users');

      // Check Schedules sheet
      const schedulesExport = schedulesData.map((schedule: any) => ({
        'Schedule ID': schedule.id,
        'Template ID': schedule.templateId,
        'Site ID': schedule.siteId,
        'Asset IDs': schedule.assetIds ? schedule.assetIds.join(', ') : schedule.assetId || '',
        'Frequency': schedule.frequency || '',
        'Active': schedule.active ? 'Yes' : 'No',
        'Start Date': schedule.startDate ? formatUKDate(schedule.startDate.toDate(), 'dd/MM/yyyy') : '',
        'Strategy': schedule.strategy || '',
        'Rotation Index': schedule.rotationIndex || 0,
        'Created': schedule.createdAt ? formatUKDate(schedule.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : '',
      }));
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(schedulesExport), 'Check Schedules');

      // Write Excel to buffer
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      zip.file('data-export.xlsx', excelBuffer);

      // Fetch uploaded files from Storage
      setExportProgress('Fetching uploaded files...');
      const documentsFolder = zip.folder('documents');
      let filesDownloaded = 0;
      let filesFailedToDownload: Array<{fileName: string, url: string}> = [];

      if (documentsData.length === 0) {
        setExportProgress('No documents to download');
      } else {
        for (const document of documentsData) {
          try {
            if (!document.storageUrl) {
              console.warn(`Document ${document.fileName} has no storageUrl`);
              continue;
            }

            const fileRef = ref(storage, document.storageUrl);
            const downloadURL = await getDownloadURL(fileRef);
            const response = await fetch(downloadURL);

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const blob = await response.blob();
            documentsFolder?.file(document.fileName, blob);
            filesDownloaded++;
            setExportProgress(`Downloading files... (${filesDownloaded}/${documentsData.length})`);
          } catch (err: any) {
            console.error(`Failed to download ${document.fileName}:`, err);
            // Store the download URL for manual download
            try {
              const fileRef = ref(storage, document.storageUrl);
              const downloadURL = await getDownloadURL(fileRef);
              filesFailedToDownload.push({fileName: document.fileName, url: downloadURL});
            } catch (urlErr) {
              console.error(`Failed to get URL for ${document.fileName}:`, urlErr);
            }
          }
        }
      }

      // If files failed to download (CORS issue), create a document with download links
      if (filesFailedToDownload.length > 0) {
        let linksContent = `Document Download Links\n`;
        linksContent += `========================\n\n`;
        linksContent += `${filesFailedToDownload.length} file(s) could not be downloaded automatically due to browser security restrictions.\n`;
        linksContent += `Please use the links below to download these files manually:\n\n`;

        filesFailedToDownload.forEach((doc, index) => {
          linksContent += `${index + 1}. ${doc.fileName}\n`;
          linksContent += `   ${doc.url}\n\n`;
        });

        linksContent += `\nNote: These links will expire after a period of time. Download them as soon as possible.\n`;
        zip.file('DOCUMENT-DOWNLOAD-LINKS.txt', linksContent);
      }

      // Create README
      setExportProgress('Creating README...');
      const readme = `Fire Safety Log - Data Export
================================

Export Date: ${formatUKDate(new Date(), 'dd/MM/yyyy HH:mm')}
Organisation ID: ${userData.orgId}
Exported By: ${userData.name} (${user?.email})

Contents:
---------
- data-export.xlsx: Complete data export with the following sheets:
  * Sites: All site locations
  * Assets: All fire safety assets
  * Checks: All scheduled check tasks
  * Entries: All completed check entries
  * Defects: All defect records
  * Fire Drills: All fire drill records
  * Training: All training records
  * Documents: List of uploaded documents
  * Users: All user accounts
  * Check Schedules: All recurring check schedules

- documents/: Folder containing all uploaded documents and photos

Notes:
------
- Dates are formatted in UK format (DD/MM/YYYY)
- Times are in 24-hour format
- This export includes all data for your organisation
- File sizes may vary depending on the number of uploaded documents

For questions or support, please contact support@firesafetylog.co.uk
`;
      zip.file('README.txt', readme);

      // Generate and download ZIP
      setExportProgress('Creating ZIP file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      setExportProgress('Downloading...');
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `fire-safety-log-export-${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);

      setExportProgress('');

      // Show summary
      let summary = `Data export completed successfully!\n\n`;
      summary += `Sites: ${sitesData.length}\n`;
      summary += `Assets: ${assetsData.length}\n`;
      summary += `Check Tasks: ${checksData.length}\n`;
      summary += `Entries: ${entriesData.length}\n`;
      summary += `Defects: ${defectsData.length}\n`;
      summary += `Fire Drills: ${drillsData.length}\n`;
      summary += `Training Records: ${trainingData.length}\n`;
      summary += `Documents: ${documentsData.length}\n`;
      summary += `Users: ${usersData.length}\n`;
      summary += `Check Schedules: ${schedulesData.length}\n`;
      summary += `\nFiles Downloaded: ${filesDownloaded}/${documentsData.length}`;

      if (filesFailedToDownload.length > 0) {
        summary += `\n\n⚠️ IMPORTANT: ${filesFailedToDownload.length} file(s) could not be downloaded automatically due to browser security (CORS).`;
        summary += `\n\nA file called "DOCUMENT-DOWNLOAD-LINKS.txt" has been included in your export with direct download links for these files. Please download them manually.`;
      }

      alert(summary);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`Failed to export data: ${err.message}`);
    } finally {
      setExporting(false);
      setExportProgress('');
    }
  };

  const getRoleLabel = (role?: string): string => {
    if (!role) return 'User';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-900">Profile</h1>
        <p className="text-sm text-brand-600 mt-1">
          Manage your account settings
        </p>
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

      {/* Password Success Message */}
      {passwordSuccess && (
        <Card className="border-l-4 border-l-green-500 bg-green-50">
          <Card.Content>
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">{passwordSuccess}</span>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* User Info */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <span>Account Information</span>
            {!editMode && (
              <Button variant="secondary" size="sm" onClick={handleEditProfile}>
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {editMode ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {error && <FormError message={error} />}

              <Input
                label="Name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name"
                required
                disabled={saving}
              />

              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">Email</label>
                <div className="px-3 py-2 bg-brand-50 border border-brand-200 text-sm text-brand-600">
                  {user?.email}
                </div>
                <p className="text-xs text-brand-600 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-900 mb-2">Role</label>
                <div className="px-3 py-2 bg-brand-50 border border-brand-200">
                  <Badge variant="pending">
                    {getRoleLabel(userData?.role)}
                  </Badge>
                </div>
                <p className="text-xs text-brand-600 mt-1">Role is managed by your administrator</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={saving}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-brand-500" />
                <div>
                  <div className="text-sm text-brand-600">Name</div>
                  <div className="font-medium text-brand-900">
                    {userData?.name || user?.displayName || 'Not set'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-500" />
                <div>
                  <div className="text-sm text-brand-600">Email</div>
                  <div className="font-medium text-brand-900">{user?.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-brand-500" />
                <div>
                  <div className="text-sm text-brand-600">Role</div>
                  <Badge variant="pending">
                    {getRoleLabel(userData?.role)}
                  </Badge>
                </div>
              </div>

              {userData?.orgId && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-brand-500" />
                  <div>
                    <div className="text-sm text-brand-600">Organisation ID</div>
                    <div className="font-medium text-brand-900 text-xs">
                      {userData.orgId}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Security */}
      <Card>
        <Card.Header>Security</Card.Header>
        <Card.Content>
          <div className="space-y-6">
            {/* Password Change */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-brand-600" />
                <div className="text-sm font-medium text-brand-900">Password</div>
              </div>
              <p className="text-sm text-brand-600 mb-3">
                Change your password to keep your account secure
              </p>

              {!showPasswordChange ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowPasswordChange(true);
                    setPasswordError('');
                  }}
                >
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4 mt-4 p-4 bg-brand-50 border border-brand-200">
                  {passwordError && <FormError message={passwordError} />}

                  <Input
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    disabled={changingPassword}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    disabled={changingPassword}
                    helperText="Minimum 6 characters"
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    disabled={changingPassword}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordError('');
                      }}
                      disabled={changingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      isLoading={changingPassword}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* 2FA - Disabled for now */}
            <div className="pt-6 border-t border-brand-200">
              <div className="text-sm font-medium text-brand-900 mb-2">
                Two-Factor Authentication
              </div>
              <p className="text-sm text-brand-600 mb-3">
                Add an extra layer of security to your account (Coming soon)
              </p>
              <Button variant="secondary" size="sm" disabled>
                Enable 2FA
              </Button>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Notification Preferences */}
      <NotificationPreferences />

      {/* Data Export */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Export & Account
          </div>
        </Card.Header>
        <Card.Content>
          <div className="space-y-6">
            {/* Export All Data */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Download className="w-4 h-4 text-brand-600" />
                <div className="text-sm font-medium text-brand-900">Export All Data</div>
              </div>
              <p className="text-sm text-brand-600 mb-4">
                Download a complete copy of all your organisation's data including sites, assets, check schedules, check tasks, check entries, defects, fire drills, training records, documents, users, and all uploaded files.
                Perfect for backup, migration, or account closure.
              </p>

              {exportProgress && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center gap-2 text-blue-900 text-sm">
                    <div className="loading-spinner w-4 h-4" />
                    {exportProgress}
                  </div>
                </div>
              )}

              <div className="bg-brand-50 border border-brand-200 p-4 rounded mb-4">
                <p className="text-sm font-medium text-brand-900 mb-2">Export includes:</p>
                <ul className="text-sm text-brand-600 space-y-1">
                  <li>• Excel file with all data tables (Sites, Assets, Checks, Defects, Drills, Training, Users)</li>
                  <li>• All uploaded documents and photos in a documents/ folder</li>
                  <li>• README file explaining the contents</li>
                  <li>• Everything packaged in a single ZIP file</li>
                </ul>
              </div>

              <Button
                variant="primary"
                onClick={handleExportAllData}
                isLoading={exporting}
                disabled={exporting}
              >
                <Download className="w-4 h-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export All Data'}
              </Button>
            </div>

            {/* Account Closure Warning */}
            <div className="pt-6 border-t border-brand-200">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">
                    Closing your account?
                  </p>
                  <p className="text-sm text-yellow-800">
                    Make sure to export all your data before closing your account. Once your account is closed,
                    your data will be retained for 90 days, after which it will be permanently deleted and cannot be recovered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
