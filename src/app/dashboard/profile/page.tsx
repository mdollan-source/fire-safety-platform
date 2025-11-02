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
import { User, Mail, Building2, Shield, CheckCircle2, Edit2, X, Lock } from 'lucide-react';

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
    </div>
  );
}
