/**
 * Filter Panel Component - Download filtering
 * CUBE Nexum Platform v2.0
 */

import React, { useState } from 'react';
import {
  DownloadFilter,
  DownloadStatus,
  DownloadCategory,
} from '../../types/download';
import './FilterPanel.css';

interface FilterPanelProps {
  filter: DownloadFilter;
  onFilterUpdate: (filter: DownloadFilter) => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filter,
  onFilterUpdate,
  onClose,
}) => {
  const [localFilter, setLocalFilter] = useState(filter);

  const statuses: DownloadStatus[] = [
    'pending',
    'downloading',
    'paused',
    'completed',
    'failed',
    'cancelled',
  ];

  const categories: DownloadCategory[] = [
    'documents',
    'images',
    'videos',
    'audio',
    'archives',
    'software',
    'other',
  ];

  const handleApply = () => {
    onFilterUpdate(localFilter);
    onClose();
  };

  const handleClear = () => {
    const emptyFilter: DownloadFilter = {};
    setLocalFilter(emptyFilter);
    onFilterUpdate(emptyFilter);
  };

  const toggleStatus = (status: DownloadStatus) => {
    const current = localFilter.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    setLocalFilter({ ...localFilter, status: updated.length > 0 ? updated : undefined });
  };

  const toggleCategory = (category: DownloadCategory) => {
    const current = localFilter.category || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setLocalFilter({ ...localFilter, category: updated.length > 0 ? updated : undefined });
  };

  return (
    <div className="filter-overlay" onClick={onClose}>
      <div className="filter-panel" onClick={(e) => e.stopPropagation()}>
        <div className="filter-header">
          <h2>Filter Downloads</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="filter-content">
          <div className="filter-section">
            <h3>Status</h3>
            <div className="filter-options">
              {statuses.map((status) => (
                <label key={status} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={(localFilter.status || []).includes(status)}
                    onChange={() => toggleStatus(status)}
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Category</h3>
            <div className="filter-options">
              {categories.map((category) => (
                <label key={category} className="filter-checkbox">
                  <input
                    type="checkbox"
                    checked={(localFilter.category || []).includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3>Search</h3>
            <input
              type="text"
              placeholder="Search filename or URL..."
              value={localFilter.search || ''}
              onChange={(e) =>
                setLocalFilter({ ...localFilter, search: e.target.value || undefined })
              }
            />
          </div>

          <div className="filter-section">
            <h3>File Size</h3>
            <div className="size-inputs">
              <div className="size-input">
                <label>Min (MB)</label>
                <input
                  type="number"
                  min="0"
                  value={
                    localFilter.min_size ? Math.round(localFilter.min_size / 1048576) : ''
                  }
                  onChange={(e) =>
                    setLocalFilter({
                      ...localFilter,
                      min_size: e.target.value
                        ? parseInt(e.target.value) * 1048576
                        : undefined,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="size-input">
                <label>Max (MB)</label>
                <input
                  type="number"
                  min="0"
                  value={
                    localFilter.max_size ? Math.round(localFilter.max_size / 1048576) : ''
                  }
                  onChange={(e) =>
                    setLocalFilter({
                      ...localFilter,
                      max_size: e.target.value
                        ? parseInt(e.target.value) * 1048576
                        : undefined,
                    })
                  }
                  placeholder="∞"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="filter-footer">
          <button className="clear-btn" onClick={handleClear}>
            Clear All
          </button>
          <button className="apply-btn" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
