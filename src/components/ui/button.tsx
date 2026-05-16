"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-burnt-peach text-white hover:bg-burnt-peach-600 shadow-[0_12px_34px_rgba(242,115,68,0.28)] hover:shadow-[0_18px_44px_rgba(242,115,68,0.36)]",
        destructive:
          "bg-danger text-white hover:bg-danger/90",
        outline:
          "border border-white/10 bg-white/[0.03] text-bright-snow hover:bg-burnt-peach/10 hover:border-burnt-peach/50",
        secondary:
          "bg-surface text-bright-snow hover:bg-surface-elevated border border-border",
        ghost:
          "text-muted-foreground hover:bg-surface hover:text-bright-snow",
        link:
          "text-burnt-peach underline-offset-4 hover:underline p-0 h-auto",
        glass:
          "glass text-bright-snow hover:bg-white/10 border border-white/10",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 py-1.5 text-xs",
        lg: "h-12 px-8 py-3 text-base",
        xl: "h-14 px-10 py-4 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
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
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
