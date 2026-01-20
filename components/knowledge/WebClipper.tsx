"use client";

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('WebClipper');

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea as _Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog as _Dialog,
  DialogContent as _DialogContent,
  DialogDescription as _DialogDescription,
  DialogFooter as _DialogFooter,
  DialogHeader as _DialogHeader,
  DialogTitle as _DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Scissors,
  Globe,
  FileText,
  Image,
  Link2 as _Link2,
  Bookmark,
  Tag,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload as _Upload,
  Settings,
  Folder,
  Star,
  StarOff,
  ExternalLink,
  Highlighter,
  StickyNote as _StickyNote,
  CheckSquare as _CheckSquare,
  Copy,
  MoreVertical as _MoreVertical,
  Filter as _Filter,
  LayoutGrid,
  List,
  RefreshCcw as _RefreshCcw,
  Archive,
  Share2 as _Share2,
  Eye as _Eye,
  EyeOff as _EyeOff,
  Loader2 as _Loader2,
} from 'lucide-react';
import {
  WebClip,
  ClipperRule,
  WebClipperConfig,
  ClipType,
  ClipFormat,
} from '@/types/knowledge-management';
import './WebClipper.css';

// ============================================================================
// BACKEND INTERFACES
// ============================================================================

interface BackendWebClip {
  id: string;
  title: string;
  url: string;
  content: string;
  clipType: string;
  tags: string[];
  createdAt: number;
  thumbnail: string | null;
}

interface BackendWebClipperConfig {
  clips: BackendWebClip[];
  defaultFolder: string;
  autoTag: boolean;
}

const toFrontendClip = (backend: BackendWebClip): WebClip => ({
  id: backend.id,
  url: backend.url,
  title: backend.title,
  type: (backend.clipType as ClipType) || 'article',
  format: 'markdown' as ClipFormat,
  content: backend.content,
  excerpt: backend.content.substring(0, 150),
  thumbnail: backend.thumbnail || undefined,
  tags: backend.tags,
  folder: 'Clips',
  isFavorite: false,
  isArchived: false,
  createdAt: new Date(backend.createdAt * 1000),
  updatedAt: new Date(backend.createdAt * 1000),
});

// Static rules (backend for rules not yet implemented)
const staticRules: ClipperRule[] = [
  {
    id: 'rule-1',
    name: 'GitHub Repositories',
    urlPattern: 'github.com/*',
    clipType: 'article',
    clipFormat: 'markdown',
    autoTag: ['github', 'code'],
    autoFolder: 'Development',
    isEnabled: true,
  },
  {
    id: 'rule-2',
    name: 'Documentation Sites',
    urlPattern: 'docs.*',
    clipType: 'page',
    clipFormat: 'html',
    autoTag: ['docs'],
    autoFolder: 'Documentation',
    isEnabled: true,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getTypeIcon = (type: ClipType) => {
  switch (type) {
    case 'article':
      return FileText;
    case 'page':
      return Globe;
    case 'selection':
      return Highlighter;
    case 'image':
      return Image;
    case 'video':
      return FileText;
    case 'bookmark':
      return Bookmark;
    default:
      return FileText;
  }
};

const getTypeColor = (type: ClipType): string => {
  switch (type) {
    case 'article':
      return '#3b82f6';
    case 'page':
      return '#22c55e';
    case 'selection':
      return '#f59e0b';
    case 'image':
      return '#ec4899';
    case 'video':
      return '#8b5cf6';
    case 'bookmark':
      return '#6366f1';
    default:
      return '#6b7280';
  }
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ClipCardProps {
  clip: WebClip;
  onView: (clip: WebClip) => void;
  onToggleFavorite: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

function ClipCard({ clip, onView, onToggleFavorite, onArchive, onDelete }: ClipCardProps) {
  const TypeIcon = getTypeIcon(clip.type);
  
  return (
    <div className="clip-card" onClick={() => onView(clip)}>
      {clip.thumbnail && (
        <div className="clip-thumbnail">
          <img src={clip.thumbnail} alt="" />
        </div>
      )}
      
      <div className="clip-content">
        <div className="clip-header">
          <div 
            className="clip-type-icon"
            style={{ backgroundColor: `${getTypeColor(clip.type)}15`, color: getTypeColor(clip.type) }}
          >
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="clip-info">
            <span className="clip-title">{clip.title}</span>
            <a 
              href={clip.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="clip-url"
              onClick={(e) => e.stopPropagation()}
            >
              {new URL(clip.url).hostname}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(clip.id); }}
          >
            {clip.isFavorite ? (
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {clip.excerpt && (
          <p className="clip-excerpt">{clip.excerpt}</p>
        )}
        
        {clip.highlights && clip.highlights.length > 0 && (
          <div className="clip-highlights">
            <Highlighter className="h-3 w-3 text-amber-500" />
            <span className="text-xs">{clip.highlights.length} highlights</span>
          </div>
        )}
        
        <div className="clip-meta">
          <div className="clip-tags">
            {clip.tags?.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {clip.tags && clip.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{clip.tags.length - 3}
              </Badge>
            )}
          </div>
          <span className="clip-time">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(clip.createdAt)}
          </span>
        </div>
      </div>
      
      <div className="clip-actions" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost">
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onArchive(clip.id)}>
          <Archive className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(clip.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface RuleCardProps {
  rule: ClipperRule;
  onToggle: (id: string) => void;
  onEdit: (rule: ClipperRule) => void;
  onDelete: (id: string) => void;
}

function RuleCard({ rule, onToggle, onEdit, onDelete }: RuleCardProps) {
  return (
    <div className={`rule-card ${rule.isEnabled ? '' : 'disabled'}`}>
      <div className="rule-header">
        <div className="rule-info">
          <span className="rule-name">{rule.name}</span>
          <code className="rule-pattern">{rule.urlPattern}</code>
        </div>
        <Switch
          checked={rule.isEnabled}
          onCheckedChange={() => onToggle(rule.id)}
        />
      </div>
      
      <div className="rule-config">
        <Badge variant="outline">
          {rule.clipType}
        </Badge>
        <Badge variant="outline">
          {rule.clipFormat}
        </Badge>
        {rule.autoFolder && (
          <Badge variant="secondary">
            <Folder className="h-3 w-3 mr-1" />
            {rule.autoFolder}
          </Badge>
        )}
      </div>
      
      {rule.autoTag && rule.autoTag.length > 0 && (
        <div className="rule-tags">
          <Tag className="h-3 w-3 text-muted-foreground" />
          {rule.autoTag.map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
      )}
      
      <div className="rule-actions">
        <Button size="sm" variant="ghost" onClick={() => onEdit(rule)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(rule.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export interface WebClipperProps {
  onClose?: () => void;
  onClipSelected?: (clip: WebClip) => void;
}

export function WebClipper({ onClose: _onClose, onClipSelected }: WebClipperProps) {
  const [config, setConfig] = useState<WebClipperConfig>({
    enabled: true,
    defaultFormat: 'markdown',
    defaultClipType: 'article',
    defaultFolder: 'Clips',
    autoTagFromDomain: true,
    autoExtractMetadata: true,
    extractMetadata: true,
    saveImages: true,
    imageQuality: 'high',
    cleanContent: true,
    cleanupContent: true,
    removeAds: true,
    simplifyLayout: true,
    rules: staticRules,
    hotkey: 'Ctrl+Shift+C',
    autoSave: true,
    saveHighlights: true,
  });
  const [clips, setClips] = useState<WebClip[]>([]);
  const [_loading, setLoading] = useState(true);
  const [rules, setRules] = useState<ClipperRule[]>(staticRules);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ClipType | 'all'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeTab, setActiveTab] = useState('clips');
  const [_selectedClip, setSelectedClip] = useState<WebClip | null>(null);
  const { toast } = useToast();

  // Fetch clips from backend
  useEffect(() => {
    const fetchClips = async () => {
      try {
        const config = await invoke<BackendWebClipperConfig>('get_web_clipper_config');
        setClips(config.clips.map(toFrontendClip));
      } catch (err) {
        log.error('Failed to fetch web clips:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchClips();
  }, []);

  const folders = useMemo(() => {
    const folderSet = new Set(clips.map(c => c.folder).filter(Boolean) as string[]);
    return ['all', ...Array.from(folderSet)];
  }, [clips]);

  const filteredClips = useMemo(() => {
    let result = clips.filter(c => !c.isArchived);
    
    if (searchQuery) {
      result = result.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedType !== 'all') {
      result = result.filter(c => c.type === selectedType);
    }
    
    if (selectedFolder !== 'all') {
      result = result.filter(c => c.folder === selectedFolder);
    }
    
    return result;
  }, [clips, searchQuery, selectedType, selectedFolder]);

  const stats = useMemo(() => ({
    total: clips.length,
    favorites: clips.filter(c => c.isFavorite).length,
    archived: clips.filter(c => c.isArchived).length,
    highlights: clips.reduce((acc, c) => acc + (c.highlights?.length || 0), 0),
  }), [clips]);

  const handleToggleFavorite = useCallback((id: string) => {
    setClips(prev => prev.map(c =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite } : c
    ));
  }, []);

  const handleArchiveClip = useCallback((id: string) => {
    setClips(prev => prev.map(c =>
      c.id === id ? { ...c, isArchived: true } : c
    ));
    toast({ title: 'Clip Archived' });
  }, [toast]);

  const handleDeleteClip = useCallback(async (id: string) => {
    try {
      await invoke('delete_web_clip', { clipId: id });
      setClips(prev => prev.filter(c => c.id !== id));
      toast({ title: 'Clip Deleted' });
    } catch (err) {
      log.error('Failed to delete clip:', err);
    }
  }, [toast]);

  const handleToggleRule = useCallback((id: string) => {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, isEnabled: !r.isEnabled } : r
    ));
  }, []);

  const handleDeleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Rule Deleted' });
  }, [toast]);

  return (
    <div className="web-clipper">
      {/* Header */}
      <div className="clipper-header">
        <div className="flex items-center gap-3">
          <div className="header-icon">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Web Clipper</h2>
            <p className="text-sm text-muted-foreground">
              {stats.total} clips · {stats.highlights} highlights
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Clip
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="clipper-stats">
        <div className="stat-item">
          <FileText className="h-4 w-4" />
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-item">
          <Star className="h-4 w-4 text-amber-400" />
          <span className="stat-value">{stats.favorites}</span>
          <span className="stat-label">Favorites</span>
        </div>
        <div className="stat-item">
          <Highlighter className="h-4 w-4 text-amber-500" />
          <span className="stat-value">{stats.highlights}</span>
          <span className="stat-label">Highlights</span>
        </div>
        <div className="stat-item">
          <Archive className="h-4 w-4" />
          <span className="stat-value">{stats.archived}</span>
          <span className="stat-label">Archived</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="clips">
            <FileText className="h-4 w-4 mr-2" />
            Clips ({filteredClips.length})
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Settings className="h-4 w-4 mr-2" />
            Rules ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clips">
          {/* Filters */}
          <div className="clipper-filters">
            <div className="search-container">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            <Select value={selectedType} onValueChange={(v) => setSelectedType(v as ClipType | 'all')}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="page">Pages</SelectItem>
                <SelectItem value="selection">Selections</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="bookmark">Bookmarks</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger className="w-[140px]">
                <Folder className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Folder" />
              </SelectTrigger>
              <SelectContent>
                {folders.map(folder => (
                  <SelectItem key={folder} value={folder}>
                    {folder === 'all' ? 'All Folders' : folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="view-toggle">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Clips List */}
          <ScrollArea className="h-[500px]">
            <div className={`clips-container ${viewMode}`}>
              {filteredClips.map(clip => (
                <ClipCard
                  key={clip.id}
                  clip={clip}
                  onView={(c) => { setSelectedClip(c); onClipSelected?.(c); }}
                  onToggleFavorite={handleToggleFavorite}
                  onArchive={handleArchiveClip}
                  onDelete={handleDeleteClip}
                />
              ))}
            </div>

            {filteredClips.length === 0 && (
              <div className="empty-state">
                <Scissors className="h-12 w-12" />
                <h3>No clips found</h3>
                <p>Adjust your filters or clip some content</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="rules">
          <div className="rules-header">
            <p className="text-sm text-muted-foreground">
              Automatic clipping rules based on URL patterns
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Button>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="rules-container">
              {rules.map(rule => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={handleToggleRule}
                  onEdit={() => toast({ title: 'Edit Rule', description: rule.name })}
                  onDelete={handleDeleteRule}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clipper Settings</CardTitle>
              <CardDescription>
                Configure default behavior for web clipping
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="setting-row">
                <div>
                  <Label>Default Format</Label>
                  <p className="text-sm text-muted-foreground">
                    Default format for clipped content
                  </p>
                </div>
                <Select 
                  value={config.defaultFormat}
                  onValueChange={(v) => setConfig(prev => ({ ...prev, defaultFormat: v as ClipFormat }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="text">Plain Text</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="setting-row">
                <div>
                  <Label>Auto-Save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save clips to library
                  </p>
                </div>
                <Switch
                  checked={config.autoSave}
                  onCheckedChange={(autoSave) => setConfig(prev => ({ ...prev, autoSave }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Save Highlights</Label>
                  <p className="text-sm text-muted-foreground">
                    Include text highlights with clips
                  </p>
                </div>
                <Switch
                  checked={config.saveHighlights}
                  onCheckedChange={(saveHighlights) => setConfig(prev => ({ ...prev, saveHighlights }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Extract Metadata</Label>
                  <p className="text-sm text-muted-foreground">
                    Auto-extract title, author, date
                  </p>
                </div>
                <Switch
                  checked={config.extractMetadata}
                  onCheckedChange={(extractMetadata) => setConfig(prev => ({ ...prev, extractMetadata }))}
                />
              </div>

              <div className="setting-row">
                <div>
                  <Label>Cleanup Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Remove ads, navigation, and clutter
                  </p>
                </div>
                <Switch
                  checked={config.cleanupContent}
                  onCheckedChange={(cleanupContent) => setConfig(prev => ({ ...prev, cleanupContent }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WebClipper;
