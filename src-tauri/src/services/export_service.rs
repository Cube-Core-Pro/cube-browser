use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use crate::services::training_data_manager::{FrameLabel, FrameMetadata, TrainingDataManager};

// ============================================================================
// EXPORT DATA STRUCTURES
// ============================================================================

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub label: String,
    pub confidence: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Keypoint {
    pub x: f64,
    pub y: f64,
    pub label: String,
    pub visible: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum LabelData {
    #[serde(rename = "category")]
    Category { categories: Vec<String> },
    #[serde(rename = "bounding_box")]
    BoundingBox { boxes: Vec<BoundingBox> },
    #[serde(rename = "keypoint")]
    Keypoint { keypoints: Vec<Keypoint> },
    #[serde(rename = "custom")]
    Custom { data: serde_json::Value },
}

// ============================================================================
// COCO FORMAT STRUCTURES
// ============================================================================

#[derive(Debug, Serialize)]
pub struct CocoDataset {
    pub info: CocoInfo,
    pub licenses: Vec<CocoLicense>,
    pub images: Vec<CocoImage>,
    pub annotations: Vec<CocoAnnotation>,
    pub categories: Vec<CocoCategory>,
}

#[derive(Debug, Serialize)]
pub struct CocoInfo {
    pub year: i32,
    pub version: String,
    pub description: String,
    pub contributor: String,
    pub url: String,
    pub date_created: String,
}

#[derive(Debug, Serialize)]
pub struct CocoLicense {
    pub id: i32,
    pub name: String,
    pub url: String,
}

#[derive(Debug, Serialize)]
pub struct CocoImage {
    pub id: i64,
    pub width: i32,
    pub height: i32,
    pub file_name: String,
    pub license: i32,
    pub flickr_url: String,
    pub coco_url: String,
    pub date_captured: String,
}

#[derive(Debug, Serialize)]
pub struct CocoAnnotation {
    pub id: i64,
    pub image_id: i64,
    pub category_id: i32,
    pub segmentation: Vec<Vec<f64>>,
    pub area: f64,
    pub bbox: Vec<f64>, // [x, y, width, height]
    pub iscrowd: i32,
}

#[derive(Debug, Serialize)]
pub struct CocoCategory {
    pub id: i32,
    pub name: String,
    pub supercategory: String,
}

// ============================================================================
// EXPORT SERVICE
// ============================================================================

pub struct ExportService {
    training_manager: TrainingDataManager,
}

impl ExportService {
    pub fn new(db_path: PathBuf) -> Result<Self, String> {
        let training_manager = TrainingDataManager::new(db_path)
            .map_err(|e| format!("Failed to initialize training manager: {}", e))?;

        Ok(Self { training_manager })
    }

    // ============================================================================
    // COCO FORMAT EXPORT
    // ============================================================================

    pub fn export_coco(
        &self,
        dataset_id: i64,
        output_dir: &Path,
        copy_images: bool,
    ) -> Result<String, String> {
        // Get dataset info
        let datasets = self
            .training_manager
            .list_datasets()
            .map_err(|e| format!("Failed to get dataset: {}", e))?;

        let dataset = datasets
            .iter()
            .find(|d| d.id == dataset_id)
            .ok_or_else(|| format!("Dataset {} not found", dataset_id))?;

        // Parse session IDs
        let session_ids: Vec<i64> = serde_json::from_str(&dataset.session_ids)
            .map_err(|e| format!("Failed to parse session IDs: {}", e))?;

        // Create output directory
        fs::create_dir_all(output_dir)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;

        // Collect all frames and labels
        let mut all_frames: Vec<FrameMetadata> = Vec::new();
        let mut all_labels: HashMap<i64, Vec<FrameLabel>> = HashMap::new();
        let mut category_map: HashMap<String, i32> = HashMap::new();
        let mut next_category_id = 1;

        for session_id in session_ids {
            let frames = self
                .training_manager
                .get_session_frames(session_id)
                .map_err(|e| format!("Failed to get frames for session {}: {}", session_id, e))?;

            for frame in frames {
                let labels = self
                    .training_manager
                    .get_frame_labels(frame.id)
                    .map_err(|e| format!("Failed to get labels for frame {}: {}", frame.id, e))?;

                // Build category map
                for label in &labels {
                    if let Ok(label_data) = serde_json::from_str::<LabelData>(&label.label_value) {
                        match label_data {
                            LabelData::BoundingBox { boxes } => {
                                for bbox in boxes {
                                    if !category_map.contains_key(&bbox.label) {
                                        category_map.insert(bbox.label.clone(), next_category_id);
                                        next_category_id += 1;
                                    }
                                }
                            }
                            LabelData::Category { categories } => {
                                for cat in categories {
                                    if !category_map.contains_key(&cat) {
                                        category_map.insert(cat.clone(), next_category_id);
                                        next_category_id += 1;
                                    }
                                }
                            }
                            _ => {}
                        }
                    }
                }

                all_labels.insert(frame.id, labels);
                all_frames.push(frame);
            }
        }

        // Build COCO dataset
        let mut coco_images = Vec::new();
        let mut coco_annotations = Vec::new();
        let mut annotation_id = 1i64;

        for frame in &all_frames {
            // Get image dimensions (default to 1920x1080 if not available)
            let (width, height) = self
                .get_image_dimensions(&frame.frame_path)
                .unwrap_or((1920, 1080));

            let file_name = Path::new(&frame.frame_path)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("unknown.jpg")
                .to_string();

            // Copy image if requested
            if copy_images {
                let src_path = Path::new(&frame.frame_path);
                let dst_path = output_dir.join("images").join(&file_name);
                fs::create_dir_all(dst_path.parent().unwrap())
                    .map_err(|e| format!("Failed to create images directory: {}", e))?;
                fs::copy(src_path, dst_path)
                    .map_err(|e| format!("Failed to copy image {}: {}", file_name, e))?;
            }

            coco_images.push(CocoImage {
                id: frame.id,
                width,
                height,
                file_name: file_name.clone(),
                license: 1,
                flickr_url: String::new(),
                coco_url: String::new(),
                date_captured: frame.created_at.clone(),
            });

            // Add annotations
            if let Some(labels) = all_labels.get(&frame.id) {
                for label in labels {
                    if let Ok(label_data) = serde_json::from_str::<LabelData>(&label.label_value) {
                        if let LabelData::BoundingBox { boxes } = label_data {
                            for bbox in boxes {
                                if let Some(&category_id) = category_map.get(&bbox.label) {
                                    let area = bbox.width * bbox.height;
                                    coco_annotations.push(CocoAnnotation {
                                        id: annotation_id,
                                        image_id: frame.id,
                                        category_id,
                                        segmentation: vec![],
                                        area,
                                        bbox: vec![bbox.x, bbox.y, bbox.width, bbox.height],
                                        iscrowd: 0,
                                    });
                                    annotation_id += 1;
                                }
                            }
                        }
                    }
                }
            }
        }

        // Build categories
        let mut coco_categories: Vec<CocoCategory> = category_map
            .iter()
            .map(|(name, id)| CocoCategory {
                id: *id,
                name: name.clone(),
                supercategory: "object".to_string(),
            })
            .collect();
        coco_categories.sort_by_key(|c| c.id);

        let coco_dataset = CocoDataset {
            info: CocoInfo {
                year: 2025,
                version: "1.0".to_string(),
                description: dataset
                    .description
                    .clone()
                    .unwrap_or_else(|| dataset.name.clone()),
                contributor: "CUBE Elite v6".to_string(),
                url: String::new(),
                date_created: Utc::now().to_rfc3339(),
            },
            licenses: vec![CocoLicense {
                id: 1,
                name: "Unknown".to_string(),
                url: String::new(),
            }],
            images: coco_images,
            annotations: coco_annotations,
            categories: coco_categories,
        };

        // Write JSON file
        let output_path = output_dir.join("annotations.json");
        let json_str = serde_json::to_string_pretty(&coco_dataset)
            .map_err(|e| format!("Failed to serialize COCO dataset: {}", e))?;

        fs::write(&output_path, json_str)
            .map_err(|e| format!("Failed to write COCO JSON: {}", e))?;

        Ok(output_path.to_string_lossy().to_string())
    }

    // ============================================================================
    // YOLO FORMAT EXPORT
    // ============================================================================

    pub fn export_yolo(
        &self,
        dataset_id: i64,
        output_dir: &Path,
        copy_images: bool,
    ) -> Result<String, String> {
        // Get dataset info
        let datasets = self
            .training_manager
            .list_datasets()
            .map_err(|e| format!("Failed to get dataset: {}", e))?;

        let dataset = datasets
            .iter()
            .find(|d| d.id == dataset_id)
            .ok_or_else(|| format!("Dataset {} not found", dataset_id))?;

        // Parse session IDs
        let session_ids: Vec<i64> = serde_json::from_str(&dataset.session_ids)
            .map_err(|e| format!("Failed to parse session IDs: {}", e))?;

        // Create output directories
        let images_dir = output_dir.join("images");
        let labels_dir = output_dir.join("labels");
        fs::create_dir_all(&images_dir)
            .map_err(|e| format!("Failed to create images directory: {}", e))?;
        fs::create_dir_all(&labels_dir)
            .map_err(|e| format!("Failed to create labels directory: {}", e))?;

        // Collect categories
        let mut category_map: HashMap<String, i32> = HashMap::new();
        let mut next_category_id = 0;

        // Process all sessions
        for session_id in session_ids {
            let frames = self
                .training_manager
                .get_session_frames(session_id)
                .map_err(|e| format!("Failed to get frames for session {}: {}", session_id, e))?;

            for frame in frames {
                let labels = self
                    .training_manager
                    .get_frame_labels(frame.id)
                    .map_err(|e| format!("Failed to get labels for frame {}: {}", frame.id, e))?;

                // Get image dimensions
                let (img_width, img_height) = self
                    .get_image_dimensions(&frame.frame_path)
                    .unwrap_or((1920, 1080));

                let file_name = Path::new(&frame.frame_path)
                    .file_stem()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown")
                    .to_string();

                // Copy image if requested
                if copy_images {
                    let src_path = Path::new(&frame.frame_path);
                    let file_ext = src_path
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("jpg");
                    let dst_path = images_dir.join(format!("{}.{}", file_name, file_ext));
                    fs::copy(src_path, dst_path)
                        .map_err(|e| format!("Failed to copy image {}: {}", file_name, e))?;
                }

                // Create YOLO label file
                let mut yolo_lines = Vec::new();

                for label in labels {
                    if let Ok(label_data) = serde_json::from_str::<LabelData>(&label.label_value) {
                        if let LabelData::BoundingBox { boxes } = label_data {
                            for bbox in boxes {
                                // Get or create category ID
                                let category_id =
                                    *category_map.entry(bbox.label.clone()).or_insert_with(|| {
                                        let id = next_category_id;
                                        next_category_id += 1;
                                        id
                                    });

                                // Convert to YOLO format (normalized coordinates)
                                let x_center = (bbox.x + bbox.width / 2.0) / img_width as f64;
                                let y_center = (bbox.y + bbox.height / 2.0) / img_height as f64;
                                let norm_width = bbox.width / img_width as f64;
                                let norm_height = bbox.height / img_height as f64;

                                yolo_lines.push(format!(
                                    "{} {:.6} {:.6} {:.6} {:.6}",
                                    category_id, x_center, y_center, norm_width, norm_height
                                ));
                            }
                        }
                    }
                }

                // Write label file
                if !yolo_lines.is_empty() {
                    let label_path = labels_dir.join(format!("{}.txt", file_name));
                    fs::write(label_path, yolo_lines.join("\n"))
                        .map_err(|e| format!("Failed to write YOLO label file: {}", e))?;
                }
            }
        }

        // Write classes.txt
        let mut categories: Vec<(String, i32)> = category_map.into_iter().collect();
        categories.sort_by_key(|(_, id)| *id);
        let classes_content = categories
            .iter()
            .map(|(name, _)| name.clone())
            .collect::<Vec<_>>()
            .join("\n");

        let classes_path = output_dir.join("classes.txt");
        fs::write(&classes_path, classes_content)
            .map_err(|e| format!("Failed to write classes.txt: {}", e))?;

        // Write data.yaml
        let yaml_content = format!(
            "train: ./images\nval: ./images\nnc: {}\nnames: [{}]",
            categories.len(),
            categories
                .iter()
                .map(|(name, _)| format!("'{}'", name))
                .collect::<Vec<_>>()
                .join(", ")
        );

        let yaml_path = output_dir.join("data.yaml");
        fs::write(&yaml_path, yaml_content)
            .map_err(|e| format!("Failed to write data.yaml: {}", e))?;

        Ok(output_dir.to_string_lossy().to_string())
    }

    // ============================================================================
    // TENSORFLOW FORMAT EXPORT
    // ============================================================================

    pub fn export_tensorflow(&self, dataset_id: i64, output_dir: &Path) -> Result<String, String> {
        // Get dataset info
        let datasets = self
            .training_manager
            .list_datasets()
            .map_err(|e| format!("Failed to get dataset: {}", e))?;

        let dataset = datasets
            .iter()
            .find(|d| d.id == dataset_id)
            .ok_or_else(|| format!("Dataset {} not found", dataset_id))?;

        // Parse session IDs
        let session_ids: Vec<i64> = serde_json::from_str(&dataset.session_ids)
            .map_err(|e| format!("Failed to parse session IDs: {}", e))?;

        // Create output directory
        fs::create_dir_all(output_dir)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;

        // Collect all data
        let mut tf_records = Vec::new();
        let mut category_map: HashMap<String, i32> = HashMap::new();
        let mut next_category_id = 0;

        for session_id in session_ids {
            let frames = self
                .training_manager
                .get_session_frames(session_id)
                .map_err(|e| format!("Failed to get frames: {}", e))?;

            for frame in frames {
                let labels = self
                    .training_manager
                    .get_frame_labels(frame.id)
                    .map_err(|e| format!("Failed to get labels: {}", e))?;

                let (img_width, img_height) = self
                    .get_image_dimensions(&frame.frame_path)
                    .unwrap_or((1920, 1080));

                let mut boxes = Vec::new();
                let mut classes = Vec::new();

                for label in labels {
                    if let Ok(label_data) = serde_json::from_str::<LabelData>(&label.label_value) {
                        if let LabelData::BoundingBox { boxes: label_boxes } = label_data {
                            for bbox in label_boxes {
                                let category_id =
                                    *category_map.entry(bbox.label.clone()).or_insert_with(|| {
                                        let id = next_category_id;
                                        next_category_id += 1;
                                        id
                                    });

                                boxes.push(json!({
                                    "ymin": bbox.y / img_height as f64,
                                    "xmin": bbox.x / img_width as f64,
                                    "ymax": (bbox.y + bbox.height) / img_height as f64,
                                    "xmax": (bbox.x + bbox.width) / img_width as f64,
                                }));
                                classes.push(category_id);
                            }
                        }
                    }
                }

                if !boxes.is_empty() {
                    tf_records.push(json!({
                        "image_path": frame.frame_path,
                        "width": img_width,
                        "height": img_height,
                        "boxes": boxes,
                        "classes": classes,
                    }));
                }
            }
        }

        // Write metadata
        let mut categories: Vec<(String, i32)> = category_map.into_iter().collect();
        categories.sort_by_key(|(_, id)| *id);

        let metadata = json!({
            "num_classes": categories.len(),
            "classes": categories.iter().map(|(name, _)| name).collect::<Vec<_>>(),
            "num_examples": tf_records.len(),
            "format": "tensorflow",
        });

        let metadata_path = output_dir.join("metadata.json");
        fs::write(
            &metadata_path,
            serde_json::to_string_pretty(&metadata).unwrap(),
        )
        .map_err(|e| format!("Failed to write metadata: {}", e))?;

        // Write records
        let records_path = output_dir.join("records.json");
        fs::write(
            &records_path,
            serde_json::to_string_pretty(&tf_records).unwrap(),
        )
        .map_err(|e| format!("Failed to write records: {}", e))?;

        Ok(output_dir.to_string_lossy().to_string())
    }

    // ============================================================================
    // PYTORCH FORMAT EXPORT
    // ============================================================================

    pub fn export_pytorch(&self, dataset_id: i64, output_dir: &Path) -> Result<String, String> {
        // Get dataset info
        let datasets = self
            .training_manager
            .list_datasets()
            .map_err(|e| format!("Failed to get dataset: {}", e))?;

        let dataset = datasets
            .iter()
            .find(|d| d.id == dataset_id)
            .ok_or_else(|| format!("Dataset {} not found", dataset_id))?;

        // Parse session IDs
        let session_ids: Vec<i64> = serde_json::from_str(&dataset.session_ids)
            .map_err(|e| format!("Failed to parse session IDs: {}", e))?;

        // Create output directory
        fs::create_dir_all(output_dir)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;

        // Collect all data
        let mut annotations = Vec::new();
        let mut category_map: HashMap<String, i32> = HashMap::new();
        let mut next_category_id = 0;

        for session_id in session_ids {
            let frames = self
                .training_manager
                .get_session_frames(session_id)
                .map_err(|e| format!("Failed to get frames: {}", e))?;

            for frame in frames {
                let labels = self
                    .training_manager
                    .get_frame_labels(frame.id)
                    .map_err(|e| format!("Failed to get labels: {}", e))?;

                let (img_width, img_height) = self
                    .get_image_dimensions(&frame.frame_path)
                    .unwrap_or((1920, 1080));

                let mut boxes = Vec::new();
                let mut labels_vec = Vec::new();

                for label in labels {
                    if let Ok(label_data) = serde_json::from_str::<LabelData>(&label.label_value) {
                        if let LabelData::BoundingBox { boxes: label_boxes } = label_data {
                            for bbox in label_boxes {
                                let category_id =
                                    *category_map.entry(bbox.label.clone()).or_insert_with(|| {
                                        let id = next_category_id;
                                        next_category_id += 1;
                                        id
                                    });

                                // PyTorch format: [x_min, y_min, x_max, y_max]
                                boxes.push(vec![
                                    bbox.x,
                                    bbox.y,
                                    bbox.x + bbox.width,
                                    bbox.y + bbox.height,
                                ]);
                                labels_vec.push(category_id);
                            }
                        }
                    }
                }

                if !boxes.is_empty() {
                    annotations.push(json!({
                        "image_path": frame.frame_path,
                        "image_id": frame.id,
                        "width": img_width,
                        "height": img_height,
                        "boxes": boxes,
                        "labels": labels_vec,
                    }));
                }
            }
        }

        // Write dataset.json
        let mut categories: Vec<(String, i32)> = category_map.into_iter().collect();
        categories.sort_by_key(|(_, id)| *id);

        let dataset_json = json!({
            "annotations": annotations,
            "categories": categories.iter().map(|(name, id)| json!({
                "id": id,
                "name": name,
            })).collect::<Vec<_>>(),
            "info": {
                "num_classes": categories.len(),
                "num_images": annotations.len(),
                "format": "pytorch",
            }
        });

        let output_path = output_dir.join("dataset.json");
        fs::write(
            &output_path,
            serde_json::to_string_pretty(&dataset_json).unwrap(),
        )
        .map_err(|e| format!("Failed to write dataset.json: {}", e))?;

        Ok(output_path.to_string_lossy().to_string())
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    fn get_image_dimensions(&self, image_path: &str) -> Option<(i32, i32)> {
        use image::GenericImageView;

        image::open(image_path).ok().map(|img| {
            let (width, height) = img.dimensions();
            (width as i32, height as i32)
        })
    }
}
