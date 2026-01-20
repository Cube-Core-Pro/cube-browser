#!/usr/bin/env node

/**
 * CUBE OmniFill - Icon Generator Script
 * Genera los 4 iconos PNG (16, 32, 48, 128) programáticamente
 * Usa canvas para renderizar el 3D cube enterprise
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Función para dibujar el icono 3D CUBE con checkmark
function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const scale = size / 128; // Base design on 128px
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Center point
  const cx = size / 2;
  const cy = size / 2;
  
  // Enable anti-aliasing
  ctx.antialias = 'subpixel';
  ctx.patternQuality = 'best';
  
  // Draw shadow/glow
  if (size >= 32) {
    ctx.save();
    const gradient = ctx.createRadialGradient(cx, cy + 10 * scale, 0, cx, cy + 10 * scale, 40 * scale);
    gradient.addColorStop(0, 'rgba(37, 99, 235, 0.4)');
    gradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.2)');
    gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }
  
  // 3D Cube coordinates
  const top = cy - 20 * scale;
  const bottom = cy + 35 * scale;
  const left = cx - 28 * scale;
  const right = cx + 28 * scale;
  const topY = top;
  const midY = top + 10 * scale;
  
  // Top face (lightest)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(right, midY);
  ctx.lineTo(cx, midY + 10 * scale);
  ctx.lineTo(left, midY);
  ctx.closePath();
  
  const topGradient = ctx.createLinearGradient(cx, topY, cx, midY + 10 * scale);
  topGradient.addColorStop(0, '#dbeafe');
  topGradient.addColorStop(1, '#bfdbfe');
  ctx.fillStyle = topGradient;
  ctx.fill();
  
  if (size >= 32) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
  }
  ctx.restore();
  
  // Left face (medium)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, midY);
  ctx.lineTo(left, bottom);
  ctx.lineTo(cx, bottom + 10 * scale);
  ctx.lineTo(cx, midY + 10 * scale);
  ctx.closePath();
  
  const leftGradient = ctx.createLinearGradient(left, midY, left, bottom);
  leftGradient.addColorStop(0, '#93c5fd');
  leftGradient.addColorStop(1, '#60a5fa');
  ctx.fillStyle = leftGradient;
  ctx.fill();
  
  if (size >= 32) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
  }
  ctx.restore();
  
  // Right face (darkest)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, midY + 10 * scale);
  ctx.lineTo(cx, bottom + 10 * scale);
  ctx.lineTo(right, bottom);
  ctx.lineTo(right, midY);
  ctx.closePath();
  
  const rightGradient = ctx.createLinearGradient(right, midY, right, bottom);
  rightGradient.addColorStop(0, '#60a5fa');
  rightGradient.addColorStop(1, '#3b82f6');
  ctx.fillStyle = rightGradient;
  ctx.fill();
  
  if (size >= 32) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
  }
  ctx.restore();
  
  // Green glow for checkmark (if size permits)
  if (size >= 32) {
    ctx.save();
    const checkGlow = ctx.createRadialGradient(cx, cy + 12 * scale, 0, cx, cy + 12 * scale, 18 * scale);
    checkGlow.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    checkGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = checkGlow;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }
  
  // Checkmark circle
  ctx.save();
  const checkRadius = size >= 32 ? 10 * scale : 8 * scale;
  ctx.beginPath();
  ctx.arc(cx, cy + 12 * scale, checkRadius, 0, Math.PI * 2);
  
  const checkCircleGradient = ctx.createLinearGradient(
    cx, cy + 12 * scale - checkRadius,
    cx, cy + 12 * scale + checkRadius
  );
  checkCircleGradient.addColorStop(0, '#34d399');
  checkCircleGradient.addColorStop(1, '#10b981');
  ctx.fillStyle = checkCircleGradient;
  ctx.fill();
  
  if (size >= 32) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
  }
  ctx.restore();
  
  // Checkmark
  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size >= 32 ? 2.5 * scale : 2 * scale;
  
  const checkOffset = cy + 12 * scale;
  const checkSize = size >= 32 ? 7 * scale : 5 * scale;
  
  ctx.beginPath();
  ctx.moveTo(cx - checkSize * 0.5, checkOffset);
  ctx.lineTo(cx - checkSize * 0.15, checkOffset + checkSize * 0.4);
  ctx.lineTo(cx + checkSize * 0.6, checkOffset - checkSize * 0.5);
  ctx.stroke();
  ctx.restore();
  
  return canvas;
}

// Main function
async function generateIcons() {
  console.log('🎨 CUBE OmniFill Icon Generator');
  console.log('================================\n');
  
  const sizes = [16, 32, 48, 128];
  const outputDir = path.join(__dirname, 'icons');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (const size of sizes) {
    try {
      console.log(`📐 Generating ${size}x${size}px icon...`);
      
      const canvas = drawIcon(size);
      const buffer = canvas.toBuffer('image/png');
      const outputPath = path.join(outputDir, `icon${size}.png`);
      
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Saved: ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Error generating ${size}px icon:`, error.message);
    }
  }
  
  console.log('\n🎉 All icons generated successfully!');
  console.log(`📂 Location: ${outputDir}`);
  console.log('\n📋 Next steps:');
  console.log('1. Go to chrome://extensions/');
  console.log('2. Click reload on CUBE OmniFill');
  console.log('3. Verify new icons appear');
}

// Check if canvas is installed
try {
  require.resolve('canvas');
  generateIcons().catch(console.error);
} catch (e) {
  console.log('⚠️  Canvas module not found. Installing...\n');
  console.log('Run: npm install canvas --save-dev');
  console.log('\nNote: This requires native dependencies.');
  console.log('On macOS: brew install pkg-config cairo pango libpng jpeg giflib librsvg');
  console.log('On Ubuntu: sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev');
  console.log('\nAlternatively, open icon-generator-enterprise.html in Chrome and download icons manually.');
}
