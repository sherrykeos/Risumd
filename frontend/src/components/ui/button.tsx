import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[6px] text-xs font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#4D9FFF]/50 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none active:scale-[0.99]',
  {
    variants: {
      variant: {
        default: 'bg-[#4D9FFF] text-white hover:bg-[#3B8EEA] shadow-none',
        destructive: 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20',
        outline: 'border border-white/[0.1] bg-[#10161B] hover:bg-[#151D24] text-[#F3F4F6] hover:border-white/[0.18]',
        secondary: 'bg-[#131A20] text-[#F3F4F6] border border-white/[0.08] hover:bg-[#182027]',
        ghost: 'hover:bg-white/[0.06] text-[#9CA3AF] hover:text-[#F3F4F6]',
        link: 'text-[#4D9FFF] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-8 px-3.5',
        sm: 'h-7 rounded-[5px] px-2.5 text-[11px]',
        lg: 'h-9 rounded-[7px] px-4 text-sm',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
