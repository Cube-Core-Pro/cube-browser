// CUBE Nexum - Bookmarks Component
// Advanced bookmark manager with Arc-like collections

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  bookmarksService,
  Bookmark,
  BookmarkTreeNode,
  BookmarkTag,
  BookmarkStats,
  SortOrder,
  ViewMode,
  type BookmarkFilter as _BookmarkFilter,
} from '../../lib/services/browser-bookmarks-service';
import './Bookmarks.css';

interface BookmarksProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  initialTitle?: string;
  onBookmarkClick?: (bookmark: Bookmark) => void;
}

type Tab = 'all' | 'favorites' | 'recent' | 'tags' | 'folders';

export const Bookmarks: React.FC<BookmarksProps> = ({
  isOpen,
  onClose,
  initialUrl,
  initialTitle,
  onBookmarkClick,
}) => {
  // State
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [_tree, setTree] = useState<BookmarkTreeNode | null>(null);
  const [tags, setTags] = useState<BookmarkTag[]>([]);
  const [stats, setStats] = useState<BookmarkStats | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('bookmarks_bar');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('Manual');
  const [viewMode, setViewMode] = useState<ViewMode>('List');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add/Edit modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
  const [newBookmarkTags, setNewBookmarkTags] = useState<string[]>([]);
  const [newBookmarkFolder, setNewBookmarkFolder] = useState('bookmarks_bar');
  
  // Import/Export state
  const [showImportExport, setShowImportExport] = useState(false);
  
  // Load data
  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [bookmarksData, treeData, tagsData, statsData] = await Promise.all([
        bookmarksService.getAll(),
        bookmarksService.getTree(),
        bookmarksService.getAllTags(),
        bookmarksService.getStats(),
      ]);
      
      setBookmarks(bookmarksData);
      setTree(treeData);
      setTags(tagsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
      
      // Set initial values if provided
      if (initialUrl && initialTitle) {
        setNewBookmarkUrl(initialUrl);
        setNewBookmarkTitle(initialTitle);
        setShowAddModal(true);
      }
    }
  }, [isOpen, loadBookmarks, initialUrl, initialTitle]);
  
  // Filtered and sorted bookmarks
  const displayedBookmarks = useMemo(() => {
    let filtered = bookmarks.filter(b => b.bookmark_type === 'Url');
    
    // Tab filter
    switch (activeTab) {
      case 'favorites':
        filtered = filtered.filter(b => b.is_favorite);
        break;
      case 'recent':
        filtered = filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, 50);
        break;
      case 'tags':
        if (selectedTag) {
          filtered = filtered.filter(b => b.tags.includes(selectedTag));
        }
        break;
      case 'folders':
        filtered = filtered.filter(b => b.parent_id === selectedFolder);
        break;
      default:
        break;
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.url?.toLowerCase().includes(query) ||
        b.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Sort
    return bookmarksService.sortBookmarks(filtered, sortOrder);
  }, [bookmarks, activeTab, selectedTag, selectedFolder, searchQuery, sortOrder]);
  
  // Actions
  const handleAddBookmark = async () => {
    if (!newBookmarkTitle || !newBookmarkUrl) return;
    
    try {
      const bookmark = await bookmarksService.create(
        newBookmarkTitle,
        newBookmarkUrl,
        newBookmarkFolder
      );
      
      // Add tags
      for (const tag of newBookmarkTags) {
        await bookmarksService.addTag(bookmark.id, tag);
      }
      
      await loadBookmarks();
      resetAddModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add bookmark');
    }
  };
  
  const handleUpdateBookmark = async () => {
    if (!editingBookmark) return;
    
    try {
      const updated = {
        ...editingBookmark,
        title: newBookmarkTitle,
        url: newBookmarkUrl,
      };
      
      await bookmarksService.update(editingBookmark.id, updated);
      await bookmarksService.setTags(editingBookmark.id, newBookmarkTags);
      
      if (editingBookmark.parent_id !== newBookmarkFolder) {
        await bookmarksService.move(editingBookmark.id, newBookmarkFolder);
      }
      
      await loadBookmarks();
      resetAddModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
    }
  };
  
  const handleDeleteBookmark = async (id: string) => {
    try {
      await bookmarksService.delete(id);
      await loadBookmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bookmark');
    }
  };
  
  const handleToggleFavorite = async (id: string) => {
    try {
      await bookmarksService.toggleFavorite(id);
      await loadBookmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite');
    }
  };
  
  const handleBatchDelete = async () => {
    if (selectedBookmarks.size === 0) return;
    
    try {
      await bookmarksService.batchDelete(Array.from(selectedBookmarks));
      setSelectedBookmarks(new Set());
      await loadBookmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete bookmarks');
    }
  };
  
  const handleBatchMove = async (targetFolder: string) => {
    if (selectedBookmarks.size === 0) return;
    
    try {
      await bookmarksService.batchMove(Array.from(selectedBookmarks), targetFolder);
      setSelectedBookmarks(new Set());
      await loadBookmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move bookmarks');
    }
  };
  
  const handleExportJson = async () => {
    try {
      const json = await bookmarksService.exportJson();
      downloadFile(json, 'cube-bookmarks.json', 'application/json');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export bookmarks');
    }
  };
  
  const handleExportHtml = async () => {
    try {
      const html = await bookmarksService.exportHtml();
      downloadFile(html, 'cube-bookmarks.html', 'text/html');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export bookmarks');
    }
  };
  
  const handleImportJson = async (file: File) => {
    try {
      const content = await file.text();
      const result = await bookmarksService.importJson(content);
      alert(`Imported ${result.imported_count} bookmarks and ${result.folders_count} folders`);
      await loadBookmarks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import bookmarks');
    }
  };
  
  // Helpers
  const resetAddModal = () => {
    setShowAddModal(false);
    setEditingBookmark(null);
    setNewBookmarkTitle('');
    setNewBookmarkUrl('');
    setNewBookmarkTags([]);
    setNewBookmarkFolder('bookmarks_bar');
  };
  
  const openEditModal = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setNewBookmarkTitle(bookmark.title);
    setNewBookmarkUrl(bookmark.url || '');
    setNewBookmarkTags(bookmark.tags);
    setNewBookmarkFolder(bookmark.parent_id || 'bookmarks_bar');
    setShowAddModal(true);
  };
  
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const toggleBookmarkSelection = (id: string) => {
    const newSelection = new Set(selectedBookmarks);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedBookmarks(newSelection);
  };
  
  const getFoldersList = (): Bookmark[] => {
    return bookmarks.filter(b => b.bookmark_type === 'Folder');
  };
  
  const getDomainFromUrl = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="bookmarks-overlay" onClick={onClose}>
      <div className="bookmarks-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bookmarks-header">
          <div className="bookmarks-header-left">
            <span className="bookmarks-icon">⭐</span>
            <h2>Bookmarks</h2>
            {stats && (
              <span className="bookmarks-count">
                {stats.total_bookmarks} bookmarks • {stats.total_folders} folders
              </span>
            )}
          </div>
          
          <div className="bookmarks-header-actions">
            <button
              className="bookmarks-btn bookmarks-btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <span>+</span> Add Bookmark
            </button>
            <button
              className="bookmarks-btn"
              onClick={() => setShowImportExport(!showImportExport)}
            >
              📦 Import/Export
            </button>
            <button className="bookmarks-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bookmarks-tabs">
          <button
            className={`bookmarks-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📑 All
          </button>
          <button
            className={`bookmarks-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            ❤️ Favorites
          </button>
          <button
            className={`bookmarks-tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            🕐 Recent
          </button>
          <button
            className={`bookmarks-tab ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            🏷️ Tags
          </button>
          <button
            className={`bookmarks-tab ${activeTab === 'folders' ? 'active' : ''}`}
            onClick={() => setActiveTab('folders')}
          >
            📁 Folders
          </button>
        </div>
        
        {/* Search and Controls */}
        <div className="bookmarks-controls">
          <div className="bookmarks-search">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="bookmarks-sort">
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as SortOrder)}
            >
              <option value="Manual">Manual Order</option>
              <option value="Alphabetical">Alphabetical</option>
              <option value="DateAdded">Date Added</option>
              <option value="DateModified">Date Modified</option>
              <option value="VisitCount">Most Visited</option>
              <option value="RecentlyUsed">Recently Used</option>
            </select>
          </div>
          
          <div className="bookmarks-view-modes">
            <button
              className={`view-mode-btn ${viewMode === 'List' ? 'active' : ''}`}
              onClick={() => setViewMode('List')}
              title="List View"
            >
              ☰
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'Grid' ? 'active' : ''}`}
              onClick={() => setViewMode('Grid')}
              title="Grid View"
            >
              ⊞
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'Compact' ? 'active' : ''}`}
              onClick={() => setViewMode('Compact')}
              title="Compact View"
            >
              ≡
            </button>
          </div>
        </div>
        
        {/* Tag Selector (when in tags tab) */}
        {activeTab === 'tags' && (
          <div className="bookmarks-tag-selector">
            <button
              className={`tag-btn ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All Tags
            </button>
            {tags.map(tag => (
              <button
                key={tag.name}
                className={`tag-btn ${selectedTag === tag.name ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag.name)}
                style={{ borderLeftColor: tag.color }}
              >
                {tag.name} ({tag.bookmark_count})
              </button>
            ))}
          </div>
        )}
        
        {/* Folder Selector (when in folders tab) */}
        {activeTab === 'folders' && (
          <div className="bookmarks-folder-selector">
            <button
              className={`folder-btn ${selectedFolder === 'bookmarks_bar' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('bookmarks_bar')}
            >
              📁 Bookmarks Bar
            </button>
            <button
              className={`folder-btn ${selectedFolder === 'other_bookmarks' ? 'active' : ''}`}
              onClick={() => setSelectedFolder('other_bookmarks')}
            >
              📁 Other Bookmarks
            </button>
            {getFoldersList()
              .filter(f => !['root', 'bookmarks_bar', 'other_bookmarks', 'mobile_bookmarks'].includes(f.id))
              .map(folder => (
                <button
                  key={folder.id}
                  className={`folder-btn ${selectedFolder === folder.id ? 'active' : ''}`}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  📁 {folder.title}
                </button>
              ))
            }
          </div>
        )}
        
        {/* Batch Actions */}
        {selectedBookmarks.size > 0 && (
          <div className="bookmarks-batch-actions">
            <span>{selectedBookmarks.size} selected</span>
            <button onClick={handleBatchDelete}>Delete</button>
            <select onChange={e => handleBatchMove(e.target.value)}>
              <option value="">Move to...</option>
              <option value="bookmarks_bar">Bookmarks Bar</option>
              <option value="other_bookmarks">Other Bookmarks</option>
              {getFoldersList()
                .filter(f => !['root', 'bookmarks_bar', 'other_bookmarks', 'mobile_bookmarks'].includes(f.id))
                .map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.title}
                  </option>
                ))
              }
            </select>
            <button onClick={() => setSelectedBookmarks(new Set())}>Clear Selection</button>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="bookmarks-error">
            {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="bookmarks-loading">
            <div className="spinner"></div>
            Loading bookmarks...
          </div>
        )}
        
        {/* Bookmarks List */}
        <div className={`bookmarks-content bookmarks-view-${viewMode.toLowerCase()}`}>
          {displayedBookmarks.length === 0 ? (
            <div className="bookmarks-empty">
              <span className="empty-icon">📭</span>
              <p>No bookmarks found</p>
              <button
                className="bookmarks-btn bookmarks-btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                Add Your First Bookmark
              </button>
            </div>
          ) : (
            displayedBookmarks.map(bookmark => (
              <div
                key={bookmark.id}
                className={`bookmark-item ${selectedBookmarks.has(bookmark.id) ? 'selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedBookmarks.has(bookmark.id)}
                  onChange={() => toggleBookmarkSelection(bookmark.id)}
                  className="bookmark-checkbox"
                />
                
                <div
                  className="bookmark-favicon"
                  onClick={() => onBookmarkClick?.(bookmark)}
                >
                  {bookmark.favicon ? (
                    <img src={bookmark.favicon} alt="" />
                  ) : (
                    <span className="default-favicon">🌐</span>
                  )}
                </div>
                
                <div
                  className="bookmark-info"
                  onClick={() => onBookmarkClick?.(bookmark)}
                >
                  <div className="bookmark-title">{bookmark.title}</div>
                  <div className="bookmark-url">
                    {bookmark.url ? getDomainFromUrl(bookmark.url) : ''}
                  </div>
                  {bookmark.tags.length > 0 && (
                    <div className="bookmark-tags">
                      {bookmark.tags.map(tag => (
                        <span key={tag} className="bookmark-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bookmark-actions">
                  <button
                    className={`bookmark-action-btn ${bookmark.is_favorite ? 'active' : ''}`}
                    onClick={() => handleToggleFavorite(bookmark.id)}
                    title={bookmark.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {bookmark.is_favorite ? '❤️' : '🤍'}
                  </button>
                  <button
                    className="bookmark-action-btn"
                    onClick={() => openEditModal(bookmark)}
                    title="Edit bookmark"
                  >
                    ✏️
                  </button>
                  <button
                    className="bookmark-action-btn delete"
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    title="Delete bookmark"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Stats Footer */}
        {stats && (
          <div className="bookmarks-footer">
            <span>
              {stats.favorites_count} favorites • {stats.total_tags} tags
            </span>
            <span className="footer-actions">
              <button onClick={loadBookmarks}>↻ Refresh</button>
            </span>
          </div>
        )}
        
        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="bookmarks-modal-overlay" onClick={resetAddModal}>
            <div className="bookmarks-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}</h3>
                <button className="modal-close" onClick={resetAddModal}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={newBookmarkTitle}
                    onChange={e => setNewBookmarkTitle(e.target.value)}
                    placeholder="Bookmark title"
                  />
                </div>
                
                <div className="form-group">
                  <label>URL</label>
                  <input
                    type="text"
                    value={newBookmarkUrl}
                    onChange={e => setNewBookmarkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Folder</label>
                  <select
                    value={newBookmarkFolder}
                    onChange={e => setNewBookmarkFolder(e.target.value)}
                  >
                    <option value="bookmarks_bar">Bookmarks Bar</option>
                    <option value="other_bookmarks">Other Bookmarks</option>
                    {getFoldersList()
                      .filter(f => !['root', 'bookmarks_bar', 'other_bookmarks', 'mobile_bookmarks'].includes(f.id))
                      .map(folder => (
                        <option key={folder.id} value={folder.id}>
                          {folder.title}
                        </option>
                      ))
                    }
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newBookmarkTags.join(', ')}
                    onChange={e => setNewBookmarkTags(
                      e.target.value.split(',').map(t => t.trim()).filter(t => t)
                    )}
                    placeholder="work, reference, important"
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button className="bookmarks-btn" onClick={resetAddModal}>
                  Cancel
                </button>
                <button
                  className="bookmarks-btn bookmarks-btn-primary"
                  onClick={editingBookmark ? handleUpdateBookmark : handleAddBookmark}
                  disabled={!newBookmarkTitle || !newBookmarkUrl}
                >
                  {editingBookmark ? 'Save Changes' : 'Add Bookmark'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Import/Export Modal */}
        {showImportExport && (
          <div className="bookmarks-modal-overlay" onClick={() => setShowImportExport(false)}>
            <div className="bookmarks-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Import / Export Bookmarks</h3>
                <button className="modal-close" onClick={() => setShowImportExport(false)}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="import-export-section">
                  <h4>Export</h4>
                  <p>Export your bookmarks to a file</p>
                  <div className="export-buttons">
                    <button className="bookmarks-btn" onClick={handleExportJson}>
                      📄 Export as JSON
                    </button>
                    <button className="bookmarks-btn" onClick={handleExportHtml}>
                      🌐 Export as HTML
                    </button>
                  </div>
                </div>
                
                <div className="import-export-section">
                  <h4>Import</h4>
                  <p>Import bookmarks from Chrome, Firefox, Safari, or CUBE</p>
                  <div className="import-dropzone">
                    <input
                      type="file"
                      accept=".json,.html,.htm"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleImportJson(file);
                      }}
                    />
                    <span>Drop a file here or click to browse</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button
                  className="bookmarks-btn"
                  onClick={() => setShowImportExport(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;
