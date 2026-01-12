"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-11 w-full rounded-xl border-2 bg-card px-4 py-2.5 text-sm font-medium",
          "transition-all duration-200",

          // Border and shadow
          "border-border shadow-soft",

          // File input styles
          "file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-primary",

          // Placeholder
          "placeholder:text-muted-foreground placeholder:font-normal",

          // Hover state
          "hover:border-muted-foreground hover:shadow-soft-lg",

          // Focus state
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",

          // Error state
          error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20",

          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:shadow-soft",

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
