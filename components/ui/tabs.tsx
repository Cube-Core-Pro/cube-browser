"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva(
  "inline-flex items-center justify-center text-muted-foreground",
  {
    variants: {
      variant: {
        default: "h-10 rounded-lg bg-muted p-1 gap-1",
        pills: "h-auto rounded-xl bg-muted/50 p-1.5 gap-1",
        underline: "h-auto border-b border-border gap-1",
        segment: "h-11 rounded-xl bg-muted/30 p-1 gap-0.5 backdrop-blur-sm",
        elite: "h-11 rounded-xl bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-500/10 p-1 gap-1 border border-purple-500/20",
        glass: "h-11 rounded-xl bg-white/10 dark:bg-black/10 backdrop-blur-xl p-1 gap-1 border border-white/20 dark:border-white/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: 
          "rounded-md px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm hover:text-foreground/80",
        pills: 
          "rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md hover:bg-background/50",
        underline: 
          "px-4 py-2.5 border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:text-foreground hover:text-foreground/80 -mb-px",
        segment: 
          "rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-lg hover:bg-background/30 flex-1",
        elite: 
          "rounded-lg px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/25 hover:text-purple-400",
        glass: 
          "rounded-lg px-4 py-2 data-[state=active]:bg-white/20 dark:data-[state=active]:bg-white/10 data-[state=active]:text-foreground data-[state=active]:backdrop-blur-md hover:bg-white/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  icon?: React.ReactNode;
  badge?: string | number;
}

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, icon, badge, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant }), className)}
    {...props}
  >
    {icon && <span className="mr-2 opacity-70">{icon}</span>}
    {children}
    {badge !== undefined && (
      <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-primary/10 text-primary">
        {badge}
      </span>
    )}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const tabsContentVariants = cva(
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "mt-3",
        animated: "mt-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>,
    VariantProps<typeof tabsContentVariants> {}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(tabsContentVariants({ variant }), className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
