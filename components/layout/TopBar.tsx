"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Menu, 
  Settings, 
  Maximize2, 
  Minimize2, 
  X,
  Globe,
  Sun,
  Moon
} from "lucide-react";
import { windowCommands } from "@/lib/tauri";
import { useTheme } from "@/components/providers/theme-provider";
import { TierBadge } from "@/components/subscription/TierBadge";
import { useTier } from "@/lib/stores/subscriptionStore";
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('TopBar');

interface TopBarProps {
  onMenuClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
  onMenuClick
}) => {
  const [isMaximized, setIsMaximized] = React.useState(false);
  const { theme, setTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tier } = useTier();

  React.useEffect(() => {
    const checkMaximized = async () => {
      try {
        const maximized = await windowCommands.isMaximized();
        setIsMaximized(maximized);
      } catch (error) {
        log.error('Failed to check window state:', error);
      }
    };
    
    checkMaximized();
  }, []);

  const handleMinimize = async () => {
    try {
      await windowCommands.minimize();
    } catch (error) {
      log.error('Failed to minimize window:', error);
    }
  };

  const handleMaximize = async () => {
    try {
      if (isMaximized) {
        await windowCommands.unmaximize();
      } else {
        await windowCommands.maximize();
      }
      setIsMaximized(!isMaximized);
    } catch (error) {
      log.error('Failed to maximize/restore window:', error);
    }
  };

  const handleClose = async () => {
    try {
      await windowCommands.close();
    } catch (error) {
      log.error('Failed to close window:', error);
    }
  };

  return (
    <div className="h-12 border-b border-border bg-background flex items-center justify-between px-4 select-none">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-8 w-8"
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">CUBE Nexum</span>
          <TierBadge />
        </div>
      </div>

      {/* Center Section - Tab Controls (placeholder) */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xs text-muted-foreground">
          Browser Controls
        </div>
      </div>

      {/* Right Section - Window Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="h-8 w-8"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMinimize}
            className="h-8 w-8 hover:bg-accent"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMaximize}
            className="h-8 w-8 hover:bg-accent"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
