"use client";

import * as React from "react";
import { TopBar } from "./TopBar";
import { SidebarV2 } from "./SidebarV2";
import { MainContent } from "./MainContent";

interface AppLayoutProps {
  children: React.ReactNode;
  tier?: "free" | "pro" | "elite";
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tier = "free"
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const handleMenuClick = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarToggle = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <TopBar 
        onMenuClick={handleMenuClick}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar V2 - Improved with collapsible sections */}
        {isSidebarOpen && (
          <SidebarV2 
            isCollapsed={isSidebarCollapsed}
            onToggle={handleSidebarToggle}
          />
        )}

        {/* Main Content */}
        <MainContent>
          {children}
        </MainContent>
      </div>

      {/* Chat flotante unificado se renderiza globalmente en layout.tsx */}
    </div>
  );
};
