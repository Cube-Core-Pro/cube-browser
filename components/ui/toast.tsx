import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-xl border p-4 pr-10 shadow-xl transition-all duration-300 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "border-border/50 bg-background/95 text-foreground shadow-lg",
        destructive:
          "destructive group border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 shadow-red-500/10",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-amber-500/10",
        info:
          "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-blue-500/10",
        elite:
          "border-purple-500/30 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400 shadow-purple-500/10",
        glass:
          "border-white/20 bg-white/10 dark:bg-black/10 backdrop-blur-xl text-foreground shadow-xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const toastIconMap = {
  default: null,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  elite: Sparkles,
  glass: null,
};

const toastIconColorMap = {
  default: "",
  destructive: "text-red-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  info: "text-blue-500",
  elite: "text-purple-500",
  glass: "",
};

interface ToastIconProps {
  variant?: keyof typeof toastIconMap;
  className?: string;
}

const ToastIcon: React.FC<ToastIconProps> = ({ variant = "default", className }) => {
  const Icon = toastIconMap[variant];
  if (!Icon) return null;
  
  return (
    <div className={cn("flex-shrink-0", className)}>
      <Icon className={cn("h-5 w-5", toastIconColorMap[variant])} />
    </div>
  );
};

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants> & {
      showIcon?: boolean;
    }
>(({ className, variant, showIcon = true, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-start gap-3 w-full">
        {showIcon && <ToastIcon variant={variant || "default"} />}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </ToastPrimitives.Root>
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-transparent px-3 text-sm font-medium ring-offset-background transition-all duration-200 hover:bg-secondary hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-500/30 group-[.destructive]:hover:border-red-500/50 group-[.destructive]:hover:bg-red-500/10 group-[.destructive]:focus:ring-red-500",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-lg p-1.5 text-foreground/50 opacity-0 transition-all duration-200 hover:text-foreground hover:bg-foreground/10 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring group-hover:opacity-100 group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-300 group-[.destructive]:hover:bg-red-500/10 group-[.destructive]:focus:ring-red-500",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-80 leading-relaxed mt-1", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

// Progress bar for timed toasts
interface ToastProgressProps {
  duration?: number;
  variant?: "default" | "destructive" | "success" | "warning" | "info" | "elite" | "glass";
  className?: string;
}

const ToastProgress: React.FC<ToastProgressProps> = ({ 
  duration = 5000, 
  variant = "default",
  className 
}) => {
  const progressColorMap = {
    default: "bg-foreground/20",
    destructive: "bg-red-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
    elite: "bg-gradient-to-r from-purple-500 to-violet-500",
    glass: "bg-white/30",
  };

  return (
    <div className={cn("absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-xl", className)}>
      <div 
        className={cn("h-full origin-left", progressColorMap[variant])}
        style={{
          animation: `shrinkWidth ${duration}ms linear forwards`,
        }}
      />
      <style jsx>{`
        @keyframes shrinkWidth {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
  ToastProgress,
};
