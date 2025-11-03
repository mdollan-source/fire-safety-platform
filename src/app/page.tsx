'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import MarketingLayout from '@/components/marketing/MarketingLayout';

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold text-black mb-6 leading-tight">
              Fire safety compliance made simple
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Digital platform for managing fire safety checks, defects, and compliance records across all your UK premises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up">
                <Button variant="primary" className="bg-black text-white hover:bg-gray-900 text-lg px-8 py-6">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/features">
                <Button variant="ghost" className="text-lg px-8 py-6 border border-black hover:bg-gray-50">
                  View Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="border-r border-black last:border-r-0">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">100%</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">Compliant</div>
            </div>
            <div className="border-r border-black last:border-r-0">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">24/7</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">Access</div>
            </div>
            <div className="border-r border-black last:border-r-0">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">Unlimited</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">Sites</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">UK</div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">Based</div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Built for UK fire safety professionals
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Comprehensive compliance management aligned with the Regulatory Reform (Fire Safety) Order 2005.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black">
            <div className="bg-white p-8">
              <h3 className="text-2xl font-bold text-black mb-4">Digital Checks</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete fire alarm tests, emergency lighting inspections, fire door checks, and extinguisher servicing on any device.
              </p>
            </div>
            <div className="bg-white p-8">
              <h3 className="text-2xl font-bold text-black mb-4">Defect Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Log and monitor safety defects with severity ratings, target dates, and automatic escalation for critical issues.
              </p>
            </div>
            <div className="bg-white p-8">
              <h3 className="text-2xl font-bold text-black mb-4">Audit Trail</h3>
              <p className="text-gray-600 leading-relaxed">
                Immutable records with photo evidence, GPS location data, and timestamps for complete regulatory compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Three steps to compliance
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="text-6xl font-bold text-black mb-4">01</div>
              <h3 className="text-2xl font-bold text-black mb-4">Register Assets</h3>
              <p className="text-gray-600 leading-relaxed">
                Add your fire doors, alarms, extinguishers, and emergency lighting systems. Attach documents and set inspection schedules.
              </p>
            </div>
            <div>
              <div className="text-6xl font-bold text-black mb-4">02</div>
              <h3 className="text-2xl font-bold text-black mb-4">Complete Checks</h3>
              <p className="text-gray-600 leading-relaxed">
                Use mobile or desktop to record inspections. Capture photos, log defects, and generate instant reports.
              </p>
            </div>
            <div>
              <div className="text-6xl font-bold text-black mb-4">03</div>
              <h3 className="text-2xl font-bold text-black mb-4">Stay Compliant</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor overdue checks, track open defects, and export compliance packs for audits and inspections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Start your free trial today
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              No credit card required. Full access to all features for 30 days.
            </p>
            <Link href="/sign-up">
              <Button variant="primary" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
