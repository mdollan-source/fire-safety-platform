'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { auth } from '@/lib/firebase/config';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function DebugClaimsPage() {
  const { user, userData } = useAuth();
  const [claims, setClaims] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      if (auth.currentUser) {
        const tokenResult = await auth.currentUser.getIdTokenResult();
        setClaims(tokenResult.claims);
      }
      setLoading(false);
    };

    fetchClaims();
  }, [user]);

  const refreshClaims = async () => {
    setLoading(true);
    try {
      // Force token refresh
      await auth.currentUser?.getIdToken(true);

      // Get new claims
      const tokenResult = await auth.currentUser?.getIdTokenResult();
      setClaims(tokenResult?.claims || null);

      alert('Claims refreshed! Check the page.');
    } catch (error) {
      console.error('Error refreshing claims:', error);
      alert('Error refreshing claims. Check console.');
    }
    setLoading(false);
  };

  const setClaimsManually = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();

      const response = await fetch('/api/auth/set-claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Set claims error:', error);
        alert(`Error: ${JSON.stringify(error)}`);
      } else {
        const result = await response.json();
        console.log('Set claims result:', result);
        alert('Claims set successfully! Refreshing...');

        // Refresh token to get new claims
        await auth.currentUser?.getIdToken(true);
        const tokenResult = await auth.currentUser?.getIdTokenResult();
        setClaims(tokenResult?.claims || null);
      }
    } catch (error: any) {
      console.error('Error setting claims:', error);
      alert(`Error: ${error.message}`);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <p className="text-center">You must be signed in to view this page.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug: User Claims</h1>

        <Card>
          <h2 className="text-xl font-semibold mb-4">User Info</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Firestore User Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Firebase Custom Claims</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs mb-4">
            {JSON.stringify(claims, null, 2)}
          </pre>

          <div className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={refreshClaims} disabled={loading}>
                Refresh Claims
              </Button>
              <Button onClick={setClaimsManually} disabled={loading} variant="secondary">
                Set Claims Manually
              </Button>
            </div>

            {claims && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <h3 className="font-semibold mb-2">Claims Status:</h3>
                <ul className="space-y-1 text-sm">
                  <li>✓ orgId: {claims.orgId || '❌ NOT SET'}</li>
                  <li>✓ role: {claims.role || '❌ NOT SET'}</li>
                  <li>✓ siteIds: {claims.siteIds !== undefined ? (claims.siteIds || 'null (all sites)') : '❌ NOT SET'}</li>
                </ul>
              </div>
            )}

            {userData && !claims?.orgId && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold mb-2">⚠️ Issue Detected:</h3>
                <p className="text-sm">Your user data has an orgId ({userData.orgId}) but your custom claims don't. This will cause permission errors.</p>
                <p className="text-sm mt-2"><strong>Solution:</strong> Click "Set Claims Manually" above.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
