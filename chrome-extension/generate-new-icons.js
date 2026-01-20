#!/usr/bin/env node

/**
 * CUBE OmniFill - Icon Generator v2
 * Genera iconos PNG del cubo 3D enterprise con checkmark
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

console.log('🎨 Generando iconos CUBE OmniFill...\n');

// Sizes to generate
const sizes = [16, 32, 48, 128];

// Color palette
const colors = {
  cubeTop: '#dbeafe',
  cubeLeft: '#93c5fd',
  cubeRight: '#3b82f6',
  checkBg: '#10b981',
  checkMark: '#ffffff',
  shadow: 'rgba(37, 99, 235, 0.3)'
};

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const scale = size / 128;
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Center
  const cx = size / 2;
  const cy = size / 2 - 8 * scale;
  
  // Cube dimensions
  const cubeSize = 28 * scale;
  const cubeHeight = 35 * scale;
  
  // Enable smooth rendering
  ctx.antialias = 'subpixel';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw subtle shadow
  if (size >= 32) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = colors.shadow;
    ctx.beginPath();
    ctx.ellipse(cx, cy + cubeHeight + 5 * scale, cubeSize * 0.8, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  // CUBE 3D FACES
  
  // Top face (lightest blue)
  ctx.save();
  ctx.fillStyle = colors.cubeTop;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + cubeSize, cy + cubeSize * 0.35);
  ctx.lineTo(cx, cy + cubeSize * 0.7);
  ctx.lineTo(cx - cubeSize, cy + cubeSize * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  // Left face (medium blue)
  ctx.save();
  ctx.fillStyle = colors.cubeLeft;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.beginPath();
  ctx.moveTo(cx - cubeSize, cy + cubeSize * 0.35);
  ctx.lineTo(cx - cubeSize, cy + cubeSize * 0.35 + cubeHeight);
  ctx.lineTo(cx, cy + cubeSize * 0.7 + cubeHeight);
  ctx.lineTo(cx, cy + cubeSize * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  // Right face (darkest blue)
  ctx.save();
  ctx.fillStyle = colors.cubeRight;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.beginPath();
  ctx.moveTo(cx, cy + cubeSize * 0.7);
  ctx.lineTo(cx, cy + cubeSize * 0.7 + cubeHeight);
  ctx.lineTo(cx + cubeSize, cy + cubeSize * 0.35 + cubeHeight);
  ctx.lineTo(cx + cubeSize, cy + cubeSize * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  
  // CHECK MARK (green circle with white check)
  const checkSize = 10 * scale;
  const checkCenterY = cy + cubeSize * 0.7 + cubeHeight * 0.4;
  
  // Green circle background
  ctx.save();
  ctx.fillStyle = colors.checkBg;
  ctx.beginPath();
  ctx.arc(cx, checkCenterY, checkSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // White checkmark
  if (size >= 16) {
    ctx.save();
    ctx.strokeStyle = colors.checkMark;
    ctx.lineWidth = Math.max(2, 2.5 * scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 3.5 * scale, checkCenterY);
    ctx.lineTo(cx - 1.5 * scale, checkCenterY + 3 * scale);
    ctx.lineTo(cx + 4.5 * scale, checkCenterY - 4 * scale);
    ctx.stroke();
    ctx.restore();
  }
  
  return canvas;
}

// Generate all icons
for (const size of sizes) {
  try {
    const canvas = drawIcon(size);
    const buffer = canvas.toBuffer('image/png');
    const filename = path.join(__dirname, 'icons', `icon${size}.png`);
    fs.writeFileSync(filename, buffer);
    console.log(`✅ Generado: icons/icon${size}.png (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error generando icon${size}.png:`, error.message);
  }
}

console.log('\n🎉 ¡Iconos generados exitosamente!');
console.log('\n📋 Próximos pasos:');
console.log('   1. Ve a chrome://extensions/');
console.log('   2. Busca "CUBE OmniFill"');
console.log('   3. Click en "Reload" (↻)');
console.log('   4. Los nuevos iconos aparecerán automáticamente\n');
