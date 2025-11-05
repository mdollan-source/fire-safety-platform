'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Building2, RefreshCw, Users, MapPin, Calendar } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { Organisation } from '@/types';

interface OrgWithStats extends Organisation {
  userCount?: number;
  siteCount?: number;
  assetCount?: number;
}

export default function OrganizationsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrgWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData && userData.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    if (userData) {
      fetchOrganizations();
    }
  }, [userData]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);

      // Fetch all organizations (using British spelling to match existing data)
      const orgsQuery = query(
        collection(db, 'organisations'),
        orderBy('createdAt', 'desc')
      );
      const orgsSnapshot = await getDocs(orgsQuery);
      const orgsData = orgsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Organisation[];

      // Fetch counts for each organization
      const orgsWithStats = await Promise.all(
        orgsData.map(async (org) => {
          try {
            // Count users
            const usersQuery = query(
              collection(db, 'users'),
              where('orgId', '==', org.id)
            );
            const usersSnapshot = await getDocs(usersQuery);
            const userCount = usersSnapshot.size;

            // Count sites
            const sitesQuery = query(
              collection(db, 'sites'),
              where('orgId', '==', org.id)
            );
            const sitesSnapshot = await getDocs(sitesQuery);
            const siteCount = sitesSnapshot.size;

            // Count assets
            const assetsQuery = query(
              collection(db, 'assets'),
              where('orgId', '==', org.id)
            );
            const assetsSnapshot = await getDocs(assetsQuery);
            const assetCount = assetsSnapshot.size;

            return {
              ...org,
              userCount,
              siteCount,
              assetCount,
            };
          } catch (error) {
            console.error(`Error fetching stats for org ${org.id}:`, error);
            return {
              ...org,
              userCount: 0,
              siteCount: 0,
              assetCount: 0,
            };
          }
        })
      );

      setOrganizations(orgsWithStats);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userData || userData.role !== 'super_admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Organizations
            </h1>
            <p className="text-sm text-brand-600 mt-1">
              View and manage all client organizations
            </p>
          </div>
          <Button variant="secondary" onClick={fetchOrganizations}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="text-2xl font-bold text-brand-900">
                {organizations.length}
              </div>
              <div className="text-sm text-brand-600">Total Organizations</div>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="text-2xl font-bold text-brand-900">
                {organizations.reduce((sum, org) => sum + (org.userCount || 0), 0)}
              </div>
              <div className="text-sm text-brand-600">Total Users</div>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="text-2xl font-bold text-brand-900">
                {organizations.reduce((sum, org) => sum + (org.siteCount || 0), 0)}
              </div>
              <div className="text-sm text-brand-600">Total Sites</div>
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="p-4">
              <div className="text-2xl font-bold text-brand-900">
                {organizations.reduce((sum, org) => sum + (org.assetCount || 0), 0)}
              </div>
              <div className="text-sm text-brand-600">Total Assets</div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Organizations List */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-brand-900">All Organizations</h2>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-brand-600">Loading organizations...</div>
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                No Organizations
              </h3>
              <p className="text-sm text-brand-600">
                No organizations have been created yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {organizations.map((org) => {
                const createdDate = org.createdAt instanceof Date
                  ? org.createdAt
                  : (org.createdAt as any)?.toDate();

                return (
                  <div
                    key={org.id}
                    className="p-4 border border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/organizations/${org.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-brand-900">
                            {org.name}
                          </h3>
                          <Badge variant="pending">
                            {org.billing?.plan || 'free'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-brand-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{org.userCount || 0} users</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{org.siteCount || 0} sites</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{org.assetCount || 0} assets</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-sm text-brand-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {createdDate && formatUKDate(createdDate, 'dd/MM/yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
