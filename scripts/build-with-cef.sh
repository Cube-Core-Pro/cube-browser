#!/bin/bash
# =============================================================================
# CUBE Nexum - Build Script with CEF Support
# =============================================================================
# This script configures the environment for building with Chromium Embedded 
# Framework (CEF) support. CEF enables Widevine DRM for streaming services like
# Netflix, Spotify, and YouTube Premium.
#
# Prerequisites:
#   1. Install CEF binaries using: cargo install export-cef-dir
#   2. Run: export-cef-dir --force $HOME/.local/share/cef
#
# Usage:
#   ./scripts/build-with-cef.sh [build|dev|check|release]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# CEF Configuration
export CEF_PATH="$HOME/.local/share/cef"

# Platform-specific library paths
case "$(uname -s)" in
    Darwin)
        # macOS
        export DYLD_FALLBACK_LIBRARY_PATH="$CEF_PATH:$CEF_PATH/Chromium Embedded Framework.framework/Libraries:$DYLD_FALLBACK_LIBRARY_PATH"
        ;;
    Linux)
        # Linux
        export LD_LIBRARY_PATH="$CEF_PATH:$LD_LIBRARY_PATH"
        ;;
esac

# Verify CEF installation
verify_cef() {
    if [ ! -d "$CEF_PATH" ]; then
        echo -e "${RED}Error: CEF binaries not found at $CEF_PATH${NC}"
        echo -e "${YELLOW}Please install CEF binaries:${NC}"
        echo "  cargo install export-cef-dir"
        echo "  export-cef-dir --force \$HOME/.local/share/cef"
        exit 1
    fi
    
    # Check for framework on macOS
    if [ "$(uname -s)" == "Darwin" ]; then
        if [ ! -d "$CEF_PATH/Chromium Embedded Framework.framework" ]; then
            echo -e "${RED}Error: Chromium Embedded Framework.framework not found${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✓ CEF binaries found at $CEF_PATH${NC}"
}

# Print environment info
print_info() {
    echo -e "${BLUE}==============================================================================${NC}"
    echo -e "${BLUE}CUBE Nexum Build with CEF Support${NC}"
    echo -e "${BLUE}==============================================================================${NC}"
    echo ""
    echo -e "Platform:   $(uname -s) $(uname -m)"
    echo -e "CEF_PATH:   $CEF_PATH"
    echo ""
}

# Build commands
build_check() {
    echo -e "${YELLOW}Running cargo check...${NC}"
    cd "$(dirname "$0")/../src-tauri"
    cargo check
    echo -e "${GREEN}✓ Check completed successfully${NC}"
}

build_dev() {
    echo -e "${YELLOW}Starting development server...${NC}"
    cd "$(dirname "$0")/.."
    npm run tauri dev
}

build_release() {
    echo -e "${YELLOW}Building release...${NC}"
    cd "$(dirname "$0")/.."
    npm run tauri build
    echo -e "${GREEN}✓ Release build completed${NC}"
}

build_cargo() {
    echo -e "${YELLOW}Building Rust backend...${NC}"
    cd "$(dirname "$0")/../src-tauri"
    cargo build
    echo -e "${GREEN}✓ Build completed successfully${NC}"
}

# Main
print_info
verify_cef

case "${1:-dev}" in
    check)
        build_check
        ;;
    dev)
        build_dev
        ;;
    build)
        build_cargo
        ;;
    release)
        build_release
        ;;
    *)
        echo "Usage: $0 [check|dev|build|release]"
        echo ""
        echo "Commands:"
        echo "  check    - Run cargo check (fast syntax/type verification)"
        echo "  dev      - Start development server with hot reload"
        echo "  build    - Build Rust backend only"
        echo "  release  - Build full release bundle"
        exit 1
        ;;
esac
