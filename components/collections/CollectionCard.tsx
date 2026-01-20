"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CollectionManagementService, CollectionPagesService } from '@/lib/services/collections-service';
import { useToast } from '@/hooks/use-toast';
import { 
  MoreVertical, Edit, Trash2, Share2, Plus, 
  ExternalLink, Link, Globe, X, Save
} from 'lucide-react';

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

interface CollectionCardProps {
  collection: Collection;
  viewMode: "grid" | "list";
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  onUpdate: () => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  viewMode,
  onDelete,
  onShare,
  onUpdate
}) => {
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPages, setShowPages] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({
    title: collection.title,
    description: collection.description || "",
    color: collection.color
  });

  // Add page form
  const [newPage, setNewPage] = useState({
    url: "",
    title: "",
    notes: ""
  });

  const handleSaveEdit = async () => {
    try {
      await CollectionManagementService.update({
        collectionId: collection.id,
        title: editForm.title,
        description: editForm.description || undefined,
        color: editForm.color
      });

      toast({
        title: "Success",
        description: "Collection updated successfully",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update collection",
        variant: "destructive",
      });
    }
  };

  const handleAddPage = async () => {
    if (!newPage.url || !newPage.title) {
      toast({
        title: "Error",
        description: "URL and title are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await CollectionPagesService.addPage({
        collectionId: collection.id,
        url: newPage.url,
        title: newPage.title,
        favicon: undefined,
        notes: newPage.notes || undefined
      });

      toast({
        title: "Success",
        description: "Page added to collection",
      });

      setShowAddPage(false);
      setNewPage({ url: "", title: "", notes: "" });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add page",
        variant: "destructive",
      });
    }
  };

  const handleRemovePage = async (pageId: string) => {
    try {
      await CollectionPagesService.removePage(collection.id, pageId);

      toast({
        title: "Success",
        description: "Page removed from collection",
      });

      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove page",
        variant: "destructive",
      });
    }
  };

  const handleOpenPage = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isEditing) {
    return (
      <Card className="border-2" ref={(el) => { if (el) el.style.borderColor = editForm.color; }}>
        <CardHeader className="pb-4">
          <div className="space-y-3">
            <Input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Collection title"
              className="font-semibold text-lg"
            />
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              placeholder="Description..."
              className="w-full px-3 py-2 border rounded-md h-20 resize-none text-sm"
            />
            <div className="flex gap-2">
              {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"].map(color => (
                <button
                  key={color}
                  onClick={() => setEditForm({ ...editForm, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all color-selector-btn ${
                    editForm.color === color ? 'border-foreground scale-110' : 'border-border'
                  }`}
                  ref={(el) => { if (el) el.style.setProperty('--selector-color', color); }}
                  title={`Select ${color} color`}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit} size="sm" className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} size="sm" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-lg transition-shadow border-l-4 collection-card-list" ref={(el) => { if (el) el.style.setProperty('--collection-color', collection.color); }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl collection-avatar"
                     ref={(el) => { if (el) el.style.setProperty('--collection-color', collection.color); }}>
                  {collection.title[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{collection.title}</h3>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground">{collection.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{collection.pages.length} pages</span>
                    <span>Created {formatDate(collection.created_at)}</span>
                    {collection.is_shared && (
                      <Badge variant="outline" className="gap-1">
                        <Share2 className="h-3 w-3" />
                        Shared
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPages(!showPages)}
              >
                {showPages ? 'Hide' : 'Show'} Pages
              </Button>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-popover border rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => { setShowAddPage(true); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Page
                    </button>
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => { onShare(collection.id); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      {collection.is_shared ? 'Unshare' : 'Share'}
                    </button>
                    <button
                      onClick={() => { onDelete(collection.id); setShowMenu(false); }}
                      className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showPages && collection.pages.length > 0 && (
            <div className="mt-4 pt-4 border-t space-y-2">
              {collection.pages.map(page => (
                <div key={page.id} className="flex items-center justify-between p-2 hover:bg-accent rounded">
                  <div className="flex items-center gap-2 flex-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate">{page.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPage(page.url)}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePage(page.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <>
      <Card className="hover:shadow-xl transition-all cursor-pointer group collection-card-grid" onClick={() => setShowPages(true)}>
        <CardHeader className="pb-3" ref={(el) => { if (el) el.style.setProperty('--collection-header-color', collection.color + '20'); }}>
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg collection-avatar"
                 ref={(el) => { if (el) el.style.setProperty('--collection-color', collection.color); }}>
              {collection.title[0].toUpperCase()}
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-popover border rounded-lg shadow-lg z-10"
                     onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { setShowAddPage(true); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Page
                  </button>
                  <button
                    onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onShare(collection.id); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    {collection.is_shared ? 'Unshare' : 'Share'}
                  </button>
                  <button
                    onClick={() => { onDelete(collection.id); setShowMenu(false); }}
                    className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg mb-1">{collection.title}</h3>
          {collection.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {collection.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Link className="h-3 w-3" />
              <span>{collection.pages.length} pages</span>
            </div>
            {collection.is_shared && (
              <Badge variant="outline" className="gap-1">
                <Share2 className="h-3 w-3" />
                Shared
              </Badge>
            )}
          </div>

          {collection.pages.length > 0 && (
            <div className="mt-3 flex -space-x-2">
              {collection.pages.slice(0, 5).map((page) => (
                <div
                  key={page.id}
                  className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs"
                  title={page.title}
                >
                  {page.favicon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={page.favicon} alt="" className="w-4 h-4" />
                  ) : (
                    <Globe className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
              {collection.pages.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold">
                  +{collection.pages.length - 5}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pages Modal */}
      {showPages && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
             onClick={() => setShowPages(false)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-4" ref={(el) => { if (el) el.style.backgroundColor = collection.color + '20'; }}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{collection.title}</h2>
                  {collection.description && (
                    <p className="text-muted-foreground mt-1">{collection.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {collection.pages.length} pages • Created {formatDate(collection.created_at)}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowPages(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-2">
                <Button
                  onClick={() => setShowAddPage(true)}
                  variant="outline"
                  className="w-full mb-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Page to Collection
                </Button>

                {collection.pages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pages in this collection yet
                  </p>
                ) : (
                  collection.pages.map(page => (
                    <Card key={page.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold">{page.title}</h4>
                            <p className="text-xs text-muted-foreground truncate mt-1">{page.url}</p>
                            {page.notes && (
                              <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                                {page.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Added {formatDate(page.date_added)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPage(page.url)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemovePage(page.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Page Modal */}
      {showAddPage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
             onClick={() => setShowAddPage(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <h3 className="text-xl font-bold">Add Page to Collection</h3>
              <p className="text-sm text-muted-foreground">{collection.title}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">URL *</label>
                <Input
                  placeholder="https://example.com"
                  value={newPage.url}
                  onChange={(e) => setNewPage({ ...newPage, url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="Page title"
                  value={newPage.title}
                  onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <textarea
                  placeholder="Optional notes..."
                  value={newPage.notes}
                  onChange={(e) => setNewPage({ ...newPage, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md h-20 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPage} className="flex-1">
                  Add Page
                </Button>
                <Button variant="outline" onClick={() => setShowAddPage(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
