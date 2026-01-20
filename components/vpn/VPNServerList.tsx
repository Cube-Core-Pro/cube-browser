import React, { useState, useMemo, useCallback } from 'react';
import { logger } from '@/lib/services/logger-service';
import { VPNServer, getCountryFlag, getLoadStatus, sortServersByPing, sortServersByLoad, filterServers, getUniqueCountries } from '../../types/vpn';
import './VPNServerList.css';

const log = logger.scope('VPNServerList');

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface VPNServerListProps {
  servers: VPNServer[];
  currentServer: VPNServer | null;
  connected: boolean;
  onConnect: (serverId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
}

type SortOption = 'ping' | 'load' | 'name' | 'country';

/**
 * VPNServerList Component
 * 
 * Displays and manages VPN servers with:
 * - Server grid with location, load, and ping information
 * - Filtering by country, protocol, premium status
 * - Sorting by ping, load, name, or country
 * - Search functionality
 * - Quick connect buttons
 */
export const VPNServerList: React.FC<VPNServerListProps> = ({
  servers,
  currentServer,
  connected,
  onConnect,
  onRefresh,
  refreshing,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedProtocol, setSelectedProtocol] = useState<'' | 'OpenVPN' | 'WireGuard'>('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('ping');
  const [connecting, setConnecting] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast notification helper
  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  // Get unique countries for filter
  const countries = useMemo(() => getUniqueCountries(servers), [servers]);

  // Filter and sort servers
  const filteredServers = useMemo(() => {
    let result = servers;

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        server =>
          server.name.toLowerCase().includes(term) ||
          server.country.toLowerCase().includes(term) ||
          server.city.toLowerCase().includes(term)
      );
    }

    // Apply filters
    result = filterServers(result, {
      country: selectedCountry || undefined,
      protocol: selectedProtocol || undefined,
      premiumOnly: premiumOnly || undefined,
    });

    // Apply sorting
    switch (sortBy) {
      case 'ping':
        result = sortServersByPing(result);
        break;
      case 'load':
        result = sortServersByLoad(result);
        break;
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'country':
        result = [...result].sort((a, b) => a.country.localeCompare(b.country));
        break;
    }

    return result;
  }, [servers, searchTerm, selectedCountry, selectedProtocol, premiumOnly, sortBy]);

  /**
   * Handle server connection
   */
  const handleConnect = async (serverId: string) => {
    if (connected) {
      showToast('info', 'Please disconnect from current server first');
      return;
    }

    setConnecting(serverId);
    try {
      await onConnect(serverId);
      showToast('success', 'Connected successfully');
    } catch (error) {
      log.error('Failed to connect:', error);
      showToast('error', 'Failed to connect to server');
    } finally {
      setConnecting(null);
    }
  };

  /**
   * Clear all filters
   */
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCountry('');
    setSelectedProtocol('');
    setPremiumOnly(false);
  };

  return (
    <div className="vpn-server-list">
      {/* Controls Bar */}
      <div className="server-controls">
        {/* Search */}
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search servers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="filters">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="filter-select"
            aria-label="Filter by country"
            title="Select country to filter servers"
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>
                {getCountryFlag(country)} {country}
              </option>
            ))}
          </select>

          <select
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value as '' | 'OpenVPN' | 'WireGuard')}
            className="filter-select"
            aria-label="Filter by protocol"
            title="Select VPN protocol"
          >
            <option value="">All Protocols</option>
            <option value="WireGuard">WireGuard</option>
            <option value="OpenVPN">OpenVPN</option>
          </select>

          <label className="checkbox-filter">
            <input
              type="checkbox"
              checked={premiumOnly}
              onChange={(e) => setPremiumOnly(e.target.checked)}
            />
            <span>Premium Only</span>
          </label>

          {(searchTerm || selectedCountry || selectedProtocol || premiumOnly) && (
            <button className="btn-clear-filters" onClick={handleClearFilters}>
              Clear Filters
            </button>
          )}
        </div>

        {/* Sort Options */}
        <div className="sort-options">
          <label>Sort by:</label>
          <div className="sort-buttons">
            <button
              className={`sort-button ${sortBy === 'ping' ? 'active' : ''}`}
              onClick={() => setSortBy('ping')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ping
            </button>
            <button
              className={`sort-button ${sortBy === 'load' ? 'active' : ''}`}
              onClick={() => setSortBy('load')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Load
            </button>
            <button
              className={`sort-button ${sortBy === 'name' ? 'active' : ''}`}
              onClick={() => setSortBy('name')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              Name
            </button>
            <button
              className={`sort-button ${sortBy === 'country' ? 'active' : ''}`}
              onClick={() => setSortBy('country')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Country
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="results-header">
        <span className="results-count">
          {filteredServers.length} server{filteredServers.length !== 1 ? 's' : ''} found
        </span>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="btn-refresh-small"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={refreshing ? 'spinning' : ''}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Server Grid */}
      {filteredServers.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>No servers found</h3>
          <p>Try adjusting your filters or search term</p>
          <button onClick={handleClearFilters} className="btn-primary">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="servers-grid">
          {filteredServers.map(server => {
            const isConnected = currentServer?.id === server.id;
            const isConnecting = connecting === server.id;
            const loadStatus = getLoadStatus(server.load);

            return (
              <div
                key={server.id}
                className={`server-card ${isConnected ? 'connected' : ''} ${isConnecting ? 'connecting' : ''}`}
              >
                {/* Server Header */}
                <div className="server-header">
                  <div className="server-name">
                    <span className="country-flag">{getCountryFlag(server.country)}</span>
                    <span className="name">{server.name}</span>
                  </div>
                  {server.premium && (
                    <span className="premium-badge">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Premium
                    </span>
                  )}
                </div>

                {/* Server Location */}
                <div className="server-location">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {server.city}, {server.country}
                </div>

                {/* Server Stats */}
                <div className="server-stats">
                  {/* Protocol */}
                  <div className="stat-item">
                    <span className="stat-label">Protocol</span>
                    <span className={`protocol-badge ${server.protocol.toLowerCase()}`}>
                      {server.protocol}
                    </span>
                  </div>

                  {/* Ping */}
                  <div className="stat-item">
                    <span className="stat-label">Ping</span>
                    <span className={`ping-value ${
                      server.ping < 50 ? 'excellent' : 
                      server.ping < 100 ? 'good' : 
                      server.ping < 150 ? 'fair' : 'poor'
                    }`}>
                      {server.ping}ms
                    </span>
                  </div>

                  {/* Load */}
                  <div className="stat-item full-width">
                    <span className="stat-label">Load</span>
                    <div className="load-bar-container">
                      <div className="load-bar">
                        <div
                          className={`load-fill ${loadStatus}`}
                          style={{ width: `${server.load}%` }}
                        ></div>
                      </div>
                      <span className="load-percentage">{server.load}%</span>
                    </div>
                  </div>
                </div>

                {/* Server IP */}
                <div className="server-ip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                  <span className="ip-address">{server.ip}</span>
                </div>

                {/* Connect Button */}
                <button
                  onClick={() => handleConnect(server.id)}
                  disabled={isConnected || isConnecting || connected}
                  className={`btn-connect ${isConnected ? 'connected' : ''}`}
                >
                  {isConnected ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Connected
                    </>
                  ) : isConnecting ? (
                    <>
                      <div className="spinner-small"></div>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Connect
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
