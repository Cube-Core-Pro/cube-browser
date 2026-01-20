"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const tooltipContentVariants = cva(
  "z-50 overflow-hidden text-sm animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm px-3 py-1.5 text-popover-foreground shadow-lg",
        dark: "rounded-lg bg-gray-900 px-3 py-1.5 text-white shadow-xl",
        light: "rounded-lg bg-white px-3 py-1.5 text-gray-900 shadow-xl border border-gray-200",
        elite: "rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 px-3 py-1.5 text-white shadow-lg shadow-purple-500/25",
        glass: "rounded-lg border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-xl px-3 py-1.5 text-foreground shadow-xl",
        info: "rounded-lg bg-blue-600 px-3 py-1.5 text-white shadow-lg shadow-blue-500/25",
        success: "rounded-lg bg-emerald-600 px-3 py-1.5 text-white shadow-lg shadow-emerald-500/25",
        warning: "rounded-lg bg-amber-500 px-3 py-1.5 text-white shadow-lg shadow-amber-500/25",
        error: "rounded-lg bg-red-600 px-3 py-1.5 text-white shadow-lg shadow-red-500/25",
      },
      size: {
        sm: "text-xs px-2 py-1",
        default: "text-sm px-3 py-1.5",
        lg: "text-sm px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>,
    VariantProps<typeof tooltipContentVariants> {
  /** Optional icon to display before content */
  icon?: React.ReactNode;
  /** Optional title for rich tooltips */
  title?: string;
  /** Whether to show an arrow */
  showArrow?: boolean;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, variant, size, icon, title, showArrow = false, children, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(tooltipContentVariants({ variant, size }), className)}
    {...props}
  >
    <div className="flex items-start gap-2">
      {icon && <span className="flex-shrink-0 mt-0.5">{icon}</span>}
      <div className="flex flex-col gap-0.5">
        {title && <span className="font-semibold">{title}</span>}
        <span className={cn(title && "opacity-90")}>{children}</span>
      </div>
    </div>
    {showArrow && (
      <TooltipPrimitive.Arrow className="fill-current" />
    )}
  </TooltipPrimitive.Content>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Quick tooltip wrapper for simple use cases
interface QuickTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  variant?: "default" | "dark" | "light" | "elite" | "glass" | "info" | "success" | "warning" | "error";
  delayDuration?: number;
}

const QuickTooltip: React.FC<QuickTooltipProps> = ({
  content,
  children,
  side = "top",
  variant = "default",
  delayDuration = 200,
}) => (
  <Tooltip delayDuration={delayDuration}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side={side} variant={variant}>
      {content}
    </TooltipContent>
  </Tooltip>
);

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, QuickTooltip };
