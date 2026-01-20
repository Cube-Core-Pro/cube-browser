/**
 * BrowserProfiles Component
 * 
 * Comprehensive browser profile management for anti-detect browsing.
 * Provides fingerprint configuration, proxy settings, cookie management,
 * and profile import/export functionality.
 * 
 * @component
 * @example
 * ```tsx
 * <BrowserProfiles
 *   onProfileLaunch={handleLaunch}
 *   onClose={() => setShowProfiles(false)}
 * />
 * ```
 */

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './BrowserProfiles.css';

// ============================================
// Types & Interfaces
// ============================================

interface BrowserProfile {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  status: 'idle' | 'running' | 'error';
  fingerprint: FingerprintConfig;
  proxy: ProxyConfig | null;
  cookies_count: number;
  storage_size_mb: number;
  last_used: string | null;
  created_at: string;
  updated_at: string;
  tags: string[];
  notes: string;
}

interface FingerprintConfig {
  user_agent: string;
  platform: string;
  vendor: string;
  screen_resolution: string;
  color_depth: number;
  timezone: string;
  language: string;
  languages: string[];
  hardware_concurrency: number;
  device_memory: number;
  webgl_vendor: string;
  webgl_renderer: string;
  canvas_noise: boolean;
  audio_noise: boolean;
  webrtc_mode: 'real' | 'disabled' | 'fake';
  geolocation: GeolocationConfig | null;
}

interface GeolocationConfig {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface ProxyConfig {
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  rotation_url: string | null;
}

interface ProfileGroup {
  id: string;
  name: string;
  color: string;
  profile_ids: string[];
}

interface BrowserProfilesProps {
  onProfileLaunch?: (profileId: string) => void;
  onClose?: () => void;
}

type ViewMode = 'grid' | 'list';
type TabType = 'profiles' | 'groups' | 'templates';

// ============================================
// Constants
// ============================================

const PROFILE_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

const PROFILE_ICONS = [
  '🌐', '👤', '🔒', '💼', '🛒', '📱', '💻', '🎮',
  '📧', '🏢', '🎯', '🚀', '⚡', '🔥', '💎', '🌟'
];

const DEFAULT_FINGERPRINT: FingerprintConfig = {
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  platform: 'Win32',
  vendor: 'Google Inc.',
  screen_resolution: '1920x1080',
  color_depth: 24,
  timezone: 'America/New_York',
  language: 'en-US',
  languages: ['en-US', 'en'],
  hardware_concurrency: 8,
  device_memory: 8,
  webgl_vendor: 'Google Inc. (NVIDIA)',
  webgl_renderer: 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
  canvas_noise: true,
  audio_noise: true,
  webrtc_mode: 'fake',
  geolocation: null
};

// ============================================
// Component
// ============================================

export const BrowserProfiles: React.FC<BrowserProfilesProps> = ({
  onProfileLaunch = () => {},
  onClose = () => {}
}) => {
  // State
  const [profiles, setProfiles] = useState<BrowserProfile[]>([]);
  const [groups, setGroups] = useState<ProfileGroup[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<BrowserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('profiles');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<BrowserProfile> | null>(null);

  // Load profiles
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [profilesData, groupsData] = await Promise.all([
        invoke<BrowserProfile[]>('list_browser_profiles', {}),
        invoke<ProfileGroup[]>('list_profile_groups', {})
      ]);
      
      setProfiles(profilesData);
      setGroups(groupsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profiles';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Filtered profiles
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = searchQuery === '' || 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTag = filterTag === null || profile.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });

  // All unique tags
  const allTags = Array.from(new Set(profiles.flatMap(p => p.tags)));

  // Actions
  const handleCreateProfile = async () => {
    if (!editingProfile?.name) return;
    
    try {
      const newProfile = await invoke<BrowserProfile>('create_browser_profile', {
        name: editingProfile.name,
        description: editingProfile.description || '',
        color: editingProfile.color || PROFILE_COLORS[0],
        icon: editingProfile.icon || PROFILE_ICONS[0],
        fingerprint: editingProfile.fingerprint || DEFAULT_FINGERPRINT,
        proxy: editingProfile.proxy || null,
        tags: editingProfile.tags || []
      });
      
      setProfiles(prev => [...prev, newProfile]);
      setShowCreateModal(false);
      setEditingProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile?.id) return;
    
    try {
      const updated = await invoke<BrowserProfile>('update_browser_profile', {
        profileId: editingProfile.id,
        updates: {
          name: editingProfile.name,
          description: editingProfile.description,
          color: editingProfile.color,
          icon: editingProfile.icon,
          fingerprint: editingProfile.fingerprint,
          proxy: editingProfile.proxy,
          tags: editingProfile.tags,
          notes: editingProfile.notes
        }
      });
      
      setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
      setShowEditModal(false);
      setEditingProfile(null);
      if (selectedProfile?.id === updated.id) {
        setSelectedProfile(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) return;
    
    try {
      await invoke('delete_browser_profile', { profileId });
      setProfiles(prev => prev.filter(p => p.id !== profileId));
      if (selectedProfile?.id === profileId) {
        setSelectedProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete profile');
    }
  };

  const handleLaunchProfile = async (profileId: string) => {
    try {
      await invoke('launch_browser_profile', { profileId });
      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, status: 'running' as const } : p
      ));
      onProfileLaunch(profileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch profile');
      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, status: 'error' as const } : p
      ));
    }
  };

  const handleStopProfile = async (profileId: string) => {
    try {
      await invoke('stop_browser_profile', { profileId });
      setProfiles(prev => prev.map(p => 
        p.id === profileId ? { ...p, status: 'idle' as const } : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop profile');
    }
  };

  const handleDuplicateProfile = async (profileId: string) => {
    try {
      const duplicated = await invoke<BrowserProfile>('duplicate_browser_profile', { profileId });
      setProfiles(prev => [...prev, duplicated]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate profile');
    }
  };

  const handleExportProfile = async (profileId: string) => {
    try {
      const exportData = await invoke<string>('export_browser_profile', { 
        profileId,
        includeData: true 
      });
      
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-${profileId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export profile');
    }
  };

  const handleImportProfile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const imported = await invoke<BrowserProfile>('import_browser_profile', { 
          profileData: text 
        });
        setProfiles(prev => [...prev, imported]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import profile');
      }
    };
    input.click();
  };

  const handleRandomizeFingerprint = async (profileId: string) => {
    try {
      const newFingerprint = await invoke<FingerprintConfig>('generate_random_fingerprint', {});
      
      if (editingProfile) {
        setEditingProfile({
          ...editingProfile,
          fingerprint: newFingerprint
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate fingerprint');
    }
  };

  const handleTestProxy = async (proxy: ProxyConfig) => {
    try {
      const result = await invoke<{ success: boolean; latency_ms: number; ip: string }>('test_proxy', { proxy });
      alert(`Proxy test successful!\nIP: ${result.ip}\nLatency: ${result.latency_ms}ms`);
    } catch (err) {
      alert(`Proxy test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="browser-profiles">
        <div className="profiles-loading">
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span>Loading browser profiles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="browser-profiles">
      {/* Header */}
      <header className="profiles-header">
        <div className="profiles-header-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="4"/>
            <line x1="21.17" y1="8" x2="12" y2="8"/>
            <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
            <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
          </svg>
          <h2>Browser Profiles</h2>
          <span className="profile-count">{profiles.length} profiles</span>
        </div>
        <div className="profiles-header-actions">
          <button className="btn-secondary" onClick={handleImportProfile}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          <button className="btn-primary" onClick={() => {
            setEditingProfile({
              name: '',
              description: '',
              color: PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)],
              icon: PROFILE_ICONS[0],
              fingerprint: DEFAULT_FINGERPRINT,
              proxy: null,
              tags: []
            });
            setShowCreateModal(true);
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Profile
          </button>
          <button className="btn-ghost" onClick={onClose} title="Close">✕</button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="profiles-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01"/>
          </svg>
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="profiles-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text"
              placeholder="Search profiles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {allTags.length > 0 && (
            <div className="tag-filter">
              <select 
                value={filterTag || ''}
                onChange={e => setFilterTag(e.target.value || null)}
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="toolbar-right">
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="profiles-content">
        {filteredProfiles.length === 0 ? (
          <div className="profiles-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="21.17" y1="8" x2="12" y2="8"/>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
            </svg>
            <h3>No Browser Profiles</h3>
            <p>Create your first browser profile to start browsing with unique fingerprints.</p>
            <button className="btn-primary" onClick={() => {
              setEditingProfile({
                name: '',
                description: '',
                color: PROFILE_COLORS[0],
                icon: PROFILE_ICONS[0],
                fingerprint: DEFAULT_FINGERPRINT,
                proxy: null,
                tags: []
              });
              setShowCreateModal(true);
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Create Profile
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="profiles-grid">
            {filteredProfiles.map(profile => (
              <div 
                key={profile.id} 
                className={`profile-card ${profile.status}`}
                style={{ '--profile-color': profile.color } as React.CSSProperties}
              >
                <div className="profile-card-header">
                  <div className="profile-icon" style={{ background: profile.color }}>
                    {profile.icon}
                  </div>
                  <div className="profile-status-indicator" data-status={profile.status} />
                </div>
                <div className="profile-card-body">
                  <h4>{profile.name}</h4>
                  <p>{profile.description || 'No description'}</p>
                  <div className="profile-meta">
                    <span title="Cookies">{profile.cookies_count} cookies</span>
                    <span title="Storage">{profile.storage_size_mb.toFixed(1)} MB</span>
                  </div>
                  {profile.tags.length > 0 && (
                    <div className="profile-tags">
                      {profile.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="profile-tag">{tag}</span>
                      ))}
                      {profile.tags.length > 3 && (
                        <span className="profile-tag more">+{profile.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="profile-card-actions">
                  {profile.status === 'running' ? (
                    <button 
                      className="btn-stop"
                      onClick={() => handleStopProfile(profile.id)}
                      title="Stop"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="6" y="6" width="12" height="12" rx="2"/>
                      </svg>
                    </button>
                  ) : (
                    <button 
                      className="btn-launch"
                      onClick={() => handleLaunchProfile(profile.id)}
                      title="Launch"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </button>
                  )}
                  <button 
                    className="btn-icon"
                    onClick={() => {
                      setEditingProfile(profile);
                      setShowEditModal(true);
                    }}
                    title="Edit"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <div className="profile-dropdown">
                    <button className="btn-icon" title="More">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="5" r="1"/>
                        <circle cx="12" cy="19" r="1"/>
                      </svg>
                    </button>
                    <div className="dropdown-menu">
                      <button onClick={() => handleDuplicateProfile(profile.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Duplicate
                      </button>
                      <button onClick={() => handleExportProfile(profile.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export
                      </button>
                      <button className="danger" onClick={() => handleDeleteProfile(profile.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="profiles-list">
            {filteredProfiles.map(profile => (
              <div 
                key={profile.id} 
                className={`profile-row ${profile.status}`}
                style={{ '--profile-color': profile.color } as React.CSSProperties}
              >
                <div className="profile-row-icon" style={{ background: profile.color }}>
                  {profile.icon}
                </div>
                <div className="profile-row-info">
                  <div className="profile-row-name">
                    {profile.name}
                    <span className={`status-badge ${profile.status}`}>{profile.status}</span>
                  </div>
                  <div className="profile-row-desc">{profile.description || 'No description'}</div>
                </div>
                <div className="profile-row-meta">
                  <span>{profile.cookies_count} cookies</span>
                  <span>{profile.storage_size_mb.toFixed(1)} MB</span>
                  <span>{profile.last_used ? new Date(profile.last_used).toLocaleDateString() : 'Never used'}</span>
                </div>
                <div className="profile-row-actions">
                  {profile.status === 'running' ? (
                    <button className="btn-stop" onClick={() => handleStopProfile(profile.id)}>Stop</button>
                  ) : (
                    <button className="btn-launch" onClick={() => handleLaunchProfile(profile.id)}>Launch</button>
                  )}
                  <button className="btn-icon" onClick={() => { setEditingProfile(profile); setShowEditModal(true); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteProfile(profile.id)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && editingProfile && (
        <ProfileModal
          profile={editingProfile}
          isNew={true}
          onSave={handleCreateProfile}
          onCancel={() => { setShowCreateModal(false); setEditingProfile(null); }}
          onChange={setEditingProfile}
          onRandomizeFingerprint={() => handleRandomizeFingerprint('')}
          onTestProxy={handleTestProxy}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingProfile && (
        <ProfileModal
          profile={editingProfile}
          isNew={false}
          onSave={handleUpdateProfile}
          onCancel={() => { setShowEditModal(false); setEditingProfile(null); }}
          onChange={setEditingProfile}
          onRandomizeFingerprint={() => handleRandomizeFingerprint(editingProfile.id || '')}
          onTestProxy={handleTestProxy}
        />
      )}
    </div>
  );
};

// ============================================
// Profile Modal Component
// ============================================

interface ProfileModalProps {
  profile: Partial<BrowserProfile>;
  isNew: boolean;
  onSave: () => void;
  onCancel: () => void;
  onChange: (profile: Partial<BrowserProfile>) => void;
  onRandomizeFingerprint: () => void;
  onTestProxy: (proxy: ProxyConfig) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  isNew,
  onSave,
  onCancel,
  onChange,
  onRandomizeFingerprint,
  onTestProxy
}) => {
  const [activeSection, setActiveSection] = useState<'general' | 'fingerprint' | 'proxy' | 'advanced'>('general');

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isNew ? 'Create New Profile' : 'Edit Profile'}</h3>
          <button className="btn-ghost" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={activeSection === 'general' ? 'active' : ''}
            onClick={() => setActiveSection('general')}
          >
            General
          </button>
          <button 
            className={activeSection === 'fingerprint' ? 'active' : ''}
            onClick={() => setActiveSection('fingerprint')}
          >
            Fingerprint
          </button>
          <button 
            className={activeSection === 'proxy' ? 'active' : ''}
            onClick={() => setActiveSection('proxy')}
          >
            Proxy
          </button>
          <button 
            className={activeSection === 'advanced' ? 'active' : ''}
            onClick={() => setActiveSection('advanced')}
          >
            Advanced
          </button>
        </div>

        <div className="modal-content">
          {activeSection === 'general' && (
            <div className="modal-section">
              <div className="field">
                <label>Profile Name *</label>
                <input 
                  type="text"
                  value={profile.name || ''}
                  onChange={e => onChange({ ...profile, name: e.target.value })}
                  placeholder="My Profile"
                />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea 
                  value={profile.description || ''}
                  onChange={e => onChange({ ...profile, description: e.target.value })}
                  placeholder="Profile description..."
                  rows={3}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Color</label>
                  <div className="color-picker">
                    {PROFILE_COLORS.map(color => (
                      <button
                        key={color}
                        className={`color-option ${profile.color === color ? 'selected' : ''}`}
                        style={{ background: color }}
                        onClick={() => onChange({ ...profile, color })}
                      />
                    ))}
                  </div>
                </div>
                <div className="field">
                  <label>Icon</label>
                  <div className="icon-picker">
                    {PROFILE_ICONS.map(icon => (
                      <button
                        key={icon}
                        className={`icon-option ${profile.icon === icon ? 'selected' : ''}`}
                        onClick={() => onChange({ ...profile, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="field">
                <label>Tags (comma separated)</label>
                <input 
                  type="text"
                  value={profile.tags?.join(', ') || ''}
                  onChange={e => onChange({ 
                    ...profile, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                  placeholder="work, social, shopping"
                />
              </div>
            </div>
          )}

          {activeSection === 'fingerprint' && (
            <div className="modal-section">
              <div className="section-header">
                <h4>Browser Fingerprint</h4>
                <button className="btn-secondary" onClick={onRandomizeFingerprint}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                  </svg>
                  Randomize
                </button>
              </div>
              <div className="field">
                <label>User Agent</label>
                <textarea 
                  value={profile.fingerprint?.user_agent || ''}
                  onChange={e => onChange({ 
                    ...profile, 
                    fingerprint: { ...profile.fingerprint!, user_agent: e.target.value }
                  })}
                  rows={2}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Platform</label>
                  <select 
                    value={profile.fingerprint?.platform || 'Win32'}
                    onChange={e => onChange({ 
                      ...profile, 
                      fingerprint: { ...profile.fingerprint!, platform: e.target.value }
                    })}
                  >
                    <option value="Win32">Windows</option>
                    <option value="MacIntel">macOS</option>
                    <option value="Linux x86_64">Linux</option>
                  </select>
                </div>
                <div className="field">
                  <label>Screen Resolution</label>
                  <select 
                    value={profile.fingerprint?.screen_resolution || '1920x1080'}
                    onChange={e => onChange({ 
                      ...profile, 
                      fingerprint: { ...profile.fingerprint!, screen_resolution: e.target.value }
                    })}
                  >
                    <option value="1920x1080">1920x1080</option>
                    <option value="2560x1440">2560x1440</option>
                    <option value="1366x768">1366x768</option>
                    <option value="1536x864">1536x864</option>
                    <option value="3840x2160">3840x2160</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Language</label>
                  <input 
                    type="text"
                    value={profile.fingerprint?.language || 'en-US'}
                    onChange={e => onChange({ 
                      ...profile, 
                      fingerprint: { ...profile.fingerprint!, language: e.target.value }
                    })}
                  />
                </div>
                <div className="field">
                  <label>Timezone</label>
                  <select 
                    value={profile.fingerprint?.timezone || 'America/New_York'}
                    onChange={e => onChange({ 
                      ...profile, 
                      fingerprint: { ...profile.fingerprint!, timezone: e.target.value }
                    })}
                  >
                    <option value="America/New_York">Eastern (New York)</option>
                    <option value="America/Chicago">Central (Chicago)</option>
                    <option value="America/Denver">Mountain (Denver)</option>
                    <option value="America/Los_Angeles">Pacific (Los Angeles)</option>
                    <option value="Europe/London">GMT (London)</option>
                    <option value="Europe/Paris">CET (Paris)</option>
                    <option value="Asia/Tokyo">JST (Tokyo)</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field">
                  <label>CPU Cores</label>
                  <select 
                    value={profile.fingerprint?.hardware_concurrency || 8}
                    onChange={e => onChange({ 
                      ...profile, 
                      fingerprint: { ...profile.fingerprint!, hardware_concurrency: parseInt(e.target.value) }
                    })}
                  >
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="16">16</option>
                  </select>
                </div>
                <div className="field">
                  <label>Device Memory (GB)</label>
                  <select 
                    value={profile.fingerprint?.device_memory || 8}
                    onChange={e => onChange({ 
                      ...profile, 
                      fingerprint: { ...profile.fingerprint!, device_memory: parseInt(e.target.value) }
                    })}
                  >
                    <option value="2">2 GB</option>
                    <option value="4">4 GB</option>
                    <option value="8">8 GB</option>
                    <option value="16">16 GB</option>
                    <option value="32">32 GB</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>WebGL Renderer</label>
                <input 
                  type="text"
                  value={profile.fingerprint?.webgl_renderer || ''}
                  onChange={e => onChange({ 
                    ...profile, 
                    fingerprint: { ...profile.fingerprint!, webgl_renderer: e.target.value }
                  })}
                />
              </div>
              <div className="checkbox-group">
                <label>
                  <input 
                    type="checkbox"
                    checked={profile.fingerprint?.canvas_noise ?? true}
                    onChange={e => onChange({ 
                      ...profile, 
                      fingerprint: { ...profile.fingerprint!, canvas_noise: e.target.checked }
                    })}
                  />
                  Canvas Noise Protection
                </label>
                <label>
                  <input 
                    type="checkbox"
                    checked={profile.fingerprint?.audio_noise ?? true}
                    onChange={e => onChange({ 
                      ...profile, 
                      fingerprint: { ...profile.fingerprint!, audio_noise: e.target.checked }
                    })}
                  />
                  Audio Noise Protection
                </label>
              </div>
              <div className="field">
                <label>WebRTC Mode</label>
                <select 
                  value={profile.fingerprint?.webrtc_mode || 'fake'}
                  onChange={e => onChange({ 
                    ...profile, 
                    fingerprint: { ...profile.fingerprint!, webrtc_mode: e.target.value as 'real' | 'disabled' | 'fake' }
                  })}
                >
                  <option value="real">Real IP (Not recommended)</option>
                  <option value="fake">Fake IP (Use proxy IP)</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === 'proxy' && (
            <div className="modal-section">
              <div className="section-header">
                <h4>Proxy Configuration</h4>
                {profile.proxy && (
                  <button className="btn-secondary" onClick={() => onTestProxy(profile.proxy!)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    Test Proxy
                  </button>
                )}
              </div>
              <div className="proxy-toggle">
                <label>
                  <input 
                    type="checkbox"
                    checked={profile.proxy !== null}
                    onChange={e => onChange({ 
                      ...profile, 
                      proxy: e.target.checked ? { type: 'http', host: '', port: 8080, username: null, password: null, rotation_url: null } : null
                    })}
                  />
                  Enable Proxy
                </label>
              </div>
              {profile.proxy && (
                <>
                  <div className="field-row">
                    <div className="field">
                      <label>Type</label>
                      <select 
                        value={profile.proxy.type}
                        onChange={e => onChange({ 
                          ...profile, 
                          proxy: { ...profile.proxy!, type: e.target.value as ProxyConfig['type'] }
                        })}
                      >
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                        <option value="socks4">SOCKS4</option>
                        <option value="socks5">SOCKS5</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Host</label>
                      <input 
                        type="text"
                        value={profile.proxy.host}
                        onChange={e => onChange({ 
                          ...profile, 
                          proxy: { ...profile.proxy!, host: e.target.value }
                        })}
                        placeholder="proxy.example.com"
                      />
                    </div>
                    <div className="field" style={{ maxWidth: '100px' }}>
                      <label>Port</label>
                      <input 
                        type="number"
                        value={profile.proxy.port}
                        onChange={e => onChange({ 
                          ...profile, 
                          proxy: { ...profile.proxy!, port: parseInt(e.target.value) || 8080 }
                        })}
                      />
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field">
                      <label>Username (optional)</label>
                      <input 
                        type="text"
                        value={profile.proxy.username || ''}
                        onChange={e => onChange({ 
                          ...profile, 
                          proxy: { ...profile.proxy!, username: e.target.value || null }
                        })}
                      />
                    </div>
                    <div className="field">
                      <label>Password (optional)</label>
                      <input 
                        type="password"
                        value={profile.proxy.password || ''}
                        onChange={e => onChange({ 
                          ...profile, 
                          proxy: { ...profile.proxy!, password: e.target.value || null }
                        })}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Rotation URL (optional)</label>
                    <input 
                      type="text"
                      value={profile.proxy.rotation_url || ''}
                      onChange={e => onChange({ 
                        ...profile, 
                        proxy: { ...profile.proxy!, rotation_url: e.target.value || null }
                      })}
                      placeholder="https://api.proxy.com/rotate?key=..."
                    />
                    <small>URL to call for rotating proxy IP</small>
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'advanced' && (
            <div className="modal-section">
              <div className="field">
                <label>Notes</label>
                <textarea 
                  value={profile.notes || ''}
                  onChange={e => onChange({ ...profile, notes: e.target.value })}
                  placeholder="Add any notes about this profile..."
                  rows={4}
                />
              </div>
              {!isNew && (
                <div className="profile-stats">
                  <h4>Profile Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat">
                      <span className="stat-label">Cookies</span>
                      <span className="stat-value">{(profile as BrowserProfile).cookies_count || 0}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Storage</span>
                      <span className="stat-value">{((profile as BrowserProfile).storage_size_mb || 0).toFixed(1)} MB</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Created</span>
                      <span className="stat-value">
                        {(profile as BrowserProfile).created_at 
                          ? new Date((profile as BrowserProfile).created_at).toLocaleDateString() 
                          : '-'}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Last Used</span>
                      <span className="stat-value">
                        {(profile as BrowserProfile).last_used 
                          ? new Date((profile as BrowserProfile).last_used!).toLocaleDateString() 
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button 
            className="btn-primary" 
            onClick={onSave}
            disabled={!profile.name?.trim()}
          >
            {isNew ? 'Create Profile' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrowserProfiles;
