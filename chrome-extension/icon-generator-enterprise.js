/**
 * Icon Generator Enterprise Script
 * External script for CSP compliance in Manifest V3
 */

// Enhanced 3D CUBE OmniFill icon renderer with premium styling
function drawIcon(canvasId, size) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const scale = size / 128; // Base design on 128px
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Center point
  const cx = size / 2;
  const cy = size / 2;
  
  // Scale factors
  const cubeWidth = 56 * scale;
  const cubeHeight = 70 * scale;
  
  // Enable anti-aliasing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
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
}

// Download single icon
function downloadIcon(canvasId, size) {
  const canvas = document.getElementById(canvasId);
  const link = document.createElement('a');
  link.download = `icon${size}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Download all icons
function downloadAll() {
  const sizes = [16, 32, 48, 128];
  sizes.forEach((size, index) => {
    setTimeout(() => {
      downloadIcon(`icon${size}`, size);
    }, index * 200); // Stagger downloads
  });
  
  // Show success message
  setTimeout(() => {
    alert('✅ All 4 icons downloaded! Check your Downloads folder.\n\nPlace them in: chrome-extension/icons/');
  }, sizes.length * 200 + 100);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Draw all icons
  ['icon16', 'icon32', 'icon48', 'icon128'].forEach(id => {
    const size = parseInt(id.replace('icon', ''));
    drawIcon(id, size);
  });
});

// Export functions for onclick handlers
window.drawIcon = drawIcon;
window.downloadIcon = downloadIcon;
window.downloadAll = downloadAll;
