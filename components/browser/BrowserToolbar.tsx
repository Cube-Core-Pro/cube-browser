/**
 * Browser Toolbar - Chrome-style compact design
 * Combines address bar with all browser actions in one horizontal row
 */

"use client";

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Lock,
  Globe,
  MoreVertical,
  Bookmark,
  Download,
  Share2,
  Printer,
  FileText,
  Settings,
  Shield,
  Zap,
  LayoutDashboard,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface BrowserToolbarProps {
  activeTab: BrowserTab | undefined;
  onNavigate: (url: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onBookmark: () => void;
  onDownload: () => void;
  onShare: () => void;
  onPrint: () => void;
  onExtractData: () => void;
}

export const BrowserToolbar: React.FC<BrowserToolbarProps> = ({
  activeTab,
  onNavigate,
  onGoBack,
  onGoForward,
  onReload,
  onHome,
  onBookmark,
  onDownload,
  onShare,
  onPrint,
  onExtractData
}) => {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState(activeTab?.url || '');
  const [isUrlFocused, setIsUrlFocused] = useState(false);

  React.useEffect(() => {
    if (activeTab && !isUrlFocused) {
      setUrlInput(activeTab.url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab?.url, isUrlFocused]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(urlInput);
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (urlInput.trim()) {
        onNavigate(urlInput.trim());
        (e.target as HTMLInputElement).blur();
      }
    }
  };

  const isSecure = activeTab?.url?.startsWith('https://');

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Left: Navigation Controls */}
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onGoBack}
                disabled={!activeTab?.canGoBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onGoForward}
                disabled={!activeTab?.canGoForward}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Forward</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onReload}
              >
                <RotateCw className={cn("h-4 w-4", activeTab?.loading && "animate-spin")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Reload</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onHome}
              >
                <Home className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Home</TooltipContent>
          </Tooltip>
        </div>

        {/* Center: Address Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 mx-2">
          <div className="relative flex items-center">
            {/* Security Icon */}
            <div className="absolute left-3 pointer-events-none">
              {isSecure ? (
                <Lock className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>

            {/* URL Input */}
            <Input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onFocus={(event) => {
                setIsUrlFocused(true);
                // Select all on focus for easy copying
                if (urlInput) {
                  (event.target as HTMLInputElement).select();
                }
              }}
              onBlur={() => setIsUrlFocused(false)}
              onKeyDown={handleUrlKeyDown}
              placeholder="Search or enter URL"
              className="h-9 pl-9 pr-10 text-sm rounded-full bg-muted/50 border-muted focus:bg-background focus:border-input transition-all"
            />

            {/* Bookmark Star */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                onBookmark();
              }}
              type="button"
            >
              <Star className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Go Button */}
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90"
            onClick={(e) => {
              e.preventDefault();
              if (urlInput.trim()) {
                onNavigate(urlInput.trim());
              }
            }}
          >
            <ArrowRight className="h-4 w-4 text-primary-foreground" />
          </Button>
        </form>

        {/* Right: Actions + Menu */}
        <div className="flex items-center gap-0.5">
          {/* Quick Actions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => router.push('/')}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Dashboard</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onExtractData}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Extract Data</TooltipContent>
          </Tooltip>

          {/* Chrome-style 3-dot Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Browser Actions</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={onBookmark}>
                <Bookmark className="mr-2 h-4 w-4" />
                Add Bookmark
                <span className="ml-auto text-xs text-muted-foreground">⌘D</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download Page
                <span className="ml-auto text-xs text-muted-foreground">⌘S</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={onPrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
                <span className="ml-auto text-xs text-muted-foreground">⌘P</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>CUBE Features</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={onExtractData}>
                <FileText className="mr-2 h-4 w-4" />
                Extract Data
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => router.push('/automation')}>
                <Zap className="mr-2 h-4 w-4" />
                Create Workflow
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>DuckDuckGo Privacy</DropdownMenuLabel>
              
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Privacy Dashboard
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Globe className="mr-2 h-4 w-4" />
                Tracker Blocking
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
                <span className="ml-auto text-xs text-muted-foreground">⌘,</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </div>
  );
};
