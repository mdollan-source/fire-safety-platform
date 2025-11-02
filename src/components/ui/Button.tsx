import { cn } from '@/lib/utils/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-brand-900 text-white hover:bg-brand-800',
      secondary: 'bg-brand-100 text-brand-900 hover:bg-brand-200',
      danger: 'bg-status-fail text-white hover:bg-red-700',
      success: 'bg-status-pass text-white hover:bg-green-700',
      ghost: 'hover:bg-brand-50 text-brand-900',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500',
          'disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="loading-spinner mr-2" aria-label="Loading" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
