"use client";

import { logger } from '@/lib/services/logger-service';
const log = logger.scope('page');


import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { 
  Database, 
  Plus, 
  Play, 
  Square, 
  RefreshCw, 
  Trash2,
  FileText,
  Download,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { listen } from '@tauri-apps/api/event';
import {
  dockerService,
  type DatabaseContainer,
  type DatabaseType,
  type DockerInfo,
  type ContainerStats,
} from '@/lib/services/dockerService';
import {
  CreateContainerDialog,
  LogsDialog,
  DatabaseTypeCard,
  FeatureCard,
} from './components';
import './database.css';

const DATABASE_TYPES: Array<{
  id: DatabaseType;
  name: string;
  icon: string;
  description: string;
  versions: string[];
  defaultPort: number;
}> = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    icon: '🐘',
    description: 'Advanced open-source relational database',
    versions: ['16', '15', '14', '13', '12'],
    defaultPort: 5432,
  },
  {
    id: 'mysql',
    name: 'MySQL',
    icon: '🐬',
    description: 'Popular open-source relational database',
    versions: ['8.0', '5.7', '5.6'],
    defaultPort: 3306,
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    icon: '🍃',
    description: 'Document-oriented NoSQL database',
    versions: ['7.0', '6.0', '5.0', '4.4'],
    defaultPort: 27017,
  },
  {
    id: 'redis',
    name: 'Redis',
    icon: '📦',
    description: 'In-memory data structure store',
    versions: ['7.2', '7.0', '6.2', '6.0'],
    defaultPort: 6379,
  },
];

export default function DatabasePage() {
  const [containers, setContainers] = useState<DatabaseContainer[]>([]);
  const [dockerInfo, setDockerInfo] = useState<DockerInfo | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load containers on mount
  useEffect(() => {
    loadContainers();
    checkDockerStatus();

    // Listen for container events
    const unlisten = listen('docker:container_created', () => {
      loadContainers();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const loadContainers = async () => {
    try {
      setLoading(true);
      const containerList = await dockerService.listContainers();
      setContainers(containerList);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load containers');
    } finally {
      setLoading(false);
    }
  };

  const checkDockerStatus = async () => {
    try {
      const info = await dockerService.getDockerInfo();
      setDockerInfo(info);
    } catch (err) {
      setDockerInfo(null);
      log.error('Docker not available:', err);
    }
  };

  const handleContainerAction = async (
    action: 'start' | 'stop' | 'restart' | 'remove',
    container: DatabaseContainer
  ) => {
    try {
      setLoading(true);
      switch (action) {
        case 'start':
          await dockerService.startContainer(container.id);
          break;
        case 'stop':
          await dockerService.stopContainer(container.id);
          break;
        case 'restart':
          await dockerService.restartContainer(container.id);
          break;
        case 'remove':
          if (confirm(`Remove container "${container.name}"? This action cannot be undone.`)) {
            await dockerService.removeContainer(container.id, false);
          }
          break;
      }
      await loadContainers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="database-page">
      {/* Header */}
      <div className="database-page__header">
        <div className="database-page__header-content">
          <div className="database-page__icon">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h1 className="database-page__title">Database Server</h1>
            <p className="database-page__subtitle">
              Docker-powered database management for developers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {dockerInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>
                Docker {dockerInfo.version} ({dockerInfo.containers_running} running)
              </span>
            </div>
          )}
          <Button onClick={() => setShowCreateDialog(true)} variant="default">
            <Plus className="w-4 h-4 mr-2" />
            New Container
          </Button>
          <Button onClick={loadContainers} variant="outline" size="icon">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Docker Not Available */}
      {!dockerInfo && (
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                Docker Not Available
              </h3>
              <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                Make sure Docker Desktop is installed and running on your system.
              </p>
              <Button onClick={checkDockerStatus} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        </Card>
      )}

      <FeatureGate
        feature="databaseServer"
        upgradeMessage="Database server management is available on Pro and Elite plans. Create unlimited database containers with PostgreSQL, MySQL, MongoDB, and Redis."
      >
        {/* Active Containers */}
        {containers.length > 0 ? (
          <div className="database-page__containers">
            <h2 className="database-page__section-title">Active Containers</h2>
            <div className="database-page__container-grid">
              {containers.map((container) => (
                <ContainerCard
                  key={container.id}
                  container={container}
                  onAction={handleContainerAction}
                />
              ))}
            </div>
          </div>
        ) : (
          !loading && (
            <Card className="database-page__empty">
              <Database className="database-page__empty-icon" />
              <h3 className="database-page__empty-title">No containers yet</h3>
              <p className="database-page__empty-message">
                Create your first database container to get started
              </p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                variant="default"
                disabled={!dockerInfo}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Container
              </Button>
            </Card>
          )
        )}

        {/* Database Types */}
        <div className="database-page__types">
          <h2 className="database-page__section-title">Supported Databases</h2>
          <div className="database-page__types-grid">
            {DATABASE_TYPES.map((db) => (
              <DatabaseTypeCard
                key={db.id}
                database={db}
                onSelect={() => {
                  setShowCreateDialog(true);
                }}
                disabled={!dockerInfo}
              />
            ))}
          </div>
        </div>

        {/* Features List */}
        <div className="database-page__features">
          <h2 className="database-page__section-title">Features</h2>
          <div className="database-page__features-grid">
            <FeatureCard
              icon={<Play className="w-6 h-6" />}
              title="Start/Stop Containers"
              description="Control your database containers with a single click"
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="Real-time Logs"
              description="View container logs in real-time for debugging"
            />
            <FeatureCard
              icon={<Download className="w-6 h-6" />}
              title="Persistent Storage"
              description="Data persists across container restarts with Docker volumes"
            />
            <FeatureCard
              icon={<SettingsIcon className="w-6 h-6" />}
              title="Custom Configuration"
              description="Configure database settings and environment variables"
            />
            <FeatureCard
              icon={<RefreshCw className="w-6 h-6" />}
              title="Auto-restart"
              description="Automatically restart containers on failure"
            />
            <FeatureCard
              icon={<CheckCircle2 className="w-6 h-6" />}
              title="Production-Ready"
              description="Battle-tested Docker images with security updates"
            />
          </div>
        </div>
      </FeatureGate>

      {/* Create Container Dialog */}
      <CreateContainerDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onCreated={() => {
          setShowCreateDialog(false);
          loadContainers();
        }}
      />
    </div>
  );
}

// ============================================================================
// Container Card Component
// ============================================================================

interface ContainerCardProps {
  container: DatabaseContainer;
  onAction: (
    action: 'start' | 'stop' | 'restart' | 'remove',
    container: DatabaseContainer
  ) => void;
}

function ContainerCard({ container, onAction }: ContainerCardProps) {
  const [stats, setStats] = useState<ContainerStats | null>(container.stats);
  const [showLogs, setShowLogs] = useState(false);

  const statusColors = {
    created: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    running: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    restarting: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    exited: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    removing: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    dead: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  };

  const dbIcons: Record<DatabaseType, string> = {
    postgresql: '🐘',
    mysql: '🐬',
    mongodb: '🍃',
    redis: '📦',
  };

  // Update stats periodically for running containers
  useEffect(() => {
    if (container.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const newStats = await dockerService.getContainerStats(container.id);
          setStats(newStats);
        } catch (err) {
          log.error('Failed to get stats:', err);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [container.id, container.status]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <>
      <Card className="container-card">
        <div className="container-card__header">
          <div className="container-card__info">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{dbIcons[container.db_type]}</span>
              <div>
                <h3 className="container-card__name">{container.name}</h3>
                <div className="text-xs text-muted-foreground">
                  {container.db_type} {container.version}
                </div>
              </div>
            </div>
            <Badge className={statusColors[container.status]}>{container.status}</Badge>
          </div>
        </div>

        {stats && container.status === 'running' && (
          <div className="container-card__stats">
            <div className="container-card__stat">
              <span className="container-card__stat-label">CPU</span>
              <span className="container-card__stat-value">
                {stats.cpu_percentage.toFixed(1)}%
              </span>
            </div>
            <div className="container-card__stat">
              <span className="container-card__stat-label">Memory</span>
              <span className="container-card__stat-value">
                {formatBytes(stats.memory_usage)} / {formatBytes(stats.memory_limit)}
              </span>
            </div>
            <div className="container-card__stat">
              <span className="container-card__stat-label">Port</span>
              <span className="container-card__stat-value">{container.host_port}</span>
            </div>
          </div>
        )}

        <div className="container-card__actions">
          {container.status === 'running' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('stop', container)}
              title="Stop"
            >
              <Square className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('start', container)}
              title="Start"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('restart', container)}
            title="Restart"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLogs(true)}
            title="View Logs"
          >
            <FileText className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('remove', container)}
            className="text-red-500 hover:text-red-700"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
          <div>Volume: {container.volume_name}</div>
          <div>
            Created: {new Date(container.created_at * 1000).toLocaleString()}
          </div>
        </div>
      </Card>

      {/* Logs Dialog */}
      <LogsDialog
        open={showLogs}
        onClose={() => setShowLogs(false)}
        container={container}
      />
    </>
  );
}

// Continue in next message...
