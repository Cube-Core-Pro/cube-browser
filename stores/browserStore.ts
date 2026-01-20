import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  history: string[];
  historyIndex: number;
}

export interface BrowserState {
  tabs: BrowserTab[];
  activeTabId: string | null;
  
  // Actions
  addTab: (url?: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<BrowserTab>) => void;
  navigateTab: (tabId: string, url: string) => void;
  goBack: (tabId: string) => void;
  goForward: (tabId: string) => void;
  reloadTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
}

export const useBrowserStore = create<BrowserState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: (url = 'about:blank') => {
        const newTab: BrowserTab = {
          id: Date.now().toString(),
          title: url === 'about:blank' ? 'New Tab' : 'Loading...',
          url,
          loading: url !== 'about:blank',
          canGoBack: false,
          canGoForward: false,
          history: [url],
          historyIndex: 0,
        };

        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
      },

      closeTab: (tabId: string) => {
        const { tabs, activeTabId } = get();
        
        if (tabs.length === 1) {
          get().addTab();
        }

        const filteredTabs = tabs.filter((tab) => tab.id !== tabId);
        
        let newActiveTabId = activeTabId;
        if (activeTabId === tabId && filteredTabs.length > 0) {
          const currentIndex = tabs.findIndex((tab) => tab.id === tabId);
          const newActiveTab = filteredTabs[Math.min(currentIndex, filteredTabs.length - 1)];
          newActiveTabId = newActiveTab.id;
        }

        set({
          tabs: filteredTabs,
          activeTabId: newActiveTabId,
        });
      },

      setActiveTab: (tabId: string) => {
        set({ activeTabId: tabId });
      },

      updateTab: (tabId: string, updates: Partial<BrowserTab>) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, ...updates } : tab
          ),
        }));
      },

      navigateTab: (tabId: string, url: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id !== tabId) return tab;

            const newHistory = tab.history.slice(0, tab.historyIndex + 1);
            newHistory.push(url);

            return {
              ...tab,
              url,
              loading: true,
              title: 'Loading...',
              history: newHistory,
              historyIndex: newHistory.length - 1,
              canGoBack: newHistory.length > 1,
              canGoForward: false,
            };
          }),
        }));
      },

      goBack: (tabId: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id !== tabId || tab.historyIndex === 0) return tab;

            const newIndex = tab.historyIndex - 1;
            return {
              ...tab,
              url: tab.history[newIndex],
              loading: true,
              historyIndex: newIndex,
              canGoBack: newIndex > 0,
              canGoForward: true,
            };
          }),
        }));
      },

      goForward: (tabId: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id !== tabId || tab.historyIndex >= tab.history.length - 1) return tab;

            const newIndex = tab.historyIndex + 1;
            return {
              ...tab,
              url: tab.history[newIndex],
              loading: true,
              historyIndex: newIndex,
              canGoBack: true,
              canGoForward: newIndex < tab.history.length - 1,
            };
          }),
        }));
      },

      reloadTab: (tabId: string) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, loading: true } : tab
          ),
        }));
      },

      closeAllTabs: () => {
        set({ tabs: [] });
        get().addTab();
      },

      closeOtherTabs: (tabId: string) => {
        const { tabs } = get();
        const keepTab = tabs.find((tab) => tab.id === tabId);
        if (keepTab) {
          set({
            tabs: [keepTab],
            activeTabId: keepTab.id,
          });
        }
      },
    }),
    {
      name: 'browser-storage',
      partialize: (state) => ({
        tabs: state.tabs.map((tab) => ({
          ...tab,
          loading: false,
        })),
        activeTabId: state.activeTabId,
      }),
    }
  )
);
