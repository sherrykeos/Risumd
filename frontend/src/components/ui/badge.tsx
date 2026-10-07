import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[4px] border px-2 py-0.5 text-[11px] font-medium transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'border-[#4D9FFF]/25 bg-[#4D9FFF]/10 text-[#4D9FFF]',
        secondary:
          'border-white/[0.08] bg-white/[0.04] text-[#9CA3AF]',
        destructive:
          'border-rose-500/20 bg-rose-500/10 text-rose-400',
        outline:
          'border-white/[0.1] text-[#9CA3AF] bg-transparent',
        success:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        warning:
          'border-amber-500/20 bg-amber-500/10 text-amber-400',
        info:
          'border-sky-500/20 bg-sky-500/10 text-sky-400',
        purple:
          'border-purple-500/20 bg-purple-500/10 text-purple-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
