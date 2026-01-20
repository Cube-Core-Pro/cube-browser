/**
 * Export Dialog - Configure export format and download
 */

import React, { useState, useCallback } from 'react';
import { ExtractedData, ExportFormat, ExportConfig, DataExportService } from '@/lib/services/extractor-service';
import { CheckCircle, AlertTriangle, X } from 'lucide-react';
import { logger } from '@/lib/services/logger-service';
import './ExportDialog.css';

const log = logger.scope('ExportDialog');

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ExportDialogProps {
  data: ExtractedData[];
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ data, onClose }) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [filename, setFilename] = useState('extracted_data');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleExport = async () => {
    setExporting(true);

    try {
      const config: ExportConfig = {
        format,
        filename,
        includeHeaders,
        pretty: true,
      };

      // Export data using ExtractorService - backend will handle file dialog and saving
      await DataExportService.export(data, config);

      showToast('success', 'Export successful!');
      // Close after a short delay so user sees the success message
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      log.error('Export failed:', error);
      showToast('error', `Export failed: ${error}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-dialog-overlay">
      <div className="export-dialog">
        <div className="dialog-header">
          <h2>Export Data</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="dialog-content">
          <div className="form-group">
            <label htmlFor="export-format">Format</label>
            <select 
              id="export-format"
              value={format} 
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              aria-label="Export format"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="excel">Excel (XLSX)</option>
              <option value="xml">XML</option>
              <option value="sql">SQL</option>
            </select>
          </div>

          <div className="form-group">
            <label>Filename</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="extracted_data"
            />
          </div>

          {(format === 'csv' || format === 'excel') && (
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                />
                Include headers
              </label>
            </div>
          )}

          <div className="export-preview">
            <h4>Preview ({data.length} records)</h4>
            <div className="preview-sample">
              <pre>{JSON.stringify(data.slice(0, 3), null, 2)}</pre>
              {data.length > 3 && <p className="preview-more">... and {data.length - 3} more</p>}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={exporting || !filename.trim()}
          >
            {exporting ? '⏳ Exporting...' : '💾 Export'}
          </button>
        </div>

        {/* Toast Notifications */}
        {toasts.length > 0 && (
          <div className="toast-container">
            {toasts.map(toast => (
              <div key={toast.id} className={`toast toast-${toast.type}`}>
                {toast.type === 'success' && <CheckCircle className="w-4 h-4" />}
                {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
                <span>{toast.message}</span>
                <button onClick={() => dismissToast(toast.id)} className="toast-dismiss">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
