'use client';

import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, BookOpen, AlertCircle, CheckCircle2, Clock, Calendar, User } from 'lucide-react';

export default function ChecksHelpPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Fire Safety Checks Guide
        </h1>
        <p className="text-sm text-brand-600 mt-1">
          Understanding check frequencies, rotation strategies, and legal requirements
        </p>
      </div>

      {/* Check Rotation Strategy */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-brand-900">Check Rotation vs. All Assets</h2>
        </Card.Header>
        <Card.Content className="space-y-4">
          <div>
            <h3 className="font-semibold text-brand-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Rotation Strategy
            </h3>
            <p className="text-sm text-brand-700 mb-2">
              Some checks don't require ALL assets to be tested every period. Instead, you check ONE asset per period in rotation, ensuring all assets are tested over a complete cycle.
            </p>
            <p className="text-sm text-brand-700 font-medium">Example:</p>
            <ul className="text-sm text-brand-700 list-disc list-inside space-y-1 ml-4">
              <li>If you have 10 call points and test weekly in rotation, each call point is tested once every 10 weeks</li>
              <li>Week 1: Test Call Point #1, Week 2: Test Call Point #2, etc.</li>
              <li>This maintains compliance while reducing unnecessary work</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-brand-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              All Assets Strategy
            </h3>
            <p className="text-sm text-brand-700 mb-2">
              Other checks require ALL assets to be checked every period without exception.
            </p>
            <p className="text-sm text-brand-700 font-medium">Example:</p>
            <ul className="text-sm text-brand-700 list-disc list-inside space-y-1 ml-4">
              <li>All fire extinguishers must be visually checked monthly</li>
              <li>All final exit doors must be checked weekly</li>
              <li>These checks ensure critical safety equipment is always ready</li>
            </ul>
          </div>
        </Card.Content>
      </Card>

      {/* Weekly Checks */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-brand-900">Weekly Checks</h2>
          </div>
        </Card.Header>
        <Card.Content className="space-y-3">
          <div className="p-3 bg-orange-50 border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-1">Fire Alarm System Test (Call Points)</h3>
            <p className="text-sm text-orange-800 mb-2">
              <strong>Strategy:</strong> Rotation - Test ONE call point per week
            </p>
            <p className="text-sm text-orange-800 mb-1">
              <strong>Requirement:</strong> BS 5839-1:2017 requires weekly testing by operating a different call point each week. All call points must be tested over a cycle, not all every week.
            </p>
            <p className="text-sm text-orange-800">
              <strong>Who can do it:</strong> Any trained staff member (fire warden, site manager, technician)
            </p>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-1">Standalone Detector Push Button Test</h3>
            <p className="text-sm text-orange-800 mb-2">
              <strong>Strategy:</strong> Rotation - Test ONE detector per week
            </p>
            <p className="text-sm text-orange-800 mb-1">
              <strong>Requirement:</strong> BS 5839-6:2019 requires weekly push button test of detectors in rotation to ensure operational functionality.
            </p>
            <p className="text-sm text-orange-800">
              <strong>Who can do it:</strong> Any trained staff member
            </p>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-1">Final Exit Doors</h3>
            <p className="text-sm text-orange-800 mb-2">
              <strong>Strategy:</strong> All Assets - Check ALL final exit doors weekly
            </p>
            <p className="text-sm text-orange-800 mb-1">
              <strong>Requirement:</strong> Fire Safety Order Article 14 requires means of escape to be maintained and free from obstruction. All exits must be checked weekly during occupied hours.
            </p>
            <p className="text-sm text-orange-800">
              <strong>Who can do it:</strong> Any responsible staff member
            </p>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-1">Sprinkler System</h3>
            <p className="text-sm text-orange-800 mb-2">
              <strong>Strategy:</strong> All Assets - System-wide weekly check
            </p>
            <p className="text-sm text-orange-800 mb-1">
              <strong>Requirement:</strong> BS EN 12845:2015 requires weekly inspection of pressure, water levels, and control panel.
            </p>
            <p className="text-sm text-orange-800">
              <strong>Who can do it:</strong> Trained technician or site manager
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* Monthly Checks */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-brand-900">Monthly Checks</h2>
          </div>
        </Card.Header>
        <Card.Content className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-1">Emergency Lighting Function Test</h3>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Strategy:</strong> Rotation recommended for 10+ lights
            </p>
            <p className="text-sm text-blue-800 mb-1">
              <strong>Requirement:</strong> BS 5266-1:2016 requires monthly function test. If you have 10+ lights, rotating monthly tests maintains compliance while being practical.
            </p>
            <p className="text-sm text-blue-800">
              <strong>Who can do it:</strong> Trained technician or site manager
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-1">Fire Door Inspection</h3>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Strategy:</strong> Rotation recommended for 10+ doors
            </p>
            <p className="text-sm text-blue-800 mb-1">
              <strong>Requirement:</strong> BS 9999:2017 recommends monthly inspection. If you have 10+ fire doors, rotating monthly checks ensures each door is checked once per month.
            </p>
            <p className="text-sm text-blue-800">
              <strong>Who can do it:</strong> Trained staff or fire warden
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-1">Fire Extinguisher Visual Check</h3>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Strategy:</strong> All Assets - Check ALL extinguishers monthly
            </p>
            <p className="text-sm text-blue-800 mb-1">
              <strong>Requirement:</strong> BS 5306-3:2017 requires monthly visual inspection of all extinguishers to ensure they are in place, accessible, and in good condition.
            </p>
            <p className="text-sm text-blue-800">
              <strong>Who can do it:</strong> Any trained staff member
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-1">Smoke/Heat Detector Visual Inspection</h3>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Strategy:</strong> Rotation recommended for 10+ detectors
            </p>
            <p className="text-sm text-blue-800 mb-1">
              <strong>Requirement:</strong> BS 5839-1:2017 Clause 25 recommends regular visual inspection. Rotating monthly inspections for large installations ensures all are checked over time.
            </p>
            <p className="text-sm text-blue-800">
              <strong>Who can do it:</strong> Trained technician or fire warden
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* Annual Checks */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-brand-900">Annual Checks (Competent Person Required)</h2>
          </div>
        </Card.Header>
        <Card.Content className="space-y-3">
          <div className="p-3 bg-purple-50 border border-purple-200">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-purple-900 font-semibold">
                Important: These checks MUST be carried out by a competent person
              </p>
            </div>
            <p className="text-sm text-purple-800 mb-2">
              A "competent person" is someone with sufficient training, experience, and knowledge to perform the servicing correctly. This typically means:
            </p>
            <ul className="text-sm text-purple-800 list-disc list-inside space-y-1 ml-4">
              <li>Third-party certified technicians (e.g., BAFE, FIA registered)</li>
              <li>Manufacturer-trained service engineers</li>
              <li>Qualified contractors specializing in fire safety equipment</li>
              <li>NOT general staff members - these require specialized expertise</li>
            </ul>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-1">Fire Alarm System Service</h3>
            <p className="text-sm text-purple-800">
              <strong>Requirement:</strong> BS 5839-1 requires annual service by competent person. Covers full system test, detector cleaning, battery checks, and documentation.
            </p>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-1">Emergency Lighting Annual Test</h3>
            <p className="text-sm text-purple-800">
              <strong>Requirement:</strong> BS 5266-1 requires full 3-hour duration test annually by competent person to verify battery capacity and system integrity.
            </p>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-1">Fire Extinguisher Service</h3>
            <p className="text-sm text-purple-800">
              <strong>Requirement:</strong> BS 5306-3 requires annual service by competent person. Includes internal inspection, pressure testing, and refilling as needed.
            </p>
          </div>

          <div className="p-3 bg-purple-50 border border-purple-200">
            <h3 className="font-semibold text-purple-900 mb-1">Sprinkler System Service</h3>
            <p className="text-sm text-purple-800">
              <strong>Requirement:</strong> BS EN 12845 and LPC Rules require quarterly and annual service by competent person. Includes pump tests, valve inspections, and system integrity checks.
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* Training & Drills */}
      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-brand-900">Training & Evacuation Drills</h2>
          </div>
        </Card.Header>
        <Card.Content className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200">
            <h3 className="font-semibold text-green-900 mb-1">Fire Safety Training</h3>
            <p className="text-sm text-green-800 mb-1">
              <strong>Requirement:</strong> Fire Safety Order Article 21 requires all relevant persons to receive fire safety training on:
            </p>
            <ul className="text-sm text-green-800 list-disc list-inside space-y-1 ml-4 mb-2">
              <li>Fire risks in the workplace</li>
              <li>Fire safety measures in place</li>
              <li>Actions to take on discovering a fire</li>
              <li>Actions to take on hearing the alarm</li>
            </ul>
            <p className="text-sm text-green-800">
              <strong>Frequency:</strong> On induction and whenever fire risks change. Refresher training recommended annually.
            </p>
          </div>

          <div className="p-3 bg-green-50 border border-green-200">
            <h3 className="font-semibold text-green-900 mb-1">Evacuation Drills</h3>
            <p className="text-sm text-green-800 mb-1">
              <strong>Requirement:</strong> BS 9999:2017 recommends evacuation drills at least twice yearly (every 6 months).
            </p>
            <p className="text-sm text-green-800">
              Drills should test the entire evacuation procedure, identify issues, and ensure staff know their roles.
            </p>
          </div>
        </Card.Content>
      </Card>

      {/* Key Takeaways */}
      <Card>
        <Card.Header>
          <h2 className="text-lg font-semibold text-brand-900">Key Takeaways</h2>
        </Card.Header>
        <Card.Content>
          <ul className="space-y-2 text-sm text-brand-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Rotation vs All:</strong> Not all checks require every asset to be tested every period. Rotation strategies maintain compliance while being practical.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Staff Checks:</strong> Weekly and monthly checks can be performed by trained staff members (fire wardens, technicians, site managers).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Competent Persons:</strong> Annual servicing MUST be performed by qualified, certified competent persons - not general staff.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Documentation:</strong> All checks must be recorded for compliance and audit purposes. This system handles that automatically.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Legal Compliance:</strong> Following these check schedules ensures compliance with UK fire safety legislation and British Standards.
              </span>
            </li>
          </ul>
        </Card.Content>
      </Card>
    </div>
  );
}
