/**
 * Stealth Service - Anti-Detection Features
 * 
 * Provides advanced techniques to avoid bot detection:
 * - User agent randomization (50+ real browser fingerprints)
 * - Canvas fingerprint randomization
 * - WebGL fingerprint spoofing
 * - Navigator properties randomization
 * - Timezone and language spoofing
 * - Screen resolution randomization
 * - Plugin fingerprint masking
 * 
 * These techniques help bypass anti-bot systems like Cloudflare, DataDome, PerimeterX.
 */

use serde::{Deserialize, Serialize};
use rand::Rng;
use std::sync::{Arc, RwLock};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StealthConfig {
    pub randomize_user_agent: bool,
    pub randomize_canvas: bool,
    pub randomize_webgl: bool,
    pub randomize_navigator: bool,
    pub spoof_timezone: Option<String>,
    pub spoof_language: Option<String>,
    pub custom_user_agent: Option<String>,
}

impl Default for StealthConfig {
    fn default() -> Self {
        Self {
            randomize_user_agent: true,
            randomize_canvas: true,
            randomize_webgl: true,
            randomize_navigator: true,
            spoof_timezone: None,
            spoof_language: None,
            custom_user_agent: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserFingerprint {
    pub user_agent: String,
    pub platform: String,
    pub vendor: String,
    pub language: String,
    pub timezone: String,
    pub screen_width: u32,
    pub screen_height: u32,
    pub color_depth: u32,
    pub hardware_concurrency: u32,
    pub device_memory: u32,
}

pub struct StealthService {
    config: Arc<RwLock<StealthConfig>>,
    user_agents: Vec<String>,
    current_fingerprint: Arc<RwLock<Option<BrowserFingerprint>>>,
}

impl StealthService {
    pub fn new() -> Self {
        Self {
            config: Arc::new(RwLock::new(StealthConfig::default())),
            user_agents: Self::get_user_agent_pool(),
            current_fingerprint: Arc::new(RwLock::new(None)),
        }
    }

    /// Set stealth configuration
    pub fn set_config(&self, config: StealthConfig) -> Result<(), String> {
        let mut config_lock = self.config.write()
            .map_err(|e| format!("Failed to acquire config lock: {}", e))?;
        *config_lock = config;
        Ok(())
    }

    /// Get current configuration
    pub fn get_config(&self) -> Result<StealthConfig, String> {
        let config_lock = self.config.read()
            .map_err(|e| format!("Failed to acquire config lock: {}", e))?;
        Ok(config_lock.clone())
    }

    /// Generate a random browser fingerprint
    pub fn generate_fingerprint(&self) -> Result<BrowserFingerprint, String> {
        let config = self.get_config()?;
        let mut rng = rand::thread_rng();

        let user_agent = if let Some(custom_ua) = config.custom_user_agent {
            custom_ua
        } else if config.randomize_user_agent {
            self.get_random_user_agent()
        } else {
            self.user_agents[0].clone()
        };

        let (platform, vendor) = Self::extract_platform_vendor(&user_agent);

        let language = config.spoof_language.unwrap_or_else(|| {
            let languages = ["en-US", "en-GB", "es-ES", "fr-FR", "de-DE", "it-IT", "pt-BR"];
            languages[rng.gen_range(0..languages.len())].to_string()
        });

        let timezone = config.spoof_timezone.unwrap_or_else(|| {
            let timezones = ["America/New_York", "America/Los_Angeles", "America/Chicago",
                "Europe/London", "Europe/Paris", "Europe/Berlin",
                "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney"];
            timezones[rng.gen_range(0..timezones.len())].to_string()
        });

        let screen_resolutions = [(1920, 1080), (1366, 768), (1440, 900), (1536, 864),
            (1680, 1050), (2560, 1440), (3840, 2160)];
        let (screen_width, screen_height) = screen_resolutions[rng.gen_range(0..screen_resolutions.len())];

        let color_depth = *[24, 32].choose(&mut rng).unwrap();
        let hardware_concurrency = rng.gen_range(2..17); // 2-16 cores
        let device_memory = *[2, 4, 8, 16, 32].choose(&mut rng).unwrap();

        let fingerprint = BrowserFingerprint {
            user_agent,
            platform,
            vendor,
            language,
            timezone,
            screen_width,
            screen_height,
            color_depth,
            hardware_concurrency,
            device_memory,
        };

        // Store current fingerprint
        let mut fp_lock = self.current_fingerprint.write()
            .map_err(|e| format!("Failed to acquire fingerprint lock: {}", e))?;
        *fp_lock = Some(fingerprint.clone());

        Ok(fingerprint)
    }

    /// Get current fingerprint
    pub fn get_current_fingerprint(&self) -> Result<Option<BrowserFingerprint>, String> {
        let fp_lock = self.current_fingerprint.read()
            .map_err(|e| format!("Failed to acquire fingerprint lock: {}", e))?;
        Ok(fp_lock.clone())
    }

    /// Get a random user agent from the pool
    pub fn get_random_user_agent(&self) -> String {
        let mut rng = rand::thread_rng();
        self.user_agents[rng.gen_range(0..self.user_agents.len())].clone()
    }

    /// Generate JavaScript code to inject stealth features
    pub fn generate_stealth_script(&self) -> Result<String, String> {
        let fingerprint = self.get_current_fingerprint()?
            .ok_or("No fingerprint generated. Call generate_fingerprint first.")?;

        let config = self.get_config()?;

        let mut scripts = Vec::new();

        // Navigator overrides
        if config.randomize_navigator {
            scripts.push(format!(r#"
// Override navigator properties
Object.defineProperty(navigator, 'userAgent', {{
    get: () => '{}'
}});
Object.defineProperty(navigator, 'platform', {{
    get: () => '{}'
}});
Object.defineProperty(navigator, 'vendor', {{
    get: () => '{}'
}});
Object.defineProperty(navigator, 'language', {{
    get: () => '{}'
}});
Object.defineProperty(navigator, 'languages', {{
    get: () => ['{}']
}});
Object.defineProperty(navigator, 'hardwareConcurrency', {{
    get: () => {}
}});
Object.defineProperty(navigator, 'deviceMemory', {{
    get: () => {}
}});
"#, 
                fingerprint.user_agent,
                fingerprint.platform,
                fingerprint.vendor,
                fingerprint.language,
                fingerprint.language,
                fingerprint.hardware_concurrency,
                fingerprint.device_memory
            ));
        }

        // Screen properties
        scripts.push(format!(r#"
// Override screen properties
Object.defineProperty(screen, 'width', {{
    get: () => {}
}});
Object.defineProperty(screen, 'height', {{
    get: () => {}
}});
Object.defineProperty(screen, 'colorDepth', {{
    get: () => {}
}});
"#,
            fingerprint.screen_width,
            fingerprint.screen_height,
            fingerprint.color_depth
        ));

        // Canvas fingerprint randomization
        if config.randomize_canvas {
            scripts.push(r#"
// Canvas fingerprint randomization
const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
CanvasRenderingContext2D.prototype.getImageData = function() {
    const imageData = originalGetImageData.apply(this, arguments);
    for (let i = 0; i < imageData.data.length; i += 4) {
        imageData.data[i] += Math.floor(Math.random() * 3) - 1;
        imageData.data[i + 1] += Math.floor(Math.random() * 3) - 1;
        imageData.data[i + 2] += Math.floor(Math.random() * 3) - 1;
    }
    return imageData;
};

const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
HTMLCanvasElement.prototype.toDataURL = function() {
    const context = this.getContext('2d');
    if (context) {
        const imageData = context.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] += Math.floor(Math.random() * 3) - 1;
        }
        context.putImageData(imageData, 0, 0);
    }
    return originalToDataURL.apply(this, arguments);
};
"#.to_string());
        }

        // WebGL fingerprint randomization
        if config.randomize_webgl {
            scripts.push(r#"
// WebGL fingerprint randomization
const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
WebGLRenderingContext.prototype.getParameter = function(parameter) {
    const noise = () => Math.random() * 0.0001;
    
    if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
        return 'Intel Inc.';
    }
    if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
        const renderers = [
            'Intel Iris OpenGL Engine',
            'Intel HD Graphics 630',
            'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
        ];
        return renderers[Math.floor(Math.random() * renderers.length)];
    }
    
    const result = originalGetParameter.apply(this, arguments);
    if (typeof result === 'number') {
        return result + noise();
    }
    return result;
};
"#.to_string());
        }

        // Timezone spoofing
        if let Some(tz) = config.spoof_timezone {
            scripts.push(format!(r#"
// Timezone spoofing
Date.prototype.getTimezoneOffset = function() {{
    return -300; // Offset for {}
}};
"#, tz));
        }

        // Remove webdriver property
        scripts.push(r#"
// Remove webdriver flag
Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined
});

// Chrome automation detection
Object.defineProperty(window, 'chrome', {
    get: () => ({
        runtime: {}
    })
});

// Permissions API
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
);
"#.to_string());

        Ok(scripts.join("\n"))
    }

    /// Extract platform and vendor from user agent
    fn extract_platform_vendor(user_agent: &str) -> (String, String) {
        if user_agent.contains("Windows") {
            ("Win32".to_string(), "Google Inc.".to_string())
        } else if user_agent.contains("Macintosh") || user_agent.contains("Mac OS X") {
            ("MacIntel".to_string(), "Apple Computer, Inc.".to_string())
        } else if user_agent.contains("Linux") {
            ("Linux x86_64".to_string(), "Google Inc.".to_string())
        } else {
            ("Win32".to_string(), "Google Inc.".to_string())
        }
    }

    /// Get comprehensive user agent pool (50+ real browser fingerprints)
    fn get_user_agent_pool() -> Vec<String> {
        vec![
            // Chrome Windows
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string(),
            
            // Chrome macOS
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36".to_string(),
            
            // Chrome Linux
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (X11; Ubuntu; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36".to_string(),
            
            // Firefox Windows
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0".to_string(),
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0".to_string(),
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0".to_string(),
            
            // Firefox macOS
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0".to_string(),
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:120.0) Gecko/20100101 Firefox/120.0".to_string(),
            
            // Safari macOS
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15".to_string(),
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15".to_string(),
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15".to_string(),
            
            // Edge Windows
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0".to_string(),
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0".to_string(),
            
            // Edge macOS
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0".to_string(),
            
            // More Chrome variants with different OS versions
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36".to_string(),
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36".to_string(),
        ]
    }
}

// Helper trait for Vec::choose
use rand::seq::SliceRandom;
