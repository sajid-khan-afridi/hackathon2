"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading = false, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-semibold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",

          // Variants
          variant === "default" &&
            "bg-primary text-primary-foreground rounded-xl shadow-soft hover:bg-primary-hover hover:shadow-glow hover:-translate-y-0.5",
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground rounded-xl shadow-soft hover:bg-destructive/90 hover:-translate-y-0.5",
          variant === "success" &&
            "bg-success text-success-foreground rounded-xl shadow-soft hover:bg-success/90 hover:-translate-y-0.5",
          variant === "outline" &&
            "border-2 border-border bg-card/50 backdrop-blur-sm rounded-xl shadow-soft hover:border-primary hover:bg-card hover:-translate-y-0.5",
          variant === "secondary" &&
            "bg-secondary text-secondary-foreground rounded-xl shadow-soft hover:bg-secondary-hover hover:-translate-y-0.5",
          variant === "ghost" &&
            "rounded-lg hover:bg-muted hover:text-foreground",
          variant === "link" &&
            "text-primary underline-offset-4 hover:underline",

          // Sizes
          size === "default" && "h-11 px-6 py-2.5 text-sm",
          size === "sm" && "h-9 px-4 text-xs rounded-lg",
          size === "lg" && "h-12 px-8 text-base",
          size === "icon" && "h-10 w-10 rounded-lg",

          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
