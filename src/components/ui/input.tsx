import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground shadow-xs placeholder:text-muted-foreground/60",
          "transition-[box-shadow,border-color] duration-150",
          "focus-visible:outline-none focus-visible:border-foreground/60 focus-visible:ring-2 focus-visible:ring-foreground/10",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/15",
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
