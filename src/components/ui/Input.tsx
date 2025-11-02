import { cn } from '@/lib/utils/cn';
import { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-brand-700 mb-1">
            {label}
            {props.required && <span className="text-status-fail ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm border bg-white',
            'focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
            'disabled:bg-brand-50 disabled:text-brand-400',
            error ? 'border-status-fail' : 'border-brand-300',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-status-fail">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-brand-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
