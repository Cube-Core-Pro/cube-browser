/**
 * Playlist Manager Component - Playlist and media library management
 * CUBE Nexum Platform v2.0
 */

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('PlaylistManager');

import React, { useState, useMemo } from 'react';
import {
  Playlist,
  MediaItem,
  PlaylistSortBy,
  sortPlaylistItems,
  searchMediaItems,
  MediaSearchQuery,
  formatDuration,
  calculatePlaylistDuration,
  generateId,
} from '../../types/media';
import './PlaylistManager.css';

interface PlaylistManagerProps {
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  currentItem: MediaItem | null;
  onPlaylistSelect: (playlist: Playlist) => void;
  onItemSelect: (item: MediaItem) => void;
  onPlaylistCreate: (playlist: Playlist) => void;
  onPlaylistDelete: (id: string) => void;
  onPlaylistUpdate: (playlist: Playlist) => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  currentPlaylist,
  currentItem,
  onPlaylistSelect,
  onItemSelect,
  onPlaylistCreate,
  onPlaylistDelete,
  onPlaylistUpdate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<PlaylistSortBy>('title');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const sortedItems = useMemo(() => {
    if (!currentPlaylist) return [];
    
    let items = [...currentPlaylist.items];

    // Search
    if (searchQuery) {
      const query: MediaSearchQuery = { query: searchQuery };
      items = searchMediaItems(items, query);
    }

    // Sort
    items = sortPlaylistItems(items, sortBy);

    return items;
  }, [currentPlaylist, searchQuery, sortBy]);

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: generateId(),
      name: newPlaylistName.trim(),
      items: [],
      current_index: 0,
      shuffle_enabled: false,
      repeat_mode: 'off',
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    onPlaylistCreate(newPlaylist);
    setNewPlaylistName('');
    setShowCreateDialog(false);
  };

  const handleDeletePlaylist = (id: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      onPlaylistDelete(id);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (!currentPlaylist) return;

    const updated: Playlist = {
      ...currentPlaylist,
      items: currentPlaylist.items.filter((item) => item.id !== itemId),
      updated_at: Date.now(),
    };

    onPlaylistUpdate(updated);
  };

  const handleAddFiles = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Media Files',
          extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'mp3', 'wav', 'flac', 'ogg', 'm4a']
        }]
      });
      
      if (selected && currentPlaylist) {
        const files = Array.isArray(selected) ? selected : [selected];
        const newItems: MediaItem[] = files.map((filePath) => {
          const fileName = filePath.split('/').pop() || 'Unknown';
          const ext = fileName.split('.').pop()?.toLowerCase() || 'mp4';
          const isAudio = ['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext);
          
          return {
            id: generateId(),
            title: fileName.replace(/\.[^/.]+$/, ''),
            file_path: filePath,
            file_size: 0,
            format: ext as MediaItem['format'],
            type: isAudio ? 'audio' : 'video',
            duration: 0,
            metadata: {
              bitrate: 0,
              sample_rate: 0,
              channels: 2
            }
          } as MediaItem;
        });
        
        const updated: Playlist = {
          ...currentPlaylist,
          items: [...currentPlaylist.items, ...newItems],
          updated_at: Date.now()
        };
        
        onPlaylistUpdate(updated);
      }
    } catch (error) {
      log.error('Failed to open file picker:', error);
    }
  };

  return (
    <div className="playlist-manager">
      <div className="playlist-sidebar">
        <div className="sidebar-header">
          <h3>Playlists</h3>
          <button
            className="icon-btn"
            onClick={() => setShowCreateDialog(true)}
            title="Create Playlist"
          >
            +
          </button>
        </div>

        <div className="playlist-list">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className={`playlist-item ${currentPlaylist?.id === playlist.id ? 'active' : ''}`}
              onClick={() => onPlaylistSelect(playlist)}
            >
              <div className="playlist-info">
                <span className="playlist-name">{playlist.name}</span>
                <span className="playlist-count">{playlist.items.length} items</span>
              </div>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePlaylist(playlist.id);
                }}
                title="Delete Playlist"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="playlist-content">
        {currentPlaylist ? (
          <>
            <div className="playlist-header">
              <div className="playlist-title">
                <h2>{currentPlaylist.name}</h2>
                <span className="playlist-stats">
                  {currentPlaylist.items.length} items • {formatDuration(calculatePlaylistDuration(currentPlaylist))}
                </span>
              </div>
              <div className="playlist-actions">
                <button className="action-btn" onClick={handleAddFiles}>
                  <span className="icon">📁</span>
                  Add Files
                </button>
              </div>
            </div>

            <div className="playlist-toolbar">
              <input
                type="text"
                placeholder="Search in playlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                aria-label="Search in playlist"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as PlaylistSortBy)}
                className="sort-select"
                title="Sort playlist by"
                aria-label="Sort playlist by"
              >
                <option value="title">Sort by Title</option>
                <option value="artist">Sort by Artist</option>
                <option value="album">Sort by Album</option>
                <option value="duration">Sort by Duration</option>
                <option value="date_added">Sort by Date Added</option>
              </select>
            </div>

            <div className="items-list">
              {sortedItems.length === 0 ? (
                <div className="empty-state">
                  <p>No items in playlist</p>
                  <button onClick={handleAddFiles}>Add Files</button>
                </div>
              ) : (
                <table className="items-table">
                  <thead>
                    <tr>
                      <th className="col-play"></th>
                      <th className="col-title">Title</th>
                      <th className="col-artist">Artist</th>
                      <th className="col-album">Album</th>
                      <th className="col-duration">Duration</th>
                      <th className="col-actions"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((item) => (
                      <tr
                        key={item.id}
                        className={`item-row ${currentItem?.id === item.id ? 'playing' : ''}`}
                        onDoubleClick={() => onItemSelect(item)}
                      >
                        <td className="col-play">
                          <button
                            className="play-btn"
                            onClick={() => onItemSelect(item)}
                            title="Play"
                          >
                            {currentItem?.id === item.id ? '⏸️' : '▶️'}
                          </button>
                        </td>
                        <td className="col-title">
                          <div className="item-title">
                            <span className="title">{item.title}</span>
                            <span className="format">{item.format.toUpperCase()}</span>
                          </div>
                        </td>
                        <td className="col-artist">{item.artist || '-'}</td>
                        <td className="col-album">{item.album || '-'}</td>
                        <td className="col-duration">{formatDuration(item.duration)}</td>
                        <td className="col-actions">
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove from Playlist"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="no-playlist-selected">
            <p>Select a playlist or create a new one</p>
          </div>
        )}
      </div>

      {showCreateDialog && (
        <div className="dialog-overlay" onClick={() => setShowCreateDialog(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Create Playlist</h3>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              autoFocus
            />
            <div className="dialog-actions">
              <button onClick={() => setShowCreateDialog(false)}>Cancel</button>
              <button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
