'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CheckCircle2, FileText, Filter, Calendar, User, MapPin, Camera } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { startOfMonth, endOfMonth } from 'date-fns';

interface Entry {
  id: string;
  orgId: string;
  siteId: string;
  assetId: string;
  taskId: string;
  templateId: string;
  completedAt: Date;
  completedBy: string;
  completedByName: string;
  fieldValues: Record<string, any>;
  evidenceUrls: string[];
  gpsLocation?: { lat: number; lng: number };
  signatureUrl?: string;
  hash: string;
  version: number;
  createdAt: Date;
}

interface Asset {
  id: string;
  name: string;
  siteId: string;
}

interface Site {
  id: string;
  name: string;
}

export default function EntriesPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch entries, assets, and sites in parallel
      const [entriesSnapshot, assetsSnapshot, sitesSnapshot] = await Promise.all([
        getDocs(query(
          collection(db, 'entries'),
          where('orgId', '==', userData!.orgId)
        )),
        getDocs(query(
          collection(db, 'assets'),
          where('orgId', '==', userData!.orgId)
        )),
        getDocs(query(
          collection(db, 'sites'),
          where('orgId', '==', userData!.orgId)
        )),
      ]);

      const entriesData = entriesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        } as Entry;
      });
      setEntries(entriesData.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime()));

      setAssets(assetsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        siteId: doc.data().siteId,
      })));

      setSites(sitesSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      })));
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssetName = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  const getFilteredEntries = () => {
    return entries.filter((entry) => {
      // Site filter
      if (siteFilter !== 'all' && entry.siteId !== siteFilter) return false;

      // Asset filter
      if (assetFilter !== 'all' && entry.assetId !== assetFilter) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const entryDate = entry.completedAt;

        switch (dateFilter) {
          case 'today':
            if (entryDate.toDateString() !== now.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (entryDate < weekAgo) return false;
            break;
          case 'month':
            const monthStart = startOfMonth(now);
            const monthEnd = endOfMonth(now);
            if (entryDate < monthStart || entryDate > monthEnd) return false;
            break;
        }
      }

      return true;
    });
  };

  const filteredEntries = getFilteredEntries();

  // Get unique sites that have entries
  const sitesWithEntries = sites.filter((site) =>
    entries.some((entry) => entry.siteId === site.id)
  );

  // Get unique assets that have entries (filtered by selected site if applicable)
  const assetsWithEntries = assets.filter((asset) => {
    const hasEntries = entries.some((entry) => entry.assetId === asset.id);
    if (!hasEntries) return false;
    if (siteFilter !== 'all' && asset.siteId !== siteFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading check history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Check History</h1>
          <p className="text-sm text-brand-600 mt-1">
            View completed checks with full audit trail
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{entries.length}</div>
                <div className="text-sm text-brand-600">Total Entries</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">
                  {entries.reduce((sum, e) => sum + (e.evidenceUrls?.length || 0), 0)}
                </div>
                <div className="text-sm text-brand-600">Evidence Photos</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">
                  {entries.filter((e) => e.gpsLocation).length}
                </div>
                <div className="text-sm text-brand-600">GPS Verified</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">
                  {entries.filter((e) => e.signatureUrl).length}
                </div>
                <div className="text-sm text-brand-600">Signed Entries</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-medium text-brand-900">Filters</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Site
              </label>
              <select
                value={siteFilter}
                onChange={(e) => {
                  setSiteFilter(e.target.value);
                  setAssetFilter('all'); // Reset asset filter
                }}
                className="px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Sites</option>
                {sitesWithEntries.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Asset
              </label>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Assets</option>
                {assetsWithEntries.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {(siteFilter !== 'all' || assetFilter !== 'all' || dateFilter !== 'all') && (
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSiteFilter('all');
                    setAssetFilter('all');
                    setDateFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Entries List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Check Entries
            </div>
            {filteredEntries.length > 0 && (
              <span className="text-sm text-brand-600">
                {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'}
              </span>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                {entries.length === 0 ? 'No Check Entries Yet' : 'No Matching Entries'}
              </h3>
              <p className="text-sm text-brand-600 mb-4">
                {entries.length === 0
                  ? 'Completed checks will appear here with full audit trail.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/entries/${entry.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-brand-900">
                        {getAssetName(entry.assetId)}
                      </h4>
                      <Badge variant="pass">Completed</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-brand-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatUKDate(entry.completedAt, 'dd/MM/yyyy HH:mm')}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {entry.completedByName}
                      </span>
                      <span>{getSiteName(entry.siteId)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      {entry.evidenceUrls && entry.evidenceUrls.length > 0 && (
                        <span className="text-xs text-brand-600 flex items-center gap-1">
                          <Camera className="w-3 h-3" />
                          {entry.evidenceUrls.length} photo{entry.evidenceUrls.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {entry.gpsLocation && (
                        <span className="text-xs text-brand-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          GPS verified
                        </span>
                      )}
                      {entry.signatureUrl && (
                        <span className="text-xs text-brand-600 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Signed
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
