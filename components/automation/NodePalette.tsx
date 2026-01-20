/**
 * Node Palette - Sidebar con nodos disponibles
 */

import React, { useState } from 'react';
import { NodeTemplate } from '@/types/automation';
import './NodePalette.css';
import { 
  Package, 
  Zap, 
  Settings, 
  GitBranch, 
  Database, 
  Plug, 
  Palette,
  Search,
  Lightbulb,
  Plus,
  X
} from 'lucide-react';

interface NodePaletteProps {
  templates: NodeTemplate[];
  onAddNode: (template: NodeTemplate) => void;
  onClose: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ templates, onAddNode, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', icon: Package },
    { id: 'trigger', label: 'Triggers', icon: Zap },
    { id: 'action', label: 'Actions', icon: Settings },
    { id: 'logic', label: 'Logic', icon: GitBranch },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'integration', label: 'Apps', icon: Plug },
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="node-palette">
      <div className="node-palette-header">
        <div className="header-title">
          <Palette size={20} className="header-icon" />
          <h3>Add Nodes</h3>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close palette">
          <X size={20} />
        </button>
      </div>

      <div className="node-palette-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="node-palette-categories">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <Icon size={16} className="cat-icon" />
              <span className="cat-label">{category.label}</span>
            </button>
          );
        })}
      </div>

      <div className="node-palette-list">
        {filteredTemplates.length === 0 ? (
          <div className="empty-state">
            <Search size={48} className="empty-icon" />
            <p>No nodes found</p>
            <span className="empty-hint">Try a different search</span>
          </div>
        ) : (
          <>
            {selectedCategory === 'all' && searchQuery === '' && (
              <div className="palette-hint">
                <Lightbulb size={16} className="hint-icon" />
                <p>Drag & drop nodes onto the canvas or click to add</p>
              </div>
            )}
            {filteredTemplates.map((template, index) => (
              <div
                key={`${template.label}-${index}`}
                className="node-template"
                onClick={() => onAddNode(template)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/reactflow', JSON.stringify(template));
                  e.dataTransfer.effectAllowed = 'move';
                }}
              >
                <span className="template-icon">{template.icon}</span>
                <div className="template-info">
                  <div className="template-label">{template.label}</div>
                  <div className="template-description">{template.description}</div>
                </div>
                <Plus size={16} className="add-indicator" />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
