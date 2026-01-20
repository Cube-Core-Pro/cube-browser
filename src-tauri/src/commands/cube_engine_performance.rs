// CUBE Engine Performance Optimization
// Resource caching, prefetch, memory management, process isolation

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use tauri::{AppHandle, Emitter, State};

// ============================================
// Performance State
// ============================================

pub struct CubePerformanceState {
    pub resource_cache: RwLock<ResourceCache>,
    pub prefetch_queue: RwLock<Vec<PrefetchRequest>>,
    pub memory_stats: RwLock<MemoryStats>,
    pub process_info: RwLock<HashMap<String, ProcessInfo>>,
    pub performance_metrics: RwLock<HashMap<String, PerformanceMetrics>>,
    pub config: RwLock<PerformanceConfig>,
}

impl Default for CubePerformanceState {
    fn default() -> Self {
        Self {
            resource_cache: RwLock::new(ResourceCache::default()),
            prefetch_queue: RwLock::new(Vec::new()),
            memory_stats: RwLock::new(MemoryStats::default()),
            process_info: RwLock::new(HashMap::new()),
            performance_metrics: RwLock::new(HashMap::new()),
            config: RwLock::new(PerformanceConfig::default()),
        }
    }
}

// ============================================
// Resource Caching
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ResourceCache {
    pub entries: HashMap<String, CacheEntry>,
    pub total_size_bytes: usize,
    pub max_size_bytes: usize,
    pub hit_count: u64,
    pub miss_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
    pub url: String,
    pub content_type: String,
    pub data: Vec<u8>,
    pub size_bytes: usize,
    pub etag: Option<String>,
    pub last_modified: Option<String>,
    pub max_age: Option<u64>,
    pub created_at: i64,
    pub last_accessed: i64,
    pub access_count: u32,
    pub cache_control: CacheControl,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CacheControl {
    pub no_cache: bool,
    pub no_store: bool,
    pub must_revalidate: bool,
    pub max_age: Option<u64>,
    pub s_maxage: Option<u64>,
    pub public: bool,
    pub private: bool,
    pub immutable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub total_entries: usize,
    pub total_size_mb: f64,
    pub hit_rate: f64,
    pub by_content_type: HashMap<String, ContentTypeStats>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ContentTypeStats {
    pub count: usize,
    pub size_bytes: usize,
}

// ============================================
// Prefetch & Preload
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrefetchRequest {
    pub url: String,
    pub priority: PrefetchPriority,
    pub resource_type: ResourceType,
    pub referrer: Option<String>,
    pub created_at: i64,
    pub status: PrefetchStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PrefetchPriority {
    Low,
    #[default]
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ResourceType {
    #[default]
    Document,
    Script,
    Stylesheet,
    Image,
    Font,
    Media,
    Fetch,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum PrefetchStatus {
    #[default]
    Pending,
    InProgress,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreloadHint {
    pub url: String,
    pub as_type: String,
    pub crossorigin: Option<String>,
    pub importance: Option<String>,
}

// ============================================
// Memory Management
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MemoryStats {
    pub total_mb: f64,
    pub used_mb: f64,
    pub available_mb: f64,
    pub heap_used_mb: f64,
    pub heap_total_mb: f64,
    pub external_mb: f64,
    pub array_buffers_mb: f64,
    pub tab_memory: HashMap<String, TabMemory>,
    pub cache_memory_mb: f64,
    pub last_gc: i64,
    pub gc_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TabMemory {
    pub tab_id: String,
    pub dom_nodes: u32,
    pub js_heap_mb: f64,
    pub documents: u32,
    pub frames: u32,
    pub layouts: u32,
    pub style_recalcs: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryPressureEvent {
    pub level: MemoryPressureLevel,
    pub timestamp: i64,
    pub total_memory_mb: f64,
    pub available_memory_mb: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum MemoryPressureLevel {
    #[default]
    None,
    Moderate,
    Critical,
}

// ============================================
// Process Isolation
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessInfo {
    pub process_id: u32,
    pub process_type: ProcessType,
    pub tab_ids: Vec<String>,
    pub cpu_usage: f64,
    pub memory_mb: f64,
    pub created_at: i64,
    pub status: ProcessStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ProcessType {
    #[default]
    Browser,
    Renderer,
    GPU,
    Network,
    Utility,
    Extension,
    Plugin,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ProcessStatus {
    #[default]
    Running,
    Suspended,
    Crashed,
    Terminated,
}

// ============================================
// Performance Metrics
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub tab_id: String,
    pub url: String,
    pub navigation_timing: NavigationTiming,
    pub resource_timing: Vec<ResourceTiming>,
    pub paint_timing: PaintTiming,
    pub layout_shifts: Vec<LayoutShift>,
    pub long_tasks: Vec<LongTask>,
    pub fps: f64,
    pub frame_time_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NavigationTiming {
    pub start_time: f64,
    pub redirect_time: f64,
    pub dns_time: f64,
    pub tcp_time: f64,
    pub ssl_time: f64,
    pub ttfb: f64,
    pub response_time: f64,
    pub dom_interactive: f64,
    pub dom_content_loaded: f64,
    pub dom_complete: f64,
    pub load_event: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceTiming {
    pub name: String,
    pub entry_type: String,
    pub start_time: f64,
    pub duration: f64,
    pub transfer_size: u64,
    pub encoded_body_size: u64,
    pub decoded_body_size: u64,
    pub initiator_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PaintTiming {
    pub first_paint: f64,
    pub first_contentful_paint: f64,
    pub largest_contentful_paint: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutShift {
    pub value: f64,
    pub had_recent_input: bool,
    pub timestamp: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LongTask {
    pub name: String,
    pub start_time: f64,
    pub duration: f64,
    pub attribution: String,
}

// ============================================
// Performance Config
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub cache_enabled: bool,
    pub max_cache_size_mb: u32,
    pub prefetch_enabled: bool,
    pub preconnect_enabled: bool,
    pub lazy_loading: bool,
    pub image_lazy_loading: bool,
    pub script_defer: bool,
    pub compression_enabled: bool,
    pub http2_push: bool,
    pub service_worker: bool,
    pub memory_saver: bool,
    pub tab_freeze_enabled: bool,
    pub tab_discard_enabled: bool,
    pub gpu_rasterization: bool,
    pub hardware_acceleration: bool,
    pub v8_lite_mode: bool,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            cache_enabled: true,
            max_cache_size_mb: 512,
            prefetch_enabled: true,
            preconnect_enabled: true,
            lazy_loading: true,
            image_lazy_loading: true,
            script_defer: true,
            compression_enabled: true,
            http2_push: true,
            service_worker: true,
            memory_saver: true,
            tab_freeze_enabled: true,
            tab_discard_enabled: true,
            gpu_rasterization: true,
            hardware_acceleration: true,
            v8_lite_mode: false,
        }
    }
}

// ============================================
// Tauri Commands - Resource Cache
// ============================================

#[tauri::command]
pub async fn cache_store(
    state: State<'_, CubePerformanceState>,
    url: String,
    content_type: String,
    data: Vec<u8>,
    etag: Option<String>,
    last_modified: Option<String>,
    max_age: Option<u64>,
) -> Result<(), String> {
    let mut cache = state.resource_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    let size = data.len();
    let now = chrono::Utc::now().timestamp_millis();
    
    let entry = CacheEntry {
        url: url.clone(),
        content_type,
        data,
        size_bytes: size,
        etag,
        last_modified,
        max_age,
        created_at: now,
        last_accessed: now,
        access_count: 1,
        cache_control: CacheControl::default(),
    };
    
    cache.entries.insert(url, entry);
    cache.total_size_bytes += size;
    
    Ok(())
}

#[tauri::command]
pub async fn cache_get(
    state: State<'_, CubePerformanceState>,
    url: String,
) -> Result<Option<CacheEntry>, String> {
    let mut cache = state.resource_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(entry) = cache.entries.get_mut(&url) {
        entry.last_accessed = chrono::Utc::now().timestamp_millis();
        entry.access_count += 1;
        let entry_clone = entry.clone();
        cache.hit_count += 1;
        return Ok(Some(entry_clone));
    }
    
    cache.miss_count += 1;
    Ok(None)
}

#[tauri::command]
pub async fn cache_remove(
    state: State<'_, CubePerformanceState>,
    url: String,
) -> Result<bool, String> {
    let mut cache = state.resource_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(entry) = cache.entries.remove(&url) {
        cache.total_size_bytes -= entry.size_bytes;
        return Ok(true);
    }
    
    Ok(false)
}

#[tauri::command]
pub async fn cache_clear(
    state: State<'_, CubePerformanceState>,
) -> Result<usize, String> {
    let mut cache = state.resource_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    let count = cache.entries.len();
    cache.entries.clear();
    cache.total_size_bytes = 0;
    Ok(count)
}

#[tauri::command]
pub async fn cache_get_stats(
    state: State<'_, CubePerformanceState>,
) -> Result<CacheStats, String> {
    let cache = state.resource_cache.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let mut by_content_type: HashMap<String, ContentTypeStats> = HashMap::new();
    
    for entry in cache.entries.values() {
        let stats = by_content_type.entry(entry.content_type.clone()).or_default();
        stats.count += 1;
        stats.size_bytes += entry.size_bytes;
    }
    
    let hit_rate = if cache.hit_count + cache.miss_count > 0 {
        cache.hit_count as f64 / (cache.hit_count + cache.miss_count) as f64
    } else {
        0.0
    };
    
    Ok(CacheStats {
        total_entries: cache.entries.len(),
        total_size_mb: cache.total_size_bytes as f64 / (1024.0 * 1024.0),
        hit_rate,
        by_content_type,
    })
}

#[tauri::command]
pub async fn cache_evict_lru(
    state: State<'_, CubePerformanceState>,
    target_size_mb: f64,
) -> Result<usize, String> {
    let mut cache = state.resource_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    let target_bytes = (target_size_mb * 1024.0 * 1024.0) as usize;
    let mut evicted = 0;
    
    while cache.total_size_bytes > target_bytes && !cache.entries.is_empty() {
        let oldest_url = cache.entries
            .iter()
            .min_by_key(|(_, e)| e.last_accessed)
            .map(|(url, _)| url.clone());
        
        if let Some(url) = oldest_url {
            if let Some(entry) = cache.entries.remove(&url) {
                cache.total_size_bytes -= entry.size_bytes;
                evicted += 1;
            }
        }
    }
    
    Ok(evicted)
}

// ============================================
// Tauri Commands - Prefetch
// ============================================

#[tauri::command]
pub async fn prefetch_add(
    state: State<'_, CubePerformanceState>,
    url: String,
    priority: Option<PrefetchPriority>,
    resource_type: Option<ResourceType>,
    referrer: Option<String>,
) -> Result<(), String> {
    let request = PrefetchRequest {
        url,
        priority: priority.unwrap_or_default(),
        resource_type: resource_type.unwrap_or_default(),
        referrer,
        created_at: chrono::Utc::now().timestamp_millis(),
        status: PrefetchStatus::Pending,
    };
    
    let mut queue = state.prefetch_queue.write().map_err(|e| format!("Lock error: {}", e))?;
    queue.push(request);
    
    Ok(())
}

#[tauri::command]
pub async fn prefetch_get_queue(
    state: State<'_, CubePerformanceState>,
) -> Result<Vec<PrefetchRequest>, String> {
    let queue = state.prefetch_queue.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(queue.clone())
}

#[tauri::command]
pub async fn prefetch_clear_queue(
    state: State<'_, CubePerformanceState>,
) -> Result<usize, String> {
    let mut queue = state.prefetch_queue.write().map_err(|e| format!("Lock error: {}", e))?;
    let count = queue.len();
    queue.clear();
    Ok(count)
}

#[tauri::command]
pub async fn prefetch_update_status(
    state: State<'_, CubePerformanceState>,
    url: String,
    status: PrefetchStatus,
) -> Result<(), String> {
    let mut queue = state.prefetch_queue.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(req) = queue.iter_mut().find(|r| r.url == url) {
        req.status = status;
    }
    
    Ok(())
}

// ============================================
// Tauri Commands - Memory
// ============================================

#[tauri::command]
pub async fn memory_get_stats(
    state: State<'_, CubePerformanceState>,
) -> Result<MemoryStats, String> {
    let stats = state.memory_stats.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(stats.clone())
}

#[tauri::command]
pub async fn memory_update_stats(
    state: State<'_, CubePerformanceState>,
    stats: MemoryStats,
) -> Result<(), String> {
    let mut current = state.memory_stats.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = stats;
    Ok(())
}

#[tauri::command]
pub async fn memory_update_tab(
    state: State<'_, CubePerformanceState>,
    tab_id: String,
    tab_memory: TabMemory,
) -> Result<(), String> {
    let mut stats = state.memory_stats.write().map_err(|e| format!("Lock error: {}", e))?;
    stats.tab_memory.insert(tab_id, tab_memory);
    Ok(())
}

#[tauri::command]
pub async fn memory_trigger_gc(
    state: State<'_, CubePerformanceState>,
    app: AppHandle,
) -> Result<(), String> {
    let mut stats = state.memory_stats.write().map_err(|e| format!("Lock error: {}", e))?;
    stats.last_gc = chrono::Utc::now().timestamp_millis();
    stats.gc_count += 1;
    
    let _ = app.emit("gc-triggered", serde_json::json!({
        "timestamp": stats.last_gc,
        "gcCount": stats.gc_count
    }));
    
    Ok(())
}

#[tauri::command]
pub async fn memory_report_pressure(
    state: State<'_, CubePerformanceState>,
    app: AppHandle,
    level: MemoryPressureLevel,
) -> Result<(), String> {
    let stats = state.memory_stats.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let event = MemoryPressureEvent {
        level,
        timestamp: chrono::Utc::now().timestamp_millis(),
        total_memory_mb: stats.total_mb,
        available_memory_mb: stats.available_mb,
    };
    
    let _ = app.emit("memory-pressure", &event);
    
    Ok(())
}

// ============================================
// Tauri Commands - Process
// ============================================

#[tauri::command]
pub async fn process_get_all(
    state: State<'_, CubePerformanceState>,
) -> Result<Vec<ProcessInfo>, String> {
    let processes = state.process_info.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(processes.values().cloned().collect())
}

#[tauri::command]
pub async fn process_get(
    state: State<'_, CubePerformanceState>,
    process_id: u32,
) -> Result<Option<ProcessInfo>, String> {
    let processes = state.process_info.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(processes.get(&process_id.to_string()).cloned())
}

#[tauri::command]
pub async fn process_register(
    state: State<'_, CubePerformanceState>,
    info: ProcessInfo,
) -> Result<(), String> {
    let mut processes = state.process_info.write().map_err(|e| format!("Lock error: {}", e))?;
    processes.insert(info.process_id.to_string(), info);
    Ok(())
}

#[tauri::command]
pub async fn process_update_stats(
    state: State<'_, CubePerformanceState>,
    process_id: u32,
    cpu_usage: f64,
    memory_mb: f64,
) -> Result<(), String> {
    let mut processes = state.process_info.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(info) = processes.get_mut(&process_id.to_string()) {
        info.cpu_usage = cpu_usage;
        info.memory_mb = memory_mb;
    }
    
    Ok(())
}

#[tauri::command]
pub async fn process_terminate(
    state: State<'_, CubePerformanceState>,
    app: AppHandle,
    process_id: u32,
) -> Result<(), String> {
    let mut processes = state.process_info.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(info) = processes.get_mut(&process_id.to_string()) {
        info.status = ProcessStatus::Terminated;
    }
    
    let _ = app.emit("process-terminated", serde_json::json!({
        "processId": process_id
    }));
    
    Ok(())
}

// ============================================
// Tauri Commands - Performance Metrics
// ============================================

#[tauri::command]
pub async fn perf_record_metrics(
    state: State<'_, CubePerformanceState>,
    metrics: PerformanceMetrics,
) -> Result<(), String> {
    let mut all_metrics = state.performance_metrics.write().map_err(|e| format!("Lock error: {}", e))?;
    all_metrics.insert(metrics.tab_id.clone(), metrics);
    Ok(())
}

#[tauri::command]
pub async fn perf_get_metrics(
    state: State<'_, CubePerformanceState>,
    tab_id: String,
) -> Result<Option<PerformanceMetrics>, String> {
    let metrics = state.performance_metrics.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(metrics.get(&tab_id).cloned())
}

#[tauri::command]
pub async fn perf_get_web_vitals(
    state: State<'_, CubePerformanceState>,
    tab_id: String,
) -> Result<WebVitals, String> {
    let metrics = state.performance_metrics.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(m) = metrics.get(&tab_id) {
        let cls: f64 = m.layout_shifts.iter().map(|s| s.value).sum();
        
        return Ok(WebVitals {
            lcp: m.paint_timing.largest_contentful_paint,
            fid: 0.0,
            cls,
            fcp: m.paint_timing.first_contentful_paint,
            ttfb: m.navigation_timing.ttfb,
            inp: 0.0,
        });
    }
    
    Ok(WebVitals::default())
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WebVitals {
    pub lcp: f64,
    pub fid: f64,
    pub cls: f64,
    pub fcp: f64,
    pub ttfb: f64,
    pub inp: f64,
}

#[tauri::command]
pub async fn perf_clear_metrics(
    state: State<'_, CubePerformanceState>,
    tab_id: Option<String>,
) -> Result<(), String> {
    let mut metrics = state.performance_metrics.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(id) = tab_id {
        metrics.remove(&id);
    } else {
        metrics.clear();
    }
    
    Ok(())
}

// ============================================
// Tauri Commands - Performance Config
// ============================================

#[tauri::command]
pub async fn perf_get_config(
    state: State<'_, CubePerformanceState>,
) -> Result<PerformanceConfig, String> {
    let config = state.config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn perf_set_config(
    state: State<'_, CubePerformanceState>,
    config: PerformanceConfig,
) -> Result<(), String> {
    let mut current = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}

#[tauri::command]
pub async fn perf_set_memory_saver(
    state: State<'_, CubePerformanceState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.memory_saver = enabled;
    Ok(())
}

#[tauri::command]
pub async fn perf_set_hardware_acceleration(
    state: State<'_, CubePerformanceState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.hardware_acceleration = enabled;
    config.gpu_rasterization = enabled;
    Ok(())
}
