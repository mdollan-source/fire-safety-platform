'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';
import { Asset, Site, AssetType } from '@/types';
import { DEFAULT_CHECK_TEMPLATES } from '@/data/check-templates';
import { getAssetTypeDefinition } from '@/data/asset-types';
import { ArrowLeft, Save, Calendar } from 'lucide-react';

// Frequency options with RRULE patterns
const FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly', rrule: 'FREQ=WEEKLY;BYDAY=MO' },
  { value: 'monthly', label: 'Monthly', rrule: 'FREQ=MONTHLY;BYMONTHDAY=1' },
  { value: 'quarterly', label: 'Quarterly', rrule: 'FREQ=MONTHLY;INTERVAL=3' },
  { value: 'annual', label: 'Annual', rrule: 'FREQ=YEARLY' },
  { value: 'daily', label: 'Daily', rrule: 'FREQ=DAILY' },
];

export default function ScheduleCheckPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [startDate, setStartDate] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  useEffect(() => {
    // Set default start date to today
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch sites
      const sitesQuery = query(
        collection(db, 'sites'),
        where('orgId', '==', userData!.orgId)
      );
      const sitesSnapshot = await getDocs(sitesQuery);
      const sitesData = sitesSnapshot.docs.map((doc) => doc.data() as Site);
      setSites(sitesData);

      // Fetch assets
      const assetsQuery = query(
        collection(db, 'assets'),
        where('orgId', '==', userData!.orgId)
      );
      const assetsSnapshot = await getDocs(assetsQuery);
      const assetsData = assetsSnapshot.docs.map((doc) => doc.data() as Asset);
      setAssets(assetsData);

      // Pre-select from URL params if available
      const urlSiteId = searchParams.get('siteId');
      const urlAssetId = searchParams.get('assetId');

      if (urlSiteId && sitesData.find((s) => s.id === urlSiteId)) {
        setSelectedSite(urlSiteId);
      } else if (sitesData.length > 0 && !selectedSite) {
        // Auto-select first site if no URL param
        setSelectedSite(sitesData[0].id);
      }

      if (urlAssetId && assetsData.find((a) => a.id === urlAssetId)) {
        setSelectedAsset(urlAssetId);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

      if (!selectedAsset) {
        throw new Error('Please select an asset');
      }

      if (!selectedTemplate) {
        throw new Error('Please select a check template');
      }

      // Get asset and template details
      const asset = assets.find((a) => a.id === selectedAsset);
      const template = DEFAULT_CHECK_TEMPLATES.find((t) => t.name === selectedTemplate);

      if (!asset || !template) {
        throw new Error('Invalid asset or template');
      }

      // Get RRULE for frequency
      const frequencyOption = FREQUENCY_OPTIONS.find((f) => f.value === frequency);
      const rrule = frequencyOption?.rrule || 'FREQ=WEEKLY;BYDAY=MO';

      // Generate schedule ID
      const scheduleId = `schedule_${Date.now()}`;

      // Create check schedule
      await setDoc(doc(db, 'check_schedules', scheduleId), {
        id: scheduleId,
        orgId: userData.orgId,
        siteId: asset.siteId,
        assetId: selectedAsset,
        templateId: selectedTemplate,
        frequency: frequency,
        rrule: rrule,
        startDate: new Date(startDate),
        active: enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid,
      });

      // Redirect to checks page
      router.push('/dashboard/checks');
    } catch (err: any) {
      setError(err.message || 'Failed to create schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter assets by selected site
  const filteredAssets = selectedSite
    ? assets.filter((a) => a.siteId === selectedSite)
    : assets;

  // Filter templates by selected asset type
  const selectedAssetData = assets.find((a) => a.id === selectedAsset);
  const availableTemplates = selectedAssetData
    ? DEFAULT_CHECK_TEMPLATES.filter(
        (t) => t.assetType === selectedAssetData.type || t.assetType === 'other' || t.assetType === undefined
      )
    : DEFAULT_CHECK_TEMPLATES;

  const selectedTemplateData = DEFAULT_CHECK_TEMPLATES.find(
    (t) => t.name === selectedTemplate
  );

  if (sites.length === 0 || assets.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                {sites.length === 0 ? 'No Sites Available' : 'No Assets Available'}
              </h3>
              <p className="text-sm text-brand-600 mb-4">
                {sites.length === 0
                  ? 'You need to create a site before scheduling checks.'
                  : 'You need to add assets before scheduling checks.'}
              </p>
              <Button
                variant="primary"
                onClick={() =>
                  router.push(sites.length === 0 ? '/dashboard/sites/new' : '/dashboard/assets/new')
                }
              >
                {sites.length === 0 ? 'Create Site' : 'Add Asset'}
              </Button>
            </div>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-brand-900">Schedule Check</h1>
        <p className="text-sm text-brand-600 mt-1">
          Create a recurring check schedule for an asset
        </p>
      </div>

      {/* Form */}
      <Card>
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <FormError message={error} />}

            {/* Site Selection */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Site <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedSite}
                onChange={(e) => {
                  setSelectedSite(e.target.value);
                  setSelectedAsset(''); // Reset asset when site changes
                }}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select a site</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Selection */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Asset <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedAsset}
                onChange={(e) => {
                  setSelectedAsset(e.target.value);
                  setSelectedTemplate(''); // Reset template when asset changes
                }}
                required
                disabled={loading || !selectedSite}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">
                  {selectedSite ? 'Select an asset' : 'Select a site first'}
                </option>
                {filteredAssets.map((asset) => {
                  const typeDefinition = getAssetTypeDefinition(asset.type);
                  return (
                    <option key={asset.id} value={asset.id}>
                      {asset.name || typeDefinition?.name} - {asset.location || 'No location'}
                    </option>
                  );
                })}
              </select>
              <p className="text-xs text-brand-600 mt-1">
                Showing {filteredAssets.length} asset(s) at this site
              </p>
            </div>

            {/* Check Template Selection */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Check Template <span className="text-red-600">*</span>
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                required
                disabled={loading || !selectedAsset}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">
                  {selectedAsset ? 'Select a check template' : 'Select an asset first'}
                </option>
                {availableTemplates.map((template) => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
              {selectedTemplateData && (
                <div className="mt-2 p-3 bg-brand-50 border border-brand-200 text-xs space-y-2">
                  <p className="text-brand-900 font-medium">
                    {selectedTemplateData.description}
                  </p>
                  {selectedTemplateData.complianceNote && (
                    <div className="p-2 bg-blue-50 border border-blue-200">
                      <p className="text-blue-900 font-medium text-xs mb-1">
                        📋 Compliance Guidance:
                      </p>
                      <p className="text-blue-800 text-xs">
                        {selectedTemplateData.complianceNote}
                      </p>
                    </div>
                  )}
                  {selectedTemplateData.strategy && (
                    <p className="text-brand-700">
                      <span className="font-medium">Strategy:</span>{' '}
                      {selectedTemplateData.strategy === 'rotate'
                        ? 'Rotates through assets - checks one asset per period'
                        : 'Checks all assets each period'}
                    </p>
                  )}
                  {selectedTemplateData.references && (
                    <p className="text-brand-600">
                      <span className="font-medium">Standards:</span> {selectedTemplateData.references.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Frequency <span className="text-red-600">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={loading}
              helperText="First check will be due on this date"
            />

            {/* Enabled */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-brand-900 border-brand-300 focus:ring-brand-500"
              />
              <label htmlFor="enabled" className="text-sm text-brand-900">
                Schedule is active (uncheck to create but not activate)
              </label>
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
                <Save className="w-4 h-4 mr-2" />
                Create Schedule
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
