import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium leading-5 transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/25 bg-primary-soft text-primary',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        destructive: 'border-destructive/25 bg-destructive-soft text-destructive',
        outline: 'border-border text-muted-foreground',
        success: 'border-success/25 bg-success-soft text-success',
        warning: 'border-warning/25 bg-warning-soft text-warning',
        info: 'border-info/25 bg-info-soft text-info',
        /** Reads as data rather than status: mono, quiet, no fill. */
        code: 'border-border bg-transparent font-mono text-[0.6875rem] tracking-tight text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * A span, not a div: badges sit inside sentences and headings, and a div nested
 * in a <p> is invalid markup that React reports as a hydration error.
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
