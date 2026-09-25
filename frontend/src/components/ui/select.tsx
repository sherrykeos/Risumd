import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          className={cn(
            'flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
            error && 'border-rose-500 focus-visible:ring-rose-500',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-rose-500 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
