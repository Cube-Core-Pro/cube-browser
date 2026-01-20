"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import { AppLayout } from "@/components/layout";
import AutomationStudio from "@/components/AutomationStudio";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { 
  Workflow, 
  Play, 
  Trash2, 
  Plus, 
  Edit,
  Clock,
  Sparkles,
  Upload
} from "lucide-react";
import {
  listWorkspaces,
  createWorkspace,
  deleteWorkspace,
  type Workspace
} from "@/lib/services/workspaceService";
import {
  getMacros,
  type Macro
} from "@/lib/services/automationService";
import { FileUploadAutomation } from "./file-upload";

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  workflowId: string;
  lastRun?: string;
  nextRun?: string;
}

export default function AutomationPage() {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, _setError] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [_showScheduleDialog, setShowScheduleDialog] = useState(false);

  useEffect(() => {
    loadData();
    loadScheduledTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadScheduledTasks = async () => {
    try {
      const stored = localStorage.getItem('cube_scheduled_tasks');
      if (stored) {
        setScheduledTasks(JSON.parse(stored));
      }
    } catch (error) {
      log.error('Failed to load scheduled tasks:', error);
    }
  };

  const toggleTask = (taskId: string) => {
    setScheduledTasks(prev => {
      const updated = prev.map(task => 
        task.id === taskId ? { ...task, enabled: !task.enabled } : task
      );
      localStorage.setItem('cube_scheduled_tasks', JSON.stringify(updated));
      return updated;
    });
    toast({
      title: "Task Updated",
      description: "Scheduled task status changed",
    });
  };

  const deleteTask = async (taskId: string) => {
    const confirmed = await confirm({
      title: 'Delete Scheduled Task',
      description: 'Are you sure you want to delete this scheduled task?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;
    
    setScheduledTasks(prev => {
      const updated = prev.filter(task => task.id !== taskId);
      localStorage.setItem('cube_scheduled_tasks', JSON.stringify(updated));
      return updated;
    });
    toast({
      title: "Task Deleted",
      description: "Scheduled task removed successfully",
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [workspacesData, macrosData] = await Promise.all([
        listWorkspaces(),
        getMacros()
      ]);
      setWorkspaces(workspacesData);
      setMacros(macrosData);
    } catch (error) {
      // Silently handle error - backend might not be ready yet
      // This is expected on initial load or when Tauri is starting
      log.warn('Automation data load deferred:', error);
      // Set empty defaults so UI still works
      setWorkspaces([]);
      setMacros([]);
    } finally {
      setLoading(false);
    }
  };

  // If workflow builder is open, show it full screen
  if (showWorkflowBuilder) {
    return <AutomationStudio />;
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a workspace name",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      await createWorkspace({ name: newWorkspaceName, description: "New automation workspace" });
      
      toast({
        title: "Success",
        description: `Workspace "${newWorkspaceName}" created successfully`,
      });

      setNewWorkspaceName("");
      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create workspace",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Workspace',
      description: `Are you sure you want to delete workspace "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await deleteWorkspace(workspaceId);
      
      toast({
        title: "Success",
        description: `Workspace "${name}" deleted successfully`,
      });

      await loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete workspace",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: string | number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout tier="elite">
      <div className="h-full w-full p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Workflow className="h-8 w-8" />
            {t('automation.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('automation.subtitle')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workflow Builder</CardTitle>
              <Sparkles className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">ELITE</div>
              <p className="text-xs text-purple-600 mb-3">
                Superior to Zapier
              </p>
              <Button
                onClick={() => setShowWorkflowBuilder(true)}
                size="sm"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Workflow className="mr-2 h-4 w-4" />
                Open Builder
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workspaces</CardTitle>
              <Workflow className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaces.length}</div>
              <p className="text-xs text-muted-foreground">
                Active automation workspaces
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Macros</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{macros.length}</div>
              <p className="text-xs text-muted-foreground">
                Recorded automation macros
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Active automation tasks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="workspaces" className="w-full">
          <TabsList>
            <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
            <TabsTrigger value="macros">Macros</TabsTrigger>
            <TabsTrigger value="file-upload">File Upload</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Workspace</CardTitle>
                <CardDescription>
                  Start a new automation workspace for your workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      placeholder="Enter workspace name"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleCreateWorkspace}
                      disabled={creating || !newWorkspaceName.trim()}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {creating ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loading ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Loading workspaces...
                </CardContent>
              </Card>
            ) : workspaces.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No workspaces yet. Create your first one above!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workspaces.map((workspace) => (
                  <Card key={workspace.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{workspace.name}</CardTitle>
                          <CardDescription>
                            {workspace.description || "No description"}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">{workspace.icon}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Tabs:</span>
                          <span className="font-medium">{workspace.tabs.length}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Created:</span>
                          <span className="font-medium">{formatDate(workspace.created_at)}</span>
                        </div>
                        {workspace.updated_at && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last Updated:</span>
                            <span className="font-medium">{formatDate(workspace.updated_at)}</span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteWorkspace(workspace.id, workspace.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Macros Tab */}
          <TabsContent value="macros" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recorded Macros</CardTitle>
                    <CardDescription>
                      View and manage your automation macros
                    </CardDescription>
                  </div>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record New Macro
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {macros.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No macros recorded yet. Click &quot;Record New Macro&quot; to start!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {macros.map((macro) => (
                      <div key={macro.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{macro.name}</div>
                          {macro.description && (
                            <div className="text-sm text-muted-foreground">{macro.description}</div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{macro.steps.length} steps</span>
                            <span>•</span>
                            <span>Created {formatDate(macro.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Play className="mr-2 h-4 w-4" />
                            Run
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Automations</CardTitle>
                <CardDescription>
                  Configure automated tasks to run on schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">No scheduled tasks configured</p>
                    <Button onClick={() => setShowScheduleDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Scheduled Task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scheduledTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${task.enabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="font-medium">{task.name}</p>
                            <p className="text-sm text-muted-foreground">{task.schedule}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toggleTask(task.id)}>
                            {task.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" onClick={() => setShowScheduleDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Scheduled Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Upload Tab */}
          <TabsContent value="file-upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  File Upload Automation
                </CardTitle>
                <CardDescription>
                  Upload files with automation instructions (PDF, TXT, DOCX, Excel, CSV)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <FileUploadAutomation 
                  onWorkflowGenerated={(instructions, fileName) => {
                    toast({
                      title: "Workflow Generated",
                      description: `Created workflow with ${instructions.length} steps from ${fileName}`,
                    });
                  }}
                  onError={(error) => {
                    toast({
                      title: "Error",
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
