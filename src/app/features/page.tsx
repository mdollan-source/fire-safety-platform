'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import MarketingLayout from '@/components/marketing/MarketingLayout';

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6 leading-tight">
              Everything you need for fire safety compliance
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Comprehensive tools for managing inspections, tracking defects, and maintaining regulatory compliance across all your premises.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="border-b border-black">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-bold text-black mb-16">Core Features</h2>

          <div className="space-y-24">
            {/* Asset Management */}
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <h3 className="text-4xl font-bold text-black mb-6">Asset Management</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Register and track all fire safety equipment across your organisation.
                </p>
                <ul className="space-y-3">
                  <li className="text-gray-600">— Fire extinguishers, alarms, and emergency lighting</li>
                  <li className="text-gray-600">— Fire doors and escape routes</li>
                  <li className="text-gray-600">— Sprinkler systems and suppression equipment</li>
                  <li className="text-gray-600">— Document storage with expiry tracking</li>
                  <li className="text-gray-600">— QR code labels for quick access</li>
                </ul>
              </div>
              <div className="bg-black h-96"></div>
            </div>

            {/* Inspection Schedules */}
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="order-2 md:order-1 bg-black h-96"></div>
              <div className="order-1 md:order-2">
                <h3 className="text-4xl font-bold text-black mb-6">Inspection Schedules</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Automated scheduling aligned with legal requirements.
                </p>
                <ul className="space-y-3">
                  <li className="text-gray-600">— Weekly fire alarm testing</li>
                  <li className="text-gray-600">— Monthly emergency lighting checks</li>
                  <li className="text-gray-600">— Annual servicing reminders</li>
                  <li className="text-gray-600">— Custom inspection frequencies</li>
                  <li className="text-gray-600">— Automatic task generation</li>
                </ul>
              </div>
            </div>

            {/* Defect Management */}
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <h3 className="text-4xl font-bold text-black mb-6">Defect Management</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Track and resolve safety issues with full audit trail.
                </p>
                <ul className="space-y-3">
                  <li className="text-gray-600">— Severity ratings (Critical, High, Medium, Low)</li>
                  <li className="text-gray-600">— Photo evidence and descriptions</li>
                  <li className="text-gray-600">— Automatic escalation for critical defects</li>
                  <li className="text-gray-600">— Target dates and resolution tracking</li>
                  <li className="text-gray-600">— Email notifications</li>
                </ul>
              </div>
              <div className="bg-black h-96"></div>
            </div>

            {/* Compliance Dashboard */}
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="order-2 md:order-1 bg-black h-96"></div>
              <div className="order-1 md:order-2">
                <h3 className="text-4xl font-bold text-black mb-6">Compliance Dashboard</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Real-time overview of your compliance status.
                </p>
                <ul className="space-y-3">
                  <li className="text-gray-600">— Overdue checks and upcoming tasks</li>
                  <li className="text-gray-600">— Open defects by severity</li>
                  <li className="text-gray-600">— Completion rates and trends</li>
                  <li className="text-gray-600">— Multi-site overview</li>
                  <li className="text-gray-600">— Export to Excel for reporting</li>
                </ul>
              </div>
            </div>

            {/* Reporting */}
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div>
                <h3 className="text-4xl font-bold text-black mb-6">Audit-Ready Reports</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Generate comprehensive compliance documentation.
                </p>
                <ul className="space-y-3">
                  <li className="text-gray-600">— PDF compliance packs</li>
                  <li className="text-gray-600">— Photo evidence included</li>
                  <li className="text-gray-600">— Immutable audit trails</li>
                  <li className="text-gray-600">— GPS and timestamp verification</li>
                  <li className="text-gray-600">— Custom date ranges</li>
                </ul>
              </div>
              <div className="bg-black h-96"></div>
            </div>

            {/* Team Management */}
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="order-2 md:order-1 bg-black h-96"></div>
              <div className="order-1 md:order-2">
                <h3 className="text-4xl font-bold text-black mb-6">Team Management</h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Control access and assign responsibilities.
                </p>
                <ul className="space-y-3">
                  <li className="text-gray-600">— Role-based permissions</li>
                  <li className="text-gray-600">— Site-specific access control</li>
                  <li className="text-gray-600">— Responsible Person designation</li>
                  <li className="text-gray-600">— Inspector and Site Manager roles</li>
                  <li className="text-gray-600">— Email invitations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to streamline your compliance?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start your free 30-day trial. No credit card required.
            </p>
            <Link href="/sign-up">
              <Button variant="primary" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
