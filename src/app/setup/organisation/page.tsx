'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import FormError from '@/components/ui/FormError';
import { Building2, CheckCircle, Check } from 'lucide-react';

type Plan = 'single_site' | 'multi_site' | 'enterprise';

export default function OrganisationSetupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Plan selection
  const [selectedPlan, setSelectedPlan] = useState<Plan>('single_site');

  // Organisation details
  const [orgName, setOrgName] = useState('');

  // First site details
  const [siteName, setSiteName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');

  const { user, refreshUserData } = useAuth();
  const router = useRouter();

  const getPlanDetails = (plan: Plan) => {
    switch (plan) {
      case 'single_site':
        return { name: 'Single Site', maxSites: 1, price: 0 };
      case 'multi_site':
        return { name: 'Multi-Site', maxSites: 5, price: 0 };
      case 'enterprise':
        return { name: 'Enterprise', maxSites: null, price: 0 }; // null = unlimited
      default:
        return { name: 'Single Site', maxSites: 1, price: 0 };
    }
  };

  const handleSelectPlan = () => {
    setStep(2);
  };

  const handleCreateOrganisation = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('You must be signed in to create an organisation');
      }

      // Generate org ID
      const orgId = `org_${Date.now()}`;

      // Get plan details
      const planDetails = getPlanDetails(selectedPlan);

      // Create organisation document
      await setDoc(doc(db, 'organisations', orgId), {
        id: orgId,
        name: orgName,
        plan: {
          type: selectedPlan,
          name: planDetails.name,
          maxSites: planDetails.maxSites,
          price: planDetails.price,
          startedAt: new Date(),
          status: 'active',
        },
        settings: {
          retentionYears: 6,
          timezone: 'Europe/London',
          features: {
            whiteLabel: false,
            sso: false,
            auditorPortal: false,
            hrbPack: false,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Update user document with orgId
      await updateDoc(doc(db, 'users', user.uid), {
        orgId: orgId,
        updatedAt: new Date(),
      });

      // Refresh user data
      await refreshUserData();

      // Send welcome email (non-blocking - don't fail if email fails)
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.displayName || 'User',
            organisationName: orgName,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't block user flow if email fails
      }

      // Move to next step (add first site)
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to create organisation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user) {
        throw new Error('You must be signed in');
      }

      // Get user data to find orgId
      const userDoc = await import('firebase/firestore').then(mod =>
        mod.getDoc(doc(db, 'users', user.uid))
      );

      const userData = userDoc.data();
      if (!userData?.orgId) {
        throw new Error('Organisation not found. Please refresh and try again.');
      }

      // Generate site ID
      const siteId = `site_${Date.now()}`;

      // Create site document
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

      // Move to success step
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to create site. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-900">Setup Your Organisation</h1>
          <p className="text-sm text-brand-600 mt-2">
            Step {step} of 4: {step === 1 ? 'Choose Plan' : step === 2 ? 'Organisation Details' : step === 3 ? 'First Site' : 'Complete'}
          </p>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step >= 1 ? 'bg-brand-900 text-white' : 'bg-brand-200 text-brand-600'
          }`}>
            {step > 1 ? '✓' : '1'}
          </div>
          <div className={`h-px w-12 ${step >= 2 ? 'bg-brand-900' : 'bg-brand-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step >= 2 ? 'bg-brand-900 text-white' : 'bg-brand-200 text-brand-600'
          }`}>
            {step > 2 ? '✓' : '2'}
          </div>
          <div className={`h-px w-12 ${step >= 3 ? 'bg-brand-900' : 'bg-brand-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step >= 3 ? 'bg-brand-900 text-white' : 'bg-brand-200 text-brand-600'
          }`}>
            {step > 3 ? '✓' : '3'}
          </div>
          <div className={`h-px w-12 ${step >= 4 ? 'bg-brand-900' : 'bg-brand-200'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
            step >= 4 ? 'bg-brand-900 text-white' : 'bg-brand-200 text-brand-600'
          }`}>
            {step > 4 ? '✓' : '4'}
          </div>
        </div>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <Card>
            <Card.Header>Choose Your Plan</Card.Header>
            <Card.Content>
              <div className="space-y-4">
                <div className="bg-brand-50 border border-brand-200 p-4 text-sm text-brand-700">
                  <p className="font-medium mb-2">Select a plan to get started</p>
                  <p>
                    All plans are currently free. Choose the plan that best fits your organisation's needs.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Single Site */}
                  <div
                    onClick={() => setSelectedPlan('single_site')}
                    className={`border-2 p-4 cursor-pointer transition-all ${
                      selectedPlan === 'single_site'
                        ? 'border-brand-900 bg-brand-50'
                        : 'border-brand-200 hover:border-brand-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-brand-900">Single Site</h3>
                          {selectedPlan === 'single_site' && (
                            <div className="w-5 h-5 bg-brand-900 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-brand-600 mb-3">
                          Perfect for managing a single location
                        </p>
                        <ul className="text-sm text-brand-700 space-y-1">
                          <li>• 1 site/location</li>
                          <li>• Unlimited assets</li>
                          <li>• Unlimited users</li>
                          <li>• All features included</li>
                        </ul>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-brand-900">Free</div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Site */}
                  <div
                    onClick={() => setSelectedPlan('multi_site')}
                    className={`border-2 p-4 cursor-pointer transition-all ${
                      selectedPlan === 'multi_site'
                        ? 'border-brand-900 bg-brand-50'
                        : 'border-brand-200 hover:border-brand-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-brand-900">Multi-Site</h3>
                          {selectedPlan === 'multi_site' && (
                            <div className="w-5 h-5 bg-brand-900 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-brand-600 mb-3">
                          Ideal for organisations with multiple locations
                        </p>
                        <ul className="text-sm text-brand-700 space-y-1">
                          <li>• Up to 5 sites/locations</li>
                          <li>• Unlimited assets</li>
                          <li>• Unlimited users</li>
                          <li>• All features included</li>
                        </ul>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-brand-900">Free</div>
                      </div>
                    </div>
                  </div>

                  {/* Enterprise */}
                  <div
                    onClick={() => setSelectedPlan('enterprise')}
                    className={`border-2 p-4 cursor-pointer transition-all ${
                      selectedPlan === 'enterprise'
                        ? 'border-brand-900 bg-brand-50'
                        : 'border-brand-200 hover:border-brand-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-brand-900">Enterprise</h3>
                          {selectedPlan === 'enterprise' && (
                            <div className="w-5 h-5 bg-brand-900 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-brand-600 mb-3">
                          For large portfolios and agencies
                        </p>
                        <ul className="text-sm text-brand-700 space-y-1">
                          <li>• Unlimited sites/locations</li>
                          <li>• Unlimited assets</li>
                          <li>• Unlimited users</li>
                          <li>• All features included</li>
                        </ul>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-brand-900">Free</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={handleSelectPlan}
                >
                  Continue with {getPlanDetails(selectedPlan).name}
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Step 2: Organisation Details */}
        {step === 2 && (
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organisation Details
              </div>
            </Card.Header>
            <Card.Content>
              <form onSubmit={handleCreateOrganisation} className="space-y-4">
                {error && <FormError message={error} />}

                <div className="bg-brand-50 border border-brand-200 p-4 text-sm text-brand-700">
                  <p className="font-medium mb-2">What is an organisation?</p>
                  <p>
                    Your organisation is your company or entity responsible for fire safety compliance.
                    You can manage multiple sites under one organisation.
                  </p>
                </div>

                <Input
                  label="Organisation name"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., ABC Property Management Ltd"
                  required
                  disabled={loading}
                  helperText="This will appear on all your compliance reports"
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    isLoading={loading}
                    disabled={loading}
                  >
                    Create Organisation
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>
        )}

        {/* Step 3: First Site */}
        {step === 3 && (
          <Card>
            <Card.Header>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Add Your First Site
              </div>
            </Card.Header>
            <Card.Content>
              <form onSubmit={handleAddSite} className="space-y-4">
                {error && <FormError message={error} />}

                <div className="bg-green-50 border border-status-pass text-status-pass p-4 text-sm">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  <strong>Organisation created!</strong> Now add your first site.
                </div>

                <Input
                  label="Site name"
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g., Main Office Building"
                  required
                  disabled={loading}
                />

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
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="SW1A 1AA"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => setStep(2)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    isLoading={loading}
                    disabled={loading}
                  >
                    Add Site
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <Card>
            <Card.Content>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-status-pass" />
                </div>

                <h2 className="text-xl font-bold text-brand-900 mb-2">Setup Complete!</h2>
                <p className="text-sm text-brand-600 mb-6">
                  Your organisation and first site have been created successfully.
                </p>

                <div className="bg-brand-50 border border-brand-200 p-4 text-left mb-6">
                  <p className="text-sm font-medium text-brand-900 mb-2">What's next?</p>
                  <ul className="text-sm text-brand-700 space-y-1">
                    <li>• Add assets (fire doors, alarms, extinguishers)</li>
                    <li>• Schedule recurring checks</li>
                    <li>• Invite team members</li>
                    <li>• Complete your first check</li>
                  </ul>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleComplete}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Footer */}
        {step < 4 && (
          <div className="mt-6 text-center text-xs text-brand-500">
            <p>You can add more sites and manage settings from your dashboard later</p>
          </div>
        )}
      </div>
    </div>
  );
}
