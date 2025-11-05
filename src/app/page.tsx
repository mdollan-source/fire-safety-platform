'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { InstallButton, InstallBanner } from '@/components/pwa/InstallButton';

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
      {/* Hero Section - Trello-inspired */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
                Fire safety management that works
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Keep your premises compliant with digital fire safety checks, asset tracking, and automated reporting.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sign-up">
                  <Button variant="primary" className="bg-black text-white hover:bg-gray-900 text-base px-6 py-3">
                    Get started — it's free
                  </Button>
                </Link>
                <InstallButton
                  variant="ghost"
                  className="text-base px-6 py-3 border-2 border-gray-300 hover:border-gray-400"
                />
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-12 min-h-[400px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📱</div>
                <p className="text-sm">Product screenshot placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Everything you need to stay compliant
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Designed for UK fire safety professionals following the Regulatory Reform (Fire Safety) Order 2005
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-black text-white rounded flex items-center justify-center text-2xl mb-4">
                ✓
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Digital Checks</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Complete fire alarm tests, emergency lighting inspections, fire door checks, and extinguisher servicing on any device.
              </p>
              <Link href="/features" className="text-black font-medium hover:underline">
                Learn more →
              </Link>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-black text-white rounded flex items-center justify-center text-2xl mb-4">
                📊
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Defect Tracking</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Log and monitor safety defects with severity ratings, target dates, and automatic escalation for critical issues.
              </p>
              <Link href="/features" className="text-black font-medium hover:underline">
                Learn more →
              </Link>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-black text-white rounded flex items-center justify-center text-2xl mb-4">
                📋
              </div>
              <h3 className="text-xl font-bold text-black mb-3">Audit Trail</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Immutable records with photo evidence, GPS location data, and timestamps for complete regulatory compliance.
              </p>
              <Link href="/features" className="text-black font-medium hover:underline">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
            <div className="order-2 md:order-1 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-12 min-h-[350px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-sm">Asset management screenshot placeholder</p>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                Track every asset in one place
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Register your fire doors, alarms, extinguishers, and emergency lighting systems. Attach documents, set inspection schedules, and never miss a compliance deadline.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-black font-bold">✓</span>
                  <span className="text-gray-700">Unlimited sites and assets</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-black font-bold">✓</span>
                  <span className="text-gray-700">Document attachments</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-black font-bold">✓</span>
                  <span className="text-gray-700">QR code labels</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
                Complete checks on any device
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Use mobile or desktop to record inspections. Capture photos, log defects, and generate instant reports. Works offline with automatic sync.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-black font-bold">✓</span>
                  <span className="text-gray-700">Pre-built check templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-black font-bold">✓</span>
                  <span className="text-gray-700">Photo evidence capture</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-black font-bold">✓</span>
                  <span className="text-gray-700">GPS location tracking</span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-12 min-h-[350px] flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-5xl mb-4">📝</div>
                <p className="text-sm">Check completion screenshot placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Compliant</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Access</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">Unlimited</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Sites</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">UK</div>
              <div className="text-sm text-gray-400 uppercase tracking-wider">Based</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Ready to simplify fire safety compliance?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start your free 30-day trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button variant="primary" className="bg-black text-white hover:bg-gray-900 text-lg px-8 py-4">
                Get started free
              </Button>
            </Link>
            <Link href="/features">
              <Button variant="ghost" className="text-lg px-8 py-4 border-2 border-gray-300 hover:border-gray-400">
                View all features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Install Banner */}
      <InstallBanner />
    </MarketingLayout>
  );
}
