'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { auth } from '@/lib/firebase/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function TestClaimsPage() {
  const { user, userData, refreshUserData } = useAuth();
  const [claims, setClaims] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError('');

      if (!auth.currentUser) {
        setError('No user signed in');
        return;
      }

      // Get the ID token result which includes custom claims
      const idTokenResult = await auth.currentUser.getIdTokenResult(true);
      setClaims(idTokenResult.claims);

      console.log('Full token claims:', idTokenResult.claims);
    } catch (err: any) {
      console.error('Error fetching claims:', err);
      setError(err.message || 'Failed to fetch claims');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshClaims = async () => {
    try {
      setLoading(true);
      setError('');

      await refreshUserData();
      await fetchClaims();

      console.log('Claims refreshed successfully');
    } catch (err: any) {
      console.error('Error refreshing claims:', err);
      setError(err.message || 'Failed to refresh claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchClaims();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p>Please sign in to test custom claims</p>
      </div>
    );
  }

  const hasOrgId = claims && 'orgId' in claims;
  const hasRole = claims && 'role' in claims;
  const hasSiteIds = claims && 'siteIds' in claims;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-900">Custom Claims Test</h1>
        <Button
          variant="secondary"
          onClick={handleRefreshClaims}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Claims
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-900 text-sm">
          {error}
        </div>
      )}

      <Card>
        <Card.Header>User Data (Firestore)</Card.Header>
        <Card.Content>
          <div className="space-y-2 font-mono text-sm">
            <div><strong>UID:</strong> {user.uid}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Name:</strong> {userData?.name || 'N/A'}</div>
            <div><strong>Org ID:</strong> {userData?.orgId || 'Not set'}</div>
            <div><strong>Role:</strong> {userData?.role || 'Not set'}</div>
            <div><strong>Site IDs:</strong> {userData?.siteIds ? JSON.stringify(userData.siteIds) : 'null (all sites)'}</div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>Custom Claims (Token)</Card.Header>
        <Card.Content>
          {loading ? (
            <p className="text-sm text-brand-600">Loading claims...</p>
          ) : claims ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {hasOrgId ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">orgId:</span>
                  <span className="font-mono text-sm">{claims.orgId || 'Not set'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {hasRole ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">role:</span>
                  <span className="font-mono text-sm">{claims.role || 'Not set'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {hasSiteIds ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium">siteIds:</span>
                  <span className="font-mono text-sm">
                    {claims.siteIds ? JSON.stringify(claims.siteIds) : 'null'}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-brand-50 rounded border border-brand-200">
                <p className="text-xs font-medium text-brand-900 mb-2">Full Claims Object:</p>
                <pre className="text-xs bg-white p-3 rounded border border-brand-200 overflow-auto">
                  {JSON.stringify(claims, null, 2)}
                </pre>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Status:</strong>{' '}
                  {hasOrgId && hasRole && hasSiteIds ? (
                    <span className="text-green-600">✓ All custom claims are set correctly!</span>
                  ) : (
                    <span className="text-orange-600">⚠ Some custom claims are missing. Click "Refresh Claims" to update.</span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand-600">No claims loaded yet</p>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
