use base64::{engine::general_purpose, Engine as _};
use serde::{Deserialize, Serialize};
use std::process::Command;
use tauri::Window;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotResult {
    pub data_url: String,
    pub width: u32,
    pub height: u32,
}

/// Capture screenshot
///
/// Modes:
/// - "full": Full screen
/// - "window": Active window
/// - "selection": User selection with interactive UI
#[tauri::command]
pub async fn screenshot_capture(mode: String, window: Window) -> Result<ScreenshotResult, String> {
    match mode.as_str() {
        "full" => capture_full_screen(window).await,
        "window" => capture_window(window).await,
        "selection" => capture_selection(window).await,
        _ => Err(format!("Invalid capture mode: {}", mode)),
    }
}

/// Get screen dimensions
fn get_screen_dimensions() -> Result<(u32, u32), String> {
    #[cfg(target_os = "macos")]
    {
        // Use system_profiler to get display info
        let output = Command::new("system_profiler")
            .arg("SPDisplaysDataType")
            .output()
            .map_err(|e| format!("Failed to get display info: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);

        // Parse resolution (looking for "Resolution: 1920 x 1080")
        if let Some(line) = output_str.lines().find(|l| l.contains("Resolution:")) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                if let (Ok(width), Ok(height)) = (parts[1].parse::<u32>(), parts[3].parse::<u32>())
                {
                    return Ok((width, height));
                }
            }
        }

        // Fallback to common resolution
        Ok((1920, 1080))
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: Use GetSystemMetrics
        Ok((1920, 1080)) // Simplified for now
    }

    #[cfg(target_os = "linux")]
    {
        // Linux: Use xrandr
        let output = Command::new("xrandr")
            .output()
            .map_err(|e| format!("Failed to get display info: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);

        // Parse primary resolution
        if let Some(line) = output_str.lines().find(|l| l.contains("*")) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if let Some(res) = parts.get(0) {
                let dims: Vec<&str> = res.split('x').collect();
                if dims.len() == 2 {
                    if let (Ok(width), Ok(height)) =
                        (dims[0].parse::<u32>(), dims[1].parse::<u32>())
                    {
                        return Ok((width, height));
                    }
                }
            }
        }

        Ok((1920, 1080))
    }
}

/// Capture full screen
async fn capture_full_screen(_window: Window) -> Result<ScreenshotResult, String> {
    let temp_path = std::env::temp_dir().join("cube_screenshot_full.png");

    #[cfg(target_os = "macos")]
    {
        // macOS: Use screencapture command
        let output = Command::new("screencapture")
            .arg("-x") // No sound
            .arg("-C") // Capture cursor
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to capture screenshot: {}", e))?;

        if !output.status.success() {
            return Err("Screenshot capture failed".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: Use PowerShell screenshot
        let ps_script = format!(
            r#"Add-Type -AssemblyName System.Windows.Forms; 
               $screen = [System.Windows.Forms.SystemInformation]::VirtualScreen; 
               $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height; 
               $graphic = [System.Drawing.Graphics]::FromImage($bitmap); 
               $graphic.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $bitmap.Size); 
               $bitmap.Save('{}');"#,
            temp_path.display()
        );

        let output = Command::new("powershell")
            .arg("-Command")
            .arg(&ps_script)
            .output()
            .map_err(|e| format!("Failed to capture screenshot: {}", e))?;

        if !output.status.success() {
            return Err("Screenshot capture failed".to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Linux: Try import (ImageMagick) or gnome-screenshot
        let output = Command::new("import")
            .arg("-window")
            .arg("root")
            .arg(&temp_path)
            .output();

        if output.is_err() {
            // Fallback to gnome-screenshot
            let output = Command::new("gnome-screenshot")
                .arg("-f")
                .arg(&temp_path)
                .output()
                .map_err(|e| format!("Failed to capture screenshot: {}", e))?;

            if !output.status.success() {
                return Err(
                    "Screenshot capture failed. Install ImageMagick or gnome-screenshot"
                        .to_string(),
                );
            }
        }
    }

    // Read and convert to base64
    let image_data =
        std::fs::read(&temp_path).map_err(|e| format!("Failed to read screenshot: {}", e))?;

    // Get actual image dimensions
    let (width, height) = get_screen_dimensions()?;

    let base64_data = general_purpose::STANDARD.encode(&image_data);
    let data_url = format!("data:image/png;base64,{}", base64_data);

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_path);

    Ok(ScreenshotResult {
        data_url,
        width,
        height,
    })
}

/// Capture active window
async fn capture_window(_window: Window) -> Result<ScreenshotResult, String> {
    let temp_path = std::env::temp_dir().join("cube_screenshot_window.png");

    #[cfg(target_os = "macos")]
    {
        // macOS: Interactive window selection
        let output = Command::new("screencapture")
            .arg("-x") // No sound
            .arg("-w") // Window mode (user clicks window)
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to capture window: {}", e))?;

        if !output.status.success() {
            return Err("Window capture cancelled or failed".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: Capture the foreground (active) window using PowerShell and .NET
        // This captures the window that had focus just before CUBE (typically what user wants)
        let ps_script = format!(
            r#"
            Add-Type -AssemblyName System.Windows.Forms
            Add-Type @'
            using System;
            using System.Runtime.InteropServices;
            using System.Drawing;
            public class Win32 {{
                [DllImport("user32.dll")]
                public static extern IntPtr GetForegroundWindow();
                [DllImport("user32.dll")]
                public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
                [StructLayout(LayoutKind.Sequential)]
                public struct RECT {{
                    public int Left, Top, Right, Bottom;
                }}
            }}
'@
            # Get the foreground window handle
            $hwnd = [Win32]::GetForegroundWindow()
            $rect = New-Object Win32+RECT
            [Win32]::GetWindowRect($hwnd, [ref]$rect)
            
            # Calculate dimensions
            $width = $rect.Right - $rect.Left
            $height = $rect.Bottom - $rect.Top
            
            # Ensure minimum size
            if ($width -lt 10) {{ $width = 800 }}
            if ($height -lt 10) {{ $height = 600 }}
            
            # Create bitmap and capture
            $bitmap = New-Object System.Drawing.Bitmap($width, $height)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
            $bitmap.Save('{}')
            $graphics.Dispose()
            $bitmap.Dispose()
            "#,
            temp_path.display()
        );

        let output = Command::new("powershell")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-Command")
            .arg(&ps_script)
            .output()
            .map_err(|e| format!("Failed to capture window: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Window capture failed: {}", stderr));
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Linux: Use import with window selection
        let output = Command::new("import")
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to capture window: {}", e))?;

        if !output.status.success() {
            return Err("Window capture failed".to_string());
        }
    }

    // Read and convert to base64
    let image_data =
        std::fs::read(&temp_path).map_err(|e| format!("Failed to read screenshot: {}", e))?;

    let base64_data = general_purpose::STANDARD.encode(&image_data);
    let data_url = format!("data:image/png;base64,{}", base64_data);

    // Get dimensions (simplified - use screen dimensions as fallback)
    let (width, height) = get_screen_dimensions().unwrap_or((800, 600));

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_path);

    Ok(ScreenshotResult {
        data_url,
        width,
        height,
    })
}

/// Capture user selection
async fn capture_selection(_window: Window) -> Result<ScreenshotResult, String> {
    let temp_path = std::env::temp_dir().join("cube_screenshot_selection.png");

    #[cfg(target_os = "macos")]
    {
        // macOS: Interactive selection mode
        let output = Command::new("screencapture")
            .arg("-x") // No sound
            .arg("-s") // Selection mode
            .arg("-i") // Interactive (allows drag selection)
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to capture selection: {}", e))?;

        if !output.status.success() {
            return Err("Selection capture cancelled or failed".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: Use the Snipping Tool via ms-screenclip: protocol
        // This launches Windows' built-in snipping experience
        // First try ms-screenclip, then fall back to SnippingTool.exe
        
        // Method 1: Try Win+Shift+S style capture via PowerShell
        let ps_script = format!(
            r#"
            Add-Type -AssemblyName System.Windows.Forms
            
            # Try using Windows.Graphics.Capture API (Windows 10 1803+)
            # Fall back to simple screen region if not available
            
            try {{
                # Launch ms-screenclip URI and wait for user
                Start-Process 'ms-screenclip:'
                Start-Sleep -Seconds 1
                
                # Wait for clipboard to have image (max 30 seconds)
                $timeout = 30
                $start = Get-Date
                while (((Get-Date) - $start).TotalSeconds -lt $timeout) {{
                    $img = [System.Windows.Forms.Clipboard]::GetImage()
                    if ($img -ne $null) {{
                        $img.Save('{}', [System.Drawing.Imaging.ImageFormat]::Png)
                        exit 0
                    }}
                    Start-Sleep -Milliseconds 500
                }}
                
                # Timeout - user cancelled
                exit 1
            }} catch {{
                # Fallback: Simple full screen (selection not available)
                $screen = [System.Windows.Forms.SystemInformation]::VirtualScreen
                $bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
                $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
                $graphics.CopyFromScreen($screen.Left, $screen.Top, 0, 0, $bitmap.Size)
                $bitmap.Save('{}')
                $graphics.Dispose()
                $bitmap.Dispose()
            }}
            "#,
            temp_path.display(),
            temp_path.display()
        );

        let output = Command::new("powershell")
            .arg("-ExecutionPolicy")
            .arg("Bypass")
            .arg("-Command")
            .arg(&ps_script)
            .output()
            .map_err(|e| format!("Failed to capture selection: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Selection capture failed or cancelled: {}", stderr));
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Linux: Use gnome-screenshot with area selection
        let output = Command::new("gnome-screenshot")
            .arg("-a") // Area selection
            .arg("-f")
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to capture selection: {}", e))?;

        if !output.status.success() {
            return Err("Selection capture failed".to_string());
        }
    }

    // Read and convert to base64
    let image_data =
        std::fs::read(&temp_path).map_err(|e| format!("Failed to read screenshot: {}", e))?;

    let base64_data = general_purpose::STANDARD.encode(&image_data);
    let data_url = format!("data:image/png;base64,{}", base64_data);

    // Try to get actual dimensions from the captured image
    let (width, height) = get_image_dimensions(&image_data).unwrap_or((800, 600));

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_path);

    Ok(ScreenshotResult {
        data_url,
        width,
        height,
    })
}

/// Get image dimensions from PNG data
fn get_image_dimensions(data: &[u8]) -> Option<(u32, u32)> {
    // PNG header check (89 50 4E 47 0D 0A 1A 0A)
    if data.len() < 24 || &data[0..8] != b"\x89PNG\r\n\x1a\n" {
        return None;
    }
    
    // IHDR chunk should be at offset 8
    // Length (4) + Type "IHDR" (4) + Width (4) + Height (4)
    if &data[12..16] != b"IHDR" {
        return None;
    }
    
    let width = u32::from_be_bytes([data[16], data[17], data[18], data[19]]);
    let height = u32::from_be_bytes([data[20], data[21], data[22], data[23]]);
    
    Some((width, height))
}

/// Copy screenshot to clipboard
#[tauri::command]
pub async fn screenshot_copy_to_clipboard(data_url: String) -> Result<bool, String> {
    // Extract base64 data
    let base64_data = data_url
        .strip_prefix("data:image/png;base64,")
        .ok_or("Invalid data URL")?;

    let image_data = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    // Write to temp file for clipboard operations
    let temp_path = std::env::temp_dir().join("cube_clipboard.png");
    std::fs::write(&temp_path, &image_data)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    #[cfg(target_os = "macos")]
    {
        // macOS: Use pbcopy with PNG
        let output = Command::new("osascript")
            .arg("-e")
            .arg(format!(
                "set the clipboard to (read (POSIX file \"{}\") as «class PNGf»)",
                temp_path.display()
            ))
            .output()
            .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;

        if !output.status.success() {
            return Err("Clipboard operation failed".to_string());
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: Use PowerShell
        let ps_script = format!(
            r#"Add-Type -AssemblyName System.Windows.Forms; 
               $img = [System.Drawing.Image]::FromFile('{}'); 
               [System.Windows.Forms.Clipboard]::SetImage($img); 
               $img.Dispose();"#,
            temp_path.display()
        );

        let output = Command::new("powershell")
            .arg("-Command")
            .arg(&ps_script)
            .output()
            .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;

        if !output.status.success() {
            return Err("Clipboard operation failed".to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Linux: Use xclip
        let output = Command::new("xclip")
            .arg("-selection")
            .arg("clipboard")
            .arg("-t")
            .arg("image/png")
            .arg("-i")
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;

        if !output.status.success() {
            return Err(
                "Clipboard operation failed. Install xclip: sudo apt install xclip".to_string(),
            );
        }
    }

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_path);

    println!("✅ Screenshot copied to clipboard");
    Ok(true)
}

/// Save screenshot to disk
#[tauri::command]
pub async fn screenshot_save(data_url: String, filename: String) -> Result<String, String> {
    // Get Downloads directory
    let downloads_dir = dirs::download_dir().ok_or("Could not find Downloads directory")?;

    let file_path = downloads_dir.join(&filename);

    // Extract base64 data
    let base64_data = data_url
        .strip_prefix("data:image/png;base64,")
        .ok_or("Invalid data URL")?;

    let image_data = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    // Write to file
    std::fs::write(&file_path, image_data)
        .map_err(|e| format!("Failed to save screenshot: {}", e))?;

    println!("✅ Screenshot saved: {:?}", file_path);
    Ok(file_path.to_string_lossy().to_string())
}

/// Share screenshot
#[tauri::command]
pub async fn screenshot_share(data_url: String) -> Result<bool, String> {
    // Extract base64 data
    let base64_data = data_url
        .strip_prefix("data:image/png;base64,")
        .ok_or("Invalid data URL")?;

    let image_data = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode image: {}", e))?;

    // Write to temp file for sharing
    let temp_path = std::env::temp_dir().join("cube_share.png");
    std::fs::write(&temp_path, &image_data)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    #[cfg(target_os = "macos")]
    {
        // macOS: Open share dialog
        let output = Command::new("open")
            .arg("-a")
            .arg("Finder")
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to open share dialog: {}", e))?;

        if !output.status.success() {
            return Err("Share dialog failed to open".to_string());
        }

        println!("✅ Screenshot opened in Finder for sharing");
        Ok(true)
    }

    #[cfg(target_os = "windows")]
    {
        // Windows: Open file location for sharing
        let output = Command::new("explorer")
            .arg("/select,")
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to open share dialog: {}", e))?;

        if !output.status.success() {
            return Err("Share dialog failed to open".to_string());
        }

        println!("✅ Screenshot opened in Explorer for sharing");
        Ok(true)
    }

    #[cfg(target_os = "linux")]
    {
        // Linux: Try xdg-open
        let output = Command::new("xdg-open")
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to open share dialog: {}", e))?;

        if !output.status.success() {
            return Err("Share dialog failed to open".to_string());
        }

        println!("✅ Screenshot opened for sharing");
        Ok(true)
    }
}
