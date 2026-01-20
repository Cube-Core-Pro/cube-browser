"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  children,
  className
}) => {
  return (
    <main 
      className={cn(
        "flex-1 overflow-auto bg-background",
        className
      )}
    >
      <div className="h-full w-full">
        {children}
      </div>
    </main>
  );
};
