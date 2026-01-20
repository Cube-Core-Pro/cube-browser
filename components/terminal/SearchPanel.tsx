/**
 * Search Panel Component - Terminal search functionality
 * CUBE Nexum Platform v2.0
 */

import { logger } from '@/lib/services/logger-service';

const log = logger.scope('SearchPanel');

import React, { useState } from 'react';
import './SearchPanel.css';

interface SearchPanelProps {
  onClose: () => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);

  const handleSearch = (direction: 'next' | 'prev') => {
    if (!searchQuery.trim()) return;
    
    // Dispatch search event to parent terminal component
    const searchEvent = new CustomEvent('terminal-search', {
      detail: {
        query: searchQuery,
        direction,
        caseSensitive,
        useRegex
      },
      bubbles: true
    });
    document.dispatchEvent(searchEvent);
    
    log.debug('Search dispatched:', { searchQuery, direction, caseSensitive, useRegex });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e.shiftKey ? 'prev' : 'next');
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="search-panel">
      <input
        type="text"
        placeholder="Find in terminal..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="search-input"
        autoFocus
      />

      <div className="search-options">
        <label className="option">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Case Sensitive
        </label>
        <label className="option">
          <input
            type="checkbox"
            checked={useRegex}
            onChange={(e) => setUseRegex(e.target.checked)}
          />
          Regex
        </label>
      </div>

      <div className="search-buttons">
        <button onClick={() => handleSearch('prev')} title="Previous Match">
          ↑
        </button>
        <button onClick={() => handleSearch('next')} title="Next Match">
          ↓
        </button>
        <button onClick={onClose} title="Close Search">
          ✕
        </button>
      </div>
    </div>
  );
};
