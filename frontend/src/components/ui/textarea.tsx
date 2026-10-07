import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-[6px] border border-white/[0.1] bg-[#0B0F12] px-3 py-2 text-xs md:text-sm text-[#F3F4F6] placeholder:text-[#6B7280] shadow-none transition-colors focus-visible:outline-hidden focus-visible:border-[#4D9FFF]/60 focus-visible:ring-1 focus-visible:ring-[#4D9FFF]/30 disabled:cursor-not-allowed disabled:opacity-40',
            error && 'border-rose-500/60 focus-visible:border-rose-500 focus-visible:ring-rose-500/30',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-[11px] text-rose-400 font-medium">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
