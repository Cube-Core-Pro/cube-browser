'use client';

import React, { useState, useEffect } from 'react';
import { vpnService, type VPNServer, type VPNStatus } from '@/lib/services/vpnService';
import { logger } from '@/lib/services/logger-service';

const log = logger.scope('VPNManager');

export function VPNManager() {
  const [servers, setServers] = useState<VPNServer[]>([]);
  const [status, setStatus] = useState<VPNStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [serversData, statusData] = await Promise.all([
        vpnService.getServers(),
        vpnService.getStatus(),
      ]);
      setServers(serversData);
      setStatus(statusData);
    } catch (err) {
      log.error('Failed to load VPN data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (serverId: string) => {
    setConnecting(true);
    try {
      await vpnService.connect(serverId);
      await loadData();
    } catch (err) {
      log.error('Connection failed:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await vpnService.disconnect();
      await loadData();
    } catch (err) {
      log.error('Disconnection failed:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">VPN Manager</h2>
      
      {/* Status */}
      {status && (
        <div className={`p-4 rounded-lg ${status.connected ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted'}`}>
          <p className="font-semibold">Status: {status.connected ? 'Connected' : 'Disconnected'}</p>
          {status.connected && status.server && (
            <>
              <p>Server: {status.server.name}</p>
              <p>IP: {status.publicIp}</p>
              <button
                onClick={handleDisconnect}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      )}

      {/* Servers */}
      <div className="grid gap-2">
        {servers.map(server => (
          <div key={server.id} className="border border-border rounded-lg p-4 bg-card">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{server.name}</p>
                <p className="text-sm text-muted-foreground">{server.city}, {server.country}</p>
                <p className="text-xs text-muted-foreground/70">Load: {server.load}% | Ping: {server.ping}ms</p>
              </div>
              <button
                onClick={() => handleConnect(server.id)}
                disabled={connecting || status?.connected}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground"
              >
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VPNManager;
