"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Globe, Workflow, Database, Zap, Shield, Video, 
  Bot, Eye, UserCheck, Lock, Network, Terminal,
  Sparkles, Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { createTab, getAllTabs } from "@/lib/services/browser-service";
import { listWorkspaces, createWorkspace } from "@/lib/services/workspaceService";
import { useRouter } from "next/navigation";
import { waitForTauri } from "@/lib/utils/environment";

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState({
    activeTabs: 0,
    activeWorkflows: 0,
    dataSources: 0,
  });
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check environment and redirect if needed
  useEffect(() => {
    const checkEnvironment = async () => {
      // Log for debugging
      log.debug('[CUBE] Starting environment detection...');
      log.debug('[CUBE] NEXT_PUBLIC_IS_TAURI:', process.env.NEXT_PUBLIC_IS_TAURI);
      log.debug('[CUBE] NEXT_PUBLIC_APP_MODE:', process.env.NEXT_PUBLIC_APP_MODE);
      log.debug('[CUBE] window.__TAURI__:', typeof window !== 'undefined' && '__TAURI__' in window);
      log.debug('[CUBE] window.__TAURI_INTERNALS__:', typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);
      
      // Wait for Tauri to initialize (gives it 3 seconds)
      const isTauri = await waitForTauri(3000);
      
      log.debug('[CUBE] Environment detection result:', isTauri ? 'TAURI DESKTOP' : 'WEB BROWSER');
      
      if (!isTauri) {
        // Not in Tauri, redirect to landing page
        log.debug('[CUBE] Not in Tauri, redirecting to landing page...');
        router.replace('/landing');
        return;
      }
      
      // We're in Tauri desktop app, show the dashboard
      log.debug('[CUBE] Tauri detected! Showing dashboard');
      setIsChecking(false);
      setIsReady(true);
    };
    
    checkEnvironment();
  }, [router]);

  // Load stats on mount (only in Tauri)
  useEffect(() => {
    if (!isReady) return;
    
    // Wrap in try-catch to prevent errors on initial load
    const initStats = async () => {
      try {
        await loadStats();
      } catch (error) {
        log.error("Failed to load initial stats:", error);
        // Continue with default values
      }
    };
    
    initStats();
  }, [isReady]);

  const loadStats = async () => {
    try {
      // Check if we're in Tauri environment
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        let tabsCount = 0;
        let workspacesCount = 0;
        
        try {
          const tabs = await getAllTabs();
          tabsCount = tabs.length;
        } catch (error) {
          log.warn("getAllTabs not available:", error);
        }
        
        try {
          const workspaces = await listWorkspaces();
          workspacesCount = workspaces.length;
        } catch (error) {
          log.warn("listWorkspaces not available:", error);
        }
        
        setStats({
          activeTabs: tabsCount,
          activeWorkflows: workspacesCount,
          dataSources: 0,
        });
      }
    } catch (error) {
      log.error("Failed to load stats:", error);
      // Keep default values
    }
  };

  const handleLaunchBrowser = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Check if we're in Tauri environment
      if (typeof window === 'undefined' || !('__TAURI__' in window)) {
        throw new Error("Not running in Tauri environment");
      }
      
      const tabId = await createTab("https://www.google.com");
      
      toast({
        title: "Browser Launched",
        description: `New tab created successfully (ID: ${tabId.slice(0, 8)}...)`,
      });
      
      // Refresh stats
      await loadStats();
      
      // Navigate to browser page after a short delay
      setTimeout(() => {
        router.push("/browser");
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to launch browser",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Check if we're in Tauri environment
      if (typeof window === 'undefined' || !('__TAURI__' in window)) {
        throw new Error("Not running in Tauri environment");
      }
      
      const workspace = await createWorkspace({
        name: `Workflow ${Date.now()}`,
        description: "New automation workflow"
      });
      
      toast({
        title: "Workflow Created",
        description: `Workspace created successfully (ID: ${workspace.id.slice(0, 8)}...)`,
      });
      
      // Refresh stats
      await loadStats();
      
      // Navigate to automation page
      setTimeout(() => {
        router.push("/automation");
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = () => {
    toast({
      title: "Data Source",
      description: "Opening data source configuration...",
    });
    
    // Navigate to data sources page
    setTimeout(() => {
      router.push("/data-sources");
    }, 500);
  };

  // Show loading state while checking environment
  if (isChecking || !isReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">
            {isChecking ? "Detecting environment..." : "Loading CUBE Nexum..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout tier="elite">
      <div className="h-full w-full p-6 space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to CUBE Nexum
          </h1>
          <p className="text-muted-foreground">
            Enterprise Browser for Business Automation
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Workflows
              </CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeWorkflows}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeWorkflows === 0 ? "No workflows running" : `${stats.activeWorkflows} active`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Browser Tabs
              </CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeTabs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTabs === 0 ? "No tabs open" : `${stats.activeTabs} tabs open`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Data Sources
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dataSources}</div>
              <p className="text-xs text-muted-foreground">
                {stats.dataSources === 0 ? "Connect your first source" : `${stats.dataSources} connected`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Automations
              </CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Create your first automation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Start building your enterprise automation workflows
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Open Browser</p>
                  <p className="text-xs text-muted-foreground">
                    Start browsing with enterprise-grade security
                  </p>
                </div>
                <Button onClick={handleLaunchBrowser} disabled={loading}>
                  {loading ? "Loading..." : "Launch Browser"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Create Workflow</p>
                  <p className="text-xs text-muted-foreground">
                    Automate repetitive tasks with visual workflow builder
                  </p>
                </div>
                <Button onClick={handleCreateWorkflow} variant="outline" disabled={loading}>
                  {loading ? "Creating..." : "Create Workflow"}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Connect Data Source</p>
                  <p className="text-xs text-muted-foreground">
                    Link databases, APIs, and file systems
                  </p>
                </div>
                <Button onClick={handleAddSource} variant="outline">Add Source</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              System Status
              <Badge variant="secondary" className="bg-green-500 text-white">
                Online
              </Badge>
            </CardTitle>
            <CardDescription>
              All systems operational
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tauri Backend</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Connected
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Next.js Frontend</span>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Running
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Database</span>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Not Configured
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Competitive Advantages - Marketing Section */}
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-violet-900 dark:text-violet-100">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Why CUBE Elite Beats The Competition
            </CardTitle>
            <CardDescription className="text-violet-700 dark:text-violet-300">
              Features no other automation platform offers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Advantage 1 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900">
                  <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Built-in VPN</h4>
                  <p className="text-xs text-muted-foreground">Enterprise-grade privacy that Zapier, Make &amp; n8n don&apos;t have</p>
                </div>
              </div>
              
              {/* Advantage 2 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Video Conferencing</h4>
                  <p className="text-xs text-muted-foreground">Zoom-quality video calls built in - no extra subscriptions</p>
                </div>
              </div>
              
              {/* Advantage 3 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                  <Bot className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">50+ Prebuilt Robots</h4>
                  <p className="text-xs text-muted-foreground">Amazon, LinkedIn, Zillow scrapers ready to use</p>
                </div>
              </div>
              
              {/* Advantage 4 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <Eye className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Website Monitoring</h4>
                  <p className="text-xs text-muted-foreground">Track price changes, stock levels, competitor updates</p>
                </div>
              </div>
              
              {/* Advantage 5 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900">
                  <UserCheck className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">AI Lead Qualifier</h4>
                  <p className="text-xs text-muted-foreground">Score leads automatically like Bardeen.ai</p>
                </div>
              </div>
              
              {/* Advantage 6 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900">
                  <Terminal className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">SSH/RDP Access</h4>
                  <p className="text-xs text-muted-foreground">Remote server management that competitors lack</p>
                </div>
              </div>
              
              {/* Advantage 7 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <Network className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">P2P File Sharing</h4>
                  <p className="text-xs text-muted-foreground">Share large files directly without cloud limits</p>
                </div>
              </div>
              
              {/* Advantage 8 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                  <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Password Manager</h4>
                  <p className="text-xs text-muted-foreground">Secure credential storage for all automations</p>
                </div>
              </div>
              
              {/* Advantage 9 */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-white/5">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900">
                  <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">100% Self-Hosted</h4>
                  <p className="text-xs text-muted-foreground">Your data never leaves your machine</p>
                </div>
              </div>
            </div>
            
            {/* CTA */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Button 
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                onClick={() => router.push('/automation/robots')}
              >
                <Bot className="mr-2 h-4 w-4" />
                Explore Robots
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/monitoring')}
              >
                <Eye className="mr-2 h-4 w-4" />
                Start Monitoring
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/automation/lead-qualifier')}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Qualify Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

