"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('Templates');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card as _Card, CardContent as _CardContent, CardDescription as _CardDescription, CardHeader as _CardHeader, CardTitle as _CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch as _Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Folder as _Folder,
  Copy,
  Trash2,
  Edit2,
  Star,
  StarOff,
  Clock,
  Tag as _Tag,
  CheckSquare,
  List,
  Table2 as _Table2,
  LayoutGrid,
  Filter,
  Download as _Download,
  Upload,
  Settings as _Settings,
  BookOpen as _BookOpen,
  Briefcase,
  GraduationCap,
  Heart,
  MoreVertical as _MoreVertical,
  Variable,
  Calendar,
  User as _User,
  Building as _Building,
  Mail as _Mail,
  Phone as _Phone,
  Globe as _Globe,
  Hash,
  Loader2,
} from 'lucide-react';
import {
  Template,
  TemplateVariable,
  TemplateInstance as _TemplateInstance,
  TemplatesConfig as _TemplatesConfig,
  TemplateCategory,
} from '@/types/knowledge-management';
import './Templates.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  content: string;
  variables: string[];
  isCustom: boolean;
  createdAt: number;
  usageCount: number;
}

interface BackendTemplatesConfig {
  templates: BackendTemplate[];
  categories: string[];
}

// Converter function
const toFrontendTemplate = (backend: BackendTemplate): Template => ({
  id: backend.id,
  name: backend.name,
  description: backend.description,
  category: backend.category as TemplateCategory,
  content: backend.content,
  variables: backend.variables.map((name, i) => ({
    id: `var-${i}`,
    name,
    type: 'text' as const,
    label: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  })),
  isFavorite: false,
  usageCount: backend.usageCount,
  createdAt: new Date(backend.createdAt * 1000),
  updatedAt: new Date(backend.createdAt * 1000),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getCategoryIcon = (category: TemplateCategory) => {
  switch (category) {
    case 'work':
      return Briefcase;
    case 'personal':
      return Heart;
    case 'education':
      return GraduationCap;
    default:
      return FileText;
  }
};

const getCategoryColor = (category: TemplateCategory): string => {
  switch (category) {
    case 'work':
      return '#3b82f6';
    case 'personal':
      return '#ec4899';
    case 'education':
      return '#22c55e';
    default:
      return '#6b7280';
  }
};

const getVariableIcon = (type: TemplateVariable['type']) => {
  switch (type) {
    case 'date':
      return Calendar;
    case 'number':
      return Hash;
    case 'select':
      return List;
    case 'list':
      return CheckSquare;
    default:
      return Variable;
  }
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TemplateCardProps {
  template: Template;
  onUse: (template: Template) => void;
  onEdit: (template: Template) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

function TemplateCard({ 
  template, 
  onUse, 
  onEdit, 
  onToggleFavorite, 
  onDelete 
}: TemplateCardProps) {
  const CategoryIcon = getCategoryIcon(template.category);
  
  return (
    <div className="template-card">
      <div className="template-header">
        <div 
          className="template-icon"
          style={{ backgroundColor: `${getCategoryColor(template.category)}15`, color: getCategoryColor(template.category) }}
        >
          <CategoryIcon className="h-5 w-5" />
        </div>
        <div className="template-info">
          <span className="template-name">{template.name}</span>
          <Badge variant="secondary" className="text-xs">
            {template.category}
          </Badge>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => onToggleFavorite(template.id)}
        >
          {template.isFavorite ? (
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          ) : (
            <StarOff className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <p className="template-description">{template.description}</p>
      
      <div className="template-variables">
        <span className="text-xs text-muted-foreground">
          {template.variables.length} variables
        </span>
        <div className="variable-pills">
          {template.variables.slice(0, 3).map(v => (
            <span key={v.id} className="variable-pill">
              {v.name}
            </span>
          ))}
          {template.variables.length > 3 && (
            <span className="variable-pill more">
              +{template.variables.length - 3}
            </span>
          )}
        </div>
      </div>
      
      <div className="template-meta">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {template.usageCount} uses
        </span>
      </div>
      
      <div className="template-actions">
        <Button size="sm" onClick={() => onUse(template)}>
          <Plus className="h-4 w-4 mr-1" />
          Use Template
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(template)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDelete(template.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface VariableInputProps {
  variable: TemplateVariable;
  value: string;
  onChange: (value: string) => void;
}

function VariableInput({ variable, value, onChange }: VariableInputProps) {
  const Icon = getVariableIcon(variable.type);
  
  return (
    <div className="variable-input">
      <Label className="flex items-center gap-2">
        <Icon className="h-3 w-3 text-muted-foreground" />
        {variable.label}
        {variable.required && <span className="text-destructive">*</span>}
      </Label>
      
      {variable.type === 'textarea' ? (
        <Textarea
          placeholder={variable.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : variable.type === 'select' && variable.options ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${variable.label}`} />
          </SelectTrigger>
          <SelectContent>
            {variable.options.map((opt, i) => (
              <SelectItem key={i} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : variable.type === 'date' ? (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : variable.type === 'number' ? (
        <Input
          type="number"
          placeholder={variable.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          type="text"
          placeholder={variable.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      
      {variable.description && (
        <p className="text-xs text-muted-foreground mt-1">{variable.description}</p>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface TemplatesProps {
  onClose?: () => void;
  onApplyTemplate?: (content: string) => void;
}

export function Templates({ onClose: _onClose, onApplyTemplate }: TemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isUseDialogOpen, setIsUseDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const config = await invoke<BackendTemplatesConfig>('get_templates_config');
        setTemplates(config.templates.map(toFrontendTemplate));
      } catch (err) {
        log.error('Failed to fetch templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const filteredTemplates = useMemo(() => {
    let result = templates;
    
    if (searchQuery) {
      result = result.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }
    
    return result;
  }, [templates, searchQuery, selectedCategory]);

  const favoriteTemplates = templates.filter(t => t.isFavorite);

  const handleUseTemplate = useCallback((template: Template) => {
    setSelectedTemplate(template);
    const initialValues: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v.defaultValue !== undefined) {
        const defaultVal = String(v.defaultValue);
        initialValues[v.name] = defaultVal === '{{today}}' 
          ? new Date().toISOString().split('T')[0]
          : defaultVal;
      } else {
        initialValues[v.name] = '';
      }
    });
    setVariableValues(initialValues);
    setIsUseDialogOpen(true);
  }, []);

  const handleApplyTemplate = useCallback(() => {
    if (!selectedTemplate) return;

    let content = selectedTemplate.content;
    Object.entries(variableValues).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });

    onApplyTemplate?.(content);
    setIsUseDialogOpen(false);
    
    setTemplates(prev => prev.map(t => 
      t.id === selectedTemplate.id 
        ? { ...t, usageCount: (t.usageCount ?? 0) + 1 }
        : t
    ));

    toast({
      title: 'Template Applied',
      description: `"${selectedTemplate.name}" has been applied`,
    });
  }, [selectedTemplate, variableValues, onApplyTemplate, toast]);

  const handleToggleFavorite = useCallback((id: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  }, []);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    try {
      await invoke('delete_template', { templateId: id });
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Template Deleted' });
    } catch (err) {
      log.error('Failed to delete template:', err);
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="templates">
      {/* Header */}
      <div className="templates-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Templates</h2>
            <p className="text-sm text-muted-foreground">
              {templates.length} templates available
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="templates-controls">
          <TabsList>
            <TabsTrigger value="browse">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="favorites">
              <Star className="h-4 w-4 mr-2" />
              Favorites ({favoriteTemplates.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="search-container">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <Select 
              value={selectedCategory}
              onValueChange={(v) => setSelectedCategory(v as TemplateCategory | 'all')}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="education">Education</SelectItem>
              </SelectContent>
            </Select>

            <div className="view-toggle">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="browse">
          <div className={`templates-grid ${viewMode}`}>
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
                onEdit={() => toast({ title: 'Edit Template', description: template.name })}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="empty-state">
              <FileText className="h-12 w-12" />
              <h3>No templates found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites">
          <div className={`templates-grid ${viewMode}`}>
            {favoriteTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUseTemplate}
                onEdit={() => toast({ title: 'Edit Template', description: template.name })}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDeleteTemplate}
              />
            ))}
          </div>
          
          {favoriteTemplates.length === 0 && (
            <div className="empty-state">
              <Star className="h-12 w-12" />
              <h3>No favorites yet</h3>
              <p>Star templates to add them to favorites</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Use Template Dialog */}
      <Dialog open={isUseDialogOpen} onOpenChange={setIsUseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Use Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Fill in the variables to generate your content
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4 py-4">
              {selectedTemplate?.variables.map(variable => (
                <VariableInput
                  key={variable.id}
                  variable={variable}
                  value={variableValues[variable.name] || ''}
                  onChange={(value) => setVariableValues(prev => ({
                    ...prev,
                    [variable.name]: value
                  }))}
                />
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyTemplate}>
              <Copy className="h-4 w-4 mr-2" />
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Templates;
