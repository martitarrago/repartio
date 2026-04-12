import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* Primary — único elemento con color de marca */
        default:
          "bg-[#FF2D8D] text-white hover:bg-[#e0277e]",
        /* Secondary — fondo blanco, borde gris */
        secondary:
          "border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB]",
        outline:
          "border border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F9FAFB]",
        destructive:
          "bg-[#DC2626] text-white hover:bg-[#b91c1c]",
        ghost:
          "text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#0A0A0A]",
        link:
          "text-[#FF2D8D] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-4 py-2",
        sm: "h-7 rounded-md px-3",
        lg: "h-9 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
