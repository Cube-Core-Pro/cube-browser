"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden",
  {
    variants: {
      variant: {
        circle: "rounded-full",
        square: "rounded-lg",
        rounded: "rounded-xl",
      },
      size: {
        xs: "h-6 w-6 text-xs",
        sm: "h-8 w-8 text-sm",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
      },
      ring: {
        none: "",
        default: "ring-2 ring-background",
        primary: "ring-2 ring-primary",
        elite: "ring-2 ring-purple-500",
        success: "ring-2 ring-emerald-500",
        warning: "ring-2 ring-amber-500",
        destructive: "ring-2 ring-red-500",
      },
    },
    defaultVariants: {
      variant: "circle",
      size: "default",
      ring: "none",
    },
  }
);

interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, variant, size, ring, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ variant, size, ring }), className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const fallbackVariants = cva(
  "flex h-full w-full items-center justify-center font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary text-primary-foreground",
        elite: "bg-gradient-to-br from-purple-500 to-violet-500 text-white",
        success: "bg-emerald-500 text-white",
        warning: "bg-amber-500 text-white",
        destructive: "bg-red-500 text-white",
        glass: "bg-white/20 backdrop-blur-sm text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof fallbackVariants> {}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, variant, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(fallbackVariants({ variant }), className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Status indicator for avatars
interface AvatarStatusProps {
  status: "online" | "offline" | "away" | "busy" | "dnd";
  className?: string;
}

const statusColorMap = {
  online: "bg-emerald-500",
  offline: "bg-gray-400",
  away: "bg-amber-500",
  busy: "bg-red-500",
  dnd: "bg-red-500",
};

const AvatarStatus: React.FC<AvatarStatusProps> = ({ status, className }) => (
  <span 
    className={cn(
      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
      statusColorMap[status],
      className
    )}
  />
);

// Avatar with status
interface AvatarWithStatusProps extends AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: "online" | "offline" | "away" | "busy" | "dnd";
  fallbackVariant?: "default" | "primary" | "elite" | "success" | "warning" | "destructive" | "glass";
}

const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  src,
  alt,
  fallback,
  status,
  fallbackVariant,
  ...props
}) => (
  <Avatar {...props}>
    <AvatarImage src={src} alt={alt} />
    <AvatarFallback variant={fallbackVariant}>{fallback}</AvatarFallback>
    {status && <AvatarStatus status={status} />}
  </Avatar>
);

// Avatar group for stacking avatars
interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  className?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({ children, max = 4, className }) => {
  const childArray = React.Children.toArray(children);
  const displayedAvatars = childArray.slice(0, max);
  const remainingCount = childArray.length - max;
  
  return (
    <div className={cn("flex -space-x-3", className)}>
      {displayedAvatars.map((child, index) => (
        <div key={index} className="relative ring-2 ring-background rounded-full">
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted ring-2 ring-background text-xs font-medium text-muted-foreground">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export { Avatar, AvatarImage, AvatarFallback, AvatarStatus, AvatarWithStatus, AvatarGroup };
