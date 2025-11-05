'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { Shield, Building2, Mail, Activity, Users, TrendingUp } from 'lucide-react';

export default function SuperAdminPage() {
  const { userData } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not super admin
    if (userData && userData.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userData, router]);

  if (!userData || userData.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-brand-600">Loading...</div>
      </div>
    );
  }

  const adminSections = [
    {
      title: 'Organizations',
      description: 'View and manage all client organizations',
      icon: Building2,
      href: '/admin/organizations',
      color: 'blue',
    },
    {
      title: 'Email Logs',
      description: 'View all sent emails, delivery status, and failures',
      icon: Mail,
      href: '/admin/email-logs',
      color: 'green',
    },
    {
      title: 'System Health',
      description: 'Monitor system metrics, errors, and performance',
      icon: Activity,
      href: '/admin/system-health',
      color: 'orange',
    },
    {
      title: 'User Management',
      description: 'Search and manage users across all organizations',
      icon: Users,
      href: '/admin/users',
      color: 'purple',
    },
    {
      title: 'Analytics',
      description: 'Platform-wide metrics and growth analytics',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'pink',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-brand-900" />
          <h1 className="text-3xl font-bold text-brand-900">Super Admin Dashboard</h1>
        </div>
        <p className="text-brand-600">
          Platform administration and monitoring
        </p>
      </div>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.href}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(section.href)}
            >
              <Card>
                <Card.Content>
                  <div className="p-6">
                    <div className={`w-12 h-12 bg-${section.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                      <Icon className={`w-6 h-6 text-${section.color}-600`} />
                    </div>
                    <h3 className="text-lg font-semibold text-brand-900 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-brand-600">
                      {section.description}
                    </p>
                  </div>
                </Card.Content>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8">
        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-brand-900">Quick Stats</h2>
          </Card.Header>
          <Card.Content>
            <p className="text-sm text-brand-600">
              Platform statistics will be displayed here once implemented.
            </p>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
