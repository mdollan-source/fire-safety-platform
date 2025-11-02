'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import FormError from '@/components/ui/FormError';
import { Building2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewSitePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [siteName, setSiteName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');

  const { user, userData } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user || !userData?.orgId) {
        throw new Error('Organisation not found. Please set up your organisation first.');
      }

      // Generate site ID
      const siteId = `site_${Date.now()}`;

      // Build address object (only include line2 if provided)
      const address: any = {
        line1: addressLine1,
        city: city,
        postcode: postcode,
        country: 'United Kingdom',
      };
      if (addressLine2?.trim()) {
        address.line2 = addressLine2;
      }

      // Create site document
      await setDoc(doc(db, 'sites', siteId), {
        id: siteId,
        orgId: userData.orgId,
        name: siteName,
        address,
        managerIds: [user.uid],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Redirect to sites list
      router.push('/dashboard/sites');
    } catch (err: any) {
      setError(err.message || 'Failed to create site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/sites">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sites
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-brand-900">Add New Site</h1>
        <p className="text-sm text-brand-600 mt-1">
          Add a premises or location to your organisation
        </p>
      </div>

      {/* Form */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Site Details
          </div>
        </Card.Header>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <FormError message={error} />}

            <Input
              label="Site name"
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g., Main Office Building"
              required
              disabled={loading}
              helperText="A descriptive name for this location"
            />

            <div className="space-y-4">
              <div className="text-sm font-medium text-brand-700">Address</div>

              <Input
                label="Address line 1"
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="123 High Street"
                required
                disabled={loading}
              />

              <Input
                label="Address line 2 (optional)"
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Suite 4"
                disabled={loading}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="London"
                  required
                  disabled={loading}
                />

                <Input
                  label="Postcode"
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value).toUpperCase()}
                  placeholder="SW1A 1AA"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="bg-brand-50 border border-brand-200 p-4 text-sm text-brand-700">
              <p className="font-medium mb-2">What's next?</p>
              <p>
                After creating your site, you can add assets (fire doors, alarms, extinguishers)
                and schedule recurring checks.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Link href="/dashboard/sites" className="flex-1">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="flex-1"
                isLoading={loading}
                disabled={loading}
              >
                Create Site
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
