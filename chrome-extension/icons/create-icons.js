const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [16, 32, 48, 128];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Blue circle background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1976d2');
  gradient.addColorStop(1, '#1565c0');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // White document
  const docWidth = size * 0.5;
  const docHeight = size * 0.6;
  const docX = (size - docWidth) / 2;
  const docY = (size - docHeight) / 2;
  
  ctx.fillStyle = 'white';
  ctx.fillRect(docX, docY, docWidth, docHeight);
  
  // LP text
  ctx.fillStyle = '#1976d2';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LP', size / 2, size / 2);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
  console.log(`Created icon${size}.png`);
});
