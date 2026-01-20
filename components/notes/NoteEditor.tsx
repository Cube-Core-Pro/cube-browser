/**
 * Notes Editor Component - Simplified for space
 * CUBE Nexum Platform v2.0
 */

import React, { useState, useEffect } from 'react';
import { Note, Category, Tag, NotesSettings } from '@/types/notes';
import './NoteEditor.css';

interface NoteEditorProps {
  note: Note;
  categories: Category[];
  allTags: Tag[];
  settings: NotesSettings;
  onSave: (note: Note) => void;
  onClose: () => void;
  onDelete: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  categories,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allTags,
  settings,
  onSave,
  onClose,
  onDelete
}) => {
  const [editedNote, setEditedNote] = useState<Note>(note);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (settings.auto_save) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      const timer = setTimeout(() => {
        onSave(editedNote);
      }, settings.auto_save_interval * 1000);
      setAutoSaveTimer(timer);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editedNote]);

  const handleSave = () => {
    onSave({ ...editedNote, updated_at: Date.now() });
  };

  return (
    <div className="note-editor-overlay">
      <div className="note-editor">
        <div className="editor-header">
          <input
            type="text"
            value={editedNote.title}
            onChange={(e) => setEditedNote({ ...editedNote, title: e.target.value })}
            className="editor-title-input"
            placeholder="Note title..."
          />
          <div className="editor-actions">
            <button onClick={handleSave} className="btn-save">Save</button>
            <button onClick={onDelete} className="btn-delete">Delete</button>
            <button onClick={onClose} className="btn-close">×</button>
          </div>
        </div>

        <div className="editor-toolbar">
          <select
            value={editedNote.category || ''}
            onChange={(e) => setEditedNote({ ...editedNote, category: e.target.value || null })}
            aria-label="Select note category"
            title="Category"
          >
            <option value="">No Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          <select
            value={editedNote.priority}
            onChange={(e) => setEditedNote({ ...editedNote, priority: e.target.value as Note['priority'] })}
            aria-label="Select note priority"
            title="Priority"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <textarea
          value={editedNote.content}
          onChange={(e) => setEditedNote({ ...editedNote, content: e.target.value })}
          className="editor-content"
          placeholder="Start writing..."
        />

        <div className="editor-footer">
          <input
            type="text"
            placeholder="Add tags (comma separated)..."
            value={editedNote.tags.join(', ')}
            onChange={(e) => setEditedNote({
              ...editedNote,
              tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            })}
            className="tags-input"
          />
        </div>
      </div>
    </div>
  );
};
