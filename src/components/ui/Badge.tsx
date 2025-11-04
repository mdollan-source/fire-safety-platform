import { cn } from '@/lib/utils/cn';

export interface BadgeProps {
  variant: 'pass' | 'fail' | 'warning' | 'pending' | 'overdue' | 'critical' | 'high' | 'medium' | 'low';
  children: React.ReactNode;
  className?: string;
}

const Badge = ({ variant, children, className }: BadgeProps) => {
  const variants = {
    pass: 'bg-green-100 text-green-800',
    fail: 'bg-red-100 text-red-800',
    warning: 'bg-orange-100 text-orange-800',
    pending: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-200 text-red-900',
    critical: 'bg-red-900 text-white',
    high: 'bg-red-100 text-red-800',
    medium: 'bg-orange-100 text-orange-800',
    low: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
