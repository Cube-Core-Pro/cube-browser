"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Sparkles,
  MessageSquare,
  Shield,
  Zap,
  MoreHorizontal,
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
  Eye,
  Share2,
  Clapperboard,
  TrendingUp,
  Megaphone,
  Search,
  Target,
  Users,
  Mail,
  Funnel,
  Link2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: "Dashboard", href: "/" },
  { icon: Globe, label: "Browser", href: "/browser" },
  { icon: Search, label: "AI Search", href: "/search", badge: "🚀" },
  { icon: Target, label: "Intelligence", href: "/research", badge: "NEW" },
  { icon: Users, label: "CRM Enterprise", href: "/crm", badge: "🔥" },
  { icon: Megaphone, label: "Marketing Hub", href: "/marketing", badge: "NEW" },
  { icon: Link2, label: "Integration Hub", href: "/integration", badge: "🔥" },
  { icon: LayoutDashboard, label: "Workspace", href: "/workspace", badge: "NEW" },
  { icon: Workflow, label: "Automation", href: "/automation" },
  { icon: Share2, label: "Social Hub", href: "/social", badge: "🔥" },
  { icon: Database, label: "Data Sources", href: "/data-sources" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: Shield, label: "VPN", href: "/vpn" },
  { icon: Sparkles, label: "AI Assistant", href: "/ai" },
  { icon: Zap, label: "Autofill", href: "/autofill" },
];

const advancedNavItems: NavItem[] = [
  { icon: Mail, label: "Email Campaigns", href: "/marketing/email", badge: "AI" },
  { icon: Funnel, label: "Funnel Builder", href: "/marketing/funnels", badge: "PRO" },
  { icon: Clapperboard, label: "Video Creator", href: "/social/video-creator", badge: "AI" },
  { icon: TrendingUp, label: "Viral Analytics", href: "/social/analytics", badge: "PRO" },
  { icon: Network, label: "P2P Sharing", href: "/p2p" },
  { icon: FolderTree, label: "FTP Client", href: "/ftp" },
  { icon: Video, label: "Video Calls", href: "/video" },
  { icon: Phone, label: "VoIP", href: "/voip" },
  { icon: FileBox, label: "LendingPad", href: "/lendingpad" },
  { icon: Terminal, label: "SSH/RDP", href: "/remote" },
  { icon: Lock, label: "Security Lab", href: "/security" },
  { icon: Bot, label: "Prebuilt Robots", href: "/automation/robots", badge: "NEW" },
  { icon: UserCheck, label: "Lead Qualifier", href: "/automation/lead-qualifier", badge: "AI" },
  { icon: Eye, label: "Website Monitor", href: "/monitoring", badge: "NEW" },
];

const bottomNavItems: NavItem[] = [
  { icon: CreditCard, label: "Pricing & Plans", href: "/pricing" },
  { icon: User, label: "Account", href: "/settings/subscription" },
  { icon: Settings, label: "Settings", href: "/settings" },
  { icon: HelpCircle, label: "Help", href: "/help" },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed = false,
  onToggle
}) => {
  const pathname = usePathname();
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  return (
    <div 
      className={cn(
        "h-full border-r border-border bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Main Navigation - Scrollable Area */}
        <div className="flex-1 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <nav className="space-y-1 px-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                    {!isCollapsed && item.badge && (
                      <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
            
            <Separator className="my-3" />
            
            {/* Advanced Tools Section */}
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10",
                isCollapsed && "justify-center px-2"
              )}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <MoreHorizontal className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <span className="text-sm">Advanced Tools</span>
              )}
            </Button>
            
            {showAdvanced && !isCollapsed && (
              <div className="pl-2 space-y-1 mt-1">
                {advancedNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        size="sm"
                        className="w-full justify-start gap-3 h-9"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-xs">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        <Separator />

        {/* Bottom Navigation */}
        <div className="py-4">
          <nav className="space-y-1 px-2">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-3" />

          {/* Toggle Button */}
          <div className="px-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10",
                isCollapsed && "justify-center px-2"
              )}
              onClick={onToggle}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span className="text-sm">Collapse</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
