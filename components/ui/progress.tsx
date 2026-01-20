"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-muted",
  {
    variants: {
      variant: {
        default: "",
        elite: "bg-purple-500/20",
        success: "bg-emerald-500/20",
        warning: "bg-amber-500/20",
        destructive: "bg-red-500/20",
        glass: "bg-white/10 backdrop-blur-sm",
      },
      size: {
        sm: "h-1.5",
        default: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-blue-500 to-purple-500",
        elite: "bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500",
        success: "bg-gradient-to-r from-emerald-500 to-green-500",
        warning: "bg-gradient-to-r from-amber-500 to-orange-500",
        destructive: "bg-gradient-to-r from-red-500 to-rose-500",
        glass: "bg-white/40",
        solid: "bg-primary",
      },
      animated: {
        true: "animate-pulse",
        false: "",
      },
      striped: {
        true: "bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      animated: false,
      striped: false,
    },
  }
)

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: "default" | "elite" | "success" | "warning" | "destructive" | "glass" | "solid";
  animated?: boolean;
  striped?: boolean;
  showValue?: boolean;
  label?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant, size, indicatorVariant, animated, striped, showValue, label, ...props }, ref) => (
  <div className="w-full">
    {(label || showValue) && (
      <div className="flex justify-between items-center mb-1.5">
        {label && <span className="text-sm font-medium text-foreground">{label}</span>}
        {showValue && <span className="text-sm text-muted-foreground">{value || 0}%</span>}
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressVariants({ variant, size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(indicatorVariants({ 
          variant: indicatorVariant || variant || "default", 
          animated,
          striped
        }))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
))
Progress.displayName = ProgressPrimitive.Root.displayName

// Circular progress variant
interface CircularProgressProps {
  value?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "elite" | "success" | "warning" | "destructive";
  showValue?: boolean;
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value = 0,
  size = 48,
  strokeWidth = 4,
  variant = "default",
  showValue = false,
  className,
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  
  const strokeColorMap = {
    default: "stroke-primary",
    elite: "stroke-purple-500",
    success: "stroke-emerald-500",
    warning: "stroke-amber-500",
    destructive: "stroke-red-500",
  }
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted opacity-20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(strokeColorMap[variant], "transition-all duration-300")}
        />
      </svg>
      {showValue && (
        <span className="absolute text-xs font-semibold">
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}

export { Progress, CircularProgress }
