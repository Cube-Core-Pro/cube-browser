"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Webhook,
  Code,
  AlertTriangle,
  CheckCircle,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  FileText,
  Play,
  Eye,
  Clock,
  Zap,
  Shield,
  XCircle,
  RotateCcw,
  Mail,
  MessageSquare,
  Database,
  FileJson,
  Layout,
  Bot,
  Download
} from "lucide-react";

// ==================== Types ====================

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  secret?: string;
  active: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  workflowId: string;
  headers?: Record<string, string>;
  responseType: 'json' | 'text' | 'none';
}

export interface CodeNodeConfig {
  id: string;
  name: string;
  language: 'javascript' | 'python' | 'typescript';
  code: string;
  inputs: string[];
  outputs: string[];
  timeout: number; // seconds
  memoryLimit: number; // MB
}

export interface ExecutionError {
  id: string;
  workflowId: string;
  workflowName: string;
  nodeId: string;
  nodeName: string;
  errorType: 'runtime' | 'timeout' | 'connection' | 'validation' | 'permission';
  message: string;
  stack?: string;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  resolved: boolean;
  input?: Record<string, unknown>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'support' | 'finance' | 'hr' | 'devops' | 'data' | 'ai';
  complexity: 'simple' | 'medium' | 'complex';
  nodesCount: number;
  tags: string[];
  downloads: number;
  rating: number;
  author: string;
  icon: string;
  nodes: Record<string, unknown>[];
  connections: Record<string, unknown>[];
}

// ==================== Webhook Manager Component ====================

interface WebhookManagerProps {
  webhooks: WebhookEndpoint[];
  baseUrl: string;
  onCreateWebhook: (webhook: Omit<WebhookEndpoint, 'id' | 'triggerCount' | 'url'>) => Promise<WebhookEndpoint>;
  onDeleteWebhook: (id: string) => Promise<void>;
  onToggleWebhook: (id: string, active: boolean) => Promise<void>;
  onCopyUrl: (url: string) => void;
}

export function WebhookManager({
  webhooks,
  baseUrl: _baseUrl,
  onCreateWebhook,
  onDeleteWebhook,
  onToggleWebhook,
  onCopyUrl
}: WebhookManagerProps) {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showSecret, setShowSecret] = useState<string | null>(null);
  
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    method: 'POST' as const,
    workflowId: '',
    responseType: 'json' as const,
    headers: {} as Record<string, string>
  });

  const handleCreate = async () => {
    if (!newWebhook.name || !newWebhook.workflowId) {
      toast({
        title: "Validation Error",
        description: "Name and workflow are required",
        variant: "destructive"
      });
      return;
    }
    
    setCreating(true);
    try {
      await onCreateWebhook({
        ...newWebhook,
        active: true,
        secret: crypto.randomUUID()
      });
      
      setShowCreateDialog(false);
      setNewWebhook({
        name: '',
        method: 'POST',
        workflowId: '',
        responseType: 'json',
        headers: {}
      });
      
      toast({
        title: "Webhook Created",
        description: "Your webhook endpoint is ready to receive requests"
      });
    } catch (_error) {
      toast({
        title: "Creation Failed",
        description: "Could not create webhook",
        variant: "destructive"
      });
    }
    setCreating(false);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500';
      case 'POST': return 'bg-blue-500';
      case 'PUT': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500">
              <Webhook className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Webhooks</CardTitle>
              <CardDescription>Trigger workflows from external services</CardDescription>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Create an endpoint to trigger workflows externally
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Webhook Name</Label>
                  <Input
                    placeholder="e.g., Stripe Payment Hook"
                    value={newWebhook.name}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="http-method-select">HTTP Method</Label>
                    <select
                      id="http-method-select"
                      title="Select HTTP method"
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      value={newWebhook.method}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, method: e.target.value as typeof newWebhook.method }))}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="response-type-select">Response Type</Label>
                    <select
                      id="response-type-select"
                      title="Select response type"
                      className="w-full h-10 px-3 rounded-md border bg-background"
                      value={newWebhook.responseType}
                      onChange={(e) => setNewWebhook(prev => ({ ...prev, responseType: e.target.value as typeof newWebhook.responseType }))}
                    >
                      <option value="json">JSON</option>
                      <option value="text">Plain Text</option>
                      <option value="none">No Response</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Target Workflow ID</Label>
                  <Input
                    placeholder="workflow-123"
                    value={newWebhook.workflowId}
                    onChange={(e) => setNewWebhook(prev => ({ ...prev, workflowId: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Create Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {webhooks.length === 0 ? (
          <div className="text-center py-8">
            <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No webhooks configured</p>
            <p className="text-sm text-muted-foreground">Create a webhook to trigger workflows externally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(webhook => (
              <div
                key={webhook.id}
                className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`flex items-center justify-center h-6 px-2 rounded text-xs font-bold text-white ${getMethodColor(webhook.method)}`}>
                      {webhook.method}
                    </div>
                    <div>
                      <p className="font-medium">{webhook.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {webhook.url}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCopyUrl(webhook.url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {webhook.triggerCount} triggers
                        </span>
                        {webhook.lastTriggered && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Last: {webhook.lastTriggered.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.active}
                      onCheckedChange={(checked) => onToggleWebhook(webhook.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteWebhook(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                
                {webhook.secret && (
                  <div className="mt-3 p-2 rounded bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-yellow-700 dark:text-yellow-400">
                        <Shield className="inline h-3 w-3 mr-1" />
                        Secret for verification
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSecret(showSecret === webhook.id ? null : webhook.id)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                    {showSecret === webhook.id && (
                      <code className="text-xs font-mono mt-1 block">{webhook.secret}</code>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Code Node Component ====================

interface CodeNodeEditorProps {
  config: CodeNodeConfig | null;
  onSave: (config: CodeNodeConfig) => Promise<void>;
  onRun: (config: CodeNodeConfig) => Promise<{ output: string; duration: number; error?: string }>;
}

export function CodeNodeEditor({ config, onSave, onRun }: CodeNodeEditorProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<CodeNodeConfig>(config || {
    id: crypto.randomUUID(),
    name: 'New Code Node',
    language: 'javascript',
    code: `// Transform your data here
// Input is available in 'items' array
// Return the transformed data

return items.map(item => {
  return {
    ...item.json,
    processed: true,
    timestamp: new Date().toISOString()
  };
});`,
    inputs: ['items'],
    outputs: ['result'],
    timeout: 30,
    memoryLimit: 128
  });
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const codeTemplates = {
    javascript: {
      transform: `// Transform data
return items.map(item => ({
  ...item.json,
  processed: true
}));`,
      filter: `// Filter items
return items.filter(item => 
  item.json.status === 'active'
);`,
      aggregate: `// Aggregate data
const total = items.reduce((sum, item) => 
  sum + item.json.amount, 0
);
return [{ total }];`,
      http: `// Make HTTP request
const response = await fetch('https://api.example.com/data');
const data = await response.json();
return [{ json: data }];`
    },
    python: {
      transform: `# Transform data
result = []
for item in items:
    item['processed'] = True
    result.append(item)
return result`,
      filter: `# Filter items
return [item for item in items if item.get('status') == 'active']`,
      aggregate: `# Aggregate data
total = sum(item.get('amount', 0) for item in items)
return [{'total': total}]`
    },
    typescript: {
      transform: `// Transform data with types
interface InputItem {
  json: { [key: string]: any };
}

interface OutputItem {
  json: { [key: string]: any; processed: boolean };
}

return items.map((item: InputItem): OutputItem => ({
  json: {
    ...item.json,
    processed: true
  }
}));`
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setOutput(null);
    
    try {
      const result = await onRun(editing);
      setOutput(result.output);
      setDuration(result.duration);
      if (result.error) {
        setError(result.error);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Execution failed');
    }
    
    setRunning(false);
  };

  const handleSave = async () => {
    try {
      await onSave(editing);
      toast({
        title: "Code Node Saved",
        description: "Your code has been saved successfully"
      });
    } catch (_error) {
      toast({
        title: "Save Failed",
        description: "Could not save code node",
        variant: "destructive"
      });
    }
  };

  const loadTemplate = (template: string) => {
    const templates = codeTemplates[editing.language as keyof typeof codeTemplates];
    if (templates && template in templates) {
      setEditing(prev => ({
        ...prev,
        code: templates[template as keyof typeof templates] || ''
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500">
              <Code className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Code Node</CardTitle>
              <CardDescription>Write custom logic in your workflows</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRun} disabled={running}>
              {running ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Test
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Node Name</Label>
            <Input
              value={editing.name}
              onChange={(e) => setEditing(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-language-select">Language</Label>
            <select
              id="code-language-select"
              title="Select programming language"
              className="w-full h-10 px-3 rounded-md border bg-background"
              value={editing.language}
              onChange={(e) => setEditing(prev => ({ ...prev, language: e.target.value as typeof editing.language }))}
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code-template-select">Template</Label>
            <select
              id="code-template-select"
              title="Select code template"
              className="w-full h-10 px-3 rounded-md border bg-background"
              onChange={(e) => loadTemplate(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Select template...</option>
              <option value="transform">Transform Data</option>
              <option value="filter">Filter Items</option>
              <option value="aggregate">Aggregate Data</option>
              {editing.language === 'javascript' && <option value="http">HTTP Request</option>}
            </select>
          </div>
        </div>

        {/* Code Editor */}
        <div className="space-y-2">
          <Label>Code</Label>
          <Textarea
            className="font-mono text-sm h-64 resize-none"
            value={editing.code}
            onChange={(e) => setEditing(prev => ({ ...prev, code: e.target.value }))}
            placeholder="// Write your code here..."
          />
        </div>

        {/* Advanced Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Timeout (seconds)</Label>
            <Input
              type="number"
              value={editing.timeout}
              onChange={(e) => setEditing(prev => ({ ...prev, timeout: parseInt(e.target.value) || 30 }))}
              min={1}
              max={300}
            />
          </div>
          <div className="space-y-2">
            <Label>Memory Limit (MB)</Label>
            <Input
              type="number"
              value={editing.memoryLimit}
              onChange={(e) => setEditing(prev => ({ ...prev, memoryLimit: parseInt(e.target.value) || 128 }))}
              min={64}
              max={1024}
            />
          </div>
        </div>

        {/* Output */}
        {(output || error) && (
          <div className={`p-3 rounded-lg ${error ? 'bg-red-50 dark:bg-red-950/20 border-red-200' : 'bg-green-50 dark:bg-green-950/20 border-green-200'} border`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium text-sm ${error ? 'text-red-700' : 'text-green-700'}`}>
                {error ? 'Error' : 'Output'}
              </span>
              {duration !== null && (
                <span className="text-xs text-muted-foreground">
                  Executed in {duration}ms
                </span>
              )}
            </div>
            <pre className="text-xs font-mono overflow-x-auto max-h-32 overflow-y-auto">
              {error || output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Error Handling Component ====================

interface ErrorHandlerProps {
  errors: ExecutionError[];
  onRetry: (errorId: string) => Promise<void>;
  onResolve: (errorId: string) => void;
  onClearAll: () => void;
}

export function ErrorHandler({ errors, onRetry, onResolve, onClearAll }: ErrorHandlerProps) {
  const { toast } = useToast();
  const [retrying, setRetrying] = useState<string | null>(null);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const unresolvedErrors = errors.filter(e => !e.resolved);
  
  const handleRetry = async (errorId: string) => {
    setRetrying(errorId);
    try {
      await onRetry(errorId);
      toast({
        title: "Retry Successful",
        description: "The workflow has been re-executed"
      });
    } catch (_error) {
      toast({
        title: "Retry Failed",
        description: "The workflow failed again",
        variant: "destructive"
      });
    }
    setRetrying(null);
  };

  const getErrorTypeIcon = (type: ExecutionError['errorType']) => {
    switch (type) {
      case 'runtime': return <Code className="h-4 w-4" />;
      case 'timeout': return <Clock className="h-4 w-4" />;
      case 'connection': return <Webhook className="h-4 w-4" />;
      case 'validation': return <AlertTriangle className="h-4 w-4" />;
      case 'permission': return <Shield className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  const getErrorTypeColor = (type: ExecutionError['errorType']) => {
    switch (type) {
      case 'runtime': return 'bg-red-500';
      case 'timeout': return 'bg-orange-500';
      case 'connection': return 'bg-yellow-500';
      case 'validation': return 'bg-purple-500';
      case 'permission': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Error Handler</CardTitle>
              <CardDescription>Manage workflow execution errors</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unresolvedErrors.length > 0 && (
              <Badge variant="destructive">
                {unresolvedErrors.length} Unresolved
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={onClearAll}>
              Clear Resolved
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-600">All Clear</p>
            <p className="text-sm text-muted-foreground">No execution errors</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errors.map(error => (
              <div
                key={error.id}
                className={`p-4 rounded-lg border transition-colors ${
                  error.resolved 
                    ? 'bg-muted/30 border-muted opacity-60'
                    : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded ${getErrorTypeColor(error.errorType)}`}>
                      {getErrorTypeIcon(error.errorType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{error.workflowName}</p>
                        <Badge variant="outline" className="text-xs">
                          {error.nodeName}
                        </Badge>
                        <Badge className={`text-xs text-white ${getErrorTypeColor(error.errorType)}`}>
                          {error.errorType}
                        </Badge>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {error.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{error.timestamp.toLocaleString()}</span>
                        <span>•</span>
                        <span>Retries: {error.retryCount}/{error.maxRetries}</span>
                      </div>
                    </div>
                  </div>
                  
                  {!error.resolved && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetry(error.id)}
                        disabled={retrying === error.id || error.retryCount >= error.maxRetries}
                      >
                        {retrying === error.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onResolve(error.id)}
                      >
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {error.stack && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setExpandedError(expandedError === error.id ? null : error.id)}
                    >
                      {expandedError === error.id ? 'Hide' : 'Show'} Stack Trace
                    </Button>
                    {expandedError === error.id && (
                      <pre className="mt-2 p-2 rounded bg-muted text-xs font-mono overflow-x-auto max-h-32">
                        {error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Template Library Component ====================

interface TemplateLibraryProps {
  templates: WorkflowTemplate[];
  onUseTemplate: (templateId: string) => Promise<void>;
  onPreviewTemplate: (template: WorkflowTemplate) => void;
}

export function TemplateLibrary({ templates, onUseTemplate, onPreviewTemplate }: TemplateLibraryProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All', icon: Layout },
    { id: 'sales', name: 'Sales', icon: Zap },
    { id: 'marketing', name: 'Marketing', icon: Mail },
    { id: 'support', name: 'Support', icon: MessageSquare },
    { id: 'data', name: 'Data', icon: Database },
    { id: 'ai', name: 'AI', icon: Bot }
  ];

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleUseTemplate = async (templateId: string) => {
    setImporting(templateId);
    try {
      await onUseTemplate(templateId);
      toast({
        title: "Template Imported",
        description: "The template has been added to your workflows"
      });
    } catch (_error) {
      toast({
        title: "Import Failed",
        description: "Could not import template",
        variant: "destructive"
      });
    }
    setImporting(null);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'complex': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500">
              <Layout className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Template Library</CardTitle>
              <CardDescription>Pre-built workflows to get started quickly</CardDescription>
            </div>
          </div>
          <Badge variant="outline">
            {templates.length} Templates
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-4">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="whitespace-nowrap"
            >
              <cat.icon className="mr-1 h-4 w-4" />
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No templates found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="p-4 rounded-lg border hover:border-primary hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.author}</p>
                    </div>
                  </div>
                  <Badge className={`text-xs text-white ${getComplexityColor(template.complexity)}`}>
                    {template.complexity}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {template.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileJson className="h-3 w-3" />
                      {template.nodesCount} nodes
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {template.downloads}
                    </span>
                    <span>★ {template.rating.toFixed(1)}</span>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreviewTemplate(template)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template.id)}
                      disabled={importing === template.id}
                    >
                      {importing === template.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Use'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Main Automation Advanced Features Component ====================

export interface AutomationAdvancedFeaturesProps {
  // Webhooks
  webhooks: WebhookEndpoint[];
  webhookBaseUrl: string;
  onCreateWebhook: (webhook: Omit<WebhookEndpoint, 'id' | 'triggerCount' | 'url'>) => Promise<WebhookEndpoint>;
  onDeleteWebhook: (id: string) => Promise<void>;
  onToggleWebhook: (id: string, active: boolean) => Promise<void>;
  onCopyWebhookUrl: (url: string) => void;
  
  // Code Node
  codeNodeConfig: CodeNodeConfig | null;
  onSaveCodeNode: (config: CodeNodeConfig) => Promise<void>;
  onRunCodeNode: (config: CodeNodeConfig) => Promise<{ output: string; duration: number; error?: string }>;
  
  // Error Handler
  executionErrors: ExecutionError[];
  onRetryError: (errorId: string) => Promise<void>;
  onResolveError: (errorId: string) => void;
  onClearResolvedErrors: () => void;
  
  // Templates
  workflowTemplates: WorkflowTemplate[];
  onUseTemplate: (templateId: string) => Promise<void>;
  onPreviewTemplate: (template: WorkflowTemplate) => void;
}

export function AutomationAdvancedFeatures({
  webhooks,
  webhookBaseUrl,
  onCreateWebhook,
  onDeleteWebhook,
  onToggleWebhook,
  onCopyWebhookUrl,
  codeNodeConfig,
  onSaveCodeNode,
  onRunCodeNode,
  executionErrors,
  onRetryError,
  onResolveError,
  onClearResolvedErrors,
  workflowTemplates,
  onUseTemplate,
  onPreviewTemplate
}: AutomationAdvancedFeaturesProps) {
  return (
    <Tabs defaultValue="webhooks" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="webhooks" className="flex items-center gap-2">
          <Webhook className="h-4 w-4" />
          <span className="hidden sm:inline">Webhooks</span>
        </TabsTrigger>
        <TabsTrigger value="code" className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          <span className="hidden sm:inline">Code</span>
        </TabsTrigger>
        <TabsTrigger value="errors" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">Errors</span>
          {executionErrors.filter(e => !e.resolved).length > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
              {executionErrors.filter(e => !e.resolved).length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <Layout className="h-4 w-4" />
          <span className="hidden sm:inline">Templates</span>
        </TabsTrigger>
      </TabsList>
      
      <div className="mt-4">
        <TabsContent value="webhooks">
          <WebhookManager
            webhooks={webhooks}
            baseUrl={webhookBaseUrl}
            onCreateWebhook={onCreateWebhook}
            onDeleteWebhook={onDeleteWebhook}
            onToggleWebhook={onToggleWebhook}
            onCopyUrl={onCopyWebhookUrl}
          />
        </TabsContent>
        
        <TabsContent value="code">
          <CodeNodeEditor
            config={codeNodeConfig}
            onSave={onSaveCodeNode}
            onRun={onRunCodeNode}
          />
        </TabsContent>
        
        <TabsContent value="errors">
          <ErrorHandler
            errors={executionErrors}
            onRetry={onRetryError}
            onResolve={onResolveError}
            onClearAll={onClearResolvedErrors}
          />
        </TabsContent>
        
        <TabsContent value="templates">
          <TemplateLibrary
            templates={workflowTemplates}
            onUseTemplate={onUseTemplate}
            onPreviewTemplate={onPreviewTemplate}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}

export default AutomationAdvancedFeatures;
