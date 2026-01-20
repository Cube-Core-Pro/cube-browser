'use client';

import React, { useState } from 'react';
import {
  FtpSite,
  CreateSiteRequest,
  FtpProtocol,
  getDefaultPort,
  getProtocolDisplayName,
  validateSite,
} from '../../types/ftp';
import './ConnectionDialog.css';

interface ConnectionDialogProps {
  sites: FtpSite[];
  onConnect: (site: FtpSite) => void;
  onCreateSite: (site: CreateSiteRequest) => Promise<void>;
  onClose: () => void;
}

/**
 * ConnectionDialog Component
 * 
 * Dialog for connecting to FTP sites with:
 * - Quick connect to saved sites
 * - Create new site
 * - Protocol selection (FTP/FTPS/SFTP/FTPES)
 */
export default function ConnectionDialog({
  sites,
  onConnect,
  onCreateSite,
  onClose,
}: ConnectionDialogProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New site form state
  const [newSite, setNewSite] = useState<Partial<CreateSiteRequest>>({
    protocol: 'sftp',
    port: 22,
  });

  const handleConnect = (site: FtpSite) => {
    onConnect(site);
  };

  const handleCreate = async () => {
    setError(null);
    
    // Validate
    const validationError = validateSite(newSite);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    
    try {
      await onCreateSite({
        name: newSite.name!,
        protocol: newSite.protocol!,
        host: newSite.host!,
        port: newSite.port,
        username: newSite.username!,
        password_encrypted: newSite.password_encrypted,
        ssh_key_path: newSite.ssh_key_path,
      });
      
      // Reset form
      setNewSite({
        protocol: 'sftp',
        port: 22,
      });
      
      setMode('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create site');
    } finally {
      setLoading(false);
    }
  };

  const handleProtocolChange = (protocol: FtpProtocol) => {
    setNewSite({
      ...newSite,
      protocol,
      port: getDefaultPort(protocol),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal connection-dialog" onClick={(e) => e.stopPropagation()} data-tour="connection-dialog">
        {/* Header */}
        <div className="modal-header">
          <h2>{mode === 'select' ? 'Connect to Server' : 'New Site'}</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="dialog-tabs">
          <button
            className={`tab ${mode === 'select' ? 'active' : ''}`}
            onClick={() => setMode('select')}
          >
            Saved Sites
          </button>
          <button
            className={`tab ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            New Site
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {mode === 'select' ? (
            // Saved Sites List
            sites.length === 0 ? (
              <div className="empty-state">
                <span>🖥️</span>
                <p>No saved sites</p>
                <p className="empty-hint">Create a new site to get started</p>
              </div>
            ) : (
              <div className="site-list">
                {sites.map((site, index) => (
                  <div key={site.id} className="site-card" onClick={() => handleConnect(site)} data-tour={index === 0 ? 'site-card' : undefined}>
                    <div className="site-card-header">
                      <div className="site-name">{site.name}</div>
                      <div className="site-protocol">{site.protocol.toUpperCase()}</div>
                    </div>
                    
                    <div className="site-card-details">
                      {site.host}:{site.port} • {site.username}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // New Site Form
            <div className="new-site-form" data-tour="site-form">
              {error && <div className="form-error">{error}</div>}

              {/* Protocol Selection */}
              <div className="form-group">
                <label>Protocol</label>
                <div className="protocol-selector" data-tour="protocol-selector">
                  {(['ftp', 'ftps', 'sftp', 'ftpes'] as FtpProtocol[]).map((protocol) => (
                    <button
                      key={protocol}
                      className={`protocol-option ${
                        newSite.protocol === protocol ? 'selected' : ''
                      }`}
                      onClick={() => handleProtocolChange(protocol)}
                    >
                      <div className="protocol-name">{protocol.toUpperCase()}</div>
                      <div className="protocol-desc">{getProtocolDisplayName(protocol)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Site Name */}
              <div className="form-group">
                <label>Site Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="My FTP Server"
                  value={newSite.name || ''}
                  onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                />
              </div>

              {/* Host */}
              <div className="form-group">
                <label>Host</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="ftp.example.com"
                  value={newSite.host || ''}
                  onChange={(e) => setNewSite({ ...newSite, host: e.target.value })}
                />
              </div>

              {/* Port */}
              <div className="form-group">
                <label>Port</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="21"
                  value={newSite.port || ''}
                  onChange={(e) =>
                    setNewSite({ ...newSite, port: parseInt(e.target.value) || undefined })
                  }
                />
              </div>

              {/* Username */}
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="username"
                  value={newSite.username || ''}
                  onChange={(e) => setNewSite({ ...newSite, username: e.target.value })}
                />
              </div>

              {/* Password */}
              {newSite.protocol !== 'sftp' && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="••••••••"
                    value={newSite.password_encrypted || ''}
                    onChange={(e) =>
                      setNewSite({ ...newSite, password_encrypted: e.target.value })
                    }
                  />
                </div>
              )}

              {/* SSH Key Path (SFTP only) */}
              {newSite.protocol === 'sftp' && (
                <div className="form-group">
                  <label>SSH Key Path (optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="~/.ssh/id_rsa"
                    value={newSite.ssh_key_path || ''}
                    onChange={(e) => setNewSite({ ...newSite, ssh_key_path: e.target.value })}
                  />
                  
                  {!newSite.ssh_key_path && (
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        className="input-field"
                        placeholder="••••••••"
                        value={newSite.password_encrypted || ''}
                        onChange={(e) =>
                          setNewSite({ ...newSite, password_encrypted: e.target.value })
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          
          {mode === 'create' && (
            <button
              className="btn-primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create & Connect'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
