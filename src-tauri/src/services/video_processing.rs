use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub path: String,
    pub filename: String,
    pub size_bytes: u64,
    pub duration_seconds: f64,
    pub width: u32,
    pub height: u32,
    pub fps: f64,
    pub format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionConfig {
    pub fps: f64,    // Frames per second to extract (e.g., 2.0 = 1 frame every 0.5s)
    pub quality: u8, // JPEG quality 1-31 (2-5 recommended, lower = better)
    pub output_format: String, // "jpg" or "png"
    pub start_time: Option<f64>, // Optional start time in seconds
    pub duration: Option<f64>, // Optional duration to extract
}

impl Default for FrameExtractionConfig {
    fn default() -> Self {
        Self {
            fps: 2.0,
            quality: 3,
            output_format: "jpg".to_string(),
            start_time: None,
            duration: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedFrame {
    pub frame_number: u32,
    pub timestamp_seconds: f64,
    pub file_path: String,
    pub file_size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractionResult {
    pub video_path: String,
    pub output_directory: String,
    pub frames_extracted: u32,
    pub frames: Vec<ExtractedFrame>,
    pub total_size_bytes: u64,
    pub extraction_time_ms: u128,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameAnalysis {
    pub frame_path: String,
    pub features: Vec<String>,
    pub ai_description: Option<String>,
    pub confidence: f32,
}

pub struct VideoProcessingService {
    temp_dir: PathBuf,
}

impl VideoProcessingService {
    pub fn new() -> Result<Self, String> {
        let temp_dir = std::env::temp_dir().join("cube_elite_video_processing");
        std::fs::create_dir_all(&temp_dir)
            .map_err(|e| format!("Failed to create temp directory: {}", e))?;

        Ok(Self { temp_dir })
    }

    /// Get video metadata using ffprobe
    pub fn get_video_info(&self, video_path: &str) -> Result<VideoInfo, String> {
        let path = Path::new(video_path);
        if !path.exists() {
            return Err(format!("Video file not found: {}", video_path));
        }

        let metadata =
            std::fs::metadata(path).map_err(|e| format!("Failed to read file metadata: {}", e))?;

        // Use ffprobe to get video info
        let output = Command::new("ffprobe")
            .args([
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-count_packets",
                "-show_entries",
                "stream=width,height,r_frame_rate,duration,codec_name",
                "-of",
                "csv=p=0",
                video_path,
            ])
            .output()
            .map_err(|e| {
                format!(
                    "Failed to execute ffprobe: {}. Make sure ffmpeg is installed.",
                    e
                )
            })?;

        if !output.status.success() {
            return Err(format!(
                "ffprobe failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        let info_str = String::from_utf8_lossy(&output.stdout);
        let parts: Vec<&str> = info_str.trim().split(',').collect();

        if parts.len() < 5 {
            return Err("Invalid ffprobe output".to_string());
        }

        // Parse frame rate (e.g., "30/1" = 30 fps)
        let fps = {
            let fps_parts: Vec<&str> = parts[2].split('/').collect();
            if fps_parts.len() == 2 {
                let num: f64 = fps_parts[0].parse().unwrap_or(30.0);
                let den: f64 = fps_parts[1].parse().unwrap_or(1.0);
                num / den
            } else {
                30.0
            }
        };

        Ok(VideoInfo {
            path: video_path.to_string(),
            filename: path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown")
                .to_string(),
            size_bytes: metadata.len(),
            duration_seconds: parts[3].parse().unwrap_or(0.0),
            width: parts[0].parse().unwrap_or(1920),
            height: parts[1].parse().unwrap_or(1080),
            fps,
            format: parts[4].to_string(),
        })
    }

    /// Extract frames from video
    pub fn extract_frames(
        &self,
        video_path: &str,
        config: FrameExtractionConfig,
    ) -> Result<ExtractionResult, String> {
        let start_time = std::time::Instant::now();

        // Create unique output directory
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let output_dir = self.temp_dir.join(format!("frames_{}", timestamp));
        std::fs::create_dir_all(&output_dir)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;

        // Build ffmpeg command
        let mut args = vec!["-i".to_string(), video_path.to_string()];

        // Add start time if specified
        if let Some(start) = config.start_time {
            args.extend(["-ss".to_string(), start.to_string()]);
        }

        // Add duration if specified
        if let Some(duration) = config.duration {
            args.extend(["-t".to_string(), duration.to_string()]);
        }

        // Add filter for fps
        args.extend(["-vf".to_string(), format!("fps={}", config.fps)]);

        // Add quality
        args.extend(["-q:v".to_string(), config.quality.to_string()]);

        // Output pattern
        let output_pattern = output_dir.join(format!("frame_%06d.{}", config.output_format));
        args.push(output_pattern.to_str().unwrap().to_string());

        // Execute ffmpeg
        let output = Command::new("ffmpeg").args(&args).output().map_err(|e| {
            format!(
                "Failed to execute ffmpeg: {}. Make sure ffmpeg is installed.",
                e
            )
        })?;

        if !output.status.success() {
            return Err(format!(
                "ffmpeg failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // Collect extracted frames
        let mut frames = Vec::new();
        let mut total_size = 0u64;
        let mut frame_number = 1u32;

        let entries = std::fs::read_dir(&output_dir)
            .map_err(|e| format!("Failed to read output directory: {}", e))?;

        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();

            if path.is_file() {
                let metadata = std::fs::metadata(&path)
                    .map_err(|e| format!("Failed to read frame metadata: {}", e))?;

                let file_size = metadata.len();
                total_size += file_size;

                // Calculate timestamp based on FPS
                let timestamp = (frame_number - 1) as f64 / config.fps;

                frames.push(ExtractedFrame {
                    frame_number,
                    timestamp_seconds: timestamp,
                    file_path: path.to_str().unwrap().to_string(),
                    file_size_bytes: file_size,
                });

                frame_number += 1;
            }
        }

        // Sort frames by frame number
        frames.sort_by_key(|f| f.frame_number);

        let extraction_time = start_time.elapsed().as_millis();

        Ok(ExtractionResult {
            video_path: video_path.to_string(),
            output_directory: output_dir.to_str().unwrap().to_string(),
            frames_extracted: frames.len() as u32,
            frames,
            total_size_bytes: total_size,
            extraction_time_ms: extraction_time,
        })
    }

    /// Clean up extracted frames
    pub fn cleanup_frames(&self, output_directory: &str) -> Result<(), String> {
        let path = Path::new(output_directory);
        if path.exists() && path.is_dir() {
            std::fs::remove_dir_all(path)
                .map_err(|e| format!("Failed to remove directory: {}", e))?;
        }
        Ok(())
    }

    /// Get temporary directory path
    pub fn get_temp_dir(&self) -> String {
        self.temp_dir.to_str().unwrap().to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = FrameExtractionConfig::default();
        assert_eq!(config.fps, 2.0);
        assert_eq!(config.quality, 3);
        assert_eq!(config.output_format, "jpg");
    }

    #[test]
    fn test_service_creation() {
        let service = VideoProcessingService::new();
        assert!(service.is_ok());
    }
}
