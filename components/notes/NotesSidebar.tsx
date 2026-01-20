/**
 * Notes Sidebar Component - Simplified
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import { Category, Tag, NoteFilter, NotesStats } from '@/types/notes';
import './NotesSidebar.css';

interface NotesSidebarProps {
  categories: Category[];
  tags: Tag[];
  filter: NoteFilter;
  stats: NotesStats;
  onFilterChange: (filter: Partial<NoteFilter>) => void;
  onCreateCategory: (name: string, color: string, icon: string) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onClose: () => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  categories,
  tags,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  filter,
  stats,
  onFilterChange
}) => {
  return (
    <div className="notes-sidebar">
      <div className="sidebar-section">
        <h3>Quick Filters</h3>
        <button onClick={() => onFilterChange({ status: ['active'] })} className="filter-btn">
          📝 All Notes ({stats.active_notes})
        </button>
        <button onClick={() => onFilterChange({ favorite_only: true })} className="filter-btn">
          ⭐ Favorites
        </button>
        <button onClick={() => onFilterChange({ pinned_only: true })} className="filter-btn">
          📌 Pinned
        </button>
        <button onClick={() => onFilterChange({ status: ['archived'] })} className="filter-btn">
          📦 Archived ({stats.archived_notes})
        </button>
      </div>

      <div className="sidebar-section">
        <h3>Categories</h3>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onFilterChange({ categories: [cat.id] })}
            className="category-btn"
            ref={(el) => { if (el) el.style.borderLeftColor = cat.color; }}
          >
            {cat.icon} {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      <div className="sidebar-section">
        <h3>Popular Tags</h3>
        {tags.slice(0, 10).map(tag => (
          <button
            key={tag.name}
            onClick={() => onFilterChange({ tags: [tag.name] })}
            className="tag-btn"
          >
            #{tag.name} ({tag.count})
          </button>
        ))}
      </div>
    </div>
  );
};
