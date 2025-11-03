'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already signed in
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <main className="min-h-screen bg-brand-50">
      {/* Header */}
      <header className="bg-white border-b border-brand-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-brand-900">Fire Safety Log</h1>
            <p className="text-sm text-brand-600">Digital compliance platform</p>
          </div>
          <div className="flex gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button variant="primary" size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <Card.Header>Welcome to Fire Safety Log</Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <p className="text-sm text-brand-700">
                A professional fire safety compliance platform built for UK premises under the Fire Safety Order.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="border border-brand-200 p-4">
                  <h3 className="font-semibold text-brand-900 mb-2">Digital Checks</h3>
                  <p className="text-sm text-brand-600">
                    Complete fire alarm tests, emergency lighting, fire door inspections and more on mobile or desktop.
                  </p>
                </div>

                <div className="border border-brand-200 p-4">
                  <h3 className="font-semibold text-brand-900 mb-2">Compliance Dashboard</h3>
                  <p className="text-sm text-brand-600">
                    Track KPIs, overdue checks, open defects and compliance status across all sites.
                  </p>
                </div>

                <div className="border border-brand-200 p-4">
                  <h3 className="font-semibold text-brand-900 mb-2">Audit-Ready Reports</h3>
                  <p className="text-sm text-brand-600">
                    Generate compliance packs with immutable records, evidence and audit trails.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Link href="/sign-up">
                  <Button variant="primary">Get Started</Button>
                </Link>
                <Link href="/sign-in">
                  <Button variant="secondary">Sign In</Button>
                </Link>
              </div>
            </div>
          </Card.Content>
        </Card>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="kpi-tile">
            <div className="kpi-label">Project Status</div>
            <div className="kpi-value">MVP</div>
            <div className="text-xs text-brand-600 mt-2">Auth system complete</div>
          </div>

          <div className="kpi-tile">
            <div className="kpi-label">Design System</div>
            <div className="kpi-value">Clean</div>
            <div className="text-xs text-brand-600 mt-2">No gradients, professional</div>
          </div>

          <div className="kpi-tile">
            <div className="kpi-label">Offline Support</div>
            <div className="kpi-value">PWA</div>
            <div className="text-xs text-brand-600 mt-2">Service worker ready</div>
          </div>

          <div className="kpi-tile">
            <div className="kpi-label">Compliance</div>
            <div className="kpi-value">UK</div>
            <div className="text-xs text-brand-600 mt-2">Fire Safety Order aligned</div>
          </div>
        </div>
      </div>
    </main>
  );
}
