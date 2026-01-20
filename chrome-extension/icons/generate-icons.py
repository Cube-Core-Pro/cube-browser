#!/usr/bin/env python3
"""
LendingPad PDF Auditor - Professional Icon Generator
Generates PNG icons from SVG using cairosvg
"""

import os
import sys

try:
    import cairosvg
except ImportError:
    print("❌ cairosvg not found. Installing...")
    os.system("pip3 install cairosvg")
    import cairosvg

def generate_icon(svg_file, output_file, size):
    """Convert SVG to PNG at specified size"""
    try:
        with open(svg_file, 'r') as f:
            svg_data = f.read()
        
        cairosvg.svg2png(
            bytestring=svg_data.encode('utf-8'),
            write_to=output_file,
            output_width=size,
            output_height=size
        )
        print(f"   ✅ Created: {output_file} ({size}x{size})")
        return True
    except Exception as e:
        print(f"   ❌ Failed: {output_file} - {str(e)}")
        return False

def main():
    print("🎨 LendingPad PDF Auditor - Icon Generator")
    print("=" * 50)
    print()
    
    # Change to script directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    icons = [
        ('icon-16.svg', 'icon16.png', 16),
        ('icon-32.svg', 'icon32.png', 32),
        ('icon-48.svg', 'icon48.png', 48),
        ('icon-master.svg', 'icon128.png', 128),
    ]
    
    print("Converting SVG icons to PNG...")
    print()
    
    success_count = 0
    for svg_file, png_file, size in icons:
        if not os.path.exists(svg_file):
            print(f"   ⚠️  SVG not found: {svg_file}")
            continue
        
        print(f"📦 Generating {png_file}...")
        if generate_icon(svg_file, png_file, size):
            success_count += 1
    
    print()
    if success_count == len(icons):
        print("✅ All icons generated successfully!")
    else:
        print(f"⚠️  Generated {success_count} out of {len(icons)} icons")
    
    print()
    print("Generated files:")
    for _, png_file, _ in icons:
        if os.path.exists(png_file):
            size = os.path.getsize(png_file)
            print(f"   {png_file}: {size:,} bytes")

if __name__ == '__main__':
    main()
