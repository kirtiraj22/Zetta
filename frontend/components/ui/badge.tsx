import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full text-xs font-medium px-2.5 py-1 border",
  {
    variants: {
      variant: {
        default: "bg-surface border-line text-muted",
        violet: "bg-violet-400/12 border-violet-400/25 text-violet-200",
        amber: "bg-amber-400/12 border-amber-400/25 text-amber-200",
        outline: "bg-transparent border-line-strong text-ink",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
