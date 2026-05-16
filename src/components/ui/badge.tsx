import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-burnt-peach text-white",
        secondary: "border-transparent bg-surface text-muted-foreground border-border",
        destructive: "border-transparent bg-danger/20 text-danger border-danger/30",
        outline: "text-foreground border-border",
        success: "border-transparent bg-success/20 text-success border-success/30",
        warning: "border-transparent bg-warning/20 text-warning border-warning/30",
        info: "border-transparent bg-info/20 text-info border-info/30",
        high: "border-danger/30 bg-danger/10 text-danger",
        medium: "border-warning/30 bg-warning/10 text-warning",
        low: "border-success/30 bg-success/10 text-success",
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
