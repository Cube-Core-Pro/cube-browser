"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('ExtractionTemplates');

import React, { useState, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription as _CardDescription, CardHeader as _CardHeader, CardTitle as _CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs as _Tabs, TabsContent as _TabsContent, TabsList as _TabsList, TabsTrigger as _TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger as _DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Plus,
  Search,
  Download as _Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff,
  Globe,
  ShoppingCart,
  Briefcase,
  Home,
  Newspaper,
  Plane,
  Heart,
  DollarSign,
  Building2,
  Eye,
  Play,
  Settings as _Settings,
  MoreVertical,
  CheckCircle,
  Clock as _Clock,
  BarChart3 as _BarChart3,
  TrendingUp as _TrendingUp,
  Users,
  Sparkles,
  Code,
  Loader2,
} from 'lucide-react';
import { ExtractionTemplate, TemplateCategory } from '@/types/data-extraction-pro';
import './ExtractionTemplates.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  sourcePattern: string;
  outputFormat: string;
  createdAt: number;
  updatedAt: number;
  usageCount: number;
  successRate: number;
  isPublic: boolean;
  author: string;
}

interface BackendTemplatesConfig {
  templates: BackendTemplate[];
  categories: string[];
}

// ============================================================================
// CONVERTER FUNCTIONS
// ============================================================================

const convertBackendTemplateToExtractionTemplate = (template: BackendTemplate): ExtractionTemplate => {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    version: template.version,
    category: template.category as TemplateCategory,
    sourcePattern: template.sourcePattern ? new RegExp(template.sourcePattern) : undefined,
    fields: [],
    outputFormat: { 
      type: 'json', 
      options: { 
        includeMetadata: true, 
        flattenNested: false, 
        nullValue: 'null', 
        dateFormat: 'ISO', 
        encoding: 'utf-8' 
      }, 
      destination: { type: 'local' } 
    },
    createdAt: new Date(template.createdAt),
    updatedAt: new Date(template.updatedAt),
    usageCount: template.usageCount,
    successRate: template.successRate,
    isPublic: template.isPublic,
    author: template.author,
  };
};

// ============================================================================
// STATIC DATA
// ============================================================================

const categoryInfo: { id: TemplateCategory; name: string; icon: React.ReactNode }[] = [
  { id: 'ecommerce', name: 'E-commerce', icon: <ShoppingCart className="h-4 w-4" /> },
  { id: 'social-media', name: 'Social Media', icon: <Users className="h-4 w-4" /> },
  { id: 'news', name: 'News & Articles', icon: <Newspaper className="h-4 w-4" /> },
  { id: 'jobs', name: 'Job Listings', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'real-estate', name: 'Real Estate', icon: <Home className="h-4 w-4" /> },
  { id: 'finance', name: 'Finance', icon: <DollarSign className="h-4 w-4" /> },
  { id: 'travel', name: 'Travel', icon: <Plane className="h-4 w-4" /> },
  { id: 'government', name: 'Government', icon: <Building2 className="h-4 w-4" /> },
  { id: 'healthcare', name: 'Healthcare', icon: <Heart className="h-4 w-4" /> },
  { id: 'custom', name: 'Custom', icon: <Code className="h-4 w-4" /> },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getCategoryIcon = (category: TemplateCategory): React.ReactNode => {
  const info = categoryInfo.find(c => c.id === category);
  return info?.icon || <Globe className="h-4 w-4" />;
};

const getCategoryName = (category: TemplateCategory): string => {
  const info = categoryInfo.find(c => c.id === category);
  return info?.name || 'Custom';
};

const formatNumber = (num: number): string => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TemplateCardProps {
  template: ExtractionTemplate;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onUse: (template: ExtractionTemplate) => void;
  onEdit: (template: ExtractionTemplate) => void;
  onDuplicate: (template: ExtractionTemplate) => void;
  onDelete: (template: ExtractionTemplate) => void;
}

function TemplateCard({
  template,
  isFavorite,
  onToggleFavorite,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
}: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <Card className="template-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="template-category-icon">
              {getCategoryIcon(template.category)}
            </div>
            <Badge variant="secondary" className="text-xs">
              {getCategoryName(template.category)}
            </Badge>
            {template.isPublic && (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                Public
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onToggleFavorite(template.id)}
            >
              {isFavorite ? (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              ) : (
                <StarOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMenu(!showMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="template-menu">
                  <button onClick={() => { onEdit(template); setShowMenu(false); }}>
                    <Edit className="h-4 w-4" /> Edit
                  </button>
                  <button onClick={() => { onDuplicate(template); setShowMenu(false); }}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </button>
                  <button className="danger" onClick={() => { onDelete(template); setShowMenu(false); }}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 className="font-semibold mb-1">{template.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {template.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            {formatNumber(template.usageCount)} uses
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {Math.round(template.successRate * 100)}% success
          </span>
          <span className="flex items-center gap-1">
            v{template.version}
          </span>
        </div>

        {template.author && (
          <p className="text-xs text-muted-foreground mb-3">
            By {template.author}
          </p>
        )}

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onUse(template)}>
            <Play className="h-4 w-4 mr-1" />
            Use Template
          </Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(template)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface ExtractionTemplatesProps {
  onClose?: () => void;
  onTemplateSelect?: (template: ExtractionTemplate) => void;
}

export function ExtractionTemplates({ onClose: _onClose, onTemplateSelect }: ExtractionTemplatesProps) {
  const [templates, setTemplates] = useState<ExtractionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const backendConfig = await invoke<BackendTemplatesConfig>('get_extraction_templates_config');
        
        if (backendConfig.templates && backendConfig.templates.length > 0) {
          const convertedTemplates = backendConfig.templates.map(convertBackendTemplateToExtractionTemplate);
          setTemplates(convertedTemplates);
          
          const favIds = convertedTemplates.filter(t => t.usageCount > 1000).map(t => t.id);
          setFavorites(new Set(favIds));
        }
      } catch (error) {
        log.error('Failed to fetch templates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load extraction templates',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [toast]);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesFavorite = !showOnlyFavorites || favorites.has(template.id);
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleUse = useCallback((template: ExtractionTemplate) => {
    onTemplateSelect?.(template);
    toast({
      title: 'Template Loaded',
      description: `${template.name} is ready to use`,
    });
  }, [onTemplateSelect, toast]);

  const handleEdit = useCallback((template: ExtractionTemplate) => {
    toast({
      title: 'Edit Template',
      description: `Opening ${template.name} for editing`,
    });
  }, [toast]);

  const handleDuplicate = useCallback((template: ExtractionTemplate) => {
    const duplicate: ExtractionTemplate = {
      ...template,
      id: `tmpl-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      isPublic: false,
    };
    setTemplates(prev => [...prev, duplicate]);
    toast({
      title: 'Template Duplicated',
      description: 'A copy of the template has been created',
    });
  }, [toast]);

  const handleDelete = useCallback(async (template: ExtractionTemplate) => {
    try {
      await invoke('delete_extraction_template', { templateId: template.id });
      setTemplates(prev => prev.filter(t => t.id !== template.id));
      toast({
        title: 'Template Deleted',
        description: `${template.name} has been deleted`,
      });
    } catch (error) {
      log.error('Failed to delete template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="extraction-templates">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="extraction-templates">
      {/* Header */}
      <div className="templates-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Extraction Templates</h2>
            <p className="text-sm text-muted-foreground">
              Pre-built templates for common extraction tasks
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {}}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="templates-filters">
        <div className="search-input">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <ScrollArea className="category-filter">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            {categoryInfo.map(cat => (
              <Button
                key={cat.id}
                size="sm"
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon}
                <span className="ml-1">{cat.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2">
          <Switch
            checked={showOnlyFavorites}
            onCheckedChange={setShowOnlyFavorites}
            id="favorites-filter"
          />
          <Label htmlFor="favorites-filter" className="text-sm cursor-pointer">
            <Star className="h-4 w-4 inline mr-1 text-yellow-500" />
            Favorites only
          </Label>
        </div>
      </div>

      {/* Template Grid */}
      <div className="templates-grid">
        {filteredTemplates.length === 0 ? (
          <div className="empty-state">
            <FileText className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium">No Templates Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Create your first template'}
            </p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              isFavorite={favorites.has(template.id)}
              onToggleFavorite={handleToggleFavorite}
              onUse={handleUse}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new extraction template from scratch or use AI to generate one
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input placeholder="My Extraction Template" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Describe what this template extracts..." />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                {categoryInfo.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button variant="outline">
              <Sparkles className="h-4 w-4 mr-2" />
              Generate with AI
            </Button>
            <Button onClick={() => setShowCreateDialog(false)}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExtractionTemplates;
