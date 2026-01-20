import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "filled" | "ghost" | "underlined";
  inputSize?: "sm" | "default" | "lg";
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    variant = "default",
    inputSize = "default",
    error = false,
    icon,
    iconPosition = "left",
    ...props 
  }, ref) => {
    const variants = {
      default: "border border-input bg-background hover:border-muted-foreground/30 focus:border-primary focus:ring-2 focus:ring-primary/20",
      filled: "border-0 bg-muted/50 hover:bg-muted focus:bg-background focus:ring-2 focus:ring-primary/20",
      ghost: "border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50",
      underlined: "border-0 border-b-2 border-input rounded-none bg-transparent hover:border-muted-foreground/50 focus:border-primary",
    };
    
    const sizes = {
      sm: "h-8 px-2.5 text-xs",
      default: "h-10 px-3 text-sm",
      lg: "h-12 px-4 text-base",
    };
    
    const hasIcon = !!icon;
    const iconPadding = hasIcon ? (iconPosition === "left" ? "pl-10" : "pr-10") : "";
    
    return (
      <div className="relative">
        {hasIcon && (
          <div 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none",
              iconPosition === "left" ? "left-3" : "right-3"
            )}
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex w-full rounded-lg ring-offset-background transition-all duration-200",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground/60",
            "focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            variants[variant],
            sizes[inputSize],
            iconPadding,
            error && "border-destructive focus:border-destructive focus:ring-destructive/20",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
