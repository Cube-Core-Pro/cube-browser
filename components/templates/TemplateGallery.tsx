'use client';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('TemplateGallery');

import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Search, Filter, Grid, List, Download, Star, Clock,
  Workflow, Mail, ShoppingCart, Users, Database,
  Bot, TrendingUp, Zap,
  ChevronRight, Play, Eye, Heart, Share2, Lock,
  Tag, Award, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  industry: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  popularity: number;
  downloads: number;
  rating: number;
  reviewCount: number;
  estimatedTime: string;
  nodes: number;
  author: {
    name: string;
    verified: boolean;
    avatar?: string;
  };
  tags: string[];
  premium: boolean;
  preview?: string;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

interface TemplateGalleryProps {
  onSelectTemplate?: (template: Template) => void;
  compact?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Templates', icon: <Grid className="w-4 h-4" />, count: 156 },
  { id: 'automation', name: 'Automation', icon: <Workflow className="w-4 h-4" />, count: 42 },
  { id: 'email', name: 'Email & Outreach', icon: <Mail className="w-4 h-4" />, count: 28 },
  { id: 'data', name: 'Data Processing', icon: <Database className="w-4 h-4" />, count: 35 },
  { id: 'ecommerce', name: 'E-commerce', icon: <ShoppingCart className="w-4 h-4" />, count: 24 },
  { id: 'crm', name: 'CRM & Sales', icon: <Users className="w-4 h-4" />, count: 31 },
  { id: 'marketing', name: 'Marketing', icon: <TrendingUp className="w-4 h-4" />, count: 18 },
  { id: 'ai', name: 'AI & ML', icon: <Bot className="w-4 h-4" />, count: 22 }
];

const INDUSTRIES = [
  'All Industries',
  'Technology',
  'Finance',
  'Healthcare',
  'E-commerce',
  'Real Estate',
  'Marketing',
  'Education',
  'Legal',
  'Consulting'
];

// =============================================================================
// Component
// =============================================================================

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate,
  compact = false
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('All Industries');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await invoke<Template[]>('get_templates', {
          category: selectedCategory,
          industry: selectedIndustry,
          search: searchQuery
        });
        setTemplates(data || []);
      } catch (err) {
        log.error('Failed to load templates:', err);
        setError(err instanceof Error ? err.message : 'Failed to load templates. Please try again.');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [selectedCategory, selectedIndustry, searchQuery]);

  // Filter and sort templates
  const filteredTemplates = useMemo(() => {
    let result = [...templates];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory);
    }

    if (selectedIndustry !== 'All Industries') {
      result = result.filter(t => t.industry === selectedIndustry);
    }

    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'recent':
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [templates, searchQuery, selectedCategory, selectedIndustry, sortBy]);

  const handleUseTemplate = async (template: Template) => {
    try {
      await invoke('use_template', { templateId: template.id });
      if (onSelectTemplate) {
        onSelectTemplate(template);
      }
    } catch (error) {
      log.error('Failed to use template:', error);
    }
  };

  const toggleFavorite = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(templateId)) {
        newFavorites.delete(templateId);
      } else {
        newFavorites.add(templateId);
      }
      return newFavorites;
    });
  };

  const getDifficultyVariant = (difficulty: Template['difficulty']): 'default' | 'secondary' | 'destructive' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      beginner: 'default',
      intermediate: 'secondary',
      advanced: 'destructive'
    };
    return variants[difficulty];
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      automation: <Workflow className="w-4 h-4" />,
      email: <Mail className="w-4 h-4" />,
      data: <Database className="w-4 h-4" />,
      ecommerce: <ShoppingCart className="w-4 h-4" />,
      crm: <Users className="w-4 h-4" />,
      marketing: <TrendingUp className="w-4 h-4" />,
      ai: <Bot className="w-4 h-4" />
    };
    return icons[category] || <Workflow className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      automation: 'bg-blue-500/20 text-blue-500',
      email: 'bg-orange-500/20 text-orange-500',
      data: 'bg-green-500/20 text-green-500',
      ecommerce: 'bg-pink-500/20 text-pink-500',
      crm: 'bg-cyan-500/20 text-cyan-500',
      marketing: 'bg-yellow-500/20 text-yellow-500',
      ai: 'bg-purple-500/20 text-purple-500'
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Popular Templates</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              See All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {filteredTemplates.slice(0, 4).map(template => (
            <div
              key={template.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
              onClick={() => handleUseTemplate(template)}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", getCategoryColor(template.category))}>
                {getCategoryIcon(template.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{template.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-amber-500" />
                  <span>{template.rating}</span>
                  <span>•</span>
                  <span>{template.downloads.toLocaleString()} uses</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Workflow className="w-8 h-8 text-destructive" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">Failed to Load Templates</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setLoading(true);
            invoke<Template[]>('get_templates', {
              category: selectedCategory,
              industry: selectedIndustry,
              search: searchQuery
            })
              .then(data => setTemplates(data || []))
              .catch(err => setError(err instanceof Error ? err.message : 'Failed to load templates'))
              .finally(() => setLoading(false));
          }}
        >
          <Download className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  // Loading state
  if (loading && templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Workflow className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Template Gallery</h2>
            <p className="text-sm text-muted-foreground">{filteredTemplates.length} templates available</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? "secondary" : "ghost"}
              size="icon"
              className="rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="flex gap-4 p-4">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Industry</label>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map(industry => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Sort By</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="recent">Recently Updated</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Categories Sidebar */}
        <Card className="w-52 shrink-0 hidden lg:block">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="space-y-1">
              {CATEGORIES.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2 h-9"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.icon}
                  <span className="flex-1 text-left text-sm">{category.name}</span>
                  <Badge variant="outline" className="text-[10px] h-5">{category.count}</Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="flex-1">
          {loading ? (
            <Card className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-8 h-8 animate-pulse text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Loading templates...</p>
              </div>
            </Card>
          ) : filteredTemplates.length === 0 ? (
            <Card className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold">No templates found</h3>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            </Card>
          ) : (
            <div className={cn(
              "grid gap-4",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
            )}>
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id} 
                  className="group cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
                  onClick={() => setSelectedTemplate(template)}
                >
                  {template.premium && (
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-purple-500 to-pink-500 border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", getCategoryColor(template.category))}>
                        {getCategoryIcon(template.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{template.name}</CardTitle>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          {template.author.verified && <Award className="w-3 h-3 text-blue-500" />}
                          <span>{template.author.name}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8 shrink-0", favorites.has(template.id) && "text-red-500")}
                        onClick={(e) => toggleFavorite(template.id, e)}
                      >
                        <Heart className={cn("w-4 h-4", favorites.has(template.id) && "fill-current")} />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-3">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        {template.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {template.downloads.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {template.estimatedTime}
                      </span>
                    </div>
                    
                    <div className="flex gap-1.5 flex-wrap">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px]">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <div className="flex items-center justify-between w-full">
                      <Badge variant={getDifficultyVariant(template.difficulty)}>
                        {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)}
                      </Badge>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTemplate(template); }}>
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUseTemplate(template); }}>
                          <Play className="w-3.5 h-3.5 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template Detail Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0", getCategoryColor(selectedTemplate.category))}>
                    {getCategoryIcon(selectedTemplate.category)}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedTemplate.name}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      {selectedTemplate.author.verified && <Award className="w-4 h-4 text-blue-500" />}
                      by {selectedTemplate.author.name}
                      {selectedTemplate.premium && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 border-0">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Pro Template
                        </Badge>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="grid grid-cols-4 gap-4 py-4 border-y">
                <div className="text-center">
                  <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="font-semibold">{selectedTemplate.rating}</p>
                  <p className="text-xs text-muted-foreground">{selectedTemplate.reviewCount} reviews</p>
                </div>
                <div className="text-center">
                  <Download className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="font-semibold">{selectedTemplate.downloads.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">downloads</p>
                </div>
                <div className="text-center">
                  <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="font-semibold">{selectedTemplate.estimatedTime}</p>
                  <p className="text-xs text-muted-foreground">setup</p>
                </div>
                <div className="text-center">
                  <Workflow className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                  <p className="font-semibold">{selectedTemplate.nodes}</p>
                  <p className="text-xs text-muted-foreground">nodes</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTemplate.tags.map(tag => (
                      <Badge key={tag} variant="outline">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <span className="capitalize">{selectedTemplate.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry</span>
                    <span>{selectedTemplate.industry}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty</span>
                    <Badge variant={getDifficultyVariant(selectedTemplate.difficulty)}>
                      {selectedTemplate.difficulty}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span>{new Date(selectedTemplate.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => toggleFavorite(selectedTemplate.id, { stopPropagation: () => {} } as React.MouseEvent)}
                >
                  <Heart className={cn("w-4 h-4 mr-2", favorites.has(selectedTemplate.id) && "fill-current text-red-500")} />
                  {favorites.has(selectedTemplate.id) ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                  {selectedTemplate.premium ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Unlock with Pro
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Use This Template
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateGallery;
