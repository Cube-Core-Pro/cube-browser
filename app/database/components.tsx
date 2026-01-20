"use client";
import { logger } from '@/lib/services/logger-service';
const log = logger.scope('components');
// ============================================================================
// Additional Components for Database Page
// Part 2: Dialogs and Supporting Components
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, EyeOff, Copy, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  dockerService,
  type DatabaseContainer,
  type DatabaseType,
  type CreateDatabaseRequest,
} from '@/lib/services/dockerService';

// ============================================================================
// Create Container Dialog
// ============================================================================

interface CreateContainerDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateContainerDialog({
  open,
  onClose,
  onCreated,
}: CreateContainerDialogProps) {
  const [name, setName] = useState('');
  const [dbType, setDbType] = useState<DatabaseType>('postgresql');
  const [version, setVersion] = useState('16');
  const [port, setPort] = useState('5432');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoRestart, setAutoRestart] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const versions: Record<DatabaseType, string[]> = {
    postgresql: ['16', '15', '14', '13', '12'],
    mysql: ['8.0', '5.7', '5.6'],
    mongodb: ['7.0', '6.0', '5.0', '4.4'],
    redis: ['7.2', '7.0', '6.2', '6.0'],
  };

  const defaultPorts: Record<DatabaseType, string> = {
    postgresql: '5432',
    mysql: '3306',
    mongodb: '27017',
    redis: '6379',
  };

  // Update defaults when database type changes
  useEffect(() => {
    setVersion(versions[dbType][0]);
    setPort(defaultPorts[dbType]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbType]);

  // Generate random password
  const generatePassword = () => {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 16; i++) {
      pass += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(pass);
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Container name is required');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: CreateDatabaseRequest = {
        name: name.trim(),
        db_type: dbType,
        version,
        port: parseInt(port),
        password,
        auto_restart: autoRestart,
      };

      await dockerService.createDatabase(request);
      onCreated();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create container');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setPassword('');
    setShowPassword(false);
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Database Container</DialogTitle>
          <DialogDescription>
            Configure and create a new database container with Docker
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Container Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Container Name</Label>
            <Input
              id="name"
              placeholder="my-database"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Database Type */}
          <div className="space-y-2">
            <Label htmlFor="dbType">Database Type</Label>
            <Select value={dbType} onValueChange={(v) => setDbType(v as DatabaseType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="postgresql">🐘 PostgreSQL</SelectItem>
                <SelectItem value="mysql">🐬 MySQL</SelectItem>
                <SelectItem value="mongodb">🍃 MongoDB</SelectItem>
                <SelectItem value="redis">📦 Redis</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Version */}
          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Select value={version} onValueChange={setVersion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions[dbType].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Port */}
          <div className="space-y-2">
            <Label htmlFor="port">Host Port</Label>
            <Input
              id="port"
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={generatePassword}
                title="Generate password"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              {password && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(password)}
                  title="Copy password"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Auto Restart */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="autoRestart"
              checked={autoRestart}
              onChange={(e) => setAutoRestart(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="autoRestart" className="cursor-pointer">
              Auto-restart on failure
            </Label>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Connection Info */}
          {name && password && (
            <Card className="p-4 bg-muted/50">
              <div className="text-sm space-y-2">
                <div className="font-semibold">Connection Details:</div>
                <div className="font-mono text-xs space-y-1">
                  <div>
                    <span className="text-muted-foreground">Host:</span> localhost
                  </div>
                  <div>
                    <span className="text-muted-foreground">Port:</span> {port}
                  </div>
                  <div>
                    <span className="text-muted-foreground">User:</span>{' '}
                    {dbType === 'postgresql' ? 'postgres' : 'root'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Password:</span> {password}
                  </div>
                  {dbType === 'postgresql' && (
                    <div className="mt-2 p-2 bg-background rounded">
                      psql -h localhost -p {port} -U postgres -d postgres
                    </div>
                  )}
                  {dbType === 'mysql' && (
                    <div className="mt-2 p-2 bg-background rounded">
                      mysql -h localhost -P {port} -u root -p
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name || !password}>
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Create Container
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Logs Dialog
// ============================================================================

interface LogsDialogProps {
  open: boolean;
  onClose: () => void;
  container: DatabaseContainer;
}

export function LogsDialog({ open, onClose, container }: LogsDialogProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tail, setTail] = useState(100);

  useEffect(() => {
    if (open) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tail]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const containerLogs = await dockerService.getContainerLogs(container.id, tail);
      setLogs(containerLogs);
    } catch (err) {
      log.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Container Logs: {container.name}</DialogTitle>
          <DialogDescription>Real-time logs from Docker container</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Label>Show last:</Label>
            <Select
              value={tail.toString()}
              onValueChange={(v) => setTail(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 lines</SelectItem>
                <SelectItem value="100">100 lines</SelectItem>
                <SelectItem value="200">200 lines</SelectItem>
                <SelectItem value="500">500 lines</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLogs}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="relative">
            <pre className="bg-muted/50 p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono">
              {logs.length > 0 ? logs.join('\n') : 'No logs available'}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Supporting Components
// ============================================================================

interface DatabaseTypeCardProps {
  database: {
    id: DatabaseType;
    name: string;
    icon: string;
    description: string;
    versions: string[];
    defaultPort: number;
  };
  onSelect: () => void;
  disabled?: boolean;
}

export function DatabaseTypeCard({
  database,
  onSelect,
  disabled,
}: DatabaseTypeCardProps) {
  return (
    <Card className="database-type-card">
      <div className="database-type-card__icon">{database.icon}</div>
      <h3 className="database-type-card__name">{database.name}</h3>
      <p className="database-type-card__description">{database.description}</p>
      <div className="database-type-card__versions">
        <span className="database-type-card__versions-label">Versions:</span>
        <div className="database-type-card__versions-list">
          {database.versions.slice(0, 3).map((version) => (
            <Badge key={version} variant="secondary">
              {version}
            </Badge>
          ))}
        </div>
      </div>
      <Button
        onClick={onSelect}
        variant="outline"
        className="database-type-card__button"
        disabled={disabled}
      >
        Create {database.name}
      </Button>
    </Card>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="feature-card">
      <div className="feature-card__icon">{icon}</div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__description">{description}</p>
    </Card>
  );
}
