/**
 * CUBE Nexum Elite - Docker Database Commands
 *
 * Tauri commands for Docker container management
 */

use crate::services::docker_service::{
    ContainerStats, CreateDatabaseRequest, DatabaseContainer, DockerInfo, DockerService,
};
use std::sync::Arc;
use tauri::State;

/// Get Docker daemon information
#[tauri::command]
pub async fn docker_get_info(
    service: State<'_, Arc<DockerService>>,
) -> Result<DockerInfo, String> {
    service
        .get_info()
        .await
        .map_err(|e| format!("Failed to get Docker info: {}", e))
}

/// Test Docker connection
#[tauri::command]
pub async fn docker_test_connection(
    service: State<'_, Arc<DockerService>>,
) -> Result<bool, String> {
    service
        .test_connection()
        .await
        .map_err(|e| format!("Docker connection test failed: {}", e))
}

/// Create database container
#[tauri::command]
pub async fn docker_create_database(
    request: CreateDatabaseRequest,
    service: State<'_, Arc<DockerService>>,
) -> Result<DatabaseContainer, String> {
    service
        .create_database(request)
        .await
        .map_err(|e| format!("Failed to create database: {}", e))
}

/// Get container details
#[tauri::command]
pub async fn docker_get_container(
    id: String,
    service: State<'_, Arc<DockerService>>,
) -> Result<DatabaseContainer, String> {
    service
        .get_container(&id)
        .await
        .map_err(|e| format!("Failed to get container: {}", e))
}

/// List all containers
#[tauri::command]
pub async fn docker_list_containers(
    service: State<'_, Arc<DockerService>>,
) -> Result<Vec<DatabaseContainer>, String> {
    service
        .list_containers()
        .await
        .map_err(|e| format!("Failed to list containers: {}", e))
}

/// Start container
#[tauri::command]
pub async fn docker_start_container(
    id: String,
    service: State<'_, Arc<DockerService>>,
) -> Result<(), String> {
    service
        .start_container(&id)
        .await
        .map_err(|e| format!("Failed to start container: {}", e))
}

/// Stop container
#[tauri::command]
pub async fn docker_stop_container(
    id: String,
    service: State<'_, Arc<DockerService>>,
) -> Result<(), String> {
    service
        .stop_container(&id)
        .await
        .map_err(|e| format!("Failed to stop container: {}", e))
}

/// Restart container
#[tauri::command]
pub async fn docker_restart_container(
    id: String,
    service: State<'_, Arc<DockerService>>,
) -> Result<(), String> {
    service
        .restart_container(&id)
        .await
        .map_err(|e| format!("Failed to restart container: {}", e))
}

/// Remove container
#[tauri::command]
pub async fn docker_remove_container(
    id: String,
    remove_volume: bool,
    service: State<'_, Arc<DockerService>>,
) -> Result<(), String> {
    service
        .remove_container(&id, remove_volume)
        .await
        .map_err(|e| format!("Failed to remove container: {}", e))
}

/// Get container statistics
#[tauri::command]
pub async fn docker_get_stats(
    id: String,
    service: State<'_, Arc<DockerService>>,
) -> Result<ContainerStats, String> {
    service
        .get_stats(&id)
        .await
        .map_err(|e| format!("Failed to get container stats: {}", e))
}

/// Start monitoring container stats
#[tauri::command]
pub async fn docker_start_stats_monitoring(
    id: String,
    service: State<'_, Arc<DockerService>>,
) -> Result<(), String> {
    service
        .start_stats_monitoring(id)
        .await
        .map_err(|e| format!("Failed to start stats monitoring: {}", e))
}

/// Get container logs
#[tauri::command]
pub async fn docker_get_logs(
    id: String,
    tail: Option<i64>,
    service: State<'_, Arc<DockerService>>,
) -> Result<Vec<String>, String> {
    service
        .get_logs(&id, tail)
        .await
        .map_err(|e| format!("Failed to get container logs: {}", e))
}

/// Stream container logs
#[tauri::command]
pub async fn docker_stream_logs(
    id: String,
    service: State<'_, Arc<DockerService>>,
) -> Result<(), String> {
    service
        .stream_logs(id)
        .await
        .map_err(|e| format!("Failed to stream container logs: {}", e))
}

/// List available database images
#[tauri::command]
pub async fn docker_list_images(
    service: State<'_, Arc<DockerService>>,
) -> Result<Vec<String>, String> {
    service
        .list_images()
        .await
        .map_err(|e| format!("Failed to list images: {}", e))
}

/// List volumes
#[tauri::command]
pub async fn docker_list_volumes(
    service: State<'_, Arc<DockerService>>,
) -> Result<Vec<String>, String> {
    service
        .list_volumes()
        .await
        .map_err(|e| format!("Failed to list volumes: {}", e))
}

/// Remove volume
#[tauri::command]
pub async fn docker_remove_volume(
    name: String,
    service: State<'_, Arc<DockerService>>,
) -> Result<(), String> {
    service
        .remove_volume(&name)
        .await
        .map_err(|e| format!("Failed to remove volume: {}", e))
}
