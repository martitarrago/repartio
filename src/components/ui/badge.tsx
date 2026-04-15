import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-none tabular-nums transition-colors",
  {
    variants: {
      variant: {
        success:     "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10",
        warning:     "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/10",
        error:       "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10",
        info:        "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/10",
        default:     "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
        outline:     "border border-border text-muted-foreground",
        secondary:   "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
        destructive: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10",
        energy:      "bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/10",
        validated:   "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10",
      },
    },
    defaultVariants: {
      variant: "default",
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
