#!/usr/bin/env node

/**
 * CUBE OmniFill - Large Icon Generator
 * Genera iconos PNG más grandes y visibles para Chrome
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

console.log('🎨 Generando iconos grandes CUBE OmniFill...\n');

const sizes = [16, 32, 48, 128];

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Clear with transparency
  ctx.clearRect(0, 0, size, size);
  
  // Enable antialiasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Calculate cube dimensions (use 90% of canvas)
  const padding = size * 0.05;
  const availableSize = size - (padding * 2);
  const cubeWidth = availableSize * 0.7;
  const cubeHeight = availableSize * 0.7;
  
  const centerX = size / 2;
  const centerY = size / 2;
  
  // 3D depth
  const depth = availableSize * 0.2;
  
  // Draw cube with 3D effect
  // Front face (main blue)
  ctx.fillStyle = '#2563EB';
  ctx.beginPath();
  ctx.moveTo(centerX - cubeWidth/2, centerY - cubeHeight/2);
  ctx.lineTo(centerX + cubeWidth/2, centerY - cubeHeight/2);
  ctx.lineTo(centerX + cubeWidth/2, centerY + cubeHeight/2);
  ctx.lineTo(centerX - cubeWidth/2, centerY + cubeHeight/2);
  ctx.closePath();
  ctx.fill();
  
  // Top face (lighter blue)
  ctx.fillStyle = '#60A5FA';
  ctx.beginPath();
  ctx.moveTo(centerX - cubeWidth/2, centerY - cubeHeight/2);
  ctx.lineTo(centerX, centerY - cubeHeight/2 - depth);
  ctx.lineTo(centerX + cubeWidth/2 + depth, centerY - cubeHeight/2 - depth);
  ctx.lineTo(centerX + cubeWidth/2, centerY - cubeHeight/2);
  ctx.closePath();
  ctx.fill();
  
  // Right face (darker blue)
  ctx.fillStyle = '#1E40AF';
  ctx.beginPath();
  ctx.moveTo(centerX + cubeWidth/2, centerY - cubeHeight/2);
  ctx.lineTo(centerX + cubeWidth/2 + depth, centerY - cubeHeight/2 - depth);
  ctx.lineTo(centerX + cubeWidth/2 + depth, centerY + cubeHeight/2 - depth);
  ctx.lineTo(centerX + cubeWidth/2, centerY + cubeHeight/2);
  ctx.closePath();
  ctx.fill();
  
  // Add gradient shine
  const gradient = ctx.createLinearGradient(
    centerX - cubeWidth/2,
    centerY - cubeHeight/2,
    centerX + cubeWidth/2,
    centerY + cubeHeight/2
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(
    centerX - cubeWidth/2,
    centerY - cubeHeight/2,
    cubeWidth,
    cubeHeight
  );
  
  // Draw checkmark (60% of cube size)
  const checkSize = Math.min(cubeWidth, cubeHeight) * 0.6;
  const checkX = centerX;
  const checkY = centerY + checkSize * 0.05;
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = Math.max(2, size / 16);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Shadow for checkmark
  if (size >= 32) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = size / 32;
    ctx.shadowOffsetX = size / 64;
    ctx.shadowOffsetY = size / 64;
  }
  
  ctx.beginPath();
  ctx.moveTo(checkX - checkSize/3, checkY);
  ctx.lineTo(checkX - checkSize/12, checkY + checkSize/3);
  ctx.lineTo(checkX + checkSize/2.5, checkY - checkSize/3);
  ctx.stroke();
  
  if (size >= 32) {
    ctx.restore();
  }
  
  return canvas;
}

// Generate all icon sizes
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const canvas = drawIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const filename = path.join(iconsDir, `icon${size}.png`);
  
  fs.writeFileSync(filename, buffer);
  console.log(`✅ Generado: icon${size}.png (${size}x${size})`);
});

console.log('\n🎉 Iconos generados exitosamente!');
console.log('📁 Ubicación:', iconsDir);
