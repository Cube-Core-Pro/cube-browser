/**
 * CUBE Nexum - History Component
 * Superior to Chrome, Firefox, Safari, Brave history systems
 * Full-featured browsing history management UI
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BrowserHistoryService, {
  HistoryEntry,
  type HistorySettings as _HistorySettings,
  HistoryStats,
  BrowsingSession,
  FrequentSite,
  RecentlyClosed,
  SearchResult,
  HistoryFilter,
  TimeRange,
  PageType,
  SortOrder,
} from '@/lib/services/browser-history-service';
import './History.css';

// ==================== Sub-Components ====================

interface HistoryEntryItemProps {
  entry: HistoryEntry;
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onOpen: (url: string) => void;
  selected: boolean;
  onSelect: (id: string) => void;
}

const HistoryEntryItem: React.FC<HistoryEntryItemProps> = ({
  entry,
  onDelete,
  onToggleStar,
  onOpen,
  selected,
  onSelect,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div 
      className={`history-entry ${selected ? 'selected' : ''}`}
      onClick={() => onOpen(entry.url)}
    >
      <div className="entry-checkbox" onClick={(e) => e.stopPropagation()}>
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={() => onSelect(entry.id)}
        />
      </div>

      <div className="entry-favicon">
        {entry.favicon_url ? (
          <img src={entry.favicon_url} alt="" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
        ) : (
          <span className="favicon-placeholder">
            {BrowserHistoryService.getPageTypeIcon(entry.page_type)}
          </span>
        )}
      </div>

      <div className="entry-info">
        <div className="entry-title" title={entry.title}>
          {entry.starred && <span className="star-badge">⭐</span>}
          {entry.title || 'Untitled'}
        </div>
        <div className="entry-url" title={entry.url}>
          {entry.url}
        </div>
        <div className="entry-meta">
          <span className="entry-domain">{entry.domain}</span>
          <span className="entry-visits">{entry.visit_count} visits</span>
          {entry.total_duration_ms > 0 && (
            <span className="entry-duration">
              {BrowserHistoryService.formatDuration(entry.total_duration_ms)}
            </span>
          )}
          <span className="entry-type">
            {BrowserHistoryService.getPageTypeIcon(entry.page_type)} {entry.page_type}
          </span>
        </div>
      </div>

      <div className="entry-time">
        {BrowserHistoryService.formatTimestamp(entry.last_visit)}
      </div>

      <div className="entry-actions" onClick={(e) => e.stopPropagation()}>
        <button 
          className={`action-btn star ${entry.starred ? 'starred' : ''}`}
          onClick={() => onToggleStar(entry.id)}
          title={entry.starred ? 'Remove star' : 'Add star'}
        >
          {entry.starred ? '⭐' : '☆'}
        </button>
        <button 
          className="action-btn menu"
          onClick={() => setShowMenu(!showMenu)}
          title="More options"
        >
          ⋮
        </button>

        {showMenu && (
          <div className="entry-menu">
            <button onClick={() => { onOpen(entry.url); setShowMenu(false); }}>
              🔗 Open Link
            </button>
            <button onClick={() => { navigator.clipboard.writeText(entry.url); setShowMenu(false); }}>
              📋 Copy URL
            </button>
            <button onClick={() => { window.open(entry.url, '_blank'); setShowMenu(false); }}>
              🆕 Open in New Tab
            </button>
            <div className="menu-divider" />
            <button 
              className="danger"
              onClick={() => { onDelete(entry.id); setShowMenu(false); }}
            >
              🗑️ Delete from History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface DateGroupProps {
  date: string;
  entries: HistoryEntry[];
  onDelete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onOpen: (url: string) => void;
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
}

const DateGroup: React.FC<DateGroupProps> = ({
  date,
  entries,
  onDelete,
  onToggleStar,
  onOpen,
  selectedIds,
  onSelect,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="date-group">
      <div className="date-header" onClick={() => setCollapsed(!collapsed)}>
        <span className="collapse-icon">{collapsed ? '▶' : '▼'}</span>
        <span className="date-label">{date}</span>
        <span className="entry-count">{entries.length} pages</span>
      </div>
      {!collapsed && (
        <div className="date-entries">
          {entries.map(entry => (
            <HistoryEntryItem
              key={entry.id}
              entry={entry}
              onDelete={onDelete}
              onToggleStar={onToggleStar}
              onOpen={onOpen}
              selected={selectedIds.has(entry.id)}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface FrequentSiteCardProps {
  site: FrequentSite;
  onOpen: (url: string) => void;
}

const FrequentSiteCard: React.FC<FrequentSiteCardProps> = ({ site, onOpen }) => {
  return (
    <div className="frequent-site-card" onClick={() => onOpen(site.url)}>
      <div className="site-favicon">
        {site.favicon_url ? (
          <img src={site.favicon_url} alt="" />
        ) : (
          <span>🌐</span>
        )}
      </div>
      <div className="site-info">
        <div className="site-title">{site.title || site.domain}</div>
        <div className="site-domain">{site.domain}</div>
      </div>
      <div className="site-visits">{BrowserHistoryService.formatVisitCount(site.visit_count)}</div>
    </div>
  );
};

interface RecentlyClosedItemProps {
  item: RecentlyClosed;
  onRestore: (id: string) => void;
}

const RecentlyClosedItem: React.FC<RecentlyClosedItemProps> = ({ item, onRestore }) => {
  return (
    <div className="recently-closed-item" onClick={() => onRestore(item.id)}>
      <span className="closed-icon">🔄</span>
      <div className="closed-info">
        <div className="closed-title">{item.title || 'Untitled'}</div>
        <div className="closed-url">{item.url}</div>
      </div>
      <span className="closed-time">
        {BrowserHistoryService.formatTimestamp(item.closed_at)}
      </span>
    </div>
  );
};

interface SessionItemProps {
  session: BrowsingSession;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, onRestore, onDelete }) => {
  return (
    <div className="session-item">
      <div className="session-icon">📂</div>
      <div className="session-info">
        <div className="session-name">
          {session.name || `Session from ${new Date(session.started_at * 1000).toLocaleDateString()}`}
        </div>
        <div className="session-meta">
          <span>{session.entry_ids.length} pages</span>
          <span>{session.tabs_count} tabs</span>
          <span>{BrowserHistoryService.formatDuration(session.total_duration_ms)}</span>
        </div>
      </div>
      <div className="session-actions">
        <button className="btn small" onClick={() => onRestore(session.id)}>
          Restore
        </button>
        <button className="btn small danger" onClick={() => onDelete(session.id)}>
          Delete
        </button>
      </div>
    </div>
  );
};

interface StatsWidgetProps {
  stats: HistoryStats;
}

const StatsWidget: React.FC<StatsWidgetProps> = ({ stats }) => {
  return (
    <div className="stats-widget">
      <h3>📊 Browsing Statistics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-number">{BrowserHistoryService.formatVisitCount(stats.total_entries)}</span>
          <span className="stat-label">Total Pages</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{BrowserHistoryService.formatVisitCount(stats.total_visits)}</span>
          <span className="stat-label">Total Visits</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{stats.unique_domains}</span>
          <span className="stat-label">Unique Sites</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{BrowserHistoryService.formatDuration(stats.total_duration_ms)}</span>
          <span className="stat-label">Total Time</span>
        </div>
      </div>
      <div className="stats-today">
        <span>Today: {stats.visits_today} visits</span>
        <span>This Week: {stats.visits_this_week} visits</span>
      </div>
    </div>
  );
};

interface FilterSidebarProps {
  filter: HistoryFilter;
  onFilterChange: (filter: HistoryFilter) => void;
  domains: string[];
  tags?: string[];
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filter, onFilterChange, domains, tags: _tags }) => {
  return (
    <div className="filter-sidebar">
      <div className="filter-section">
        <h4>Time Range</h4>
        <select
          value={filter.time_range}
          onChange={(e) => onFilterChange({ ...filter, time_range: e.target.value as TimeRange })}
        >
          <option value="AllTime">All Time</option>
          <option value="LastHour">Last Hour</option>
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
          <option value="LastWeek">Last 7 Days</option>
          <option value="LastMonth">Last 30 Days</option>
          <option value="LastThreeMonths">Last 3 Months</option>
        </select>
      </div>

      <div className="filter-section">
        <h4>Sort By</h4>
        <select
          value={filter.sort_by}
          onChange={(e) => onFilterChange({ ...filter, sort_by: e.target.value as SortOrder })}
        >
          <option value="DateDesc">Newest First</option>
          <option value="DateAsc">Oldest First</option>
          <option value="VisitCountDesc">Most Visited</option>
          <option value="TitleAsc">Title A-Z</option>
          <option value="DurationDesc">Most Time Spent</option>
        </select>
      </div>

      <div className="filter-section">
        <h4>Page Type</h4>
        <div className="filter-chips">
          {['Video', 'Social', 'News', 'Shopping', 'Search', 'Email'].map(type => (
            <button
              key={type}
              className={`filter-chip ${filter.page_types.includes(type as PageType) ? 'active' : ''}`}
              onClick={() => {
                const types = filter.page_types.includes(type as PageType)
                  ? filter.page_types.filter(t => t !== type)
                  : [...filter.page_types, type as PageType];
                onFilterChange({ ...filter, page_types: types });
              }}
            >
              {BrowserHistoryService.getPageTypeIcon(type as PageType)} {type}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Options</h4>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filter.starred_only}
            onChange={(e) => onFilterChange({ ...filter, starred_only: e.target.checked })}
          />
          Starred only
        </label>
      </div>

      <div className="filter-section">
        <h4>Popular Domains</h4>
        <div className="domain-list">
          {domains.slice(0, 10).map(domain => (
            <button
              key={domain}
              className={`domain-chip ${filter.domains.includes(domain) ? 'active' : ''}`}
              onClick={() => {
                const newDomains = filter.domains.includes(domain)
                  ? filter.domains.filter(d => d !== domain)
                  : [...filter.domains, domain];
                onFilterChange({ ...filter, domains: newDomains });
              }}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {filter.page_types.length > 0 || filter.domains.length > 0 || filter.starred_only ? (
        <button 
          className="clear-filters"
          onClick={() => onFilterChange(BrowserHistoryService.createDefaultFilter())}
        >
          Clear All Filters
        </button>
      ) : null}
    </div>
  );
};

interface ClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: (timeRange: TimeRange) => void;
}

const ClearHistoryModal: React.FC<ClearHistoryModalProps> = ({ isOpen, onClose, onClear }) => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('LastHour');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal clear-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🗑️ Clear Browsing History</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-content">
          <p>Select the time range to clear:</p>
          <div className="time-range-options">
            {[
              { value: 'LastHour', label: 'Last hour' },
              { value: 'Today', label: 'Today' },
              { value: 'Yesterday', label: 'Yesterday' },
              { value: 'LastWeek', label: 'Last 7 days' },
              { value: 'LastMonth', label: 'Last 30 days' },
              { value: 'AllTime', label: 'All time' },
            ].map(option => (
              <label key={option.value} className="range-option">
                <input
                  type="radio"
                  name="timeRange"
                  value={option.value}
                  checked={selectedRange === option.value}
                  onChange={() => setSelectedRange(option.value as TimeRange)}
                />
                {option.label}
              </label>
            ))}
          </div>
          <div className="warning-text">
            ⚠️ This action cannot be undone.
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose}>Cancel</button>
          <button 
            className="btn danger" 
            onClick={() => { onClear(selectedRange); onClose(); }}
          >
            Clear History
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== Main Component ====================

type TabType = 'history' | 'frequent' | 'closed' | 'sessions';

const History: React.FC = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [frequentSites, setFrequentSites] = useState<FrequentSite[]>([]);
  const [recentlyClosed, setRecentlyClosed] = useState<RecentlyClosed[]>([]);
  const [sessions, setSessions] = useState<BrowsingSession[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [filter, setFilter] = useState<HistoryFilter>(BrowserHistoryService.createDefaultFilter());
  const [searchQuery, setSearchQuery] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [
        historyEntries,
        historyStats,
        frequent,
        closed,
        allSessions,
        allDomains,
        allTags,
      ] = await Promise.all([
        BrowserHistoryService.filter(filter),
        BrowserHistoryService.getStats(),
        BrowserHistoryService.getFrequentSites(20),
        BrowserHistoryService.getRecentlyClosed(20),
        BrowserHistoryService.getRecentSessions(10),
        BrowserHistoryService.getAllDomains(),
        BrowserHistoryService.getAllTags(),
      ]);

      setEntries(historyEntries);
      setStats(historyStats);
      setFrequentSites(frequent);
      setRecentlyClosed(closed);
      setSessions(allSessions);
      setDomains(allDomains);
      setTags(allTags);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await BrowserHistoryService.search(query);
        setSearchResults(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      }
    } else {
      setSearchResults(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await BrowserHistoryService.deleteEntry(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await BrowserHistoryService.deleteEntries(Array.from(selectedIds));
      setSelectedIds(new Set());
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entries');
    }
  };

  const handleToggleStar = async (id: string) => {
    try {
      await BrowserHistoryService.toggleStarred(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle star');
    }
  };

  const handleOpen = (url: string) => {
    window.open(url, '_blank');
  };

  const handleClearHistory = async (timeRange: TimeRange) => {
    try {
      await BrowserHistoryService.clear(timeRange);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  };

  const handleRestoreClosed = async (id: string) => {
    try {
      const item = await BrowserHistoryService.restoreRecentlyClosed(id);
      window.open(item.url, '_blank');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore tab');
    }
  };

  const handleRestoreSession = async (sessionId: string) => {
    try {
      const urls = await BrowserHistoryService.restoreSession(sessionId);
      urls.forEach(url => window.open(url, '_blank'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore session');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await BrowserHistoryService.deleteSession(sessionId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const displayEntries = searchResults 
    ? searchResults.map(r => r.entry)
    : entries;

  const groupedEntries = BrowserHistoryService.groupEntriesByDate(displayEntries);

  if (loading) {
    return (
      <div className="history-page loading">
        <div className="loading-spinner">
          <span>📜</span>
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <header className="history-header">
        <div className="header-left">
          <h1>📜 Browsing History</h1>
        </div>
        <div className="header-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search history..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => handleSearch('')}>✕</button>
          )}
        </div>
        <div className="header-actions">
          <button 
            className="btn icon" 
            onClick={() => setShowSidebar(!showSidebar)}
            title="Toggle filters"
          >
            {showSidebar ? '◀' : '▶'}
          </button>
          <button className="btn danger" onClick={() => setShowClearModal(true)}>
            🗑️ Clear History
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="history-tabs">
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📜 History
        </button>
        <button 
          className={`tab ${activeTab === 'frequent' ? 'active' : ''}`}
          onClick={() => setActiveTab('frequent')}
        >
          ⭐ Frequent
        </button>
        <button 
          className={`tab ${activeTab === 'closed' ? 'active' : ''}`}
          onClick={() => setActiveTab('closed')}
        >
          🔄 Recently Closed ({recentlyClosed.length})
        </button>
        <button 
          className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          📂 Sessions
        </button>
      </div>

      <div className="history-content">
        {showSidebar && activeTab === 'history' && (
          <FilterSidebar 
            filter={filter} 
            onFilterChange={setFilter}
            domains={domains}
            tags={tags}
          />
        )}

        <main className="history-main">
          {activeTab === 'history' && (
            <>
              {stats && <StatsWidget stats={stats} />}

              {selectedIds.size > 0 && (
                <div className="bulk-actions">
                  <span>{selectedIds.size} selected</span>
                  <button onClick={handleDeleteSelected}>🗑️ Delete Selected</button>
                  <button onClick={() => setSelectedIds(new Set())}>Clear Selection</button>
                </div>
              )}

              <div className="history-list">
                {searchResults && (
                  <div className="search-results-header">
                    Found {searchResults.length} results for &quot;{searchQuery}&quot;
                  </div>
                )}

                {displayEntries.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📭</span>
                    <h3>No history found</h3>
                    <p>
                      {searchQuery 
                        ? 'No entries match your search'
                        : 'Your browsing history will appear here'}
                    </p>
                  </div>
                ) : (
                  Array.from(groupedEntries.entries()).map(([date, dateEntries]) => (
                    <DateGroup
                      key={date}
                      date={date}
                      entries={dateEntries}
                      onDelete={handleDelete}
                      onToggleStar={handleToggleStar}
                      onOpen={handleOpen}
                      selectedIds={selectedIds}
                      onSelect={toggleSelect}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'frequent' && (
            <div className="frequent-sites">
              <h2>⭐ Most Visited Sites</h2>
              <div className="sites-grid">
                {frequentSites.map(site => (
                  <FrequentSiteCard key={site.domain} site={site} onOpen={handleOpen} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'closed' && (
            <div className="recently-closed">
              <div className="section-header">
                <h2>🔄 Recently Closed Tabs</h2>
                <button 
                  className="btn small"
                  onClick={() => BrowserHistoryService.clearRecentlyClosed().then(loadData)}
                >
                  Clear All
                </button>
              </div>
              {recentlyClosed.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <h3>No recently closed tabs</h3>
                  <p>Tabs you close will appear here for easy restoration</p>
                </div>
              ) : (
                <div className="closed-list">
                  {recentlyClosed.map(item => (
                    <RecentlyClosedItem
                      key={item.id}
                      item={item}
                      onRestore={handleRestoreClosed}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="sessions">
              <h2>📂 Browsing Sessions</h2>
              {sessions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <h3>No saved sessions</h3>
                  <p>Your browsing sessions will be saved automatically</p>
                </div>
              ) : (
                <div className="sessions-list">
                  {sessions.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      onRestore={handleRestoreSession}
                      onDelete={handleDeleteSession}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <ClearHistoryModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onClear={handleClearHistory}
      />
    </div>
  );
};

export default History;
