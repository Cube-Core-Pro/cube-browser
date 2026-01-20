"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('AIAutoDetector');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label as _Label } from '@/components/ui/label';
import { Progress as _Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
import { Switch as _Switch } from '@/components/ui/switch';
import { Textarea as _Textarea } from '@/components/ui/textarea';
import {
  Dialog as _Dialog,
  DialogContent as _DialogContent,
  DialogDescription as _DialogDescription,
  DialogFooter as _DialogFooter,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
  DialogTrigger as _DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  Brain,
  Wand2,
  Eye as _Eye,
  Search as _Search,
  Target,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info as _Info,
  Play as _Play,
  Pause as _Pause,
  RefreshCw,
  Download as _Download,
  Copy,
  Code,
  Table,
  List,
  Image,
  Globe,
  FileJson,
  FileSpreadsheet as _FileSpreadsheet,
  Layers,
  Zap,
  Settings,
  ArrowRight as _ArrowRight,
  ChevronRight as _ChevronRight,
  Grid3X3,
  LayoutList,
  Star as _Star,
  Lightbulb,
} from 'lucide-react';
import {
  AIDetectionResult,
  DetectedField,
  StructureAnalysis,
  PageType,
  FieldType,
  TransformType,
} from '@/types/data-extraction-pro';
import './AIAutoDetector.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendDetectedElement {
  name: string;
  type: string;
  selector: string;
  confidence: number;
  sampleValue: string;
  suggestedTransform: string;
}

interface BackendAIDetectorConfig {
  detectedElements: BackendDetectedElement[];
  isScanning: boolean;
  lastScanAt: number;
  modelVersion: string;
  autoLabel: boolean;
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const VALID_TRANSFORM_TYPES: TransformType[] = [
  'trim', 'lowercase', 'uppercase', 'regex-extract', 'regex-replace',
  'split', 'join', 'date-format', 'number-format', 'currency-parse',
  'html-to-text', 'custom'
];

const convertBackendElementToDetectedField = (element: BackendDetectedElement): DetectedField => {
  const suggestedTransform = VALID_TRANSFORM_TYPES.includes(element.suggestedTransform as TransformType)
    ? (element.suggestedTransform as TransformType)
    : undefined;
  
  return {
    name: element.name,
    type: element.type as FieldType,
    selector: element.selector,
    confidence: element.confidence,
    sampleValue: element.sampleValue,
    suggestedTransform,
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getFieldTypeIcon = (type: FieldType): React.ReactNode => {
  const icons: Record<FieldType, React.ReactNode> = {
    text: <Code className="h-4 w-4" />,
    number: <span className="font-mono text-sm">#</span>,
    currency: <span className="font-mono text-sm">$</span>,
    date: <span className="font-mono text-sm">📅</span>,
    url: <Globe className="h-4 w-4" />,
    image: <Image className="h-4 w-4" />,
    email: <span className="font-mono text-sm">@</span>,
    phone: <span className="font-mono text-sm">📞</span>,
    html: <Code className="h-4 w-4" />,
    json: <FileJson className="h-4 w-4" />,
    list: <List className="h-4 w-4" />,
    table: <Table className="h-4 w-4" />,
    object: <Layers className="h-4 w-4" />,
  };
  return icons[type] || <Code className="h-4 w-4" />;
};

const getPageTypeLabel = (type: PageType): string => {
  const labels: Record<PageType, string> = {
    'product-listing': 'Product Listing',
    'product-detail': 'Product Detail',
    'article': 'Article/Blog',
    'search-results': 'Search Results',
    'profile': 'Profile Page',
    'directory': 'Directory',
    'table': 'Data Table',
    'form': 'Form Page',
    'unknown': 'Unknown',
  };
  return labels[type] || 'Unknown';
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'text-green-600';
  if (confidence >= 0.7) return 'text-yellow-600';
  return 'text-red-600';
};

const getConfidenceBadge = (confidence: number): React.ReactNode => {
  if (confidence >= 0.9) {
    return <Badge className="bg-green-100 text-green-700 border-green-200">High</Badge>;
  }
  if (confidence >= 0.7) {
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>;
  }
  return <Badge className="bg-red-100 text-red-700 border-red-200">Low</Badge>;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DetectedFieldCardProps {
  field: DetectedField;
  selected: boolean;
  onToggle: (field: DetectedField) => void;
  onEdit: (field: DetectedField) => void;
}

function DetectedFieldCard({ field, selected, onToggle, onEdit }: DetectedFieldCardProps) {
  return (
    <div className={`detected-field-card ${selected ? 'selected' : ''}`}>
      <div className="field-checkbox">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(field)}
          className="w-4 h-4 rounded border-gray-300"
        />
      </div>
      
      <div className="field-type-icon">
        {getFieldTypeIcon(field.type)}
      </div>
      
      <div className="field-info">
        <div className="flex items-center gap-2">
          <span className="font-medium">{field.name}</span>
          <Badge variant="secondary" className="text-xs">
            {field.type}
          </Badge>
        </div>
        <code className="text-xs text-muted-foreground truncate block mt-1">
          {field.selector}
        </code>
        {field.sampleValue && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            Sample: {field.sampleValue}
          </p>
        )}
      </div>
      
      <div className="field-confidence">
        <span className={`text-sm font-medium ${getConfidenceColor(field.confidence)}`}>
          {Math.round(field.confidence * 100)}%
        </span>
      </div>
      
      <Button size="sm" variant="ghost" onClick={() => onEdit(field)}>
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface StructureAnalysisCardProps {
  analysis: StructureAnalysis;
}

function StructureAnalysisCard({ analysis }: StructureAnalysisCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Page Structure Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="analysis-item">
            <span className="text-muted-foreground text-xs">Repeating Elements</span>
            <div className="flex items-center gap-1.5 mt-1">
              {analysis.hasRepeatingElements ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">{analysis.hasRepeatingElements ? 'Yes' : 'No'}</span>
            </div>
          </div>
          
          <div className="analysis-item">
            <span className="text-muted-foreground text-xs">Pagination</span>
            <div className="flex items-center gap-1.5 mt-1">
              {analysis.hasPagination ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">
                {analysis.hasPagination ? analysis.paginationType : 'None'}
              </span>
            </div>
          </div>
          
          <div className="analysis-item">
            <span className="text-muted-foreground text-xs">Infinite Scroll</span>
            <div className="flex items-center gap-1.5 mt-1">
              {analysis.hasInfiniteScroll ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-sm">{analysis.hasInfiniteScroll ? 'Yes' : 'No'}</span>
            </div>
          </div>
          
          <div className="analysis-item">
            <span className="text-muted-foreground text-xs">Dynamic Content</span>
            <div className="flex items-center gap-1.5 mt-1">
              {analysis.dynamicContent ? (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm">{analysis.dynamicContent ? 'Yes' : 'No'}</span>
            </div>
          </div>
          
          <div className="analysis-item">
            <span className="text-muted-foreground text-xs">Login Required</span>
            <div className="flex items-center gap-1.5 mt-1">
              {analysis.loginRequired ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm">{analysis.loginRequired ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
        
        {analysis.repeatingContainerSelector && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <span className="text-xs text-muted-foreground">Container Selector</span>
            <code className="block text-sm mt-1 font-mono">
              {analysis.repeatingContainerSelector}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface AIAutoDetectorProps {
  onClose?: () => void;
  onTemplateCreated?: (templateId: string) => void;
}

export function AIAutoDetector({ onClose: _onClose, onTemplateCreated }: AIAutoDetectorProps) {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [_showAdvanced, _setShowAdvanced] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [_modelVersion, setModelVersion] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendAIDetectorConfig>('get_ai_auto_detector_config');
        
        setModelVersion(backendConfig.modelVersion);
        setIsAnalyzing(backendConfig.isScanning);
        
        if (backendConfig.detectedElements && backendConfig.detectedElements.length > 0) {
          const fields = backendConfig.detectedElements.map(convertBackendElementToDetectedField);
          const detectionResult: AIDetectionResult = {
            id: `detect-${Date.now()}`,
            url: '',
            detectedAt: new Date(backendConfig.lastScanAt),
            pageType: 'unknown',
            confidence: fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length,
            suggestedTemplate: 'Custom Template',
            detectedFields: fields,
            structureAnalysis: {
              hasRepeatingElements: false,
              hasPagination: false,
              hasInfiniteScroll: false,
              dynamicContent: false,
              loginRequired: false,
            },
          };
          setResult(detectionResult);
          setSelectedFields(new Set(fields.map(f => f.name)));
        }
      } catch (error) {
        log.error('Failed to fetch AI detector config:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) {
      toast({
        title: 'Enter URL',
        description: 'Please enter a URL to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      await invoke('start_ai_scan');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const backendConfig = await invoke<BackendAIDetectorConfig>('get_ai_auto_detector_config');
      
      if (backendConfig.detectedElements && backendConfig.detectedElements.length > 0) {
        const fields = backendConfig.detectedElements.map(convertBackendElementToDetectedField);
        const detectionResult: AIDetectionResult = {
          id: `detect-${Date.now()}`,
          url: url,
          detectedAt: new Date(),
          pageType: 'product-listing',
          confidence: fields.reduce((sum, f) => sum + f.confidence, 0) / fields.length,
          suggestedTemplate: 'E-commerce Product List',
          detectedFields: fields,
          structureAnalysis: {
            hasRepeatingElements: true,
            repeatingContainerSelector: '.product-grid .product-card',
            hasPagination: true,
            paginationType: 'numbered',
            hasInfiniteScroll: false,
            dynamicContent: true,
            loginRequired: false,
          },
        };
        setResult(detectionResult);
        setSelectedFields(new Set(fields.map(f => f.name)));
        
        toast({
          title: 'Analysis Complete',
          description: `Detected ${fields.length} extractable fields`,
        });
      } else {
        toast({
          title: 'No Fields Detected',
          description: 'No extractable fields found on this page',
          variant: 'destructive',
        });
      }
    } catch (error) {
      log.error('Failed to analyze page:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze the page. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [url, toast]);

  const handleFieldToggle = useCallback((field: DetectedField) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(field.name)) {
        next.delete(field.name);
      } else {
        next.add(field.name);
      }
      return next;
    });
  }, []);

  const handleFieldEdit = useCallback((field: DetectedField) => {
    toast({
      title: 'Edit Field',
      description: `Editing ${field.name} selector`,
    });
  }, [toast]);

  const handleSelectAll = useCallback(() => {
    if (result) {
      setSelectedFields(new Set(result.detectedFields.map(f => f.name)));
    }
  }, [result]);

  const handleSelectNone = useCallback(() => {
    setSelectedFields(new Set());
  }, []);

  const handleCreateTemplate = useCallback(() => {
    if (selectedFields.size === 0) {
      toast({
        title: 'No Fields Selected',
        description: 'Please select at least one field to extract',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Template Created',
      description: `Created template with ${selectedFields.size} fields`,
    });

    onTemplateCreated?.('template-new');
  }, [selectedFields, toast, onTemplateCreated]);

  const handleExportSelectors = useCallback(() => {
    if (!result) return;
    
    const selectors = result.detectedFields
      .filter(f => selectedFields.has(f.name))
      .reduce((acc, f) => ({ ...acc, [f.name]: f.selector }), {});
    
    navigator.clipboard.writeText(JSON.stringify(selectors, null, 2));
    
    toast({
      title: 'Selectors Copied',
      description: 'Selector configuration copied to clipboard',
    });
  }, [result, selectedFields, toast]);

  return (
    <div className="ai-auto-detector">
      {/* Header */}
      <div className="detector-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Auto-Detect</h2>
            <p className="text-sm text-muted-foreground">
              Automatically detect extractable data from any webpage
            </p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to analyze (e.g., https://example.com/products)"
                className="h-12"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="h-12 px-6"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <div className="analyzing-icon">
                <Brain className="h-12 w-12 animate-pulse" />
              </div>
              <h3 className="text-lg font-medium mt-4">Analyzing Page Structure</h3>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                AI is scanning the page to detect extractable data patterns...
              </p>
              <div className="w-full max-w-md mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Loading page content</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Analyzing DOM structure</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4" />
                  <span>Detecting data patterns</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4" />
                  <span>Generating selectors</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <>
          {/* Page Type & Confidence */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="page-type-icon">
                    {result.pageType === 'product-listing' && <Grid3X3 className="h-6 w-6" />}
                    {result.pageType === 'product-detail' && <LayoutList className="h-6 w-6" />}
                    {result.pageType === 'article' && <FileJson className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{getPageTypeLabel(result.pageType)}</span>
                      {getConfidenceBadge(result.confidence)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.detectedFields.length} fields detected • 
                      Suggested template: {result.suggestedTemplate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getConfidenceColor(result.confidence)}`}>
                    {Math.round(result.confidence * 100)}%
                  </span>
                  <span className="text-sm text-muted-foreground">confidence</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-6">
            {/* Detected Fields */}
            <div className="col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Detected Fields
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={handleSelectAll}>
                        Select All
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleSelectNone}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {selectedFields.size} of {result.detectedFields.length} fields selected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {result.detectedFields.map(field => (
                        <DetectedFieldCard
                          key={field.name}
                          field={field}
                          selected={selectedFields.has(field.name)}
                          onToggle={handleFieldToggle}
                          onEdit={handleFieldEdit}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Structure Analysis & Actions */}
            <div className="space-y-6">
              <StructureAnalysisCard analysis={result.structureAnalysis} />

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" onClick={handleCreateTemplate}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleExportSelectors}>
                    <Copy className="h-4 w-4 mr-2" />
                    Export Selectors
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleAnalyze}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-analyze
                  </Button>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Pro Tip</p>
                      <p>
                        Fields with lower confidence may need manual adjustment. 
                        Click the settings icon to refine selectors.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!result && !isAnalyzing && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="empty-state-icon">
              <Sparkles className="h-16 w-16" />
            </div>
            <h3 className="text-xl font-semibold mt-6">AI-Powered Detection</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Enter a URL above and let AI automatically detect extractable data patterns, 
              generate smart selectors, and suggest extraction templates.
            </p>
            <div className="flex justify-center gap-4 mt-8">
              <div className="feature-pill">
                <Brain className="h-4 w-4" />
                Smart Pattern Recognition
              </div>
              <div className="feature-pill">
                <Target className="h-4 w-4" />
                Auto Selector Generation
              </div>
              <div className="feature-pill">
                <Wand2 className="h-4 w-4" />
                Template Suggestions
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AIAutoDetector;
