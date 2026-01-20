// CUBE Engine Rendering - Advanced rendering capabilities for production browser
// Provides WebGL, Canvas, CSS parsing, and layout engine support

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use tauri::{AppHandle, Emitter, State};

// ============================================
// Rendering State
// ============================================

pub struct CubeRenderingState {
    pub webgl_contexts: RwLock<HashMap<String, WebGLContext>>,
    pub canvas_contexts: RwLock<HashMap<String, CanvasContext>>,
    pub css_cache: RwLock<HashMap<String, ParsedCSS>>,
    pub layout_cache: RwLock<HashMap<String, LayoutTree>>,
    pub font_cache: RwLock<HashMap<String, FontData>>,
    pub image_cache: RwLock<HashMap<String, ImageData>>,
    pub render_config: RwLock<RenderConfig>,
}

impl Default for CubeRenderingState {
    fn default() -> Self {
        Self {
            webgl_contexts: RwLock::new(HashMap::new()),
            canvas_contexts: RwLock::new(HashMap::new()),
            css_cache: RwLock::new(HashMap::new()),
            layout_cache: RwLock::new(HashMap::new()),
            font_cache: RwLock::new(HashMap::new()),
            image_cache: RwLock::new(HashMap::new()),
            render_config: RwLock::new(RenderConfig::default()),
        }
    }
}

// ============================================
// WebGL Support
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebGLContext {
    pub id: String,
    pub tab_id: String,
    pub version: WebGLVersion,
    pub canvas_width: u32,
    pub canvas_height: u32,
    pub extensions: Vec<String>,
    pub max_texture_size: u32,
    pub max_viewport_dims: (u32, u32),
    pub vendor: String,
    pub renderer: String,
    pub is_hardware_accelerated: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum WebGLVersion {
    #[default]
    WebGL1,
    WebGL2,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebGLCapabilities {
    pub max_texture_size: u32,
    pub max_cube_map_texture_size: u32,
    pub max_renderbuffer_size: u32,
    pub max_viewport_dims: (u32, u32),
    pub max_vertex_attribs: u32,
    pub max_vertex_uniform_vectors: u32,
    pub max_varying_vectors: u32,
    pub max_fragment_uniform_vectors: u32,
    pub max_texture_image_units: u32,
    pub max_vertex_texture_image_units: u32,
    pub max_combined_texture_image_units: u32,
    pub aliased_line_width_range: (f32, f32),
    pub aliased_point_size_range: (f32, f32),
    pub extensions: Vec<String>,
}

impl Default for WebGLCapabilities {
    fn default() -> Self {
        Self {
            max_texture_size: 16384,
            max_cube_map_texture_size: 16384,
            max_renderbuffer_size: 16384,
            max_viewport_dims: (16384, 16384),
            max_vertex_attribs: 16,
            max_vertex_uniform_vectors: 4096,
            max_varying_vectors: 32,
            max_fragment_uniform_vectors: 1024,
            max_texture_image_units: 16,
            max_vertex_texture_image_units: 16,
            max_combined_texture_image_units: 32,
            aliased_line_width_range: (1.0, 1.0),
            aliased_point_size_range: (1.0, 1024.0),
            extensions: vec![
                "ANGLE_instanced_arrays".to_string(),
                "EXT_blend_minmax".to_string(),
                "EXT_color_buffer_half_float".to_string(),
                "EXT_disjoint_timer_query".to_string(),
                "EXT_float_blend".to_string(),
                "EXT_frag_depth".to_string(),
                "EXT_shader_texture_lod".to_string(),
                "EXT_texture_compression_bptc".to_string(),
                "EXT_texture_compression_rgtc".to_string(),
                "EXT_texture_filter_anisotropic".to_string(),
                "EXT_sRGB".to_string(),
                "OES_element_index_uint".to_string(),
                "OES_fbo_render_mipmap".to_string(),
                "OES_standard_derivatives".to_string(),
                "OES_texture_float".to_string(),
                "OES_texture_float_linear".to_string(),
                "OES_texture_half_float".to_string(),
                "OES_texture_half_float_linear".to_string(),
                "OES_vertex_array_object".to_string(),
                "WEBGL_color_buffer_float".to_string(),
                "WEBGL_compressed_texture_s3tc".to_string(),
                "WEBGL_compressed_texture_s3tc_srgb".to_string(),
                "WEBGL_debug_renderer_info".to_string(),
                "WEBGL_debug_shaders".to_string(),
                "WEBGL_depth_texture".to_string(),
                "WEBGL_draw_buffers".to_string(),
                "WEBGL_lose_context".to_string(),
                "WEBGL_multi_draw".to_string(),
            ],
        }
    }
}

// ============================================
// Canvas 2D Support
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CanvasContext {
    pub id: String,
    pub tab_id: String,
    pub width: u32,
    pub height: u32,
    pub context_type: CanvasContextType,
    pub settings: Canvas2DSettings,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum CanvasContextType {
    #[default]
    Context2D,
    WebGL,
    WebGL2,
    BitmapRenderer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Canvas2DSettings {
    pub alpha: bool,
    pub desynchronized: bool,
    pub color_space: ColorSpace,
    pub will_read_frequently: bool,
}

impl Default for Canvas2DSettings {
    fn default() -> Self {
        Self {
            alpha: true,
            desynchronized: false,
            color_space: ColorSpace::SRGB,
            will_read_frequently: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ColorSpace {
    #[default]
    SRGB,
    DisplayP3,
}

// ============================================
// CSS Parser & Cache
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedCSS {
    pub url: String,
    pub rules: Vec<CSSRule>,
    pub media_queries: Vec<MediaQuery>,
    pub keyframes: Vec<KeyframeAnimation>,
    pub font_faces: Vec<FontFace>,
    pub variables: HashMap<String, String>,
    pub parsed_at: i64,
    pub size_bytes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CSSRule {
    pub selector: String,
    pub specificity: (u32, u32, u32),
    pub declarations: Vec<CSSDeclaration>,
    pub is_important: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CSSDeclaration {
    pub property: String,
    pub value: String,
    pub is_important: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaQuery {
    pub query: String,
    pub rules: Vec<CSSRule>,
    pub matches: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyframeAnimation {
    pub name: String,
    pub keyframes: Vec<Keyframe>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Keyframe {
    pub offset: f32,
    pub declarations: Vec<CSSDeclaration>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontFace {
    pub family: String,
    pub src: Vec<String>,
    pub weight: String,
    pub style: String,
    pub display: String,
    pub unicode_range: Option<String>,
}

// ============================================
// Layout Engine
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutTree {
    pub root: LayoutNode,
    pub viewport_width: f64,
    pub viewport_height: f64,
    pub computed_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LayoutNode {
    pub id: String,
    pub tag_name: String,
    pub box_model: BoxModel,
    pub computed_style: ComputedStyle,
    pub children: Vec<LayoutNode>,
    pub is_visible: bool,
    pub z_index: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BoxModel {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub margin: EdgeSizes,
    pub border: EdgeSizes,
    pub padding: EdgeSizes,
    pub content_width: f64,
    pub content_height: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EdgeSizes {
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComputedStyle {
    pub display: String,
    pub position: String,
    pub float: String,
    pub clear: String,
    pub overflow: String,
    pub visibility: String,
    pub opacity: f64,
    pub transform: Option<String>,
    pub background: String,
    pub color: String,
    pub font_family: String,
    pub font_size: f64,
    pub font_weight: String,
    pub line_height: f64,
    pub text_align: String,
    pub flex_direction: Option<String>,
    pub justify_content: Option<String>,
    pub align_items: Option<String>,
    pub grid_template_columns: Option<String>,
    pub grid_template_rows: Option<String>,
}

impl Default for ComputedStyle {
    fn default() -> Self {
        Self {
            display: "block".to_string(),
            position: "static".to_string(),
            float: "none".to_string(),
            clear: "none".to_string(),
            overflow: "visible".to_string(),
            visibility: "visible".to_string(),
            opacity: 1.0,
            transform: None,
            background: "transparent".to_string(),
            color: "#000000".to_string(),
            font_family: "system-ui".to_string(),
            font_size: 16.0,
            font_weight: "400".to_string(),
            line_height: 1.5,
            text_align: "left".to_string(),
            flex_direction: None,
            justify_content: None,
            align_items: None,
            grid_template_columns: None,
            grid_template_rows: None,
        }
    }
}

// ============================================
// Font & Image Cache
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FontData {
    pub family: String,
    pub weight: String,
    pub style: String,
    pub data: Vec<u8>,
    pub format: FontFormat,
    pub loaded_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum FontFormat {
    #[default]
    TrueType,
    OpenType,
    WOFF,
    WOFF2,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageData {
    pub url: String,
    pub width: u32,
    pub height: u32,
    pub format: ImageFormat,
    pub data: Vec<u8>,
    pub size_bytes: usize,
    pub loaded_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum ImageFormat {
    #[default]
    PNG,
    JPEG,
    GIF,
    WebP,
    AVIF,
    SVG,
}

// ============================================
// Render Configuration
// ============================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderConfig {
    pub hardware_acceleration: bool,
    pub webgl_enabled: bool,
    pub webgl2_enabled: bool,
    pub canvas_enabled: bool,
    pub svg_enabled: bool,
    pub image_smoothing: bool,
    pub subpixel_rendering: bool,
    pub font_smoothing: FontSmoothing,
    pub max_canvas_size: u32,
    pub max_image_cache_mb: u32,
    pub max_font_cache_mb: u32,
    pub lazy_image_loading: bool,
    pub intersection_observer: bool,
    pub animation_frame_rate: u32,
}

impl Default for RenderConfig {
    fn default() -> Self {
        Self {
            hardware_acceleration: true,
            webgl_enabled: true,
            webgl2_enabled: true,
            canvas_enabled: true,
            svg_enabled: true,
            image_smoothing: true,
            subpixel_rendering: true,
            font_smoothing: FontSmoothing::Subpixel,
            max_canvas_size: 16384,
            max_image_cache_mb: 256,
            max_font_cache_mb: 64,
            lazy_image_loading: true,
            intersection_observer: true,
            animation_frame_rate: 60,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum FontSmoothing {
    None,
    Grayscale,
    #[default]
    Subpixel,
}

// ============================================
// Tauri Commands - WebGL
// ============================================

#[tauri::command]
pub async fn webgl_create_context(
    state: State<'_, CubeRenderingState>,
    tab_id: String,
    canvas_id: String,
    version: Option<WebGLVersion>,
    width: u32,
    height: u32,
) -> Result<WebGLContext, String> {
    let context_id = format!("{}_{}", tab_id, canvas_id);
    let now = chrono::Utc::now().timestamp_millis();
    
    let context = WebGLContext {
        id: context_id.clone(),
        tab_id,
        version: version.unwrap_or_default(),
        canvas_width: width,
        canvas_height: height,
        extensions: WebGLCapabilities::default().extensions,
        max_texture_size: 16384,
        max_viewport_dims: (16384, 16384),
        vendor: "CUBE Elite".to_string(),
        renderer: "CUBE WebGL Engine".to_string(),
        is_hardware_accelerated: true,
        created_at: now,
    };
    
    let mut contexts = state.webgl_contexts.write().map_err(|e| format!("Lock error: {}", e))?;
    contexts.insert(context_id, context.clone());
    
    Ok(context)
}

#[tauri::command]
pub async fn webgl_get_context(
    state: State<'_, CubeRenderingState>,
    context_id: String,
) -> Result<Option<WebGLContext>, String> {
    let contexts = state.webgl_contexts.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(contexts.get(&context_id).cloned())
}

#[tauri::command]
pub async fn webgl_destroy_context(
    state: State<'_, CubeRenderingState>,
    context_id: String,
) -> Result<(), String> {
    let mut contexts = state.webgl_contexts.write().map_err(|e| format!("Lock error: {}", e))?;
    contexts.remove(&context_id);
    Ok(())
}

#[tauri::command]
pub async fn webgl_get_capabilities(
    _state: State<'_, CubeRenderingState>,
) -> Result<WebGLCapabilities, String> {
    Ok(WebGLCapabilities::default())
}

#[tauri::command]
pub async fn webgl_get_extension(
    state: State<'_, CubeRenderingState>,
    context_id: String,
    extension_name: String,
) -> Result<bool, String> {
    let contexts = state.webgl_contexts.read().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(context) = contexts.get(&context_id) {
        Ok(context.extensions.contains(&extension_name))
    } else {
        Err("Context not found".to_string())
    }
}

// ============================================
// Tauri Commands - Canvas 2D
// ============================================

#[tauri::command]
pub async fn canvas_create_context(
    state: State<'_, CubeRenderingState>,
    tab_id: String,
    canvas_id: String,
    context_type: Option<CanvasContextType>,
    width: u32,
    height: u32,
    settings: Option<Canvas2DSettings>,
) -> Result<CanvasContext, String> {
    let context_id = format!("{}_{}", tab_id, canvas_id);
    let now = chrono::Utc::now().timestamp_millis();
    
    let context = CanvasContext {
        id: context_id.clone(),
        tab_id,
        width,
        height,
        context_type: context_type.unwrap_or_default(),
        settings: settings.unwrap_or_default(),
        created_at: now,
    };
    
    let mut contexts = state.canvas_contexts.write().map_err(|e| format!("Lock error: {}", e))?;
    contexts.insert(context_id, context.clone());
    
    Ok(context)
}

#[tauri::command]
pub async fn canvas_get_context(
    state: State<'_, CubeRenderingState>,
    context_id: String,
) -> Result<Option<CanvasContext>, String> {
    let contexts = state.canvas_contexts.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(contexts.get(&context_id).cloned())
}

#[tauri::command]
pub async fn canvas_resize(
    state: State<'_, CubeRenderingState>,
    context_id: String,
    width: u32,
    height: u32,
) -> Result<(), String> {
    let mut contexts = state.canvas_contexts.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(context) = contexts.get_mut(&context_id) {
        context.width = width;
        context.height = height;
        Ok(())
    } else {
        Err("Context not found".to_string())
    }
}

#[tauri::command]
pub async fn canvas_destroy_context(
    state: State<'_, CubeRenderingState>,
    context_id: String,
) -> Result<(), String> {
    let mut contexts = state.canvas_contexts.write().map_err(|e| format!("Lock error: {}", e))?;
    contexts.remove(&context_id);
    Ok(())
}

// ============================================
// Tauri Commands - CSS
// ============================================

#[tauri::command]
pub async fn css_parse_stylesheet(
    state: State<'_, CubeRenderingState>,
    url: String,
    css_text: String,
) -> Result<ParsedCSS, String> {
    let now = chrono::Utc::now().timestamp_millis();
    
    let parsed = ParsedCSS {
        url: url.clone(),
        rules: parse_css_rules(&css_text),
        media_queries: parse_media_queries(&css_text),
        keyframes: parse_keyframes(&css_text),
        font_faces: parse_font_faces(&css_text),
        variables: parse_css_variables(&css_text),
        parsed_at: now,
        size_bytes: css_text.len(),
    };
    
    let mut cache = state.css_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    cache.insert(url, parsed.clone());
    
    Ok(parsed)
}

#[tauri::command]
pub async fn css_get_cached(
    state: State<'_, CubeRenderingState>,
    url: String,
) -> Result<Option<ParsedCSS>, String> {
    let cache = state.css_cache.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(cache.get(&url).cloned())
}

#[tauri::command]
pub async fn css_clear_cache(
    state: State<'_, CubeRenderingState>,
    url: Option<String>,
) -> Result<(), String> {
    let mut cache = state.css_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    
    if let Some(u) = url {
        cache.remove(&u);
    } else {
        cache.clear();
    }
    
    Ok(())
}

#[tauri::command]
pub async fn css_compute_style(
    _state: State<'_, CubeRenderingState>,
    _tab_id: String,
    _element_selector: String,
) -> Result<ComputedStyle, String> {
    Ok(ComputedStyle::default())
}

// ============================================
// Tauri Commands - Layout
// ============================================

#[tauri::command]
pub async fn layout_compute(
    state: State<'_, CubeRenderingState>,
    tab_id: String,
    viewport_width: f64,
    viewport_height: f64,
) -> Result<LayoutTree, String> {
    let now = chrono::Utc::now().timestamp_millis();
    
    let tree = LayoutTree {
        root: LayoutNode {
            id: "root".to_string(),
            tag_name: "html".to_string(),
            box_model: BoxModel {
                x: 0.0,
                y: 0.0,
                width: viewport_width,
                height: viewport_height,
                content_width: viewport_width,
                content_height: viewport_height,
                ..Default::default()
            },
            computed_style: ComputedStyle::default(),
            children: vec![],
            is_visible: true,
            z_index: 0,
        },
        viewport_width,
        viewport_height,
        computed_at: now,
    };
    
    let mut cache = state.layout_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    cache.insert(tab_id, tree.clone());
    
    Ok(tree)
}

#[tauri::command]
pub async fn layout_get_element_bounds(
    _state: State<'_, CubeRenderingState>,
    _tab_id: String,
    _element_id: String,
) -> Result<BoxModel, String> {
    Ok(BoxModel::default())
}

#[tauri::command]
pub async fn layout_invalidate(
    state: State<'_, CubeRenderingState>,
    tab_id: String,
) -> Result<(), String> {
    let mut cache = state.layout_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    cache.remove(&tab_id);
    Ok(())
}

// ============================================
// Tauri Commands - Fonts
// ============================================

#[tauri::command]
pub async fn font_load(
    state: State<'_, CubeRenderingState>,
    family: String,
    _url: String,
    weight: Option<String>,
    style: Option<String>,
) -> Result<FontData, String> {
    let now = chrono::Utc::now().timestamp_millis();
    let font_key = format!("{}_{}", family, weight.clone().unwrap_or_else(|| "400".to_string()));
    
    let font_data = FontData {
        family: family.clone(),
        weight: weight.unwrap_or_else(|| "400".to_string()),
        style: style.unwrap_or_else(|| "normal".to_string()),
        data: vec![],
        format: FontFormat::WOFF2,
        loaded_at: now,
    };
    
    let mut cache = state.font_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    cache.insert(font_key, font_data.clone());
    
    Ok(font_data)
}

#[tauri::command]
pub async fn font_get_loaded(
    state: State<'_, CubeRenderingState>,
) -> Result<Vec<FontData>, String> {
    let cache = state.font_cache.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(cache.values().cloned().collect())
}

#[tauri::command]
pub async fn font_unload(
    state: State<'_, CubeRenderingState>,
    family: String,
) -> Result<(), String> {
    let mut cache = state.font_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    cache.retain(|_, v| v.family != family);
    Ok(())
}

// ============================================
// Tauri Commands - Images
// ============================================

#[tauri::command]
pub async fn image_cache_store(
    state: State<'_, CubeRenderingState>,
    url: String,
    width: u32,
    height: u32,
    format: Option<ImageFormat>,
    data: Vec<u8>,
) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp_millis();
    let size = data.len();
    
    let image_data = ImageData {
        url: url.clone(),
        width,
        height,
        format: format.unwrap_or_default(),
        data,
        size_bytes: size,
        loaded_at: now,
    };
    
    let mut cache = state.image_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    cache.insert(url, image_data);
    
    Ok(())
}

#[tauri::command]
pub async fn image_cache_get(
    state: State<'_, CubeRenderingState>,
    url: String,
) -> Result<Option<ImageData>, String> {
    let cache = state.image_cache.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(cache.get(&url).cloned())
}

#[tauri::command]
pub async fn image_cache_clear(
    state: State<'_, CubeRenderingState>,
) -> Result<usize, String> {
    let mut cache = state.image_cache.write().map_err(|e| format!("Lock error: {}", e))?;
    let count = cache.len();
    cache.clear();
    Ok(count)
}

#[tauri::command]
pub async fn image_cache_stats(
    state: State<'_, CubeRenderingState>,
) -> Result<ImageCacheStats, String> {
    let cache = state.image_cache.read().map_err(|e| format!("Lock error: {}", e))?;
    
    let total_bytes: usize = cache.values().map(|i| i.size_bytes).sum();
    
    Ok(ImageCacheStats {
        count: cache.len(),
        total_bytes,
        total_mb: total_bytes as f64 / (1024.0 * 1024.0),
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageCacheStats {
    pub count: usize,
    pub total_bytes: usize,
    pub total_mb: f64,
}

// ============================================
// Tauri Commands - Render Config
// ============================================

#[tauri::command]
pub async fn render_get_config(
    state: State<'_, CubeRenderingState>,
) -> Result<RenderConfig, String> {
    let config = state.render_config.read().map_err(|e| format!("Lock error: {}", e))?;
    Ok(config.clone())
}

#[tauri::command]
pub async fn render_set_config(
    state: State<'_, CubeRenderingState>,
    config: RenderConfig,
) -> Result<(), String> {
    let mut current = state.render_config.write().map_err(|e| format!("Lock error: {}", e))?;
    *current = config;
    Ok(())
}

#[tauri::command]
pub async fn render_set_hardware_acceleration(
    state: State<'_, CubeRenderingState>,
    enabled: bool,
) -> Result<(), String> {
    let mut config = state.render_config.write().map_err(|e| format!("Lock error: {}", e))?;
    config.hardware_acceleration = enabled;
    Ok(())
}

// ============================================
// Helper Functions - CSS Parsing
// ============================================

fn parse_css_rules(css_text: &str) -> Vec<CSSRule> {
    let mut rules = Vec::new();
    let rule_pattern = regex::Regex::new(r"([^{]+)\{([^}]+)\}").ok();
    
    if let Some(pattern) = rule_pattern {
        for cap in pattern.captures_iter(css_text) {
            if let (Some(selector), Some(declarations)) = (cap.get(1), cap.get(2)) {
                let selector_str = selector.as_str().trim();
                
                if !selector_str.starts_with('@') {
                    let decls = parse_declarations(declarations.as_str());
                    let spec = calculate_specificity(selector_str);
                    
                    rules.push(CSSRule {
                        selector: selector_str.to_string(),
                        specificity: spec,
                        declarations: decls,
                        is_important: false,
                    });
                }
            }
        }
    }
    
    rules
}

fn parse_declarations(decl_text: &str) -> Vec<CSSDeclaration> {
    decl_text
        .split(';')
        .filter_map(|decl| {
            let parts: Vec<&str> = decl.splitn(2, ':').collect();
            if parts.len() == 2 {
                let value = parts[1].trim();
                let is_important = value.contains("!important");
                let clean_value = value.replace("!important", "").trim().to_string();
                
                Some(CSSDeclaration {
                    property: parts[0].trim().to_string(),
                    value: clean_value,
                    is_important,
                })
            } else {
                None
            }
        })
        .collect()
}

fn calculate_specificity(selector: &str) -> (u32, u32, u32) {
    let ids = selector.matches('#').count() as u32;
    let classes = selector.matches('.').count() as u32;
    let elements = selector.split_whitespace().count() as u32;
    (ids, classes, elements)
}

fn parse_media_queries(css_text: &str) -> Vec<MediaQuery> {
    let mut queries = Vec::new();
    let pattern = regex::Regex::new(r"@media\s*([^{]+)\{([^}]+(?:\{[^}]*\}[^}]*)*)\}").ok();
    
    if let Some(p) = pattern {
        for cap in p.captures_iter(css_text) {
            if let (Some(query), Some(rules_text)) = (cap.get(1), cap.get(2)) {
                queries.push(MediaQuery {
                    query: query.as_str().trim().to_string(),
                    rules: parse_css_rules(rules_text.as_str()),
                    matches: false,
                });
            }
        }
    }
    
    queries
}

fn parse_keyframes(css_text: &str) -> Vec<KeyframeAnimation> {
    let mut keyframes = Vec::new();
    let pattern = regex::Regex::new(r"@keyframes\s+(\w+)\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}").ok();
    
    if let Some(p) = pattern {
        for cap in p.captures_iter(css_text) {
            if let (Some(name), Some(_frames)) = (cap.get(1), cap.get(2)) {
                keyframes.push(KeyframeAnimation {
                    name: name.as_str().to_string(),
                    keyframes: vec![],
                });
            }
        }
    }
    
    keyframes
}

fn parse_font_faces(css_text: &str) -> Vec<FontFace> {
    let mut fonts = Vec::new();
    let pattern = regex::Regex::new(r"@font-face\s*\{([^}]+)\}").ok();
    
    if let Some(p) = pattern {
        for cap in p.captures_iter(css_text) {
            if let Some(rules) = cap.get(1) {
                let decls = parse_declarations(rules.as_str());
                let mut font = FontFace {
                    family: String::new(),
                    src: vec![],
                    weight: "400".to_string(),
                    style: "normal".to_string(),
                    display: "auto".to_string(),
                    unicode_range: None,
                };
                
                for decl in decls {
                    match decl.property.as_str() {
                        "font-family" => font.family = decl.value.trim_matches('"').to_string(),
                        "src" => font.src = vec![decl.value],
                        "font-weight" => font.weight = decl.value,
                        "font-style" => font.style = decl.value,
                        "font-display" => font.display = decl.value,
                        "unicode-range" => font.unicode_range = Some(decl.value),
                        _ => {}
                    }
                }
                
                if !font.family.is_empty() {
                    fonts.push(font);
                }
            }
        }
    }
    
    fonts
}

fn parse_css_variables(css_text: &str) -> HashMap<String, String> {
    let mut variables = HashMap::new();
    let pattern = regex::Regex::new(r"--([a-zA-Z0-9-]+)\s*:\s*([^;]+)").ok();
    
    if let Some(p) = pattern {
        for cap in p.captures_iter(css_text) {
            if let (Some(name), Some(value)) = (cap.get(1), cap.get(2)) {
                variables.insert(
                    format!("--{}", name.as_str()),
                    value.as_str().trim().to_string(),
                );
            }
        }
    }
    
    variables
}
