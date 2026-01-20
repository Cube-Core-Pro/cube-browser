"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer shrink-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border border-primary rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary hover:border-primary/80",
        filled: "border-0 bg-muted rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground hover:bg-muted/80",
        elite: "border border-purple-500/50 rounded-md data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-violet-500 data-[state=checked]:text-white data-[state=checked]:border-transparent hover:border-purple-500",
        success: "border border-emerald-500/50 rounded-md data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500 hover:border-emerald-500",
        warning: "border border-amber-500/50 rounded-md data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500 hover:border-amber-500",
        destructive: "border border-red-500/50 rounded-md data-[state=checked]:bg-red-500 data-[state=checked]:text-white data-[state=checked]:border-red-500 hover:border-red-500",
        circle: "border border-primary rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground hover:border-primary/80",
      },
      size: {
        sm: "h-3.5 w-3.5",
        default: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const iconSizeMap = {
  sm: "h-3 w-3",
  default: "h-3.5 w-3.5",
  lg: "h-4 w-4",
}

interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  indeterminate?: boolean;
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, variant, size, indeterminate, ...props }, ref) => {
  const iconSize = iconSizeMap[size || "default"]
  
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(checkboxVariants({ variant, size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        {indeterminate ? (
          <Minus className={cn(iconSize, "stroke-[3]")} />
        ) : (
          <Check className={cn(iconSize, "stroke-[3]")} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

// Labeled checkbox for convenience
interface LabeledCheckboxProps extends CheckboxProps {
  label: string;
  description?: string;
  labelClassName?: string;
}

const LabeledCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  LabeledCheckboxProps
>(({ label, description, labelClassName, className, id, ...props }, ref) => {
  const generatedId = React.useId()
  const checkboxId = id || generatedId
  
  return (
    <div className="flex items-start gap-3">
      <Checkbox ref={ref} id={checkboxId} className={className} {...props} />
      <div className="flex flex-col gap-0.5">
        <label 
          htmlFor={checkboxId}
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
    </div>
  )
})
LabeledCheckbox.displayName = "LabeledCheckbox"

export { Checkbox, LabeledCheckbox }
