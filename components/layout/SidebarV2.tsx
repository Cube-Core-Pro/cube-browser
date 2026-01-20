"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Home,
  Globe,
  Workflow,
  Database,
  Terminal,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  Shield,
  Zap,
  Network,
  FolderTree,
  Video,
  Phone,
  FileBox,
  Lock,
  LayoutDashboard,
  CreditCard,
  User,
  Bot,
  UserCheck,
  Share2,
  Clapperboard,
  TrendingUp,
  Megaphone,
  Search,
  Target,
  Users,
  Mail,
  Funnel,
  Link2,
  Gift,
  BarChart3,
  Boxes,
  Rocket,
  Briefcase,
  Monitor,
  Key,
  PanelBottomClose,
  PanelBottomOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// Types
// =============================================================================

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
  badgeColor?: 'default' | 'success' | 'warning' | 'info';
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  defaultOpen?: boolean;
}

// =============================================================================
// Navigation Configuration
// =============================================================================

const navSections: NavSection[] = [
  {
    id: 'core',
    title: 'Core',
    icon: Rocket,
    defaultOpen: true,
    items: [
      { icon: Home, label: "Dashboard", href: "/" },
      { icon: Globe, label: "Browser", href: "/browser" },
      { icon: Sparkles, label: "AI Assistant", href: "/ai", badge: "GPT-5.2" },
      { icon: MessageSquare, label: "Chat", href: "/chat" },
    ]
  },
  {
    id: 'productivity',
    title: 'Productivity',
    icon: Briefcase,
    defaultOpen: true,
    items: [
      { icon: LayoutDashboard, label: "Workspace", href: "/workspace" },
      { icon: Workflow, label: "Automation", href: "/automation" },
      { icon: Zap, label: "Autofill", href: "/autofill" },
      { icon: Database, label: "Data Sources", href: "/data-sources" },
    ]
  },
  {
    id: 'business',
    title: 'Business Suite',
    icon: TrendingUp,
    defaultOpen: false,
    items: [
      { icon: Users, label: "CRM Enterprise", href: "/crm", badge: "🔥" },
      { icon: Search, label: "AI Search", href: "/search", badge: "🚀" },
      { icon: Target, label: "Intelligence", href: "/research" },
      { icon: Megaphone, label: "Marketing Hub", href: "/marketing" },
      { icon: Share2, label: "Social Hub", href: "/social" },
      { icon: Link2, label: "Integration Hub", href: "/integration" },
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing Tools',
    icon: Megaphone,
    defaultOpen: false,
    items: [
      { icon: Mail, label: "Email Campaigns", href: "/marketing/email", badge: "AI" },
      { icon: Funnel, label: "Funnel Builder", href: "/marketing/funnels", badge: "PRO" },
      { icon: Clapperboard, label: "Video Creator", href: "/social/video-creator", badge: "AI" },
      { icon: TrendingUp, label: "Viral Analytics", href: "/social/analytics" },
    ]
  },
  {
    id: 'communication',
    title: 'Communication',
    icon: Phone,
    defaultOpen: false,
    items: [
      { icon: Video, label: "Video Calls", href: "/video" },
      { icon: Phone, label: "VoIP", href: "/voip" },
      { icon: Network, label: "P2P Sharing", href: "/p2p" },
      { icon: FolderTree, label: "FTP Client", href: "/ftp" },
    ]
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: Shield,
    defaultOpen: false,
    items: [
      { icon: Shield, label: "VPN", href: "/vpn" },
      { icon: Key, label: "Password Manager", href: "/password-manager" },
      { icon: Lock, label: "Security Lab", href: "/security" },
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Tools',
    icon: Terminal,
    defaultOpen: false,
    items: [
      { icon: Terminal, label: "SSH/RDP", href: "/remote" },
      { icon: Monitor, label: "Website Monitor", href: "/monitoring" },
      { icon: FileBox, label: "LendingPad", href: "/lendingpad" },
      { icon: Bot, label: "Prebuilt Robots", href: "/automation/robots" },
      { icon: UserCheck, label: "Lead Qualifier", href: "/automation/lead-qualifier", badge: "AI" },
    ]
  },
];

const footerItems: NavItem[] = [
  { icon: Gift, label: "Referrals", href: "/referrals", badge: "💰" },
  { icon: BarChart3, label: "ROI Dashboard", href: "/roi" },
  { icon: Boxes, label: "Templates", href: "/templates" },
  { icon: CreditCard, label: "Pricing", href: "/pricing" },
  { icon: User, label: "Account", href: "/settings/subscription" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

// =============================================================================
// Collapsible Section Component
// =============================================================================

interface CollapsibleSectionProps {
  section: NavSection;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  section,
  isCollapsed,
  isExpanded,
  onToggle,
  pathname
}) => {
  const Icon = section.icon;
  const hasActiveItem = section.items.some(item => pathname === item.href);

  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <div className="space-y-1">
          {section.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="icon"
                      className="w-10 h-10 mx-auto"
                    >
                      <ItemIcon className="h-4 w-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex items-center gap-2">
                  {item.label}
                  {item.badge && (
                    <span className="text-[10px] bg-primary text-primary-foreground px-1.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-between h-9 px-3 text-muted-foreground hover:text-foreground",
          hasActiveItem && "text-foreground"
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wider">
            {section.title}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="space-y-0.5 pl-2">
          {section.items.map((item) => {
            const ItemIcon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-2 h-8 text-sm",
                    isActive ? "bg-secondary" : "hover:bg-secondary/50"
                  )}
                >
                  <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "ml-auto text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                      "bg-primary/20 text-primary"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Sidebar Component
// =============================================================================

export const SidebarV2: React.FC<SidebarProps> = ({ 
  isCollapsed = false,
  onToggle
}) => {
  const pathname = usePathname();
  
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(() => {
    const initial = new Set<string>();
    navSections.forEach(section => {
      if (section.defaultOpen) {
        initial.add(section.id);
      }
    });
    return initial;
  });
  
  // Track if footer is expanded
  const [footerExpanded, setFooterExpanded] = React.useState(false);

  // Auto-expand section containing active item
  React.useEffect(() => {
    navSections.forEach(section => {
      if (section.items.some(item => pathname === item.href)) {
        setExpandedSections(prev => new Set(prev).add(section.id));
      }
    });
  }, [pathname]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div 
        className={cn(
          "h-full border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-14" : "w-60"
        )}
      >
        {/* Scrollable Navigation Area */}
        <ScrollArea className="flex-1 py-2">
          <nav className={cn("space-y-2", isCollapsed ? "px-2" : "px-2")}>
            {navSections.map((section) => (
              <CollapsibleSection
                key={section.id}
                section={section}
                isCollapsed={isCollapsed}
                isExpanded={expandedSections.has(section.id)}
                onToggle={() => toggleSection(section.id)}
                pathname={pathname}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* Collapsible Footer */}
        <div className="border-t border-border shrink-0">
          {/* Footer Toggle Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full h-8 rounded-none border-b border-border/50",
              isCollapsed ? "justify-center" : "justify-between px-3"
            )}
            onClick={() => setFooterExpanded(!footerExpanded)}
          >
            {!isCollapsed && (
              <span className="text-xs text-muted-foreground">
                {footerExpanded ? "Hide Options" : "More Options"}
              </span>
            )}
            {footerExpanded ? (
              <PanelBottomClose className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <PanelBottomOpen className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>

          {/* Expandable Footer Items */}
          {footerExpanded && (
            <div className={cn(
              "py-2 space-y-0.5 max-h-48 overflow-y-auto",
              isCollapsed ? "px-2" : "px-2"
            )}>
              {footerItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link href={item.href}>
                          <Button
                            variant={isActive ? "secondary" : "ghost"}
                            size="icon"
                            className="w-10 h-10 mx-auto"
                          >
                            <Icon className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start gap-2 h-8"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-sm truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px]">{item.badge}</span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Collapse Sidebar Button */}
          <div className={cn("p-2", !footerExpanded && "pt-2")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size={isCollapsed ? "icon" : "sm"}
                  className={cn(
                    "w-full",
                    isCollapsed ? "h-10" : "h-8 justify-start gap-2"
                  )}
                  onClick={onToggle}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4" />
                      <span className="text-xs">Collapse</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Expand Sidebar</TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SidebarV2;
