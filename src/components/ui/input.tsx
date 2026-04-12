import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-8 w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-1.5 text-sm text-[#0A0A0A] placeholder:text-[#9CA3AF]",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:border-[#FF2D8D] focus-visible:ring-2 focus-visible:ring-[#FF2D8D]/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
