'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import MarketingLayout from '@/components/marketing/MarketingLayout';

export default function SolutionsPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Solutions for every organisation
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Whether you manage a single building or a national portfolio, Fire Safety Log scales to meet your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="space-y-32">
            {/* Single Site */}
            <div>
              <h2 className="text-5xl font-bold text-black mb-12">Single Site</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">
                    Perfect for individual buildings
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Manage fire safety compliance for schools, offices, retail units, care homes, and other single premises.
                  </p>
                  <div className="space-y-4">
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Centralized Records</h4>
                      <p className="text-gray-600">Replace paper logbooks with digital records accessible from any device.</p>
                    </div>
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Automated Scheduling</h4>
                      <p className="text-gray-600">Never miss a check with automatic task generation and email reminders.</p>
                    </div>
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Instant Reports</h4>
                      <p className="text-gray-600">Generate audit-ready compliance packs in seconds, not hours.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black h-96"></div>
              </div>
            </div>

            {/* Multi-Site */}
            <div>
              <h2 className="text-5xl font-bold text-black mb-12">Multi-Site</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div className="order-2 md:order-1 bg-black h-96"></div>
                <div className="order-1 md:order-2">
                  <h3 className="text-2xl font-bold text-black mb-6">
                    Built for portfolios
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Oversee compliance across multiple locations from a unified dashboard. Ideal for property managers and regional operations.
                  </p>
                  <div className="space-y-4">
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Portfolio Overview</h4>
                      <p className="text-gray-600">Monitor compliance status across all sites from a single dashboard.</p>
                    </div>
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Site-Specific Access</h4>
                      <p className="text-gray-600">Grant permissions per location to site managers and local teams.</p>
                    </div>
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Consolidated Reporting</h4>
                      <p className="text-gray-600">Generate reports for individual sites or across your entire estate.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agency/Consultant */}
            <div>
              <h2 className="text-5xl font-bold text-black mb-12">Agency & Consultants</h2>
              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-2xl font-bold text-black mb-6">
                    Manage client compliance
                  </h3>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Fire safety consultants and property management agencies can manage multiple client organisations from one account.
                  </p>
                  <div className="space-y-4">
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Client Organizations</h4>
                      <p className="text-gray-600">Separate compliance records and reporting for each client.</p>
                    </div>
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Professional Reports</h4>
                      <p className="text-gray-600">Branded compliance packs for client delivery and regulatory submission.</p>
                    </div>
                    <div className="border-l-4 border-black pl-4">
                      <h4 className="font-bold text-black mb-2">Scalable Licensing</h4>
                      <p className="text-gray-600">Add clients as your business grows with flexible pricing.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black h-96"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-black mb-12">Industries We Serve</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-black">
            <div className="bg-white p-8">
              <h3 className="text-xl font-bold text-black mb-4">Property Management</h3>
              <p className="text-gray-600">Residential and commercial property portfolios</p>
            </div>
            <div className="bg-white p-8">
              <h3 className="text-xl font-bold text-black mb-4">Healthcare</h3>
              <p className="text-gray-600">Hospitals, care homes, and medical facilities</p>
            </div>
            <div className="bg-white p-8">
              <h3 className="text-xl font-bold text-black mb-4">Education</h3>
              <p className="text-gray-600">Schools, colleges, and universities</p>
            </div>
            <div className="bg-white p-8">
              <h3 className="text-xl font-bold text-black mb-4">Hospitality</h3>
              <p className="text-gray-600">Hotels, restaurants, and leisure facilities</p>
            </div>
            <div className="bg-white p-8">
              <h3 className="text-xl font-bold text-black mb-4">Retail</h3>
              <p className="text-gray-600">Shops, shopping centres, and warehouses</p>
            </div>
            <div className="bg-white p-8">
              <h3 className="text-xl font-bold text-black mb-4">Industrial</h3>
              <p className="text-gray-600">Manufacturing and distribution facilities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Find the right solution for your organisation
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start with a free trial or speak to our team about your requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button variant="primary" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" className="text-lg px-8 py-6 border border-white text-white hover:bg-white hover:text-black">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
