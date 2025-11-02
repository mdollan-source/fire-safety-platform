'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Site, UserRole } from '@/types';

export default function NewUserPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('technician');
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [allSitesAccess, setAllSitesAccess] = useState(true);

  useEffect(() => {
    if (userData?.orgId) {
      fetchSites();
    }
  }, [userData]);

  const fetchSites = async () => {
    try {
      const sitesQuery = query(
        collection(db, 'sites'),
        where('orgId', '==', userData!.orgId)
      );
      const snapshot = await getDocs(sitesQuery);
      const sitesData = snapshot.docs.map((doc) => doc.data() as Site);
      setSites(sitesData);
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  };

  const handleSiteToggle = (siteId: string) => {
    if (selectedSites.includes(siteId)) {
      setSelectedSites(selectedSites.filter((id) => id !== siteId));
    } else {
      setSelectedSites([...selectedSites, siteId]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user || !userData?.orgId) {
        throw new Error('You must be signed in');
      }

      if (!name.trim()) {
        throw new Error('Please provide a name');
      }

      if (!email.trim()) {
        throw new Error('Please provide an email address');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please provide a valid email address');
      }

      // Check if email already exists in this org
      const existingUserQuery = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase()),
        where('orgId', '==', userData.orgId)
      );
      const existingSnapshot = await getDocs(existingUserQuery);
      if (!existingSnapshot.empty) {
        throw new Error('A user with this email already exists in your organisation');
      }

      // Call API to send invitation
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase(),
          role: role,
          siteIds: allSitesAccess ? [] : selectedSites,
          orgId: userData.orgId,
          invitedBy: userData.name || user.displayName || 'Administrator',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      // Show success and redirect
      alert('Invitation sent successfully! The user will receive an email with instructions to join.');
      router.push('/dashboard/users');
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-brand-900">Add User</h1>
        <p className="text-sm text-brand-600 mt-1">
          Add a new team member to your organisation
        </p>
      </div>

      {/* Info Notice */}
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <Card.Content>
          <div className="flex items-start gap-3">
            <UserPlus className="w-5 h-5 text-blue-700 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Send Invitation</h3>
              <p className="text-sm text-blue-800 mt-1">
                An email invitation will be sent to the user with a link to create their account. The invitation is valid for 7 days.
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Form */}
      <Card>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <FormError message={error} />}

            {/* Name */}
            <Input
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., John Smith"
              required
              disabled={loading}
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., john.smith@company.com"
              required
              disabled={loading}
              helperText="User will need to sign up with this email"
            />

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Role <span className="text-red-600">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="technician">Technician - Completes checks</option>
                <option value="fire_marshal">Fire Marshal - Completes checks + training</option>
                <option value="site_manager">Site Manager - Manages sites</option>
                <option value="responsible_person">Responsible Person - Full compliance ownership</option>
                <option value="competent_person">Competent Person - External contractor</option>
                <option value="auditor">Auditor - Read-only access</option>
                <option value="super_admin">Super Admin - Full system access</option>
              </select>
              <p className="text-xs text-brand-600 mt-1">
                Defines what the user can do in the system
              </p>
            </div>

            {/* Site Access */}
            <div className="pt-4 border-t border-brand-200">
              <h3 className="text-sm font-semibold text-brand-900 mb-4">
                Site Access
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="allSites"
                    checked={allSitesAccess}
                    onChange={(e) => {
                      setAllSitesAccess(e.target.checked);
                      if (e.target.checked) {
                        setSelectedSites([]);
                      }
                    }}
                    disabled={loading}
                    className="mt-1 w-4 h-4"
                  />
                  <label htmlFor="allSites" className="text-sm text-brand-900 cursor-pointer">
                    <div className="font-medium">Access to all sites</div>
                    <div className="text-brand-600">User can access all sites in your organisation</div>
                  </label>
                </div>

                {!allSitesAccess && (
                  <div className="ml-7 space-y-2 bg-brand-50 p-4 border border-brand-200">
                    <p className="text-sm font-medium text-brand-900 mb-2">
                      Select specific sites:
                    </p>
                    {sites.length === 0 ? (
                      <p className="text-sm text-brand-600">
                        No sites available. Create sites first.
                      </p>
                    ) : (
                      sites.map((site) => (
                        <div key={site.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`site-${site.id}`}
                            checked={selectedSites.includes(site.id)}
                            onChange={() => handleSiteToggle(site.id)}
                            disabled={loading}
                            className="w-4 h-4"
                          />
                          <label
                            htmlFor={`site-${site.id}`}
                            className="text-sm text-brand-900 cursor-pointer"
                          >
                            {site.name}
                          </label>
                        </div>
                      ))
                    )}
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
                <UserPlus className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
