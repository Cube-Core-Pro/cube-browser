/**
 * Docker Database Service
 * 
 * TypeScript service for managing Docker database containers
 * via CUBE Nexum backend (Bollard/Docker API)
 */

import { invoke } from '@tauri-apps/api/core';

// ============================================================================
// Types
// ============================================================================

export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'redis';

export type ContainerStatus =
  | 'created'
  | 'running'
  | 'paused'
  | 'restarting'
  | 'removing'
  | 'exited'
  | 'dead'
  | 'unknown';

export interface DatabaseContainer {
  id: string;
  name: string;
  db_type: DatabaseType;
  version: string;
  status: ContainerStatus;
  port: number;
  host_port: number;
  created_at: number;
  started_at: number | null;
  volume_name: string;
  network: string;
  stats: ContainerStats | null;
}

export interface ContainerStats {
  cpu_percentage: number;
  memory_usage: number;
  memory_limit: number;
  memory_percentage: number;
  network_rx: number;
  network_tx: number;
}

export interface CreateDatabaseRequest {
  name: string;
  db_type: DatabaseType;
  version: string;
  port?: number;
  password: string;
  volume_name?: string;
  env_vars?: string[];
  auto_restart: boolean;
}

export interface DockerInfo {
  connected: boolean;
  version: string | null;
  api_version: string | null;
  os: string | null;
  arch: string | null;
  containers_running: number;
  containers_paused: number;
  containers_stopped: number;
  images: number;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Get Docker daemon information
 */
export async function getDockerInfo(): Promise<DockerInfo> {
  return await invoke<DockerInfo>('docker_get_info');
}

/**
 * Test Docker connection
 */
export async function testDockerConnection(): Promise<boolean> {
  return await invoke<boolean>('docker_test_connection');
}

/**
 * Create and start a database container
 */
export async function createDatabase(
  request: CreateDatabaseRequest
): Promise<DatabaseContainer> {
  return await invoke<DatabaseContainer>('docker_create_database', { request });
}

/**
 * Get container details
 */
export async function getContainer(id: string): Promise<DatabaseContainer> {
  return await invoke<DatabaseContainer>('docker_get_container', { id });
}

/**
 * List all containers
 */
export async function listContainers(): Promise<DatabaseContainer[]> {
  return await invoke<DatabaseContainer[]>('docker_list_containers');
}

/**
 * Start container
 */
export async function startContainer(id: string): Promise<void> {
  await invoke<void>('docker_start_container', { id });
}

/**
 * Stop container
 */
export async function stopContainer(id: string): Promise<void> {
  await invoke<void>('docker_stop_container', { id });
}

/**
 * Restart container
 */
export async function restartContainer(id: string): Promise<void> {
  await invoke<void>('docker_restart_container', { id });
}

/**
 * Remove container
 */
export async function removeContainer(
  id: string,
  removeVolume: boolean = false
): Promise<void> {
  await invoke<void>('docker_remove_container', { id, removeVolume });
}

/**
 * Get container statistics
 */
export async function getContainerStats(id: string): Promise<ContainerStats> {
  return await invoke<ContainerStats>('docker_get_stats', { id });
}

/**
 * Start monitoring container stats (will emit events)
 */
export async function startStatsMonitoring(id: string): Promise<void> {
  await invoke<void>('docker_start_stats_monitoring', { id });
}

/**
 * Get container logs
 */
export async function getContainerLogs(
  id: string,
  tail?: number
): Promise<string[]> {
  return await invoke<string[]>('docker_get_logs', { id, tail });
}

/**
 * Stream container logs (will emit events)
 */
export async function streamContainerLogs(id: string): Promise<void> {
  await invoke<void>('docker_stream_logs', { id });
}

/**
 * List available database images
 */
export async function listImages(): Promise<string[]> {
  return await invoke<string[]>('docker_list_images');
}

/**
 * List volumes
 */
export async function listVolumes(): Promise<string[]> {
  return await invoke<string[]>('docker_list_volumes');
}

/**
 * Remove volume
 */
export async function removeVolume(name: string): Promise<void> {
  await invoke<void>('docker_remove_volume', { name });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get human-readable status text
 */
export function getStatusText(status: ContainerStatus): string {
  const statusMap: Record<ContainerStatus, string> = {
    created: 'Created',
    running: 'Running',
    paused: 'Paused',
    restarting: 'Restarting',
    removing: 'Removing',
    exited: 'Stopped',
    dead: 'Dead',
    unknown: 'Unknown',
  };
  return statusMap[status] || 'Unknown';
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: ContainerStatus): string {
  const colorMap: Record<ContainerStatus, string> = {
    created: 'text-blue-600 dark:text-blue-400',
    running: 'text-green-600 dark:text-green-400',
    paused: 'text-yellow-600 dark:text-yellow-400',
    restarting: 'text-orange-600 dark:text-orange-400',
    removing: 'text-gray-600 dark:text-gray-400',
    exited: 'text-gray-600 dark:text-gray-400',
    dead: 'text-red-600 dark:text-red-400',
    unknown: 'text-gray-600 dark:text-gray-400',
  };
  return colorMap[status] || 'text-gray-600';
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Get database icon
 */
export function getDatabaseIcon(type: DatabaseType): string {
  const iconMap: Record<DatabaseType, string> = {
    postgresql: '🐘',
    mysql: '🐬',
    mongodb: '🍃',
    redis: '📦',
  };
  return iconMap[type] || '🗄️';
}

/**
 * Get database display name
 */
export function getDatabaseName(type: DatabaseType): string {
  const nameMap: Record<DatabaseType, string> = {
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    mongodb: 'MongoDB',
    redis: 'Redis',
  };
  return nameMap[type] || 'Database';
}

/**
 * Get default port for database type
 */
export function getDefaultPort(type: DatabaseType): number {
  const portMap: Record<DatabaseType, number> = {
    postgresql: 5432,
    mysql: 3306,
    mongodb: 27017,
    redis: 6379,
  };
  return portMap[type] || 5432;
}

/**
 * Get available versions for database type
 */
export function getAvailableVersions(type: DatabaseType): string[] {
  const versionsMap: Record<DatabaseType, string[]> = {
    postgresql: ['16', '15', '14', '13', '12'],
    mysql: ['8.0', '5.7', '5.6'],
    mongodb: ['7.0', '6.0', '5.0', '4.4'],
    redis: ['7.2', '7.0', '6.2', '6.0'],
  };
  return versionsMap[type] || ['latest'];
}

/**
 * Generate random password
 */
export function generatePassword(length: number = 16): string {
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Export as default service object
export const dockerService = {
  getDockerInfo,
  testDockerConnection,
  createDatabase,
  getContainer,
  listContainers,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer,
  getContainerStats,
  startStatsMonitoring,
  getContainerLogs,
  streamContainerLogs,
  listImages,
  listVolumes,
  removeVolume,
};

export default dockerService;
