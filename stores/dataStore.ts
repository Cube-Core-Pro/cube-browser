import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataSourceType = 'web' | 'database' | 'api' | 'file' | 'spreadsheet';
export type DataSourceStatus = 'connected' | 'disconnected' | 'error';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: DataSourceStatus;
  config: Record<string, unknown>;
  lastSync?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataRecord {
  id: string;
  sourceId: string;
  data: Record<string, unknown>;
  metadata: {
    extractedAt: string;
    url?: string;
    success: boolean;
    error?: string;
  };
}

export interface DataExport {
  id: string;
  name: string;
  sourceIds: string[];
  format: 'json' | 'csv' | 'xlsx';
  filters?: Record<string, unknown>;
  createdAt: string;
  recordCount: number;
  filePath?: string;
}

export interface DataState {
  sources: DataSource[];
  records: DataRecord[];
  exports: DataExport[];
  
  // Data sources
  addSource: (source: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSource: (id: string, updates: Partial<DataSource>) => void;
  deleteSource: (id: string) => void;
  syncSource: (id: string) => Promise<void>;
  
  // Data records
  addRecord: (record: Omit<DataRecord, 'id'>) => string;
  addRecords: (records: Omit<DataRecord, 'id'>[]) => void;
  deleteRecord: (id: string) => void;
  deleteRecordsBySource: (sourceId: string) => void;
  clearAllRecords: () => void;
  
  // Data exports
  createExport: (exportConfig: Omit<DataExport, 'id' | 'createdAt' | 'recordCount'>) => string;
  deleteExport: (id: string) => void;
  clearExports: () => void;
  
  // Helpers
  getSource: (id: string) => DataSource | undefined;
  getSourceRecords: (sourceId: string) => DataRecord[];
  getRecordCount: (sourceId?: string) => number;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      sources: [],
      records: [],
      exports: [],

      addSource: (source) => {
        const id = Date.now().toString();
        const now = new Date().toISOString();
        
        const newSource: DataSource = {
          ...source,
          id,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          sources: [...state.sources, newSource],
        }));

        return id;
      },

      updateSource: (id, updates) => {
        set((state) => ({
          sources: state.sources.map((source) =>
            source.id === id
              ? { ...source, ...updates, updatedAt: new Date().toISOString() }
              : source
          ),
        }));
      },

      deleteSource: (id) => {
        set((state) => ({
          sources: state.sources.filter((source) => source.id !== id),
          records: state.records.filter((record) => record.sourceId !== id),
        }));
      },

      syncSource: async (id) => {
        set((state) => ({
          sources: state.sources.map((source) =>
            source.id === id
              ? { ...source, status: 'connected' as const, lastSync: new Date().toISOString() }
              : source
          ),
        }));
      },

      addRecord: (record) => {
        const id = Date.now().toString();
        
        const newRecord: DataRecord = {
          ...record,
          id,
        };

        set((state) => ({
          records: [...state.records, newRecord],
        }));

        return id;
      },

      addRecords: (records) => {
        const newRecords: DataRecord[] = records.map((record, index) => ({
          ...record,
          id: `${Date.now()}-${index}`,
        }));

        set((state) => ({
          records: [...state.records, ...newRecords],
        }));
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((record) => record.id !== id),
        }));
      },

      deleteRecordsBySource: (sourceId) => {
        set((state) => ({
          records: state.records.filter((record) => record.sourceId !== sourceId),
        }));
      },

      clearAllRecords: () => {
        set({ records: [] });
      },

      createExport: (exportConfig) => {
        const id = Date.now().toString();
        const now = new Date().toISOString();
        
        const recordCount = exportConfig.sourceIds.reduce((count, sourceId) => {
          return count + get().getSourceRecords(sourceId).length;
        }, 0);

        const newExport: DataExport = {
          ...exportConfig,
          id,
          createdAt: now,
          recordCount,
        };

        set((state) => ({
          exports: [...state.exports, newExport],
        }));

        return id;
      },

      deleteExport: (id) => {
        set((state) => ({
          exports: state.exports.filter((exp) => exp.id !== id),
        }));
      },

      clearExports: () => {
        set({ exports: [] });
      },

      getSource: (id) => {
        return get().sources.find((source) => source.id === id);
      },

      getSourceRecords: (sourceId) => {
        return get().records.filter((record) => record.sourceId === sourceId);
      },

      getRecordCount: (sourceId) => {
        if (sourceId) {
          return get().getSourceRecords(sourceId).length;
        }
        return get().records.length;
      },
    }),
    {
      name: 'data-storage',
      partialize: (state) => ({
        sources: state.sources,
        exports: state.exports,
      }),
    }
  )
);
