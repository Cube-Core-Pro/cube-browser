/**
 * Add Download Dialog Component - Add new download
 * CUBE Nexum Platform v2.0
 */

import React, { useState } from 'react';
import { DownloadSettings, isValidDownloadUrl } from '../../types/download';
import './AddDownloadDialog.css';

interface AddDownloadDialogProps {
  settings: DownloadSettings;
  onAdd: (url: string, destination?: string) => void;
  onClose: () => void;
}

export const AddDownloadDialog: React.FC<AddDownloadDialogProps> = ({
  settings,
  onAdd,
  onClose,
}) => {
  const [url, setUrl] = useState('');
  const [destination, setDestination] = useState(settings.default_destination);
  const [useDefaultDest, setUseDefaultDest] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidDownloadUrl(url)) {
      setError('Invalid URL. Must start with http://, https://, or ftp://');
      return;
    }

    const finalDest = useDefaultDest ? settings.default_destination : destination;
    onAdd(url, finalDest);
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (isValidDownloadUrl(text)) {
        setUrl(text);
        setError(null);
      } else {
        setError('Clipboard does not contain a valid URL');
      }
    } catch {
      setError('Failed to read clipboard');
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="add-download-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Add Download</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="dialog-content">
          <div className="form-group">
            <label>Download URL *</label>
            <div className="url-input-group">
              <input
                type="text"
                placeholder="https://example.com/file.zip"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
              <button className="paste-btn" onClick={handlePaste} title="Paste from clipboard">
                📋
              </button>
            </div>
            {error && <span className="error-text">{error}</span>}
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useDefaultDest}
                onChange={(e) => setUseDefaultDest(e.target.checked)}
              />
              Use default destination
            </label>
          </div>

          {!useDefaultDest && (
            <div className="form-group">
              <label>Destination</label>
              <input
                type="text"
                placeholder="/path/to/downloads"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="add-btn" onClick={handleAdd} disabled={!url.trim()}>
            Start Download
          </button>
        </div>
      </div>
    </div>
  );
};
