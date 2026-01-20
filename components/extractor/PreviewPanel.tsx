/**
 * Preview Panel - Show extracted data preview
 */

import React, { useState } from 'react';
import { ExtractedData, ExtractionSchema } from '@/types/extractor';
import { logger } from '@/lib/services/logger-service';
import './PreviewPanel.css';

const _log = logger.scope('PreviewPanel'); // Reserved for future debugging

interface PreviewPanelProps {
  data: ExtractedData[];
  schema: ExtractionSchema | null;
  onExport: () => void;
  onClose: () => void;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  data,
  schema,
  onExport,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  const fields = schema?.fields.map(f => f.name) || [];

  return (
    <div className="preview-panel">
      <div className="preview-header">
        <div className="header-info">
          <h3>Preview</h3>
          <span className="record-count">{data.length} records</span>
        </div>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={viewMode === 'table' ? 'active' : ''}
              onClick={() => setViewMode('table')}
            >
              📊 Table
            </button>
            <button
              className={viewMode === 'json' ? 'active' : ''}
              onClick={() => setViewMode('json')}
            >
              📝 JSON
            </button>
          </div>
          <button className="btn-primary-small" onClick={onExport}>
            💾 Export
          </button>
          <button className="btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      <div className="preview-content">
        {viewMode === 'table' ? (
          <div className="table-view">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {fields.map((field) => (
                    <th key={field}>{field}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((record, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    {fields.map((field) => (
                      <td key={field}>
                        {typeof record[field] === 'object'
                          ? JSON.stringify(record[field])
                          : String(record[field] || '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="json-view">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
