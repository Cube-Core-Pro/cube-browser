'use client';

import React, { useState, useEffect } from 'react';
import { browserService, type BrowserTab, type TabGroup } from '@/lib/services/browser-service';

export function TabManager() {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [groups, setGroups] = useState<TabGroup[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTabs();
    const interval = setInterval(loadTabs, 2000); // Refresh every 2s
    return () => clearInterval(interval);
  }, []);

  const loadTabs = async () => {
    try {
      const [tabsData, groupsData] = await Promise.all([
        browserService.getAllTabs(),
        browserService.getAllGroups(),
      ]);
      setTabs(tabsData);
      setGroups(groupsData);
      const active = tabsData.find(t => t.active);
      if (active) setActiveTabId(active.id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tabs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTab = async () => {
    try {
      await browserService.createTab('about:blank');
      await loadTabs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tab');
    }
  };

  const handleCloseTab = async (tabId: string) => {
    try {
      await browserService.closeTab(tabId);
      await loadTabs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close tab');
    }
  };

  const handleSwitchTab = async (tabId: string) => {
    try {
      await browserService.switchTab(tabId);
      setActiveTabId(tabId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch tab');
    }
  };

  const handlePinTab = async (tabId: string, pinned: boolean) => {
    try {
      await browserService.pinTab(tabId, pinned);
      await loadTabs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pin tab');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tabs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Browser Tabs</h2>
        <button
          onClick={handleCreateTab}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Tab
        </button>
      </div>

      {/* Tab Groups */}
      {groups.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Groups</h3>
          {groups.map(group => (
            <div
              key={group.id}
              className="border rounded-lg p-3"
              style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{group.name}</span>
                <span className="text-sm text-muted-foreground">{group.tabIds.length} tabs</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs List */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">All Tabs ({tabs.length})</h3>
        <div className="grid gap-2">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                tab.id === activeTabId
                  ? 'bg-blue-50 border-blue-300'
                  : 'hover:bg-accent'
              }`}
              onClick={() => handleSwitchTab(tab.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {tab.pinned && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        Pinned
                      </span>
                    )}
                    {tab.active && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="font-medium truncate">{tab.title || 'Untitled'}</p>
                  <p className="text-sm text-muted-foreground truncate">{tab.url}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(tab.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinTab(tab.id, !tab.pinned);
                    }}
                    className="p-2 text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                    title={tab.pinned ? 'Unpin' : 'Pin'}
                  >
                    📌
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCloseTab(tab.id);
                    }}
                    className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {tabs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tabs open</p>
          <button
            onClick={handleCreateTab}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create First Tab
          </button>
        </div>
      )}
    </div>
  );
}

export default TabManager;
