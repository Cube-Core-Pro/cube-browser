//! Build script for CUBE Nexum with CEF integration
//!
//! This script configures the build environment for:
//! - Tauri framework
//! - CEF (Chromium Embedded Framework) binaries
//!
//! CEF Installation:
//!   1. cargo install export-cef-dir
//!   2. export-cef-dir --force $HOME/.local/share/cef
//!   3. export CEF_PATH="$HOME/.local/share/cef"

use std::env;
use std::path::PathBuf;

fn main() {
    // Standard Tauri build
    tauri_build::build();
    
    // Configure CEF paths
    configure_cef();
}

/// Configure CEF library paths and environment
fn configure_cef() {
    // Check for CEF_PATH environment variable
    let cef_path = match env::var("CEF_PATH") {
        Ok(path) => PathBuf::from(path),
        Err(_) => {
            // Fallback to user's home directory
            if let Ok(home) = env::var("HOME") {
                PathBuf::from(home).join(".local").join("share").join("cef")
            } else {
                println!("cargo:warning=CEF_PATH not set and HOME not available");
                println!("cargo:warning=Run: export CEF_PATH=\"$HOME/.local/share/cef\"");
                return;
            }
        }
    };
    
    // Check if CEF binaries exist
    if !cef_path.exists() {
        println!("cargo:warning=CEF binaries not found at {:?}", cef_path);
        println!("cargo:warning=Install with: cargo install export-cef-dir");
        println!("cargo:warning=Then run: export-cef-dir --force $HOME/.local/share/cef");
        return;
    }
    
    // Set CEF_PATH environment variable for runtime
    println!("cargo:rustc-env=CEF_PATH={}", cef_path.display());
    
    // macOS specific configuration
    #[cfg(target_os = "macos")]
    {
        // Framework can be in root or in Release subfolder depending on install method
        let framework_direct = cef_path.join("Chromium Embedded Framework.framework");
        let framework_release = cef_path.join("Release").join("Chromium Embedded Framework.framework");
        
        let (framework, framework_path) = if framework_direct.exists() {
            (framework_direct, cef_path.clone())
        } else if framework_release.exists() {
            (framework_release, cef_path.join("Release"))
        } else {
            println!("cargo:warning=CEF framework not found in {:?}", cef_path);
            return;
        };
        
        // Add framework search path
        println!("cargo:rustc-link-search=framework={}", framework_path.display());
        
        // Link the CEF framework
        println!("cargo:rustc-link-lib=framework=Chromium Embedded Framework");
        
        // Set rpath for runtime loading
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Frameworks");
        println!("cargo:rustc-link-arg=-Wl,-rpath,{}", framework_path.display());
        
        println!("cargo:warning=CEF framework found: {:?}", framework);
        
        // Include path for CEF headers
        let include_path = cef_path.join("include");
        if include_path.exists() {
            println!("cargo:include={}", include_path.display());
        }
    }
    
    // Windows specific configuration
    #[cfg(target_os = "windows")]
    {
        let release_path = cef_path.join("Release");
        let lib_path = cef_path.join("Release");
        
        if release_path.exists() {
            println!("cargo:rustc-link-search=native={}", lib_path.display());
            println!("cargo:rustc-link-lib=dylib=libcef");
            println!("cargo:warning=CEF Windows binaries found");
        }
    }
    
    // Linux specific configuration
    #[cfg(target_os = "linux")]
    {
        let release_path = cef_path.join("Release");
        
        if release_path.exists() {
            println!("cargo:rustc-link-search=native={}", release_path.display());
            println!("cargo:rustc-link-lib=dylib=cef");
            
            // Set rpath for runtime
            println!("cargo:rustc-link-arg=-Wl,-rpath,$ORIGIN");
            println!("cargo:rustc-link-arg=-Wl,-rpath,{}", release_path.display());
            
            println!("cargo:warning=CEF Linux binaries found");
        }
    }
    
    // Rerun if cef-binaries directory changes
    println!("cargo:rerun-if-changed=cef-binaries");
    println!("cargo:rerun-if-env-changed=CEF_PATH");
}
