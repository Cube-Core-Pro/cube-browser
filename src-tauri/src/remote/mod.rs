// Remote Connection Management Module
// Provides unified interface for remote connections (VPN, RDP, FTP, SSH)

use serde::{Deserialize, Serialize};

// ============================================================================
// TYPES
// ============================================================================

/// Remote connection types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum RemoteConnection {
    /// VPN Connection
    VPN {
        config_id: String,
        provider: String,
        status: ConnectionStatus,
    },
    /// RDP Connection
    RDP {
        config_id: String,
        host: String,
        port: u16,
        status: ConnectionStatus,
    },
    /// FTP/SFTP Connection
    FTP {
        site_id: String,
        host: String,
        protocol: String,
        status: ConnectionStatus,
    },
    /// SSH Connection
    SSH {
        session_id: String,
        host: String,
        port: u16,
        status: ConnectionStatus,
    },
}

/// Connection status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ConnectionStatus {
    Connected,
    Connecting,
    Disconnected,
    Error(String),
}

/// Remote connection manager
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteManager {
    pub connections: Vec<RemoteConnection>,
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

impl RemoteManager {
    /// Create new remote manager
    pub fn new() -> Self {
        Self {
            connections: Vec::new(),
        }
    }

    /// Add connection
    pub fn add_connection(&mut self, connection: RemoteConnection) {
        self.connections.push(connection);
    }

    /// Remove connection
    pub fn remove_connection(&mut self, index: usize) {
        if index < self.connections.len() {
            self.connections.remove(index);
        }
    }

    /// Get all connections
    pub fn get_connections(&self) -> &[RemoteConnection] {
        &self.connections
    }

    /// Get connected connections
    pub fn get_connected(&self) -> Vec<&RemoteConnection> {
        self.connections
            .iter()
            .filter(|c| matches!(c.status(), ConnectionStatus::Connected))
            .collect()
    }
}

impl RemoteConnection {
    /// Get connection status
    pub fn status(&self) -> &ConnectionStatus {
        match self {
            RemoteConnection::VPN { status, .. } => status,
            RemoteConnection::RDP { status, .. } => status,
            RemoteConnection::FTP { status, .. } => status,
            RemoteConnection::SSH { status, .. } => status,
        }
    }

    /// Get connection name
    pub fn name(&self) -> String {
        match self {
            RemoteConnection::VPN { config_id, .. } => format!("VPN: {}", config_id),
            RemoteConnection::RDP { host, .. } => format!("RDP: {}", host),
            RemoteConnection::FTP { site_id, .. } => format!("FTP: {}", site_id),
            RemoteConnection::SSH { session_id, .. } => format!("SSH: {}", session_id),
        }
    }
}

impl Default for RemoteManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_remote_manager_creation() {
        let manager = RemoteManager::new();
        assert_eq!(manager.connections.len(), 0);
    }

    #[test]
    fn test_add_connection() {
        let mut manager = RemoteManager::new();
        let connection = RemoteConnection::VPN {
            config_id: "test".to_string(),
            provider: "test_provider".to_string(),
            status: ConnectionStatus::Connected,
        };
        manager.add_connection(connection);
        assert_eq!(manager.connections.len(), 1);
    }

    #[test]
    fn test_get_connected() {
        let mut manager = RemoteManager::new();
        manager.add_connection(RemoteConnection::VPN {
            config_id: "vpn1".to_string(),
            provider: "provider1".to_string(),
            status: ConnectionStatus::Connected,
        });
        manager.add_connection(RemoteConnection::VPN {
            config_id: "vpn2".to_string(),
            provider: "provider2".to_string(),
            status: ConnectionStatus::Disconnected,
        });
        let connected = manager.get_connected();
        assert_eq!(connected.len(), 1);
    }
}
