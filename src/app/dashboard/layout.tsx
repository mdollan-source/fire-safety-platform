import ProtectedRoute from '@/lib/auth/ProtectedRoute';
import DashboardNav from '@/components/layout/DashboardNav';
import NotificationPermissionPrompt from '@/components/notifications/NotificationPermissionPrompt';
import ForegroundMessageListener from '@/components/notifications/ForegroundMessageListener';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-50">
        <DashboardNav />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </main>
        <NotificationPermissionPrompt />
        <ForegroundMessageListener />
      </div>
    </ProtectedRoute>
  );
}
