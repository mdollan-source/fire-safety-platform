'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Asset, Site } from '@/types';
import { ASSET_TYPES, getAssetTypeDefinition } from '@/data/asset-types';
import { Plus, Package, MapPin, Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as LucideIcons from 'lucide-react';

export default function AssetsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.orgId) {
      fetchSites();
      fetchAssets();
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

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const assetsQuery = query(
        collection(db, 'assets'),
        where('orgId', '==', userData!.orgId)
      );
      const snapshot = await getDocs(assetsQuery);
      const assetsData = snapshot.docs.map((doc) => doc.data() as Asset);
      setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (selectedSite !== 'all' && asset.siteId !== selectedSite) {
      return false;
    }
    if (selectedType !== 'all' && asset.type !== selectedType) {
      return false;
    }
    return true;
  });

  const getSiteName = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  const getAssetIcon = (type: string) => {
    const typeDefinition = getAssetTypeDefinition(type as any);
    const iconName = typeDefinition?.icon || 'Package';
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Package className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading assets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Assets</h1>
          <p className="text-sm text-brand-600 mt-1">
            Fire safety equipment and systems across your sites
          </p>
        </div>
        <Button variant="primary" onClick={() => router.push('/dashboard/assets/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-brand-500" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Site Filter */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">
                  Site
                </label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Sites ({sites.length})</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-brand-700 mb-1">
                  Asset Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Types</option>
                  {ASSET_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content>
            <div className="text-2xl font-bold text-brand-900">{filteredAssets.length}</div>
            <div className="text-sm text-brand-600">Total Assets</div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="text-2xl font-bold text-brand-900">
              {filteredAssets.filter((a) => a.status === 'active').length}
            </div>
            <div className="text-sm text-brand-600">Active</div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="text-2xl font-bold text-brand-900">
              {new Set(filteredAssets.map((a) => a.type)).size}
            </div>
            <div className="text-sm text-brand-600">Asset Types</div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="text-2xl font-bold text-brand-900">
              {new Set(filteredAssets.map((a) => a.siteId)).size}
            </div>
            <div className="text-sm text-brand-600">Sites</div>
          </Card.Content>
        </Card>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card>
          <Card.Content>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                No Assets Found
              </h3>
              <p className="text-sm text-brand-600 mb-4">
                {selectedSite === 'all' && selectedType === 'all'
                  ? 'Start by adding your first fire safety asset.'
                  : 'Try adjusting your filters.'}
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard/assets/new')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Asset
              </Button>
            </div>
          </Card.Content>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const typeDefinition = getAssetTypeDefinition(asset.type);
            return (
              <Card key={asset.id}>
                <Card.Content>
                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/assets/${asset.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-brand-100 text-brand-700">
                        {getAssetIcon(asset.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-brand-900 mb-1 truncate">
                          {asset.name || typeDefinition?.name}
                        </h3>
                        <p className="text-xs text-brand-600 mb-2">
                          {typeDefinition?.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-brand-600 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{getSiteName(asset.siteId)}</span>
                        </div>
                        {asset.location && (
                          <p className="text-xs text-brand-600 mb-2 truncate">
                            {asset.location}
                          </p>
                        )}
                        <Badge
                          variant={
                            asset.status === 'active'
                              ? 'pass'
                              : asset.status === 'inactive'
                              ? 'pending'
                              : 'fail'
                          }
                        >
                          {asset.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
