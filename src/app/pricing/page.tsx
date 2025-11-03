'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import MarketingLayout from '@/components/marketing/MarketingLayout';

export default function PricingPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Choose the plan that fits your organisation. All plans are currently free.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black">
            {/* Single Site */}
            <div className="bg-white p-12">
              <h3 className="text-2xl font-bold text-black mb-4">Single Site</h3>
              <p className="text-gray-600 mb-8">For single sites and small organisations</p>
              <div className="mb-8">
                <div className="text-5xl font-bold text-black mb-2">Free</div>
                <div className="text-sm text-gray-600">for now</div>
              </div>
              <Link href="/sign-up">
                <Button variant="primary" className="w-full mb-8 bg-black text-white hover:bg-gray-900">
                  Get Started
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="text-gray-600">— 1 site/location</li>
                <li className="text-gray-600">— Unlimited assets</li>
                <li className="text-gray-600">— Unlimited users</li>
                <li className="text-gray-600">— Digital checks & inspections</li>
                <li className="text-gray-600">— Defect tracking</li>
                <li className="text-gray-600">— Compliance dashboard</li>
                <li className="text-gray-600">— PDF reports</li>
                <li className="text-gray-600">— Email support</li>
              </ul>
            </div>

            {/* Multi-Site */}
            <div className="bg-black text-white p-12 relative">
              <div className="absolute top-0 right-0 bg-white text-black px-4 py-1 text-xs font-bold">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-4">Multi-Site</h3>
              <p className="text-gray-300 mb-8">For multi-site organisations</p>
              <div className="mb-8">
                <div className="text-5xl font-bold mb-2">Free</div>
                <div className="text-sm text-gray-300">for now</div>
              </div>
              <Link href="/sign-up">
                <Button variant="primary" className="w-full mb-8 bg-white text-black hover:bg-gray-100">
                  Get Started
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="text-gray-300">— Up to 5 sites/locations</li>
                <li className="text-gray-300">— Unlimited assets</li>
                <li className="text-gray-300">— Unlimited users</li>
                <li className="text-gray-300">— Everything in Single Site, plus:</li>
                <li className="text-white font-medium">— Multi-site dashboard</li>
                <li className="text-white font-medium">— Site-specific permissions</li>
                <li className="text-white font-medium">— Advanced analytics</li>
                <li className="text-white font-medium">— Priority email support</li>
              </ul>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-12">
              <h3 className="text-2xl font-bold text-black mb-4">Enterprise</h3>
              <p className="text-gray-600 mb-8">For agencies and large portfolios</p>
              <div className="mb-8">
                <div className="text-5xl font-bold text-black mb-2">Free</div>
                <div className="text-sm text-gray-600">for now</div>
              </div>
              <Link href="/sign-up">
                <Button variant="primary" className="w-full mb-8 border border-black bg-white text-black hover:bg-black hover:text-white">
                  Get Started
                </Button>
              </Link>
              <ul className="space-y-4">
                <li className="text-gray-600">— Unlimited sites/locations</li>
                <li className="text-gray-600">— Unlimited assets</li>
                <li className="text-gray-600">— Unlimited users</li>
                <li className="text-gray-600">— Everything in Multi-Site, plus:</li>
                <li className="text-black font-medium">— Custom integrations</li>
                <li className="text-black font-medium">— Dedicated account manager</li>
                <li className="text-black font-medium">— Custom SLA</li>
                <li className="text-black font-medium">— Phone & priority support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-black mb-12 text-center">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-black mb-3">What's included in the free trial?</h3>
              <p className="text-gray-600 leading-relaxed">
                Full access to all features for 30 days. No credit card required. You can cancel anytime during the trial.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-black mb-3">Can I change plans later?</h3>
              <p className="text-gray-600 leading-relaxed">
                Yes. You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at the start of your next billing period.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-black mb-3">What happens to my data if I cancel?</h3>
              <p className="text-gray-600 leading-relaxed">
                Before cancelling, use the "Export All Data" feature in your Profile settings to download a complete copy of your data (Excel file, all documents, and photos in a ZIP file). Your data is retained for 90 days after cancellation, allowing you to reactivate if needed. After 90 days, all data is permanently deleted.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-black mb-3">Is there a setup fee?</h3>
              <p className="text-gray-600 leading-relaxed">
                No setup fees for any plan. You only pay the monthly subscription cost.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-bold text-black mb-3">Do you offer annual billing?</h3>
              <p className="text-gray-600 leading-relaxed">
                Yes. Annual subscriptions receive a 20% discount. Contact us for annual billing options.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-black mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-600 leading-relaxed">
                We accept all major credit and debit cards. Enterprise customers can request invoice billing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
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
