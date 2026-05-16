import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
  {
    variants: {
      variant: {
        default: "border-transparent bg-peach-500 text-white",
        secondary: "border-snow-300 bg-snow-100 text-ink-100",
        outline: "border-snow-300 text-ink-200 bg-transparent",
        success: "border-[#22C55E]/30 bg-[#22C55E]/12 text-[#15803D]",
        warning: "border-[#F59E0B]/30 bg-[#F59E0B]/12 text-[#B45309]",
        danger: "border-[#EF4444]/30 bg-[#EF4444]/12 text-[#B91C1C]",
        info: "border-[#3B82F6]/30 bg-[#3B82F6]/12 text-[#1D4ED8]",
        high: "border-[#EF4444]/30 bg-[#EF4444]/10 text-[#B91C1C]",
        medium: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#B45309]",
        low: "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#15803D]",
        peach: "border-peach-200 bg-peach-50 text-peach-700",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
