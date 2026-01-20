/**
 * Schema Builder - Configure extraction schema
 */

import React, { useState } from 'react';
import {
  ExtractionSchema,
  ExtractionField,
  SelectorSuggestion,
} from '@/types/extractor';
import './SchemaBuilder.css';

interface SchemaBuilderProps {
  schema: ExtractionSchema;
  onUpdateSchema: (schema: ExtractionSchema) => void;
  onAddField: (field: ExtractionField) => void;
  onRemoveField: (fieldId: string) => void;
  onUpdateField: (fieldId: string, updates: Partial<ExtractionField>) => void;
  onStartSelection: () => void;
  onSave: () => void;
  suggestions: SelectorSuggestion[];
}

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({
  schema,
  onUpdateSchema,
  onAddField,
  onRemoveField,
  onUpdateField,
  onStartSelection,
  onSave,
  suggestions,
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');

  const handleAddNewField = () => {
    if (!newFieldName.trim()) return;

    const newField: ExtractionField = {
      id: `field_${Date.now()}`,
      name: newFieldName,
      selector: {
        id: `selector_${Date.now()}`,
        type: 'css',
        value: '',
        strategy: 'single',
        label: newFieldName,
      },
    };

    onAddField(newField);
    setNewFieldName('');
  };

  const handleUpdateSchemaName = (name: string) => {
    onUpdateSchema({ ...schema, name, modified: new Date() });
  };

  const handleUpdateSchemaUrl = (url: string) => {
    onUpdateSchema({ ...schema, url, modified: new Date() });
  };

  const handleUpdateFieldSelector = (fieldId: string, selector: string) => {
    const field = schema.fields.find(f => f.id === fieldId);
    if (!field) return;

    onUpdateField(fieldId, {
      selector: {
        ...field.selector,
        value: selector,
      },
    });
  };

  const applySuggestion = (fieldId: string, suggestion: SelectorSuggestion) => {
    onUpdateField(fieldId, { selector: suggestion.selector });
  };

  return (
    <div className="schema-builder">
      {/* Schema Info */}
      <div className="schema-info-panel">
        <div className="form-group">
          <label>Schema Name</label>
          <input
            type="text"
            value={schema.name}
            onChange={(e) => handleUpdateSchemaName(e.target.value)}
            placeholder="My Schema"
          />
        </div>
        <div className="form-group">
          <label>Target URL</label>
          <input
            type="url"
            value={schema.url}
            onChange={(e) => handleUpdateSchemaUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      </div>

      {/* Fields */}
      <div className="fields-section">
        <div className="fields-header">
          <h3>Fields ({schema.fields.length})</h3>
          <button className="btn-secondary-small" onClick={onStartSelection}>
            🎯 Select Element
          </button>
        </div>

        <div className="fields-list">
          {schema.fields.map((field) => (
            <div
              key={field.id}
              className={`field-item ${editingField === field.id ? 'editing' : ''}`}
            >
              <div className="field-header">
                <div className="field-name">
                  <span className="field-icon">📌</span>
                  <span>{field.name}</span>
                </div>
                <div className="field-actions">
                  <button
                    className="btn-icon-xs"
                    onClick={() =>
                      setEditingField(editingField === field.id ? null : field.id)
                    }
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon-xs"
                    onClick={() => onRemoveField(field.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {editingField === field.id && (
                <div className="field-editor">
                  <div className="form-group-small">
                    <label id={`selector-type-${field.id}`}>Selector Type</label>
                    <select
                      value={field.selector.type}
                      onChange={(e) =>
                        onUpdateField(field.id, {
                          selector: {
                            ...field.selector,
                            type: e.target.value as 'css' | 'xpath' | 'text' | 'attribute' | 'smart',
                          },
                        })
                      }
                      aria-labelledby={`selector-type-${field.id}`}
                      title="Select selector type"
                    >
                      <option value="css">CSS Selector</option>
                      <option value="xpath">XPath</option>
                      <option value="text">Text Content</option>
                      <option value="attribute">Attribute</option>
                      <option value="smart">Smart (AI)</option>
                    </select>
                  </div>

                  <div className="form-group-small">
                    <label>Selector Value</label>
                    <textarea
                      value={field.selector.value}
                      onChange={(e) =>
                        handleUpdateFieldSelector(field.id, e.target.value)
                      }
                      placeholder="e.g., .product-title"
                      rows={2}
                    />
                  </div>

                  <div className="form-group-small">
                    <label id={`strategy-${field.id}`}>Strategy</label>
                    <select
                      value={field.selector.strategy}
                      onChange={(e) =>
                        onUpdateField(field.id, {
                          selector: {
                            ...field.selector,
                            strategy: e.target.value as 'single' | 'multiple' | 'table' | 'list' | 'nested',
                          },
                        })
                      }
                      aria-labelledby={`strategy-${field.id}`}
                      title="Select extraction strategy"
                    >
                      <option value="single">Single Element</option>
                      <option value="multiple">Multiple Elements</option>
                      <option value="table">Table Data</option>
                      <option value="list">List Items</option>
                      <option value="nested">Nested Structure</option>
                    </select>
                  </div>

                  {/* AI Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="suggestions-section">
                      <label>AI Suggestions</label>
                      {suggestions.map((suggestion, idx) => (
                        <div key={idx} className="suggestion-item">
                          <div className="suggestion-info">
                            <span className="suggestion-selector">
                              {suggestion.selector.value}
                            </span>
                            <span className="suggestion-score">
                              {suggestion.score}%
                            </span>
                          </div>
                          <button
                            className="btn-link-small"
                            onClick={() => applySuggestion(field.id, suggestion)}
                          >
                            Apply
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Field */}
        <div className="add-field-section">
          <input
            type="text"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="Field name..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddNewField()}
          />
          <button className="btn-secondary-small" onClick={handleAddNewField}>
            ➕ Add Field
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="schema-actions">
        <button className="btn-primary" onClick={onSave}>
          💾 Save Schema
        </button>
      </div>
    </div>
  );
};
