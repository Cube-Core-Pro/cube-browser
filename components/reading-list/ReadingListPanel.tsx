"use client";

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, CheckCircle, Circle, Trash2, 
  Tag, Plus, Globe, Calendar, Clock
} from 'lucide-react';

export interface ReadingListItem {
  id: string;
  url: string;
  title: string;
  author?: string;
  excerpt?: string;
  preview_text?: string;
  content?: string;
  thumbnail?: string;
  favicon?: string;
  tags: string[];
  reading_time_minutes?: number;
  progress_percentage?: number;
  is_read: boolean;
  is_favorite?: boolean;
  added_at?: number;
  date_added: number;
  read_at?: number;
  date_read?: number;
  last_opened_at?: number;
}

interface ReadingListPanelProps {
  items: ReadingListItem[];
  loading: boolean;
  onMarkAsRead: (id: string, isRead: boolean) => void;
  onRemove: (id: string) => void;
  onAddTags: (id: string, tags: string[]) => void;
}

export const ReadingListPanel: React.FC<ReadingListPanelProps> = ({
  items,
  loading,
  onMarkAsRead,
  onRemove,
  onAddTags
}) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState<{ [key: string]: string }>({});

  const handleOpenUrl = (url: string) => {
    window.open(url, '_blank');
  };

  const handleAddTag = (itemId: string) => {
    const tags = tagInput[itemId]?.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (tags && tags.length > 0) {
      onAddTags(itemId, tags);
      setTagInput(prev => ({ ...prev, [itemId]: '' }));
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading reading list...
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Globe className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items in your reading list</h3>
          <p className="text-muted-foreground">
            Save articles and pages to read later
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <Card 
          key={item.id} 
          className={`hover:shadow-lg transition-all ${
            item.is_read ? 'opacity-60' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Read/Unread Toggle */}
              <div className="flex-shrink-0 pt-1">
                <button
                  onClick={() => onMarkAsRead(item.id, !item.is_read)}
                  className="hover:scale-110 transition-transform"
                >
                  {item.is_read ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground hover:text-blue-600" />
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Title and URL */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 
                      className={`font-semibold text-lg mb-1 cursor-pointer hover:text-blue-600 ${
                        item.is_read ? 'line-through' : ''
                      }`}
                      onClick={() => handleOpenUrl(item.url)}
                    >
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Globe className="h-3 w-3" />
                      <span className="truncate">{item.url}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenUrl(item.url)}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                      title="Remove from list"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Preview Text */}
                {item.preview_text && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.preview_text}
                  </p>
                )}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Added {formatDate(item.date_added)}</span>
                  </div>
                  {item.date_read && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Read {formatTime(item.date_read)}</span>
                    </div>
                  )}
                </div>

                {/* Add Tags Section */}
                {expandedItem === item.id ? (
                  <div className="flex gap-2 pt-2 border-t">
                    <Input
                      placeholder="Add tags (comma-separated)"
                      value={tagInput[item.id] || ''}
                      onChange={(e) => setTagInput(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag(item.id)}
                      className="flex-1"
                      size={1}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddTag(item.id)}
                      disabled={!tagInput[item.id]?.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedItem(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedItem(item.id)}
                    className="mt-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tags
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
