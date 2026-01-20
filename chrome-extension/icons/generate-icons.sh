#!/bin/bash

# LendingPad PDF Auditor - Icon Generation Script
# Converts SVG icons to PNG format for Chrome Extension

echo "🎨 LendingPad PDF Auditor - Icon Generator"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

# Check if required tools are available
if ! command -v rsvg-convert &> /dev/null && ! command -v qlmanage &> /dev/null && ! command -v sips &> /dev/null; then
    echo "❌ No suitable SVG conversion tool found."
    echo ""
    echo "Please install one of the following:"
    echo "  1. librsvg (recommended): brew install librsvg"
    echo "  2. ImageMagick: brew install imagemagick"
    echo ""
    exit 1
fi

# Function to convert SVG to PNG
convert_icon() {
    local size=$1
    local input="icon-${size}.svg"
    local output="icon${size}.png"
    
    if [ ! -f "$input" ]; then
        input="icon-master.svg"
    fi
    
    echo "📦 Generating ${output}..."
    
    # Try rsvg-convert (best quality)
    if command -v rsvg-convert &> /dev/null; then
        rsvg-convert -w ${size} -h ${size} "$input" -o "$output"
    # Try ImageMagick
    elif command -v convert &> /dev/null; then
        convert -background none -density 300 -resize ${size}x${size} "$input" "$output"
    # Try qlmanage + sips (macOS native)
    else
        qlmanage -t -s ${size} -o . "$input" > /dev/null 2>&1
        mv "${input%.svg}.png" "$output" 2>/dev/null || true
    fi
    
    if [ -f "$output" ]; then
        echo "   ✅ Created: $output"
    else
        echo "   ⚠️  Failed: $output"
    fi
}

echo "Converting SVG icons to PNG..."
echo ""

# Generate all required sizes
convert_icon 16
convert_icon 32
convert_icon 48
convert_icon 128

echo ""
echo "✅ Icon generation complete!"
echo ""
echo "Generated files:"
ls -lh icon*.png 2>/dev/null || echo "   No PNG files generated"
echo ""
echo "📝 Note: If generation failed, you can:"
echo "   1. Install librsvg: brew install librsvg"
echo "   2. Or use online converter: https://cloudconvert.com/svg-to-png"
echo "   3. Or open SVG files in Preview.app and export as PNG"
echo ""
