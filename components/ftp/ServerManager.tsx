'use client';

import React, { useState } from 'react';
import {
  FtpSite,
  getProtocolColor,
  formatTimestamp,
} from '../../types/ftp';
import './ServerManager.css';

interface ServerManagerProps {
  sites: FtpSite[];
  onConnect: (site: FtpSite) => void;
  onDelete: (siteId: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}

/**
 * ServerManager Component
 * 
 * Manages saved FTP sites with:
 * - Site list with details
 * - Quick connect
 * - Delete sites
 * - Edit site settings
 */
export default function ServerManager({
  sites,
  onConnect,
  onDelete,
  onRefresh,
  onClose,
}: ServerManagerProps) {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleConnect = (site: FtpSite) => {
    onConnect(site);
    onClose();
  };

  const handleDelete = (siteId: string) => {
    onDelete(siteId);
    setDeleteConfirm(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal server-manager" onClick={(e) => e.stopPropagation()} data-tour="server-manager">
        {/* Header */}
        <div className="modal-header">
          <h2>Server Manager</h2>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {sites.length === 0 ? (
            <div className="empty-state">
              <span>🖥️</span>
              <p>No saved sites</p>
              <p className="empty-hint">Create a new site to get started</p>
            </div>
          ) : (
            <div className="site-list">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className={`site-item ${selectedSite === site.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSite(site.id)}
                >
                  {/* Site Header */}
                  <div className="site-header">
                    <div className="site-name">{site.name}</div>
                    
                    <div
                      className="site-protocol"
                      ref={(el) => { if (el) el.style.color = getProtocolColor(site.protocol); }}
                    >
                      {site.protocol.toUpperCase()}
                    </div>
                  </div>

                  {/* Site Details */}
                  <div className="site-details">
                    <div className="site-detail">
                      <span className="detail-label">Host:</span>
                      <span className="detail-value">
                        {site.host}:{site.port}
                      </span>
                    </div>
                    
                    <div className="site-detail">
                      <span className="detail-label">Username:</span>
                      <span className="detail-value">{site.username}</span>
                    </div>
                    
                    {site.last_used && (
                      <div className="site-detail">
                        <span className="detail-label">Last used:</span>
                        <span className="detail-value">
                          {formatTimestamp(site.last_used)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Site Actions */}
                  <div className="site-actions">
                    <button
                      className="btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(site);
                      }}
                    >
                      Connect
                    </button>
                    
                    {deleteConfirm === site.id ? (
                      <>
                        <button
                          className="btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(site.id);
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          className="btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(null);
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(site.id);
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onRefresh}>
            Refresh
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
