/**
 * Notes Grid Component
 * CUBE Nexum Platform v2.0
 */

import React from 'react';
import { Note, Category, getTypeIcon, getPriorityIcon, formatDate, getPreview } from '@/types/notes';
import './NotesGrid.css';

interface NotesGridProps {
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

export const NotesGrid: React.FC<NotesGridProps> = ({
  notes,
  selectedNote,
  categories,
  onSelectNote,
  onDeleteNote,
  onArchiveNote,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTogglePin,
  onToggleFavorite,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDuplicate
}) => {
  const getCategoryColor = (categoryId: string | null): string => {
    if (!categoryId) return '#6b7280';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.color : '#6b7280';
  };

  return (
    <div className="notes-grid">
      {notes.map(note => (
        <div
          key={note.id}
          className={`note-card ${selectedNote?.id === note.id ? 'selected' : ''} ${note.pinned ? 'pinned' : ''}`}
          onClick={() => onSelectNote(note)}
          ref={(el) => { 
            if (el) {
              el.style.borderColor = note.color || getCategoryColor(note.category);
              if (note.color) el.style.backgroundColor = `${note.color}10`;
            }
          }}
        >
          <div className="note-card-header">
            <div className="note-card-icons">
              <span className="note-type">{getTypeIcon(note.type)}</span>
              {note.pinned && <span className="pin-badge">📌</span>}
              {note.favorite && <span className="fav-badge">⭐</span>}
            </div>
            <span className="note-priority">{getPriorityIcon(note.priority)}</span>
          </div>

          <h3 className="note-card-title">{note.title}</h3>

          {note.content && (
            <p className="note-card-content">{getPreview(note.content, 120)}</p>
          )}

          {note.tags.length > 0 && (
            <div className="note-card-tags">
              {note.tags.slice(0, 4).map(tag => (
                <span key={tag} className="note-tag">#{tag}</span>
              ))}
              {note.tags.length > 4 && (
                <span className="tags-more">+{note.tags.length - 4}</span>
              )}
            </div>
          )}

          <div className="note-card-footer">
            <span className="note-card-date">{formatDate(note.updated_at)}</span>
            
            <div className="note-card-actions">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(note.id);
                }}
                className="card-action-btn"
                title="Favorite"
              >
                {note.favorite ? '⭐' : '☆'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchiveNote(note.id);
                }}
                className="card-action-btn"
                title="Archive"
              >
                📦
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete?')) onDeleteNote(note.id);
                }}
                className="card-action-btn delete"
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
