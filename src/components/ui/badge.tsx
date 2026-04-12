import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      variant: {
        /* Validado / activo */
        success:  "bg-[#ECFDF5] text-[#059669]",
        /* Borrador / pendiente */
        warning:  "bg-[#FEF9C3] text-[#A16207]",
        /* Error / baja */
        error:    "bg-[#FEF2F2] text-[#DC2626]",
        /* Neutro */
        default:  "bg-[#F3F4F6] text-[#6B7280]",
        outline:  "border border-[#E5E7EB] text-[#6B7280]",
        /* Alias para compatibilidad */
        secondary: "bg-[#F3F4F6] text-[#6B7280]",
        destructive: "bg-[#FEF2F2] text-[#DC2626]",
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
