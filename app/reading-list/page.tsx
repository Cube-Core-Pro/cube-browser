"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import { AppLayout } from "@/components/layout";
import { ReadingListPanel, ReadingListItem } from "@/components/reading-list/ReadingListPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  Plus, Search, BookOpen, CheckCircle, 
  Clock, Filter, Tag
} from "lucide-react";

interface ReadingListStats {
  total: number;
  read: number;
  unread: number;
  total_articles?: number;
  unread_articles?: number;
  read_articles?: number;
  favorite_articles?: number;
  total_reading_time_minutes?: number;
}

export default function ReadingListPage() {
  const { t: _t } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [stats, setStats] = useState<ReadingListStats>({ total: 0, read: 0, unread: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");
  const { confirm } = useConfirm();

  // New item form
  const [newItem, setNewItem] = useState({
    url: "",
    title: "",
    preview_text: ""
  });

  useEffect(() => {
    loadReadingList();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReadingList = async () => {
    try {
      setLoading(true);
      const allItems: ReadingListItem[] = await invoke('get_all_articles');
      // Normalize field names for component compatibility
      const normalizedItems = allItems.map(item => ({
        ...item,
        date_added: item.added_at || item.date_added || 0,
        date_read: item.read_at || item.date_read,
        preview_text: item.excerpt || item.preview_text,
      }));
      setItems(normalizedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load reading list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const readingStats: ReadingListStats = await invoke('get_reading_list_stats');
      // Normalize field names
      setStats({
        total: readingStats.total_articles ?? readingStats.total ?? 0,
        read: readingStats.read_articles ?? readingStats.read ?? 0,
        unread: readingStats.unread_articles ?? readingStats.unread ?? 0,
      });
    } catch (error) {
      log.error('Failed to load stats:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.url.trim() || !newItem.title.trim()) {
      toast({
        title: "Error",
        description: "URL and title are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const article = {
        id: crypto.randomUUID(),
        url: newItem.url,
        title: newItem.title,
        excerpt: newItem.preview_text || null,
        author: null,
        content: null,
        thumbnail: null,
        tags: [],
        reading_time_minutes: null,
        progress_percentage: 0.0,
        is_read: false,
        is_favorite: false,
        added_at: Math.floor(Date.now() / 1000),
        read_at: null,
        last_opened_at: null,
      };
      await invoke('add_article', { article });

      toast({
        title: "Success",
        description: "Added to reading list",
      });

      setShowAddDialog(false);
      setNewItem({ url: "", title: "", preview_text: "" });
      loadReadingList();
      loadStats();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    try {
      if (isRead) {
        await invoke('mark_article_as_read', { id });
      } else {
        await invoke('mark_article_as_unread', { id });
      }
      loadReadingList();
      loadStats();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (id: string) => {
    const confirmed = await confirm({
      title: 'Remove Item',
      description: 'Remove this item from your reading list?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    try {
      await invoke('delete_article', { id });
      toast({
        title: "Success",
        description: "Item removed from reading list",
      });
      loadReadingList();
      loadStats();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const handleAddTags = async (id: string, newTags: string[]) => {
    try {
      // Find existing item and merge tags
      const existingItem = items.find(item => item.id === id);
      if (!existingItem) {
        throw new Error('Item not found');
      }
      const updatedTags = Array.from(new Set([...existingItem.tags, ...newTags]));
      const updatedArticle = {
        ...existingItem,
        tags: updatedTags,
        added_at: existingItem.added_at || existingItem.date_added || 0,
      };
      await invoke('update_article', { article: updatedArticle });
      loadReadingList();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add tags",
        variant: "destructive",
      });
    }
  };

  // Get all unique tags
  const allTags = Array.from(new Set(items.flatMap(item => item.tags)));

  // Filter items
  const filteredItems = items.filter(item => {
    // Tab filter
    if (activeTab === "unread" && item.is_read) return false;
    if (activeTab === "read" && !item.is_read) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !item.title.toLowerCase().includes(query) &&
        !item.url.toLowerCase().includes(query) &&
        !item.preview_text?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Tags filter
    if (filterTags.length > 0) {
      if (!filterTags.some(tag => item.tags.includes(tag))) {
        return false;
      }
    }

    return true;
  });

  return (
    <AppLayout tier="elite">
      <div className="h-full w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              Reading List
            </h1>
            <p className="text-muted-foreground mt-1">
              Save articles and pages to read later
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add to Reading List
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("all")}>
            <CardHeader className="pb-3">
              <CardDescription>Total Items</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("unread")}>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Unread
              </CardDescription>
              <CardTitle className="text-3xl text-orange-600">{stats.unread}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveTab("read")}>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Read
              </CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.read}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reading list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tag Filters */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Tags:</span>
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filterTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setFilterTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {filterTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilterTags([])}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "unread" | "read")}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread ({stats.unread})
            </TabsTrigger>
            <TabsTrigger value="read">
              Read ({stats.read})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <ReadingListPanel
              items={filteredItems}
              loading={loading}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemove}
              onAddTags={handleAddTags}
            />
          </TabsContent>

          <TabsContent value="unread" className="mt-6">
            <ReadingListPanel
              items={filteredItems}
              loading={loading}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemove}
              onAddTags={handleAddTags}
            />
          </TabsContent>

          <TabsContent value="read" className="mt-6">
            <ReadingListPanel
              items={filteredItems}
              loading={loading}
              onMarkAsRead={handleMarkAsRead}
              onRemove={handleRemove}
              onAddTags={handleAddTags}
            />
          </TabsContent>
        </Tabs>

        {/* Add Item Dialog */}
        {showAddDialog && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 dialog-backdrop" 
              onClick={() => setShowAddDialog(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 dialog-container">
              <Card 
                className="w-full max-w-md dialog-content"
                onClick={(e) => e.stopPropagation()}
              >
              <CardHeader>
                <CardTitle>Add to Reading List</CardTitle>
                <CardDescription>
                  Save an article or page to read later
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">URL *</label>
                  <Input
                    placeholder="https://example.com/article"
                    value={newItem.url}
                    onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="Article title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Preview Text</label>
                  <textarea
                    placeholder="Optional preview or notes..."
                    value={newItem.preview_text}
                    onChange={(e) => setNewItem({ ...newItem, preview_text: e.target.value })}
                    className="w-full px-4 py-2 border rounded-md h-20 resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleAddItem}
                    disabled={!newItem.url.trim() || !newItem.title.trim()}
                    className="flex-1"
                  >
                    Add to List
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
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
