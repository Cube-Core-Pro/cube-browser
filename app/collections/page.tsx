"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import { AppLayout } from "@/components/layout";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Plus, Search, Grid, List, Share2, 
  Folder, Sparkles
} from "lucide-react";

interface Collection {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon?: string;
  pages: CollectionPage[];
  created_at: number;
  updated_at: number;
  is_shared: boolean;
  share_code?: string;
}

interface CollectionPage {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  preview_image?: string;
  notes?: string;
  date_added: number;
}

interface CollectionsStats {
  total_collections: number;
  total_pages: number;
  shared: number;
}

export default function CollectionsPage() {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<CollectionsStats>({ 
    total_collections: 0, 
    total_pages: 0, 
    shared: 0 
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const { confirm } = useConfirm();

  // New collection form
  const [newCollection, setNewCollection] = useState({
    title: "",
    description: "",
    color: "#3B82F6"
  });

  useEffect(() => {
    loadCollections();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const allCollections: Collection[] = await invoke('get_all_collections');
      setCollections(allCollections);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const collectionStats: CollectionsStats = await invoke('get_collections_stats');
      setStats(collectionStats);
    } catch (error) {
      log.error('Failed to load stats:', error);
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollection.title.trim()) {
      toast({
        title: "Error",
        description: "Collection title is required",
        variant: "destructive",
      });
      return;
    }

    try {
      await invoke('create_collection', {
        title: newCollection.title,
        description: newCollection.description || undefined,
        color: newCollection.color
      });

      toast({
        title: "Success",
        description: "Collection created successfully",
      });

      setShowNewDialog(false);
      setNewCollection({ title: "", description: "", color: "#3B82F6" });
      loadCollections();
      loadStats();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create collection",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCollection = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Collection',
      description: 'Are you sure you want to delete this collection? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await invoke('delete_collection', { collectionId: id });
      toast({
        title: "Success",
        description: "Collection deleted successfully",
      });
      loadCollections();
      loadStats();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete collection",
        variant: "destructive",
      });
    }
  };

  const handleShareCollection = async (id: string) => {
    try {
      const shareCode: string = await invoke('share_collection', { collectionId: id });
      toast({
        title: "Collection Shared",
        description: `Share code: ${shareCode}`,
      });
      loadCollections();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share collection",
        variant: "destructive",
      });
    }
  };

  const filteredCollections = collections.filter(collection => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.title.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query) ||
      collection.pages.some(page => 
        page.title.toLowerCase().includes(query) ||
        page.url.toLowerCase().includes(query)
      )
    );
  });

  const PRESET_COLORS = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
    "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
  ];

  return (
    <AppLayout tier="elite">
      <div className="h-full w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Folder className="h-8 w-8 text-blue-600" />
              Collections
            </h1>
            <p className="text-muted-foreground mt-1">
              Organize your browsing by topics, projects, or interests
            </p>
          </div>
          <Button
            onClick={() => setShowNewDialog(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
          >
            <Plus className="mr-2 h-5 w-5" />
            New Collection
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Collections</CardDescription>
              <CardTitle className="text-3xl">{stats.total_collections}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Pages Saved</CardDescription>
              <CardTitle className="text-3xl">{stats.total_pages}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Shared Collections</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                {stats.shared}
                {stats.shared > 0 && <Share2 className="h-5 w-5 text-blue-600" />}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and View Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search collections and pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collections Grid/List */}
        {loading ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Loading collections...
            </CardContent>
          </Card>
        ) : filteredCollections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first collection to organize related pages
              </p>
              <Button onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Button>
            </CardContent>
          </Card>
        ) : (
          <CollectionGrid
            collections={filteredCollections}
            viewMode={viewMode}
            onDelete={handleDeleteCollection}
            onShare={handleShareCollection}
            onUpdate={loadCollections}
          />
        )}

        {/* New Collection Dialog */}
        {showNewDialog && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 dialog-backdrop" 
              onClick={() => setShowNewDialog(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 dialog-container">
              <Card 
                className="w-full max-w-md dialog-content"
                onClick={(e) => e.stopPropagation()}
              >
              <CardHeader>
                <CardTitle>Create New Collection</CardTitle>
                <CardDescription>
                  Organize related pages by topic or project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="e.g., Research Project, Travel Plans"
                    value={newCollection.title}
                    onChange={(e) => setNewCollection({ ...newCollection, title: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    placeholder="Optional description..."
                    value={newCollection.description}
                    onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewCollection({ ...newCollection, color })}
                        className={`w-10 h-10 rounded-full border-2 transition-all color-swatch ${
                          newCollection.color === color 
                            ? 'border-gray-900 scale-110' 
                            : 'border-gray-200 hover:scale-105'
                        }`}
                        ref={(el) => { if (el) el.style.setProperty('--swatch-color', color); }}
                        aria-label={`Color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleCreateCollection}
                    disabled={!newCollection.title.trim()}
                    className="flex-1"
                  >
                    Create Collection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
