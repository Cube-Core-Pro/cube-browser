"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const switchVariants = cva(
  "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        elite: "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-violet-500 data-[state=unchecked]:bg-input",
        success: "data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-input",
        warning: "data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-input",
        destructive: "data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-input",
        glass: "data-[state=checked]:bg-white/30 data-[state=unchecked]:bg-white/10 backdrop-blur-sm",
      },
      size: {
        sm: "h-5 w-9",
        default: "h-6 w-11",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const thumbSizeMap = {
  sm: "h-4 w-4 data-[state=checked]:translate-x-4",
  default: "h-5 w-5 data-[state=checked]:translate-x-5",
  lg: "h-6 w-6 data-[state=checked]:translate-x-7",
}

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    VariantProps<typeof switchVariants> {
  thumbClassName?: string;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, variant, size, thumbClassName, ...props }, ref) => {
  const thumbSize = thumbSizeMap[size || "default"]
  
  return (
    <SwitchPrimitives.Root
      className={cn(switchVariants({ variant, size }), className)}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 data-[state=unchecked]:translate-x-0",
          thumbSize,
          thumbClassName
        )}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

// Labeled switch for convenience
interface LabeledSwitchProps extends SwitchProps {
  label: string;
  description?: string;
  labelPosition?: "left" | "right";
  labelClassName?: string;
}

const LabeledSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  LabeledSwitchProps
>(({ label, description, labelPosition = "right", labelClassName, className, id, ...props }, ref) => {
  const generatedId = React.useId()
  const switchId = id || generatedId
  
  const labelContent = (
    <div className="flex flex-col gap-0.5">
      <label 
        htmlFor={switchId}
        className={cn(
          "text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          labelClassName
        )}
      >
        {label}
      </label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
  
  return (
    <div className="flex items-center gap-3">
      {labelPosition === "left" && labelContent}
      <Switch ref={ref} id={switchId} className={className} {...props} />
      {labelPosition === "right" && labelContent}
    </div>
  )
})
LabeledSwitch.displayName = "LabeledSwitch"

export { Switch, LabeledSwitch }
