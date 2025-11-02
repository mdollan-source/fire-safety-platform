'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import Button from '@/components/ui/Button';
import {
  LayoutDashboard,
  Building2,
  Package,
  ClipboardCheck,
  AlertTriangle,
  Users,
  FileText,
  LogOut,
  User,
  History,
  FileStack,
  GraduationCap,
  Siren,
  Mail,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Checks', href: '/dashboard/checks', icon: ClipboardCheck },
  { name: 'History', href: '/dashboard/entries', icon: History },
  { name: 'Defects', href: '/dashboard/defects', icon: AlertTriangle },
  { name: 'Sites', href: '/dashboard/sites', icon: Building2 },
  { name: 'Assets', href: '/dashboard/assets', icon: Package },
  { name: 'Templates', href: '/dashboard/templates', icon: FileStack },
  { name: 'Training', href: '/dashboard/training', icon: GraduationCap },
  { name: 'Drills', href: '/dashboard/drills', icon: Siren },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Users', href: '/dashboard/users', icon: Users },
];

// Development-only navigation items
const devNavigation = [
  { name: 'Test Emails', href: '/dashboard/test-emails', icon: Mail },
  { name: 'Test Notifications', href: '/dashboard/test-notifications', icon: Bell },
];

// Combine navigation based on environment
const allNavigation = process.env.NODE_ENV === 'development'
  ? [...navigation, ...devNavigation]
  : navigation;

export default function DashboardNav() {
  const pathname = usePathname();
  const { user, userData, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-brand-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-900 flex items-center justify-center text-white font-bold text-sm">
              FS
            </div>
            <span className="font-semibold text-brand-900 hidden sm:inline">Fire Safety</span>
          </Link>

          {/* Desktop user menu */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right text-sm">
              <div className="font-medium text-brand-900">{userData?.name || user?.displayName}</div>
              <div className="text-xs text-brand-600">{userData?.role?.replace('_', ' ')}</div>
            </div>

            <Link href="/dashboard/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4" />
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-brand-600 hover:text-brand-900 hover:bg-brand-50 rounded transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Desktop navigation tabs */}
        <div className="hidden md:flex gap-1 -mb-px overflow-x-auto">
          {allNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-brand-900 text-brand-900'
                    : 'border-transparent text-brand-600 hover:text-brand-900 hover:border-brand-300'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-200 bg-white">
          <div className="px-4 py-2 space-y-1">
            {/* User info */}
            <div className="py-3 px-2 border-b border-brand-200 mb-2">
              <div className="font-medium text-brand-900 text-sm">{userData?.name || user?.displayName}</div>
              <div className="text-xs text-brand-600 mt-1">{userData?.role?.replace('_', ' ')}</div>
            </div>

            {/* Navigation items */}
            {allNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-100 text-brand-900'
                      : 'text-brand-600 hover:bg-brand-50 hover:text-brand-900'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Profile and Logout */}
            <div className="pt-2 mt-2 border-t border-brand-200 space-y-1">
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-900 transition-colors"
              >
                <User className="w-5 h-5" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
