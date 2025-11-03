'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Defect, Asset, DefectSeverity, DefectStatus } from '@/types';
import { AlertTriangle, Plus, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { formatUKDate } from '@/lib/utils/date';
import { isPast } from 'date-fns';

export default function DefectsPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DefectStatus | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<DefectSeverity | 'all'>('all');

  useEffect(() => {
    if (userData?.orgId) {
      fetchData();
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch defects
      const defectsQuery = query(
        collection(db, 'defects'),
        where('orgId', '==', userData!.orgId)
      );
      const defectsSnapshot = await getDocs(defectsQuery);
      const defectsData = defectsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          targetDate: data.targetDate?.toDate(),
          resolvedAt: data.resolvedAt?.toDate(),
        } as Defect;
      });
      setDefects(defectsData);

      // Fetch assets for names
      const assetsQuery = query(
        collection(db, 'assets'),
        where('orgId', '==', userData!.orgId)
      );
      const assetsSnapshot = await getDocs(assetsQuery);
      const assetsData = assetsSnapshot.docs.map((doc) => doc.data() as Asset);
      setAssets(assetsData);
    } catch (error) {
      console.error('Error fetching defects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssetName = (assetId?: string) => {
    if (!assetId) return 'General Site';
    const asset = assets.find((a) => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const getSeverityBadgeVariant = (severity: DefectSeverity): 'fail' | 'warning' | 'pending' => {
    switch (severity) {
      case 'critical':
        return 'fail';
      case 'high':
        return 'fail';
      case 'medium':
        return 'warning';
      case 'low':
        return 'pending';
    }
  };

  const getStatusBadgeVariant = (status: DefectStatus): 'fail' | 'warning' | 'pass' | 'pending' => {
    switch (status) {
      case 'open':
        return 'fail';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'pass';
      case 'verified':
        return 'pass';
      case 'closed':
        return 'pending';
    }
  };

  const getStatusIcon = (status: DefectStatus) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5" />;
      case 'in_progress':
        return <Clock className="w-5 h-5" />;
      case 'resolved':
      case 'verified':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'closed':
        return <XCircle className="w-5 h-5" />;
    }
  };

  const filteredDefects = defects.filter((defect) => {
    if (statusFilter !== 'all' && defect.status !== statusFilter) return false;
    if (severityFilter !== 'all' && defect.severity !== severityFilter) return false;
    return true;
  });

  const getDefectsByStatus = (status: DefectStatus) => {
    return defects.filter((d) => d.status === status);
  };

  const getDefectsBySeverity = (severity: DefectSeverity) => {
    return defects.filter((d) => d.severity === severity);
  };

  const getOverdueDefects = () => {
    return defects.filter((d) => {
      if (d.status === 'resolved' || d.status === 'verified' || d.status === 'closed') return false;
      if (!d.targetDate) return false;
      return isPast(d.targetDate);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-brand-600">Loading defects...</div>
      </div>
    );
  }

  const openDefects = getDefectsByStatus('open');
  const inProgressDefects = getDefectsByStatus('in_progress');
  const resolvedDefects = getDefectsByStatus('resolved');
  const criticalDefects = getDefectsBySeverity('critical');
  const overdueDefects = getOverdueDefects();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Defects</h1>
          <p className="text-sm text-brand-600 mt-1">
            Track and resolve fire safety defects
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push('/dashboard/defects/new')}
        >
          <Plus className="w-4 h-4 mr-2" />
          Raise Defect
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-700">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{openDefects.length}</div>
                <div className="text-sm text-brand-600">Open</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 text-orange-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{inProgressDefects.length}</div>
                <div className="text-sm text-brand-600">In Progress</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{resolvedDefects.length}</div>
                <div className="text-sm text-brand-600">Resolved</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{criticalDefects.length}</div>
                <div className="text-sm text-brand-600">Critical</div>
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 text-purple-700">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{overdueDefects.length}</div>
                <div className="text-sm text-brand-600">Overdue</div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <Card.Content>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DefectStatus | 'all')}
                className="px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="verified">Verified</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-900 mb-2">
                Severity
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as DefectSeverity | 'all')}
                className="px-3 py-2 border border-brand-300 text-sm text-brand-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {(statusFilter !== 'all' || severityFilter !== 'all') && (
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setSeverityFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Defects List */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Defects
            </div>
            {filteredDefects.length > 0 && (
              <span className="text-sm text-brand-600">{filteredDefects.length} defect(s)</span>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {filteredDefects.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-brand-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brand-900 mb-2">
                {defects.length === 0 ? 'No Defects Recorded' : 'No Matching Defects'}
              </h3>
              <p className="text-sm text-brand-600 mb-4">
                {defects.length === 0
                  ? 'Great! No defects have been raised yet.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
              {defects.length === 0 && (
                <Button
                  variant="primary"
                  onClick={() => router.push('/dashboard/defects/new')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Raise First Defect
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDefects.map((defect) => {
                const isOverdue = defect.targetDate &&
                  defect.status !== 'resolved' &&
                  defect.status !== 'verified' &&
                  defect.status !== 'closed' &&
                  isPast(defect.targetDate);

                return (
                  <div
                    key={defect.id}
                    className="flex items-center justify-between p-4 border border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/defects/${defect.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-brand-900">{defect.title}</h4>
                        {isOverdue && (
                          <Badge variant="fail">Overdue</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-brand-600">
                        <span>{getAssetName(defect.assetId)}</span>
                        {defect.targetDate && (
                          <>
                            <span>•</span>
                            <span>Due: {formatUKDate(defect.targetDate, 'dd/MM/yyyy')}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Raised: {formatUKDate(defect.createdAt, 'dd/MM/yyyy')}</span>
                        {defect.createdBy && (
                          <>
                            <span>•</span>
                            <span>By: {defect.createdBy}</span>
                          </>
                        )}
                      </div>
                      {defect.description && (
                        <p className="text-sm text-brand-600 mt-1 line-clamp-2">
                          {defect.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Badge variant={getSeverityBadgeVariant(defect.severity)}>
                        {defect.severity.toUpperCase()}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(defect.status)}>
                        {defect.status.replace('_', ' ').toUpperCase()}
                      </Badge>
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
