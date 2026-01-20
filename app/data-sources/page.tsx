"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');



import { AppLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit,
  Server,
  FileJson,
  Cloud,
  HardDrive,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { invoke } from '@tauri-apps/api/core';

interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'cloud';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  config: Record<string, unknown>;
}

export default function DataSourcesPage() {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [newSourceName, setNewSourceName] = useState("");
  const [selectedType, setSelectedType] = useState<DataSource['type']>('database');
  const [isLoading, setIsLoading] = useState(false);

  // Load data sources on mount
  useEffect(() => {
    loadDataSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { confirm } = useConfirm();

  const loadDataSources = async () => {
    try {
      const sources = await invoke<DataSource[]>('list_data_sources');
      setDataSources(sources);
    } catch (error) {
      log.error('Failed to load data sources:', error);
      toast({
        title: "Error",
        description: "Failed to load data sources",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: DataSource['type']) => {
    switch (type) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'api': return <Server className="h-4 w-4" />;
      case 'file': return <FileJson className="h-4 w-4" />;
      case 'cloud': return <Cloud className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return (
          <Badge variant="secondary" className="bg-green-500 text-white">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="secondary" className="bg-gray-500 text-white">
            <XCircle className="mr-1 h-3 w-3" />
            Disconnected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
    }
  };

  const handleAddSource = async () => {
    if (!newSourceName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a data source name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const newSource = await invoke<DataSource>('create_data_source', {
        request: {
          name: newSourceName,
          type: selectedType,
          config: {}
        }
      });

      setDataSources([...dataSources, newSource]);
      setNewSourceName("");

      toast({
        title: "Success",
        description: `Data source "${newSourceName}" added successfully`,
      });
    } catch (error) {
      log.error('Failed to create data source:', error);
      toast({
        title: "Error",
        description: "Failed to create data source",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Data Source',
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    setIsLoading(true);

    try {
      await invoke('delete_data_source', { id });
      setDataSources(dataSources.filter(source => source.id !== id));
      
      toast({
        title: "Success",
        description: `Data source "${name}" deleted successfully`,
      });
    } catch (error) {
      log.error('Failed to delete data source:', error);
      toast({
        title: "Error",
        description: "Failed to delete data source",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (source: DataSource) => {
    toast({
      title: "Testing Connection",
      description: `Testing connection to "${source.name}"...`,
    });

    setIsLoading(true);

    try {
      const result = await invoke<{ success: boolean; message: string; latency_ms?: number }>('test_data_source_connection', {
        id: source.id
      });

      // Update local state with connection status
      await loadDataSources();

      toast({
        title: result.success ? "Success" : "Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      log.error('Connection test failed:', error);
      toast({
        title: "Error",
        description: "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectedCount = dataSources.filter(s => s.status === 'connected').length;
  const errorCount = dataSources.filter(s => s.status === 'error').length;

  return (
    <AppLayout tier="elite">
      <div className="h-full w-full p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8" />
            Data Sources
          </h1>
          <p className="text-muted-foreground">
            Connect and manage your data sources, databases, and APIs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dataSources.length}</div>
              <p className="text-xs text-muted-foreground">
                Configured data sources
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedCount}</div>
              <p className="text-xs text-muted-foreground">
                Active connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorCount}</div>
              <p className="text-xs text-muted-foreground">
                Connection errors
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2m</div>
              <p className="text-xs text-muted-foreground">
                ago
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Sources ({dataSources.length})</TabsTrigger>
            <TabsTrigger value="database">
              <Database className="mr-2 h-4 w-4" />
              Databases
            </TabsTrigger>
            <TabsTrigger value="api">
              <Server className="mr-2 h-4 w-4" />
              APIs
            </TabsTrigger>
            <TabsTrigger value="file">
              <FileJson className="mr-2 h-4 w-4" />
              Files
            </TabsTrigger>
          </TabsList>

          {/* Add New Source */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Add New Data Source</CardTitle>
              <CardDescription>
                Connect a new database, API, or file source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="source-name">Source Name</Label>
                  <Input
                    id="source-name"
                    placeholder="Enter source name"
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="source-type">Type</Label>
                  <select
                    id="source-type"
                    title="Select data source type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as DataSource['type'])}
                  >
                    <option value="database">Database</option>
                    <option value="api">API</option>
                    <option value="file">File</option>
                    <option value="cloud">Cloud Storage</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddSource} className="w-full" disabled={isLoading}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isLoading ? 'Adding...' : 'Add Source'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* All Sources */}
          <TabsContent value="all" className="space-y-4">
            {dataSources.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No data sources configured yet. Add your first one above!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataSources.map((source) => (
                  <Card key={source.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(source.type)}
                          <CardTitle className="text-lg">{source.name}</CardTitle>
                        </div>
                        {getStatusBadge(source.status)}
                      </div>
                      <CardDescription className="capitalize">
                        {source.type} source
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {source.lastSync && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Last Sync:</span>
                            <span className="font-medium">{source.lastSync}</span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleTestConnection(source)}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Testing...' : 'Test'}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteSource(source.id, source.name)}
                            disabled={isLoading}
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

          {/* Database Tab */}
          <TabsContent value="database">
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  {dataSources.filter(s => s.type === 'database').map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(source.type)}
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-sm text-muted-foreground">Database Connection</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(source.status)}
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                    </div>
                  ))}
                  {dataSources.filter(s => s.type === 'database').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No database sources configured
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  {dataSources.filter(s => s.type === 'api').map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(source.type)}
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-sm text-muted-foreground">API Endpoint</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(source.status)}
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                    </div>
                  ))}
                  {dataSources.filter(s => s.type === 'api').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No API sources configured
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Tab */}
          <TabsContent value="file">
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  {dataSources.filter(s => s.type === 'file').map((source) => (
                    <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(source.type)}
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <div className="text-sm text-muted-foreground">File Source</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(source.status)}
                        <Button variant="outline" size="sm">Configure</Button>
                      </div>
                    </div>
                  ))}
                  {dataSources.filter(s => s.type === 'file').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No file sources configured
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
