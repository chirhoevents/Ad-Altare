import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium font-inter tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-burgundy-100 text-burgundy-800',
        gold: 'bg-gold-100 text-gold-700',
        success: 'bg-green-100 text-green-800',
        outline: 'border border-near-black/20 text-near-black',
        muted: 'bg-near-black/10 text-near-black/60',
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
