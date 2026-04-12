import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-[999px] px-2.5 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        success:     "bg-[#DCFCE7] text-[#15803D]",
        warning:     "bg-[#FEF9C3] text-[#A16207]",
        error:       "bg-[#FEF2F2] text-[#DC2626]",
        info:        "bg-[#E0F2FE] text-[#0369A1]",
        default:     "bg-[#F4F4F5] text-[#71717A]",
        outline:     "border border-[#E4E4E7] text-[#71717A]",
        secondary:   "bg-[#F4F4F5] text-[#71717A]",
        destructive: "bg-[#FEF2F2] text-[#DC2626]",
        energy:      "bg-[#FEF3C7] text-[#B45309]",
        validated:   "bg-[#E5A500]/15 text-[#92400E]",
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
