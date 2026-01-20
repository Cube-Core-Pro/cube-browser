// Macro System Commands - Full implementation with input automation
use chrono::{DateTime, Utc};
use enigo::{
    Axis, Button, Coordinate, Direction, Enigo, Key, Keyboard, Mouse, Settings,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{command, State};
use uuid::Uuid;

// Simplified Macro structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroStep {
    pub action: String,
    pub target: Option<String>,
    pub value: Option<String>,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroStats {
    pub total_runs: u32,
    pub successful_runs: u32,
    pub failed_runs: u32,
    pub average_duration_ms: u64,
    pub success_rate: f32,
    pub last_run: Option<DateTime<Utc>>,
}

impl Default for MacroStats {
    fn default() -> Self {
        Self {
            total_runs: 0,
            successful_runs: 0,
            failed_runs: 0,
            average_duration_ms: 0,
            success_rate: 0.0,
            last_run: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Macro {
    pub id: String,
    pub name: String,
    pub description: String,
    pub steps: Vec<MacroStep>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub author: String,
    pub tags: Vec<String>,
    pub stats: MacroStats,
}

// Managed state for macros
pub struct MacroState {
    pub macros: Mutex<HashMap<String, Macro>>,
    pub recording: Mutex<Option<Vec<MacroStep>>>,
    pub recording_id: Mutex<Option<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MacroInfo {
    pub id: String,
    pub name: String,
    pub description: String,
    pub step_count: usize,
    pub created_at: DateTime<Utc>,
    pub stats: MacroStats,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlaybackResult {
    pub success: bool,
    pub steps_executed: usize,
    pub total_duration_ms: u64,
    pub errors: Vec<String>,
}

/// Start recording a new macro
#[command]
pub async fn start_recording(state: State<'_, MacroState>) -> Result<String, String> {
    let mut recording = state
        .recording
        .lock()
        .map_err(|e| format!("Failed to lock recording: {}", e))?;

    if recording.is_some() {
        return Err("Already recording a macro".to_string());
    }

    *recording = Some(Vec::new());

    let macro_id = Uuid::new_v4().to_string();
    let mut current_id = state
        .recording_id
        .lock()
        .map_err(|e| format!("Failed to lock recording ID: {}", e))?;
    *current_id = Some(macro_id.clone());

    Ok(macro_id)
}

/// Stop recording and save macro
#[command]
pub async fn stop_recording(
    name: String,
    description: String,
    state: State<'_, MacroState>,
) -> Result<MacroInfo, String> {
    let steps = {
        let mut recording = state
            .recording
            .lock()
            .map_err(|e| format!("Failed to lock recording: {}", e))?;

        recording.take().ok_or("Not currently recording")?
    };

    let macro_id = {
        let mut current_id = state
            .recording_id
            .lock()
            .map_err(|e| format!("Failed to lock recording ID: {}", e))?;

        current_id.take().ok_or("No recording ID found")?
    };

    let macro_data = Macro {
        id: macro_id.clone(),
        name: name.clone(),
        description: description.clone(),
        steps: steps.clone(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        author: "User".to_string(),
        tags: Vec::new(),
        stats: MacroStats::default(),
    };

    let mut macros = state
        .macros
        .lock()
        .map_err(|e| format!("Failed to lock macros: {}", e))?;

    let step_count = macro_data.steps.len();
    let stats = macro_data.stats.clone();
    let created_at = macro_data.created_at;

    macros.insert(macro_id.clone(), macro_data);

    Ok(MacroInfo {
        id: macro_id,
        name,
        description,
        step_count,
        created_at,
        stats,
    })
}

/// Add step to current recording
#[command]
pub async fn add_macro_step(
    action: String,
    target: Option<String>,
    value: Option<String>,
    state: State<'_, MacroState>,
) -> Result<(), String> {
    let mut recording = state
        .recording
        .lock()
        .map_err(|e| format!("Failed to lock recording: {}", e))?;

    let steps = recording.as_mut().ok_or("Not currently recording")?;

    steps.push(MacroStep {
        action,
        target,
        value,
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    });

    Ok(())
}

/// Play a macro by ID with real input simulation using enigo
#[command]
pub async fn play_macro(
    macro_id: String,
    state: State<'_, MacroState>,
) -> Result<PlaybackResult, String> {
    let macro_data = {
        let macros = state
            .macros
            .lock()
            .map_err(|e| format!("Failed to lock macros: {}", e))?;

        macros.get(&macro_id).cloned().ok_or("Macro not found")?
    };

    // Clone steps for use in blocking task
    let steps = macro_data.steps.clone();

    // Execute all enigo operations in a blocking task (enigo is not Send)
    let result = tokio::task::spawn_blocking(move || {
        // Initialize enigo for input simulation
        let mut enigo = Enigo::new(&Settings::default())
            .map_err(|e| format!("Failed to initialize input simulator: {}", e))?;

        let start_time = Instant::now();
        let mut steps_executed = 0;
        let mut errors: Vec<String> = Vec::new();
        let mut last_timestamp: Option<u64> = None;

        // Execute each step with proper timing
        for (index, step) in steps.iter().enumerate() {
            // Apply delay based on timestamp difference (replay at recorded speed)
            if let Some(last_ts) = last_timestamp {
                if step.timestamp > last_ts {
                    let delay_ms = step.timestamp - last_ts;
                    // Cap maximum delay at 5 seconds to prevent excessive waits
                    let capped_delay = delay_ms.min(5000);
                    std::thread::sleep(Duration::from_millis(capped_delay));
                }
            }
            last_timestamp = Some(step.timestamp);

            // Execute the action
            match execute_macro_step(&mut enigo, &step) {
                Ok(()) => {
                    steps_executed += 1;
                }
                Err(e) => {
                    let error_msg = format!("Step {} ({}) failed: {}", index + 1, step.action, e);
                    errors.push(error_msg);
                    // Continue execution despite errors
                }
            }

            // Small delay between steps for system stability
            std::thread::sleep(Duration::from_millis(50));
        }

        let total_duration_ms = start_time.elapsed().as_millis() as u64;
        let success = errors.is_empty();

        Ok::<(usize, u64, bool, Vec<String>), String>((steps_executed, total_duration_ms, success, errors))
    })
    .await
    .map_err(|e| format!("Task failed: {}", e))??;

    let (steps_executed, total_duration_ms, success, errors) = result;

    // Update stats
    {
        let mut macros = state
            .macros
            .lock()
            .map_err(|e| format!("Failed to lock macros: {}", e))?;

        if let Some(macro_mut) = macros.get_mut(&macro_id) {
            macro_mut.stats.total_runs += 1;
            if success {
                macro_mut.stats.successful_runs += 1;
            } else {
                macro_mut.stats.failed_runs += 1;
            }
            macro_mut.stats.success_rate =
                macro_mut.stats.successful_runs as f32 / macro_mut.stats.total_runs as f32;
            
            // Update average duration
            let total_time = macro_mut.stats.average_duration_ms * (macro_mut.stats.total_runs - 1) as u64
                + total_duration_ms;
            macro_mut.stats.average_duration_ms = total_time / macro_mut.stats.total_runs as u64;
            
            macro_mut.stats.last_run = Some(Utc::now());
            macro_mut.updated_at = Utc::now();
        }
    }

    Ok(PlaybackResult {
        success,
        steps_executed,
        total_duration_ms,
        errors,
    })
}

/// Execute a single macro step with real input simulation
fn execute_macro_step(enigo: &mut Enigo, step: &MacroStep) -> Result<(), String> {
    match step.action.as_str() {
        "click" | "mouse_click" => {
            // Parse coordinates from target: "x,y" format
            if let Some(target) = &step.target {
                let coords: Vec<&str> = target.split(',').collect();
                if coords.len() >= 2 {
                    let x: i32 = coords[0].trim().parse()
                        .map_err(|_| "Invalid X coordinate")?;
                    let y: i32 = coords[1].trim().parse()
                        .map_err(|_| "Invalid Y coordinate")?;
                    
                    enigo.move_mouse(x, y, Coordinate::Abs)
                        .map_err(|e| format!("Failed to move mouse: {}", e))?;
                    
                    enigo.button(Button::Left, Direction::Click)
                        .map_err(|e| format!("Failed to click: {}", e))?;
                } else {
                    // Click at current position
                    enigo.button(Button::Left, Direction::Click)
                        .map_err(|e| format!("Failed to click: {}", e))?;
                }
            } else {
                enigo.button(Button::Left, Direction::Click)
                    .map_err(|e| format!("Failed to click: {}", e))?;
            }
        }
        "right_click" => {
            if let Some(target) = &step.target {
                let coords: Vec<&str> = target.split(',').collect();
                if coords.len() >= 2 {
                    let x: i32 = coords[0].trim().parse()
                        .map_err(|_| "Invalid X coordinate")?;
                    let y: i32 = coords[1].trim().parse()
                        .map_err(|_| "Invalid Y coordinate")?;
                    
                    enigo.move_mouse(x, y, Coordinate::Abs)
                        .map_err(|e| format!("Failed to move mouse: {}", e))?;
                }
            }
            enigo.button(Button::Right, Direction::Click)
                .map_err(|e| format!("Failed to right click: {}", e))?;
        }
        "double_click" => {
            if let Some(target) = &step.target {
                let coords: Vec<&str> = target.split(',').collect();
                if coords.len() >= 2 {
                    let x: i32 = coords[0].trim().parse()
                        .map_err(|_| "Invalid X coordinate")?;
                    let y: i32 = coords[1].trim().parse()
                        .map_err(|_| "Invalid Y coordinate")?;
                    
                    enigo.move_mouse(x, y, Coordinate::Abs)
                        .map_err(|e| format!("Failed to move mouse: {}", e))?;
                }
            }
            // Double click = two rapid clicks
            enigo.button(Button::Left, Direction::Click)
                .map_err(|e| format!("Failed to double click (1): {}", e))?;
            std::thread::sleep(Duration::from_millis(50));
            enigo.button(Button::Left, Direction::Click)
                .map_err(|e| format!("Failed to double click (2): {}", e))?;
        }
        "mouse_move" | "move" => {
            if let Some(target) = &step.target {
                let coords: Vec<&str> = target.split(',').collect();
                if coords.len() >= 2 {
                    let x: i32 = coords[0].trim().parse()
                        .map_err(|_| "Invalid X coordinate")?;
                    let y: i32 = coords[1].trim().parse()
                        .map_err(|_| "Invalid Y coordinate")?;
                    
                    enigo.move_mouse(x, y, Coordinate::Abs)
                        .map_err(|e| format!("Failed to move mouse: {}", e))?;
                }
            }
        }
        "mouse_down" => {
            let button = match step.value.as_deref() {
                Some("right") => Button::Right,
                Some("middle") => Button::Middle,
                _ => Button::Left,
            };
            enigo.button(button, Direction::Press)
                .map_err(|e| format!("Failed to press mouse button: {}", e))?;
        }
        "mouse_up" => {
            let button = match step.value.as_deref() {
                Some("right") => Button::Right,
                Some("middle") => Button::Middle,
                _ => Button::Left,
            };
            enigo.button(button, Direction::Release)
                .map_err(|e| format!("Failed to release mouse button: {}", e))?;
        }
        "scroll" | "scroll_vertical" => {
            let amount: i32 = step.value.as_deref()
                .unwrap_or("3")
                .parse()
                .unwrap_or(3);
            enigo.scroll(amount, Axis::Vertical)
                .map_err(|e| format!("Failed to scroll: {}", e))?;
        }
        "scroll_horizontal" => {
            let amount: i32 = step.value.as_deref()
                .unwrap_or("3")
                .parse()
                .unwrap_or(3);
            enigo.scroll(amount, Axis::Horizontal)
                .map_err(|e| format!("Failed to horizontal scroll: {}", e))?;
        }
        "type" | "text" | "input" => {
            if let Some(text) = &step.value {
                enigo.text(text)
                    .map_err(|e| format!("Failed to type text: {}", e))?;
            }
        }
        "key" | "key_press" => {
            if let Some(key_str) = &step.value {
                let key = parse_key(key_str)?;
                enigo.key(key, Direction::Click)
                    .map_err(|e| format!("Failed to press key: {}", e))?;
            }
        }
        "key_down" => {
            if let Some(key_str) = &step.value {
                let key = parse_key(key_str)?;
                enigo.key(key, Direction::Press)
                    .map_err(|e| format!("Failed to press key down: {}", e))?;
            }
        }
        "key_up" => {
            if let Some(key_str) = &step.value {
                let key = parse_key(key_str)?;
                enigo.key(key, Direction::Release)
                    .map_err(|e| format!("Failed to release key: {}", e))?;
            }
        }
        "shortcut" | "hotkey" => {
            // Format: "ctrl+shift+a" or "cmd+c"
            if let Some(shortcut) = &step.value {
                execute_shortcut(enigo, shortcut)?;
            }
        }
        "wait" | "delay" => {
            let delay_ms: u64 = step.value.as_deref()
                .unwrap_or("1000")
                .parse()
                .unwrap_or(1000);
            std::thread::sleep(Duration::from_millis(delay_ms));
        }
        "drag" => {
            // Format target: "start_x,start_y" value: "end_x,end_y"
            if let (Some(start), Some(end)) = (&step.target, &step.value) {
                let start_coords: Vec<&str> = start.split(',').collect();
                let end_coords: Vec<&str> = end.split(',').collect();
                
                if start_coords.len() >= 2 && end_coords.len() >= 2 {
                    let start_x: i32 = start_coords[0].trim().parse()
                        .map_err(|_| "Invalid start X")?;
                    let start_y: i32 = start_coords[1].trim().parse()
                        .map_err(|_| "Invalid start Y")?;
                    let end_x: i32 = end_coords[0].trim().parse()
                        .map_err(|_| "Invalid end X")?;
                    let end_y: i32 = end_coords[1].trim().parse()
                        .map_err(|_| "Invalid end Y")?;
                    
                    // Move to start, press, move to end, release
                    enigo.move_mouse(start_x, start_y, Coordinate::Abs)
                        .map_err(|e| format!("Failed to move to drag start: {}", e))?;
                    std::thread::sleep(Duration::from_millis(50));
                    
                    enigo.button(Button::Left, Direction::Press)
                        .map_err(|e| format!("Failed to press for drag: {}", e))?;
                    std::thread::sleep(Duration::from_millis(50));
                    
                    // Smooth drag movement
                    let steps = 20;
                    for i in 1..=steps {
                        let progress = i as f64 / steps as f64;
                        let current_x = start_x + ((end_x - start_x) as f64 * progress) as i32;
                        let current_y = start_y + ((end_y - start_y) as f64 * progress) as i32;
                        enigo.move_mouse(current_x, current_y, Coordinate::Abs)
                            .map_err(|e| format!("Failed to drag move: {}", e))?;
                        std::thread::sleep(Duration::from_millis(10));
                    }
                    
                    enigo.button(Button::Left, Direction::Release)
                        .map_err(|e| format!("Failed to release drag: {}", e))?;
                }
            }
        }
        _ => {
            return Err(format!("Unknown action: {}", step.action));
        }
    }
    
    Ok(())
}

/// Parse a key string to enigo Key enum
fn parse_key(key_str: &str) -> Result<Key, String> {
    let key = match key_str.to_lowercase().as_str() {
        // Letters
        "a" => Key::Unicode('a'),
        "b" => Key::Unicode('b'),
        "c" => Key::Unicode('c'),
        "d" => Key::Unicode('d'),
        "e" => Key::Unicode('e'),
        "f" => Key::Unicode('f'),
        "g" => Key::Unicode('g'),
        "h" => Key::Unicode('h'),
        "i" => Key::Unicode('i'),
        "j" => Key::Unicode('j'),
        "k" => Key::Unicode('k'),
        "l" => Key::Unicode('l'),
        "m" => Key::Unicode('m'),
        "n" => Key::Unicode('n'),
        "o" => Key::Unicode('o'),
        "p" => Key::Unicode('p'),
        "q" => Key::Unicode('q'),
        "r" => Key::Unicode('r'),
        "s" => Key::Unicode('s'),
        "t" => Key::Unicode('t'),
        "u" => Key::Unicode('u'),
        "v" => Key::Unicode('v'),
        "w" => Key::Unicode('w'),
        "x" => Key::Unicode('x'),
        "y" => Key::Unicode('y'),
        "z" => Key::Unicode('z'),
        // Numbers
        "0" => Key::Unicode('0'),
        "1" => Key::Unicode('1'),
        "2" => Key::Unicode('2'),
        "3" => Key::Unicode('3'),
        "4" => Key::Unicode('4'),
        "5" => Key::Unicode('5'),
        "6" => Key::Unicode('6'),
        "7" => Key::Unicode('7'),
        "8" => Key::Unicode('8'),
        "9" => Key::Unicode('9'),
        // Special keys
        "enter" | "return" => Key::Return,
        "tab" => Key::Tab,
        "space" => Key::Space,
        "backspace" => Key::Backspace,
        "delete" | "del" => Key::Delete,
        "escape" | "esc" => Key::Escape,
        "home" => Key::Home,
        "end" => Key::End,
        "pageup" | "page_up" => Key::PageUp,
        "pagedown" | "page_down" => Key::PageDown,
        "up" | "arrowup" => Key::UpArrow,
        "down" | "arrowdown" => Key::DownArrow,
        "left" | "arrowleft" => Key::LeftArrow,
        "right" | "arrowright" => Key::RightArrow,
        // Modifier keys
        "shift" => Key::Shift,
        "ctrl" | "control" => Key::Control,
        "alt" => Key::Alt,
        "meta" | "cmd" | "command" | "win" | "windows" => Key::Meta,
        "capslock" | "caps_lock" => Key::CapsLock,
        // Function keys
        "f1" => Key::F1,
        "f2" => Key::F2,
        "f3" => Key::F3,
        "f4" => Key::F4,
        "f5" => Key::F5,
        "f6" => Key::F6,
        "f7" => Key::F7,
        "f8" => Key::F8,
        "f9" => Key::F9,
        "f10" => Key::F10,
        "f11" => Key::F11,
        "f12" => Key::F12,
        // Other
        "insert" | "ins" => Key::Other(0x2D), // VK_INSERT on Windows
        "printscreen" | "print_screen" => Key::Other(0x2C), // VK_SNAPSHOT
        "pause" => Key::Other(0x13), // VK_PAUSE
        "numlock" | "num_lock" => Key::Other(0x90), // VK_NUMLOCK
        "scrolllock" | "scroll_lock" => Key::Other(0x91), // VK_SCROLL
        _ => {
            // Try to parse as single Unicode character
            if key_str.len() == 1 {
                Key::Unicode(key_str.chars().next().unwrap())
            } else {
                return Err(format!("Unknown key: {}", key_str));
            }
        }
    };
    Ok(key)
}

/// Execute a keyboard shortcut like "ctrl+c" or "cmd+shift+s"
fn execute_shortcut(enigo: &mut Enigo, shortcut: &str) -> Result<(), String> {
    let parts: Vec<&str> = shortcut.split('+').map(|s| s.trim()).collect();
    
    if parts.is_empty() {
        return Err("Empty shortcut".to_string());
    }
    
    // Parse all keys
    let keys: Vec<Key> = parts.iter()
        .map(|&k| parse_key(k))
        .collect::<Result<Vec<_>, _>>()?;
    
    // Press all modifier keys first
    for key in &keys[..keys.len().saturating_sub(1)] {
        enigo.key(*key, Direction::Press)
            .map_err(|e| format!("Failed to press modifier {}: {}", shortcut, e))?;
    }
    
    // Press and release the final key
    if let Some(final_key) = keys.last() {
        enigo.key(*final_key, Direction::Click)
            .map_err(|e| format!("Failed to press final key: {}", e))?;
    }
    
    // Release modifier keys in reverse order
    for key in keys[..keys.len().saturating_sub(1)].iter().rev() {
        enigo.key(*key, Direction::Release)
            .map_err(|e| format!("Failed to release modifier: {}", e))?;
    }
    
    Ok(())
}

/// Get list of all macros
#[command]
pub async fn get_macros(state: State<'_, MacroState>) -> Result<Vec<MacroInfo>, String> {
    let macros = state
        .macros
        .lock()
        .map_err(|e| format!("Failed to lock macros: {}", e))?;

    let mut macro_list: Vec<MacroInfo> = macros
        .values()
        .map(|m| MacroInfo {
            id: m.id.clone(),
            name: m.name.clone(),
            description: m.description.clone(),
            step_count: m.steps.len(),
            created_at: m.created_at,
            stats: m.stats.clone(),
        })
        .collect();

    macro_list.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(macro_list)
}

/// Get macro details by ID
#[command]
pub async fn get_macro(macro_id: String, state: State<'_, MacroState>) -> Result<Macro, String> {
    let macros = state
        .macros
        .lock()
        .map_err(|e| format!("Failed to lock macros: {}", e))?;

    macros
        .get(&macro_id)
        .cloned()
        .ok_or("Macro not found".to_string())
}

/// Delete macro by ID
#[command]
pub async fn delete_macro(macro_id: String, state: State<'_, MacroState>) -> Result<(), String> {
    let mut macros = state
        .macros
        .lock()
        .map_err(|e| format!("Failed to lock macros: {}", e))?;

    macros
        .remove(&macro_id)
        .ok_or("Macro not found".to_string())?;

    Ok(())
}

/// Save macro (for updating existing macros)
#[command]
pub async fn save_macro(macro_data: Macro, state: State<'_, MacroState>) -> Result<(), String> {
    let mut macros = state
        .macros
        .lock()
        .map_err(|e| format!("Failed to lock macros: {}", e))?;

    macros.insert(macro_data.id.clone(), macro_data);

    Ok(())
}

/// Get recording status
#[command]
pub async fn get_recording_status(state: State<'_, MacroState>) -> Result<bool, String> {
    let recording = state
        .recording
        .lock()
        .map_err(|e| format!("Failed to lock recording: {}", e))?;

    Ok(recording.is_some())
}

/// Get current step count during recording
#[command]
pub async fn get_step_count(state: State<'_, MacroState>) -> Result<usize, String> {
    let recording = state
        .recording
        .lock()
        .map_err(|e| format!("Failed to lock recording: {}", e))?;

    Ok(recording.as_ref().map(|r| r.len()).unwrap_or(0))
}
