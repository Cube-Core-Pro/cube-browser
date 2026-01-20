/**
 * Notes List Component
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import { Note, Category, getTypeIcon, getPriorityIcon, formatDate, getPreview } from '@/types/notes';
import './NotesList.css';

interface NotesListProps {
  notes: Note[];
  selectedNote: Note | null;
  categories: Category[];
  onSelectNote: (note: Note) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onArchiveNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNote,
  categories,
  onSelectNote,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdateNote,
  onDeleteNote,
  onArchiveNote,
  onTogglePin,
  onToggleFavorite,
  onDuplicate
}) => {
  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getCategoryColor = (categoryId: string | null): string => {
    if (!categoryId) return '#6b7280';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6b7280';
  };

  return (
    <div className="notes-list">
      {notes.map(note => (
        <div
          key={note.id}
          className={`note-item ${selectedNote?.id === note.id ? 'selected' : ''} ${note.pinned ? 'pinned' : ''}`}
          onClick={() => onSelectNote(note)}
        >
          <div className="note-item-header">
            <div className="note-item-icons">
              <span className="note-type-icon">{getTypeIcon(note.type)}</span>
              {note.pinned && <span className="pin-icon">📌</span>}
              {note.favorite && <span className="favorite-icon">⭐</span>}
              {note.reminder && <span className="reminder-icon">⏰</span>}
            </div>
            <span className="note-priority-icon">{getPriorityIcon(note.priority)}</span>
          </div>

          <h3 className="note-item-title">{note.title}</h3>

          {note.content && (
            <p className="note-item-preview">{getPreview(note.content, 100)}</p>
          )}

          <div className="note-item-meta">
            {note.category && (
              <span 
                className="note-category-badge"
                ref={(el) => { if (el) el.style.backgroundColor = getCategoryColor(note.category); }}
              >
                {getCategoryName(note.category)}
              </span>
            )}
            
            {note.tags.length > 0 && (
              <div className="note-tags-preview">
                {note.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="note-tag-mini">#{tag}</span>
                ))}
                {note.tags.length > 3 && (
                  <span className="note-tags-more">+{note.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>

          <div className="note-item-footer">
            <span className="note-date">{formatDate(note.updated_at)}</span>
            
            <div className="note-item-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(note.id);
                }}
                className="note-action-btn"
                title={note.pinned ? 'Unpin' : 'Pin'}
              >
                📌
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(note.id);
                }}
                className="note-action-btn"
                title={note.favorite ? 'Unfavorite' : 'Favorite'}
              >
                {note.favorite ? '⭐' : '☆'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(note.id);
                }}
                className="note-action-btn"
                title="Duplicate"
              >
                📋
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchiveNote(note.id);
                }}
                className="note-action-btn"
                title="Archive"
              >
                📦
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this note?')) {
                    onDeleteNote(note.id);
                  }
                }}
                className="note-action-btn delete"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
